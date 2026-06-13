import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect } from "vitest";

export type LocalSupabaseEnv = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
};

export type TestUser = {
  authUserId: string;
  appUserId: string;
  email: string;
  password: string;
  client: SupabaseClient;
};

export type ClinicFixture = {
  id: string;
  ownerMemberId: string;
  doctorMemberId: string;
  secondDoctorMemberId: string;
  patientId: string;
  serviceId: string;
  appointmentId: string;
  subscriptionId: string;
  rows: Record<string, { column: string; value: string }>;
};

export type LiveFixture = {
  runId: string;
  env: LocalSupabaseEnv;
  admin: SupabaseClient;
  anon: SupabaseClient;
  users: {
    ownerA: TestUser;
    managerA: TestUser;
    receptionistA: TestUser;
    doctorA: TestUser;
    assistantA: TestUser;
    accountantA: TestUser;
    suspendedA: TestUser;
    removedA: TestUser;
    noMembership: TestUser;
    ownerB: TestUser;
    doctorB: TestUser;
    secondDoctorA: TestUser;
    staffCandidate: TestUser;
    managerCandidate: TestUser;
    elevatedCandidate: TestUser;
  };
  clinicA: ClinicFixture;
  clinicB: ClinicFixture;
};

type QueryResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

type CreatedUser = {
  authUserId: string;
  appUserId: string;
  email: string;
  password: string;
};

function parseSupabaseStatusEnv(output: string): Partial<LocalSupabaseEnv> {
  const entries = Object.fromEntries(
    output
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Z_]+)="?([^"]+)"?$/))
      .filter((match): match is RegExpMatchArray => Boolean(match))
      .map((match) => [match[1], match[2]]),
  );

  return {
    url: entries.API_URL,
    anonKey: entries.ANON_KEY,
    serviceRoleKey: entries.SERVICE_ROLE_KEY,
  };
}

function loadStatusEnv(): Partial<LocalSupabaseEnv> {
  const command = process.platform === "win32" ? "cmd.exe" : "pnpm";
  const args =
    process.platform === "win32"
      ? ["/c", "pnpm", "supabase", "status", "-o", "env"]
      : ["supabase", "status", "-o", "env"];

  try {
    return parseSupabaseStatusEnv(
      execFileSync(command, args, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }),
    );
  } catch {
    return {};
  }
}

function assertLocalUrl(url: string): void {
  const parsed = new URL(url);
  const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);

  if (!localHosts.has(parsed.hostname)) {
    throw new Error(`Refusing to run live Supabase tests against non-local URL: ${url}`);
  }
}

export function getLocalSupabaseEnv(): LocalSupabaseEnv {
  const statusEnv = loadStatusEnv();
  const env = {
    url: process.env.SUPABASE_LOCAL_URL ?? statusEnv.url,
    anonKey: process.env.SUPABASE_LOCAL_ANON_KEY ?? statusEnv.anonKey,
    serviceRoleKey: process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY ?? statusEnv.serviceRoleKey,
  };

  if (!env.url || !env.anonKey || !env.serviceRoleKey) {
    throw new Error("Missing local Supabase URL, anon key, or service-role key for live tests.");
  }

  assertLocalUrl(env.url);

  return {
    url: env.url,
    anonKey: env.anonKey,
    serviceRoleKey: env.serviceRoleKey,
  };
}

export function createAdminClient(env: LocalSupabaseEnv): SupabaseClient {
  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export function createAnonClient(env: LocalSupabaseEnv): SupabaseClient {
  return createClient(env.url, env.anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

async function must<T>(result: PromiseLike<QueryResult<T>>, context: string): Promise<T> {
  const { data, error } = await result;

  if (error || data === null) {
    throw new Error(`${context}: ${error?.message ?? "missing data"}`);
  }

  return data;
}

async function createUser(admin: SupabaseClient, runId: string, label: string): Promise<CreatedUser> {
  const email = `${label}.${runId}@example.test`;
  const password = `Ayadajo-${runId}-${label}-password-123`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      test_run: runId,
    },
  });

  if (created.error || !created.data.user) {
    throw new Error(`create auth user ${label}: ${created.error?.message ?? "missing user"}`);
  }

  const profile = await must<{ id: string }>(
    admin
      .from("users")
      .insert({
        auth_user_id: created.data.user.id,
        email,
        full_name: `M5 ${label}`,
      })
      .select("id")
      .single(),
    `create profile ${label}`,
  );

  return {
    authUserId: created.data.user.id,
    appUserId: profile.id,
    email,
    password,
  };
}

