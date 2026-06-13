import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createUserScopedSupabaseClient } from "@/lib/supabase/server";
import type { ClinicRole } from "./permissions";

export const ACTIVE_CLINIC_COOKIE = "ayadajo_active_clinic_id";

export type AppUser = {
  id: string;
  authUserId: string;
  email: string;
  fullName: string;
  isPlatformAdmin: boolean;
  platformRole: "super_admin" | "support_admin" | null;
};

export type ClinicMembership = {
  id: string;
  clinicId: string;
  clinicName: string;
  clinicSlug: string;
  clinicStatus: "trial" | "active" | "past_due" | "read_only" | "suspended" | "cancelled";
  clinicTimezone: "Asia/Amman";
  role: ClinicRole;
  status: "active" | "invited" | "suspended" | "removed";
  isClinical: boolean;
};

export type AuthSession = {
  user: AppUser;
  memberships: ClinicMembership[];
  activeMemberships: ClinicMembership[];
  activeClinic: ClinicMembership | null;
  requiresClinicSelection: boolean;
};

type QueryError = {
  message: string;
};

type ProfileRecord = {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  is_platform_admin: boolean;
  platform_role: "super_admin" | "support_admin" | null;
  deleted_at: string | null;
};

type ProfileQueryResult = {
  data: ProfileRecord | null;
  error: QueryError | null;
};

type ProfileQuery = {
  select(columns: string): {
    eq(column: "auth_user_id", value: string): {
      maybeSingle(): Promise<ProfileQueryResult>;
    };
  };
};

type MembershipRecord = {
  id: string;
  clinic_id: string;
  role: ClinicRole;
  status: ClinicMembership["status"];
  is_clinical: boolean;
  clinics:
    | {
        id: string;
        name: string;
        slug: string;
        status: ClinicMembership["clinicStatus"];
        timezone: "Asia/Amman";
      }
    | {
        id: string;
        name: string;
        slug: string;
        status: ClinicMembership["clinicStatus"];
        timezone: "Asia/Amman";
      }[]
    | null;
};

type MembershipQueryResult = {
  data: MembershipRecord[] | null;
  error: QueryError | null;
};

type MembershipQuery = {
  select(columns: string): {
    eq(column: "user_id", value: string): {
      order(column: "created_at", options: { ascending: boolean }): Promise<MembershipQueryResult>;
    };
  };
};

function createMembershipQuery(
  supabase: Awaited<ReturnType<typeof createUserScopedSupabaseClient>>,
): MembershipQuery {
  return (supabase.from as unknown as (table: "clinic_members") => MembershipQuery)(
    "clinic_members",
  );
}

function createProfileQuery(
  supabase: Awaited<ReturnType<typeof createUserScopedSupabaseClient>>,
): ProfileQuery {
  return (supabase.from as unknown as (table: "users") => ProfileQuery)("users");
}

function firstClinic(record: MembershipRecord): {
  id: string;
  name: string;
  slug: string;
  status: ClinicMembership["clinicStatus"];
  timezone: "Asia/Amman";
} | null {
  if (!record.clinics) {
    return null;
  }

  if (Array.isArray(record.clinics)) {
    return record.clinics[0] ?? null;
  }

  return record.clinics;
}

function mapMembership(record: MembershipRecord): ClinicMembership | null {
  const clinic = firstClinic(record);

  if (!clinic) {
    return null;
  }

  return {
    id: record.id,
    clinicId: record.clinic_id,
    clinicName: clinic.name,
    clinicSlug: clinic.slug,
    clinicStatus: clinic.status,
    clinicTimezone: clinic.timezone,
    role: record.role,
    status: record.status,
    isClinical: record.is_clinical,
  };
}

export async function getCurrentAuthSession(): Promise<AuthSession | null> {
  const supabase = await createUserScopedSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const { data: profile, error: profileError } = await createProfileQuery(supabase)
    .select("id, auth_user_id, email, full_name, is_platform_admin, platform_role, deleted_at")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (profileError || !profile || profile.deleted_at) {
    return null;
  }

  const { data: membershipRows, error: membershipError } = await createMembershipQuery(supabase)
    .select(
      "id, clinic_id, role, status, is_clinical, clinics(id, name, slug, status, timezone)",
    )
    .eq("user_id", profile.id)
    .order("created_at", { ascending: true });

  if (membershipError) {
    throw new Error("Unable to load clinic memberships.");
  }

  const memberships = (membershipRows ?? [])
    .map(mapMembership)
    .filter((membership): membership is ClinicMembership => Boolean(membership));
  const activeMemberships = memberships.filter((membership) => membership.status === "active");
  const cookieStore = await cookies();
  const selectedClinicId = cookieStore.get(ACTIVE_CLINIC_COOKIE)?.value;
  const selectedActiveClinic = activeMemberships.find(
    (membership) => membership.clinicId === selectedClinicId,
  );
  const activeClinic =
    selectedActiveClinic ?? (activeMemberships.length === 1 ? activeMemberships[0] : null);

  return {
    user: {
      id: profile.id,
      authUserId: profile.auth_user_id,
      email: profile.email,
      fullName: profile.full_name,
      isPlatformAdmin: profile.is_platform_admin,
      platformRole: profile.platform_role,
    },
    memberships,
    activeMemberships,
    activeClinic,
    requiresClinicSelection: activeMemberships.length > 1 && !selectedActiveClinic,
  };
}

export async function requireAuthSession(): Promise<AuthSession> {
  const session = await getCurrentAuthSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
