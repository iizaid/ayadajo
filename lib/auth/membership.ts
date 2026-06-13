import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { writeAuditLog, type AuditWriteResult } from "@/lib/audit";
import { createUserScopedSupabaseClient } from "@/lib/supabase/server";
import { authorize, CLINIC_ROLES, type ClinicRole, type PermissionCode } from "./permissions";
import type { AuthSession } from "./session";
import {
  evaluateStaffLifecyclePermission,
  type StaffLifecycleMember,
  type StaffLifecycleOperation,
} from "./membership-rules";

export type ClinicMember = StaffLifecycleMember & {
  clinicId: string;
  isClinical: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MemberInvite = {
  id: string;
  clinicId: string;
  email: string;
  role: ClinicRole;
  expiresAt: string;
  acceptedAt: string | null;
};

export type MembershipFailureReason =
  | "unauthenticated"
  | "no_active_clinic"
  | "forbidden"
  | "cross_tenant"
  | "target_not_found"
  | "invalid_input"
  | "self_offboarding"
  | "manager_cannot_manage_elevated_role"
  | "manager_cannot_assign_elevated_role"
  | "last_owner"
  | "rls_rejected"
  | "write_failed";

export type MembershipResult<T> =
  | { ok: true; data: T; audit: AuditWriteResult }
  | { ok: false; reason: MembershipFailureReason };

type QueryError = {
  message: string;
};

type MemberRecord = {
  id: string;
  clinic_id: string;
  user_id: string;
  role: ClinicRole;
  status: ClinicMember["status"];
  is_clinical: boolean;
  created_at: string;
  updated_at: string;
};

type InviteRecord = {
  id: string;
  clinic_id: string;
  email: string;
  role: ClinicRole;
  expires_at: string;
  accepted_at: string | null;
};

type ListResult<T> = { data: T[] | null; error: QueryError | null };
type SingleResult<T> = { data: T | null; error: QueryError | null };

type SelectBuilder<T> = {
  eq(column: string, value: string): SelectBuilder<T>;
  order(column: string, options: { ascending: boolean }): Promise<ListResult<T>>;
  maybeSingle(): Promise<SingleResult<T>>;
};

type InsertBuilder<TInsert, TSelect> = {
  insert(values: TInsert): {
    select(columns: string): {
      maybeSingle(): Promise<SingleResult<TSelect>>;
    };
  };
};

type ChainUpdateBuilder<TSelect> = {
  eq(column: string, value: string): ChainUpdateBuilder<TSelect>;
  select(columns: string): {
    maybeSingle(): Promise<SingleResult<TSelect>>;
  };
};

type MemberTable = {
  select(columns: string): SelectBuilder<MemberRecord>;
  update(values: Partial<Pick<MemberRecord, "role" | "status" | "is_clinical">>): ChainUpdateBuilder<MemberRecord>;
};

type InviteInsert = {
  clinic_id: string;
  email: string;
  role: ClinicRole;
  token_hash: string;
  invited_by: string;
  expires_at: string;
};

type InviteTable = InsertBuilder<InviteInsert, InviteRecord>;

type LifecycleContext =
  | {
      ok: true;
      clinicId: string;
      permission: PermissionCode;
      members: ClinicMember[];
      target: ClinicMember | null;
      activeOwnerCount: number;
    }
  | { ok: false; reason: MembershipFailureReason };

const createInviteInputSchema = z.object({
  email: z.string().trim().email().max(254),
  role: z.enum(CLINIC_ROLES),
});

const memberIdInputSchema = z.object({
  memberId: z.string().uuid(),
});

const changeRoleInputSchema = memberIdInputSchema.extend({
  role: z.enum(CLINIC_ROLES),
});

function memberTable(supabase: Awaited<ReturnType<typeof createUserScopedSupabaseClient>>): MemberTable {
  return (supabase.from as unknown as (table: "clinic_members") => MemberTable)("clinic_members");
}

function inviteTable(supabase: Awaited<ReturnType<typeof createUserScopedSupabaseClient>>): InviteTable {
  return (supabase.from as unknown as (table: "member_invites") => InviteTable)("member_invites");
}

function mapMember(record: MemberRecord): ClinicMember {
  return {
    id: record.id,
    clinicId: record.clinic_id,
    userId: record.user_id,
    role: record.role,
    status: record.status,
    isClinical: record.is_clinical,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapInvite(record: InviteRecord): MemberInvite {
  return {
    id: record.id,
    clinicId: record.clinic_id,
    email: record.email,
    role: record.role,
    expiresAt: record.expires_at,
    acceptedAt: record.accepted_at,
  };
}

function writeFailure(error: QueryError | null): MembershipFailureReason {
  return error?.message.toLowerCase().includes("row-level security") ? "rls_rejected" : "write_failed";
}

function staffPermission(session: AuthSession | null): PermissionCode | null {
  const full = authorize(session, "staff.manage");

  if (full.allowed) {
    return "staff.manage";
  }

  const limited = authorize(session, "staff.manage_limited");

  return limited.allowed ? "staff.manage_limited" : null;
}

function activeClinicId(session: AuthSession): string | null {
  return session.activeClinic?.status === "active" ? session.activeClinic.clinicId : null;
}

async function loadMembers(clinicId: string): Promise<ListResult<MemberRecord>> {
  const supabase = await createUserScopedSupabaseClient();

  return memberTable(supabase)
    .select("id, clinic_id, user_id, role, status, is_clinical, created_at, updated_at")
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: true });
}

async function loadLifecycleContext(
  session: AuthSession,
  targetMemberId?: string,
): Promise<LifecycleContext> {
  const clinicId = activeClinicId(session);

  if (!clinicId) {
    return { ok: false, reason: "no_active_clinic" as const };
  }

  const permission = staffPermission(session);

  if (!permission) {
    return { ok: false, reason: "forbidden" as const };
  }

  const { data, error } = await loadMembers(clinicId);

  if (error) {
    return { ok: false, reason: writeFailure(error) };
  }

  const members = (data ?? []).map(mapMember);
  const target = targetMemberId
    ? (members.find((member) => member.id === targetMemberId) ?? null)
    : null;

  return {
    ok: true,
    clinicId,
    permission,
    members,
    target,
    activeOwnerCount: members.filter(
      (member) => member.role === "owner" && member.status === "active",
    ).length,
  };
}

function lifecycleDecision(input: {
  session: AuthSession;
  operation: StaffLifecycleOperation;
  target?: ClinicMember | null;
  nextRole?: ClinicRole;
  activeOwnerCount: number;
}) {
  return evaluateStaffLifecyclePermission({
    actorUserId: input.session.user.id,
    actorRole: input.session.activeClinic?.role ?? "assistant",
    operation: input.operation,
    target: input.target,
    nextRole: input.nextRole,
    activeOwnerCount: input.activeOwnerCount,
  });
}

function inviteTokenHash(): string {
  return createHash("sha256").update(randomBytes(32)).digest("hex");
}

async function auditMembershipAction(input: {
  session: AuthSession;
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
}): Promise<AuditWriteResult> {
  return writeAuditLog({
    clinicId: input.session.activeClinic?.clinicId ?? null,
    actorUserId: input.session.user.id,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    summary: input.summary,
  });
}

export async function listClinicMembers(session: AuthSession): Promise<MembershipResult<ClinicMember[]>> {
  const context = await loadLifecycleContext(session);

  if (!context.ok) {
    return context;
  }

  return {
    ok: true,
    data: context.members,
    audit: { ok: false, reason: "rls_rejected" },
  };
}

export async function createMemberInvite(
  session: AuthSession,
  input: unknown,
): Promise<MembershipResult<MemberInvite & { delivery: "deferred" }>> {
  const parsed = createInviteInputSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, reason: "invalid_input" };
  }

  const context = await loadLifecycleContext(session);

  if (!context.ok) {
    return context;
  }

  const decision = lifecycleDecision({
    session,
    operation: "invite",
    nextRole: parsed.data.role,
    activeOwnerCount: context.activeOwnerCount,
  });

  if (!decision.allowed) {
    return { ok: false, reason: decision.reason };
  }

  const supabase = await createUserScopedSupabaseClient();
  const { data, error } = await inviteTable(supabase)
    .insert({
      clinic_id: context.clinicId,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      token_hash: inviteTokenHash(),
      invited_by: session.user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("id, clinic_id, email, role, expires_at, accepted_at")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, reason: writeFailure(error) };
  }

  const audit = await auditMembershipAction({
    session,
    action: "member.invite",
    entityType: "member_invite",
    entityId: data.id,
    summary: "member invite created",
  });

  return { ok: true, data: { ...mapInvite(data), delivery: "deferred" }, audit };
}