async function signIn(env: LocalSupabaseEnv, user: CreatedUser): Promise<TestUser> {
  const client = createAnonClient(env);
  const signedIn = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  if (signedIn.error || !signedIn.data.session) {
    throw new Error(`sign in ${user.email}: ${signedIn.error?.message ?? "missing session"}`);
  }

  return {
    ...user,
    client,
  };
}

async function createClinic(admin: SupabaseClient, runId: string, label: "a" | "b") {
  return must<{ id: string }>(
    admin
      .from("clinics")
      .insert({
        name: `M5 Clinic ${label.toUpperCase()} ${runId}`,
        slug: `m5-${runId}-${label}`,
        status: "active",
      })
      .select("id")
      .single(),
    `create clinic ${label}`,
  );
}

async function createMember(
  admin: SupabaseClient,
  clinicId: string,
  userId: string,
  role: string,
  status = "active",
) {
  return must<{ id: string }>(
    admin
      .from("clinic_members")
      .insert({
        clinic_id: clinicId,
        user_id: userId,
        role,
        status,
        is_clinical: role === "doctor",
      })
      .select("id")
      .single(),
    `create member ${role}`,
  );
}

async function createClinicRows(admin: SupabaseClient, input: {
  clinicId: string;
  ownerUserId: string;
  ownerMemberId: string;
  doctorMemberId: string;
  secondDoctorMemberId: string;
  runId: string;
  label: "a" | "b";
}): Promise<ClinicFixture> {
  const patient = await must<{ id: string }>(
    admin
      .from("patients")
      .insert({
        clinic_id: input.clinicId,
        full_name: `M5 Patient ${input.label}`,
        phone: input.label === "a" ? "+962790000001" : "+962790000002",
        created_by: input.ownerUserId,
      })
      .select("id")
      .single(),
    `create patient ${input.label}`,
  );
  const service = await must<{ id: string }>(
    admin
      .from("services")
      .insert({
        clinic_id: input.clinicId,
        name: `M5 Service ${input.label}`,
        default_minutes: 30,
        default_price: 10,
      })
      .select("id")
      .single(),
    `create service ${input.label}`,
  );

  await must<{ clinic_id: string }>(
    admin
      .from("clinic_settings")
      .insert({
        clinic_id: input.clinicId,
      })
      .select("clinic_id")
      .single(),
    `create settings ${input.label}`,
  );
  const workingHours = await must<{ id: string }>(
    admin
      .from("working_hours")
      .insert({
        clinic_id: input.clinicId,
        weekday: 1,
        open_time: "09:00",
        close_time: "17:00",
      })
      .select("id")
      .single(),
    `create working hours ${input.label}`,
  );
  const availability = await must<{ id: string }>(
    admin
      .from("doctors_availability")
      .insert({
        clinic_id: input.clinicId,
        doctor_member_id: input.doctorMemberId,
        weekday: 1,
        start_time: "09:00",
        end_time: "17:00",
      })
      .select("id")
      .single(),
    `create doctor availability ${input.label}`,
  );
  const appointment = await must<{ id: string }>(
    admin
      .from("appointments")
      .insert({
        clinic_id: input.clinicId,
        patient_id: patient.id,
        doctor_member_id: input.doctorMemberId,
        service_id: service.id,
        starts_at: input.label === "a" ? "2031-01-01T09:00:00Z" : "2031-01-02T09:00:00Z",
        ends_at: input.label === "a" ? "2031-01-01T09:30:00Z" : "2031-01-02T09:30:00Z",
        status: "booked",
        created_by: input.ownerUserId,
      })
      .select("id")
      .single(),
    `create appointment ${input.label}`,
  );
  const statusHistory = await must<{ id: string }>(
    admin
      .from("appointment_status_history")
      .insert({
        clinic_id: input.clinicId,
        appointment_id: appointment.id,
        to_status: "booked",
        changed_by: input.ownerUserId,
      })
      .select("id")
      .single(),
    `create appointment status ${input.label}`,
  );
  const treatmentNote = await must<{ id: string }>(
    admin
      .from("treatment_notes")
      .insert({
        clinic_id: input.clinicId,
        patient_id: patient.id,
        appointment_id: appointment.id,
        doctor_member_id: input.doctorMemberId,
        note: "M5 synthetic note",
        created_by: input.ownerUserId,
      })
      .select("id")
      .single(),
    `create treatment note ${input.label}`,
  );
  const treatmentPlan = await must<{ id: string }>(
    admin
      .from("treatment_plans")
      .insert({
        clinic_id: input.clinicId,
        patient_id: patient.id,
        title: `M5 Plan ${input.label}`,
        created_by: input.ownerUserId,
      })
      .select("id")
      .single(),
    `create treatment plan ${input.label}`,
  );
  const treatmentPlanItem = await must<{ id: string }>(
    admin
      .from("treatment_plan_items")
      .insert({
        clinic_id: input.clinicId,
        treatment_plan_id: treatmentPlan.id,
        procedure_name: "M5 procedure",
        price: 10,
      })
      .select("id")
      .single(),
    `create treatment plan item ${input.label}`,
  );
  const invoice = await must<{ id: string }>(
    admin
      .from("invoices")
      .insert({
        clinic_id: input.clinicId,
        patient_id: patient.id,
        number: `M5-${input.runId}-${input.label}`,
        subtotal: 10,
        total: 10,
        balance: 10,
        created_by: input.ownerUserId,
      })
      .select("id")
      .single(),
    `create invoice ${input.label}`,
  );
  const invoiceItem = await must<{ id: string }>(
    admin
      .from("invoice_items")
      .insert({
        clinic_id: input.clinicId,
        invoice_id: invoice.id,
        description: "M5 item",
        quantity: 1,
        unit_price: 10,
        line_total: 10,
      })
      .select("id")
      .single(),
    `create invoice item ${input.label}`,
  );
  const payment = await must<{ id: string }>(
    admin
      .from("payments")
      .insert({
        clinic_id: input.clinicId,
        patient_id: patient.id,
        invoice_id: invoice.id,
        amount: 5,
        method: "cash",
        recorded_by: input.ownerUserId,
      })
      .select("id")
      .single(),
    `create payment ${input.label}`,
  );
  const plan = await must<{ id: string }>(
    admin.from("plans").select("id").eq("code", "pilot").single(),
    "load pilot plan",
  );
  const subscription = await must<{ id: string }>(
    admin
      .from("subscriptions")
      .insert({
        clinic_id: input.clinicId,
        plan_id: plan.id,
        status: "trial",
        trial_ends_at: "2031-01-31T00:00:00Z",
      })
      .select("id")
      .single(),
    `create subscription ${input.label}`,
  );
  const subscriptionPayment = await must<{ id: string }>(
    admin
      .from("subscription_payments")
      .insert({
        clinic_id: input.clinicId,
        subscription_id: subscription.id,
        amount: 10,
        method: "cash",
        recorded_by: input.ownerUserId,
      })
      .select("id")
      .single(),
    `create subscription payment ${input.label}`,
  );
  const template = await must<{ id: string }>(
    admin
      .from("message_templates")
      .insert({
        clinic_id: input.clinicId,
        code: `m5-${input.label}`,
        channel: "email",
        body: "M5 template",
      })
      .select("id")
      .single(),
    `create message template ${input.label}`,
  );
  const reminder = await must<{ id: string }>(
    admin
      .from("reminders")
      .insert({
        clinic_id: input.clinicId,
        appointment_id: appointment.id,
        type: "reminder_24h",
        channel: "email",
      })
      .select("id")
      .single(),
    `create reminder ${input.label}`,
  );
  const reminderEvent = await must<{ id: string }>(
    admin
      .from("reminder_events")
      .insert({
        clinic_id: input.clinicId,
        reminder_id: reminder.id,
        appointment_id: appointment.id,
        scheduled_for: "2031-01-01T08:00:00Z",
      })
      .select("id")
      .single(),
    `create reminder event ${input.label}`,
  );
  const message = await must<{ id: string }>(
    admin
      .from("messages")
      .insert({
        clinic_id: input.clinicId,
        appointment_id: appointment.id,
        patient_id: patient.id,
        reminder_event_id: reminderEvent.id,
        channel: "email",
        to_email: `m5-${input.label}@example.test`,
        template_code: `m5-${input.label}`,
      })
      .select("id")
      .single(),
    `create message ${input.label}`,
  );
  const bookingRequest = await must<{ id: string }>(
    admin
      .from("public_booking_requests")
      .insert({
        clinic_id: input.clinicId,
        patient_name: "M5 Booking",
        patient_phone: input.label === "a" ? "+962790000011" : "+962790000012",
        service_id: service.id,
        preferred_doctor_member_id: input.doctorMemberId,
        requested_at: "2031-01-03T09:00:00Z",
      })
      .select("id")
      .single(),
    `create booking request ${input.label}`,
  );
  const file = await must<{ id: string }>(
    admin
      .from("files")
      .insert({
        clinic_id: input.clinicId,
        patient_id: patient.id,
        uploaded_by: input.ownerUserId,
        storage_key: `clinics/${input.clinicId}/m5-${input.runId}-${input.label}.pdf`,
        mime: "application/pdf",
        size_bytes: 100,
      })
      .select("id")
      .single(),
    `create file ${input.label}`,
  );
  const auditLog = await must<{ id: string }>(
    admin
      .from("audit_logs")
      .insert({
        clinic_id: input.clinicId,
        actor_user_id: input.ownerUserId,
        action: "m5.synthetic",
        entity_type: "test",
        summary: "m5 synthetic audit",
      })
      .select("id")
      .single(),
    `create audit log ${input.label}`,
  );
  const supportGrant = await must<{ id: string }>(
    admin
      .from("support_access_grants")
      .insert({
        clinic_id: input.clinicId,
        granted_to: input.ownerUserId,
        reason: "M5 synthetic support grant",
        expires_at: "2031-01-31T00:00:00Z",
      })
      .select("id")
      .single(),
    `create support grant ${input.label}`,
  );
  const notification = await must<{ id: string }>(
    admin
      .from("notifications")
      .insert({
        clinic_id: input.clinicId,
        recipient_member_id: input.ownerMemberId,
        type: "m5",
      })
      .select("id")
      .single(),
    `create notification ${input.label}`,
  );

  return {
    id: input.clinicId,
    ownerMemberId: input.ownerMemberId,
    doctorMemberId: input.doctorMemberId,
    secondDoctorMemberId: input.secondDoctorMemberId,
    patientId: patient.id,
    serviceId: service.id,
    appointmentId: appointment.id,
    subscriptionId: subscription.id,
    rows: {
      clinics: { column: "id", value: input.clinicId },
      clinic_settings: { column: "clinic_id", value: input.clinicId },
      clinic_members: { column: "id", value: input.ownerMemberId },
      member_invites: await createInviteRow(admin, input),
      working_hours: { column: "id", value: workingHours.id },
      services: { column: "id", value: service.id },
      doctors_availability: { column: "id", value: availability.id },
      patients: { column: "id", value: patient.id },
      appointments: { column: "id", value: appointment.id },
      appointment_status_history: { column: "id", value: statusHistory.id },
      treatment_notes: { column: "id", value: treatmentNote.id },
      treatment_plans: { column: "id", value: treatmentPlan.id },
      treatment_plan_items: { column: "id", value: treatmentPlanItem.id },
      invoices: { column: "id", value: invoice.id },
      invoice_items: { column: "id", value: invoiceItem.id },
      payments: { column: "id", value: payment.id },
      subscriptions: { column: "id", value: subscription.id },
      subscription_payments: { column: "id", value: subscriptionPayment.id },
      message_templates: { column: "id", value: template.id },
      reminders: { column: "id", value: reminder.id },
      reminder_events: { column: "id", value: reminderEvent.id },
      messages: { column: "id", value: message.id },
      public_booking_requests: { column: "id", value: bookingRequest.id },
      files: { column: "id", value: file.id },
      audit_logs: { column: "id", value: auditLog.id },
      support_access_grants: { column: "id", value: supportGrant.id },
      notifications: { column: "id", value: notification.id },
    },
  };
}