export async function changeMemberRole(
  session: AuthSession,
  input: unknown,
): Promise<MembershipResult<ClinicMember>> {
  const parsed = changeRoleInputSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, reason: "invalid_input" };
  }

  const context = await loadLifecycleContext(session, parsed.data.memberId);

  if (!context.ok) {
    return context;
  }

  const decision = lifecycleDecision({
    session,
    operation: "change_role",
    target: context.target,
    nextRole: parsed.data.role,
    activeOwnerCount: context.activeOwnerCount,
  });

  if (!decision.allowed) {
    return { ok: false, reason: decision.reason };
  }

  const supabase = await createUserScopedSupabaseClient();
  const { data, error } = await memberTable(supabase)
    .update({ role: parsed.data.role, is_clinical: parsed.data.role === "doctor" })
    .eq("clinic_id", context.clinicId)
    .eq("id", parsed.data.memberId)
    .select("id, clinic_id, user_id, role, status, is_clinical, created_at, updated_at")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, reason: writeFailure(error) };
  }

  const audit = await auditMembershipAction({
    session,
    action: "member.role_change",
    entityType: "clinic_member",
    entityId: data.id,
    summary: "member role changed",
  });

  return { ok: true, data: mapMember(data), audit };
}

async function setMemberStatus(
  session: AuthSession,
  input: unknown,
  status: "suspended" | "removed",
): Promise<MembershipResult<ClinicMember>> {
  const parsed = memberIdInputSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, reason: "invalid_input" };
  }

  const context = await loadLifecycleContext(session, parsed.data.memberId);

  if (!context.ok) {
    return context;
  }

  const operation = status === "suspended" ? "suspend" : "remove";
  const decision = lifecycleDecision({
    session,
    operation,
    target: context.target,
    activeOwnerCount: context.activeOwnerCount,
  });

  if (!decision.allowed) {
    return { ok: false, reason: decision.reason };
  }

  const supabase = await createUserScopedSupabaseClient();
  const { data, error } = await memberTable(supabase)
    .update({ status })
    .eq("clinic_id", context.clinicId)
    .eq("id", parsed.data.memberId)
    .select("id, clinic_id, user_id, role, status, is_clinical, created_at, updated_at")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, reason: writeFailure(error) };
  }

  const audit = await auditMembershipAction({
    session,
    action: `member.${operation}`,
    entityType: "clinic_member",
    entityId: data.id,
    summary: `member ${operation} applied`,
  });

  return { ok: true, data: mapMember(data), audit };
}

export async function suspendClinicMember(
  session: AuthSession,
  input: unknown,
): Promise<MembershipResult<ClinicMember>> {
  return setMemberStatus(session, input, "suspended");
}

export async function removeClinicMember(
  session: AuthSession,
  input: unknown,
): Promise<MembershipResult<ClinicMember>> {
  return setMemberStatus(session, input, "removed");
}