async function createInviteRow(
  admin: SupabaseClient,
  input: {
    clinicId: string;
    ownerUserId: string;
    runId: string;
    label: "a" | "b";
  },
) {
  const invite = await must<{ id: string }>(
    admin
      .from("member_invites")
      .insert({
        clinic_id: input.clinicId,
        email: `invite-${input.label}-${input.runId}@example.test`,
        role: "assistant",
        token_hash: randomUUID(),
        invited_by: input.ownerUserId,
        expires_at: "2031-01-31T00:00:00Z",
      })
      .select("id")
      .single(),
    `create invite ${input.label}`,
  );

  return { column: "id", value: invite.id };
}

export async function createLiveFixture(): Promise<LiveFixture> {
  const runId = randomUUID().slice(0, 8);
  const env = getLocalSupabaseEnv();
  const admin = createAdminClient(env);
  const anon = createAnonClient(env);
  const createdUsers = {
    ownerA: await createUser(admin, runId, "owner-a"),
    managerA: await createUser(admin, runId, "manager-a"),
    receptionistA: await createUser(admin, runId, "receptionist-a"),
    doctorA: await createUser(admin, runId, "doctor-a"),
    assistantA: await createUser(admin, runId, "assistant-a"),
    accountantA: await createUser(admin, runId, "accountant-a"),
    suspendedA: await createUser(admin, runId, "suspended-a"),
    removedA: await createUser(admin, runId, "removed-a"),
    noMembership: await createUser(admin, runId, "nomembership"),
    ownerB: await createUser(admin, runId, "owner-b"),
    doctorB: await createUser(admin, runId, "doctor-b"),
    secondDoctorA: await createUser(admin, runId, "second-doctor-a"),
    staffCandidate: await createUser(admin, runId, "staff-candidate"),
    managerCandidate: await createUser(admin, runId, "manager-candidate"),
    elevatedCandidate: await createUser(admin, runId, "elevated-candidate"),
  };
  const clinicA = await createClinic(admin, runId, "a");
  const clinicB = await createClinic(admin, runId, "b");

  const ownerAMember = await createMember(admin, clinicA.id, createdUsers.ownerA.appUserId, "owner");
  await createMember(admin, clinicA.id, createdUsers.managerA.appUserId, "manager");
  await createMember(admin, clinicA.id, createdUsers.receptionistA.appUserId, "receptionist");
  const doctorAMember = await createMember(admin, clinicA.id, createdUsers.doctorA.appUserId, "doctor");
  await createMember(admin, clinicA.id, createdUsers.assistantA.appUserId, "assistant");
  await createMember(admin, clinicA.id, createdUsers.accountantA.appUserId, "accountant");
  await createMember(admin, clinicA.id, createdUsers.suspendedA.appUserId, "assistant", "suspended");
  await createMember(admin, clinicA.id, createdUsers.removedA.appUserId, "assistant", "removed");
  const secondDoctorA = await createMember(
    admin,
    clinicA.id,
    createdUsers.secondDoctorA.appUserId,
    "doctor",
  );
  const ownerBMember = await createMember(admin, clinicB.id, createdUsers.ownerB.appUserId, "owner");
  const doctorBMember = await createMember(admin, clinicB.id, createdUsers.doctorB.appUserId, "doctor");

  const signedUsers = {
    ownerA: await signIn(env, createdUsers.ownerA),
    managerA: await signIn(env, createdUsers.managerA),
    receptionistA: await signIn(env, createdUsers.receptionistA),
    doctorA: await signIn(env, createdUsers.doctorA),
    assistantA: await signIn(env, createdUsers.assistantA),
    accountantA: await signIn(env, createdUsers.accountantA),
    suspendedA: await signIn(env, createdUsers.suspendedA),
    removedA: await signIn(env, createdUsers.removedA),
    noMembership: await signIn(env, createdUsers.noMembership),
    ownerB: await signIn(env, createdUsers.ownerB),
    doctorB: await signIn(env, createdUsers.doctorB),
    secondDoctorA: await signIn(env, createdUsers.secondDoctorA),
    staffCandidate: await signIn(env, createdUsers.staffCandidate),
    managerCandidate: await signIn(env, createdUsers.managerCandidate),
    elevatedCandidate: await signIn(env, createdUsers.elevatedCandidate),
  };

  return {
    runId,
    env,
    admin,
    anon,
    users: signedUsers,
    clinicA: await createClinicRows(admin, {
      clinicId: clinicA.id,
      ownerUserId: createdUsers.ownerA.appUserId,
      ownerMemberId: ownerAMember.id,
      doctorMemberId: doctorAMember.id,
      secondDoctorMemberId: secondDoctorA.id,
      runId,
      label: "a",
    }),
    clinicB: await createClinicRows(admin, {
      clinicId: clinicB.id,
      ownerUserId: createdUsers.ownerB.appUserId,
      ownerMemberId: ownerBMember.id,
      doctorMemberId: doctorBMember.id,
      secondDoctorMemberId: doctorBMember.id,
      runId,
      label: "b",
    }),
  };
}

export async function destroyLiveFixture(fixture: LiveFixture): Promise<void> {
  await fixture.admin.from("clinics").delete().in("id", [fixture.clinicA.id, fixture.clinicB.id]);

  for (const user of Object.values(fixture.users)) {
    await fixture.admin.auth.admin.deleteUser(user.authUserId);
  }
}

export function expectDenied(result: { data: unknown; error: { message: string } | null }): void {
  const emptyArray = Array.isArray(result.data) && result.data.length === 0;

  expect(result.error || emptyArray).toBeTruthy();
}
