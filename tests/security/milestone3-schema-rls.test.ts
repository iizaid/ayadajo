import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migrationsDir = path.join(root, "supabase", "migrations");

const m2Migration = readMigration("0001_init.sql");
const schemaMigration = readMigration("0002_tenant_tables.sql");
const rlsMigration = readMigration("0003_rls.sql");
const constraintsMigration = readMigration("0004_constraints.sql");
const hardeningMigration = readMigration("0005_m3_rls_hardening.sql");
const m4MembershipMigration = readMigration("0006_m4_membership_lifecycle.sql");
const seedSql = readFileSync(path.join(root, "supabase", "seed.sql"), "utf8").toLowerCase();

const clinicOwnedTables = [
  "clinic_settings",
  "clinic_members",
  "member_invites",
  "working_hours",
  "services",
  "doctors_availability",
  "patients",
  "appointments",
  "appointment_status_history",
  "treatment_notes",
  "treatment_plans",
  "treatment_plan_items",
  "invoices",
  "invoice_items",
  "payments",
  "subscriptions",
  "subscription_payments",
  "reminders",
  "reminder_events",
  "messages",
  "public_booking_requests",
  "files",
  "support_access_grants",
  "notifications",
] as const;

const rlsProtectedTables = [
  "clinics",
  ...clinicOwnedTables,
  "message_templates",
  "audit_logs",
] as const;

const broadWritePolicyTables = [
  "clinic_settings",
  "clinic_members",
  "member_invites",
  "working_hours",
  "services",
  "doctors_availability",
  "patients",
  "appointments",
  "treatment_notes",
  "treatment_plans",
  "treatment_plan_items",
  "invoices",
  "invoice_items",
  "payments",
  "reminders",
  "reminder_events",
  "messages",
  "public_booking_requests",
  "files",
  "notifications",
] as const;

const permissionWritePolicies = [
  "clinics_permission_update",
  "clinic_settings_permission_insert",
  "clinic_settings_permission_update",
  "working_hours_permission_insert",
  "working_hours_permission_update",
  "services_permission_insert",
  "services_permission_update",
  "doctors_availability_permission_insert",
  "doctors_availability_permission_update",
  "clinic_members_permission_insert",
  "clinic_members_permission_update",
  "member_invites_permission_insert",
  "member_invites_permission_update",
  "patients_permission_insert",
  "patients_permission_update",
  "appointments_permission_insert",
  "appointments_permission_update",
  "treatment_notes_permission_insert",
  "treatment_notes_permission_update",
  "treatment_plans_permission_insert",
  "treatment_plans_permission_update",
  "treatment_plan_items_permission_insert",
  "treatment_plan_items_permission_update",
  "invoices_permission_insert",
  "invoices_permission_update",
  "invoice_items_permission_insert",
  "invoice_items_permission_update",
  "payments_permission_insert",
  "message_templates_permission_insert",
  "message_templates_permission_update",
  "reminders_permission_insert",
  "reminders_permission_update",
  "reminder_events_permission_insert",
  "reminder_events_permission_update",
  "messages_permission_insert",
  "messages_permission_update",
  "public_booking_requests_permission_update",
] as const;

function readMigration(fileName: string): string {
  return readFileSync(path.join(migrationsDir, fileName), "utf8").toLowerCase();
}

function tableBlock(tableName: string): string {
  const match = schemaMigration.match(
    new RegExp(`create table public\\.${tableName} \\(([\\s\\S]*?)\\n\\);`),
  );

  if (!match) {
    throw new Error(`Missing table block for ${tableName}`);
  }

  return match[1];
}

function hasSeededPermission(roleCode: string, permissionCode: string): boolean {
  return new RegExp(`\\('${roleCode}',\\s*'${permissionCode}'\\)`).test(seedSql);
}

describe("Milestone 3 schema and RLS", () => {
  it("creates the expected Milestone 3 migration files", () => {
    expect(existsSync(path.join(migrationsDir, "0002_tenant_tables.sql"))).toBe(true);
    expect(existsSync(path.join(migrationsDir, "0003_rls.sql"))).toBe(true);
    expect(existsSync(path.join(migrationsDir, "0004_constraints.sql"))).toBe(true);
    expect(existsSync(path.join(migrationsDir, "0005_m3_rls_hardening.sql"))).toBe(true);
    expect(existsSync(path.join(migrationsDir, "0006_m4_membership_lifecycle.sql"))).toBe(true);
    expect(existsSync(path.join(root, "supabase", "seed.sql"))).toBe(true);
  });

  it("keeps Milestone 2 base tables protected", () => {
    expect(m2Migration).toContain("alter table public.users enable row level security");
    expect(m2Migration).toContain("alter table public.plans enable row level security");
    expect(m2Migration).toContain("create policy users_select_own_profile");
    expect(m2Migration).toContain("using (auth_user_id = auth.uid())");
    expect(m2Migration).toContain("create policy plans_select_active");
    expect(m2Migration).toContain("using (is_active = true)");
  });

  it("creates every planned clinic-owned table with clinic_id", () => {
    for (const table of clinicOwnedTables) {
      const block = tableBlock(table);

      expect(schemaMigration).toContain(`create table public.${table}`);
      expect(block).toMatch(/clinic_id uuid (not null|primary key)/);
    }
  });

  it("documents mixed-scope tables that intentionally do not use clinic_id not null", () => {
    expect(tableBlock("clinics")).not.toContain("clinic_id");
    expect(tableBlock("message_templates")).toContain("clinic_id uuid references public.clinics");
    expect(tableBlock("audit_logs")).toContain("clinic_id uuid references public.clinics");
  });

  it("enables RLS on every protected tenant or mixed-scope table", () => {
    for (const table of rlsProtectedTables) {
      expect(rlsMigration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("adds tenant-membership helper functions with safe security-definer settings", () => {
    expect(rlsMigration).toContain("create or replace function public.current_app_user_id()");
    expect(rlsMigration).toContain("create or replace function public.is_platform_admin");
    expect(rlsMigration).toContain("create or replace function public.is_clinic_member");
    expect(rlsMigration).toMatch(/security definer[\s\S]*?set search_path = public/);
    expect(rlsMigration).toContain("cm.status = 'active'");
    expect(rlsMigration).toContain("u.auth_user_id = (select auth.uid())");
  });

  it("adds a permission helper for hardened write policies", () => {
    expect(hardeningMigration).toContain("create or replace function public.has_clinic_permission");
    expect(hardeningMigration).toMatch(/security definer[\s\S]*?set search_path = public/);
    expect(hardeningMigration).toContain("join public.roles r on r.code = cm.role");
    expect(hardeningMigration).toContain("join public.role_permissions rp on rp.role_id = r.id");
    expect(hardeningMigration).toContain("join public.permissions p on p.id = rp.permission_id");
    expect(hardeningMigration).toContain("cm.status = 'active'");
    expect(hardeningMigration).toContain("grant execute on function public.has_clinic_permission(uuid, text) to authenticated");
  });

  it("uses tenant-scoped policy patterns and avoids broad private-data policies", () => {
    expect(rlsMigration).toContain("public.is_clinic_member(clinic_id)");
    expect(rlsMigration).toContain("public.is_clinic_member(id)");
    expect(rlsMigration).not.toMatch(/to\s+anon\b/);
    expect(rlsMigration).not.toMatch(/for select\s+to authenticated\s+using\s*\(\s*true\s*\)/);
    expect(rlsMigration).not.toMatch(/for all\s+to authenticated/);
  });

  it("drops broad active-member write policies from sensitive tables", () => {
    expect(hardeningMigration).toContain("drop policy if exists clinics_member_update on public.clinics");
    expect(hardeningMigration).toContain("drop policy if exists appointment_status_history_tenant_insert");
    expect(hardeningMigration).toContain("drop policy if exists message_templates_tenant_insert");
    expect(hardeningMigration).toContain("drop policy if exists message_templates_tenant_update");
    expect(hardeningMigration).toContain("drop policy if exists audit_logs_tenant_insert");

    for (const table of broadWritePolicyTables) {
      expect(hardeningMigration).toContain(`drop policy if exists ${table}_tenant_insert on public.${table}`);
      expect(hardeningMigration).toContain(`drop policy if exists ${table}_tenant_update on public.${table}`);
    }
  });

  it("replaces safe writes with permission-based policies only", () => {
    for (const policy of permissionWritePolicies) {
      expect(hardeningMigration).toContain(`create policy ${policy}`);
    }

    expect(hardeningMigration).toContain("public.has_clinic_permission(clinic_id, 'patient.create')");
    expect(hardeningMigration).toContain("public.has_clinic_permission(clinic_id, 'patient.update')");
    expect(hardeningMigration).toContain("public.has_clinic_permission(clinic_id, 'appointment.manage')");
    expect(hardeningMigration).toContain("public.has_clinic_permission(clinic_id, 'staff.manage')");
    expect(hardeningMigration).toContain("public.has_clinic_permission(clinic_id, 'settings.manage')");
    expect(hardeningMigration).toContain("public.has_clinic_permission(clinic_id, 'payment.record')");
    expect(hardeningMigration).toContain("public.has_clinic_permission(clinic_id, 'reminder.send')");
    expect(hardeningMigration).not.toMatch(/with check\s*\(\s*public\.is_clinic_member\(clinic_id\)\s*\)/);
    expect(hardeningMigration).not.toMatch(/using\s*\(\s*public\.is_clinic_member\(clinic_id\)\s*\)\s*with check/);
  });

  it("keeps sensitive deferred tables closed to normal-user writes", () => {
    expect(hardeningMigration).not.toContain("create policy audit_logs_");
    expect(hardeningMigration).not.toContain("for insert\nto authenticated\nwith check (public.has_clinic_permission(clinic_id, 'audit_log");
    expect(hardeningMigration).not.toContain("create policy files_permission_insert");
    expect(hardeningMigration).not.toContain("create policy files_permission_update");
    expect(hardeningMigration).not.toContain("create policy notifications_permission_insert");
    expect(hardeningMigration).not.toContain("create policy notifications_permission_update");
    expect(hardeningMigration).not.toContain("create policy subscriptions_permission_insert");
    expect(hardeningMigration).not.toContain("create policy subscriptions_permission_update");
    expect(hardeningMigration).not.toContain("create policy subscription_payments_permission_insert");
    expect(hardeningMigration).not.toContain("create policy subscription_payments_permission_update");
    expect(hardeningMigration).not.toMatch(/to\s+anon\b/);
    expect(hardeningMigration).not.toContain("public_booking_requests_permission_insert");
  });

  it("adds narrow M4 RLS support for limited staff lifecycle helpers", () => {
    expect(m4MembershipMigration).toContain(
      "drop policy if exists clinic_members_permission_update on public.clinic_members",
    );
    expect(m4MembershipMigration).toContain(
      "public.has_clinic_permission(clinic_id, 'staff.manage_limited')",
    );
    expect(m4MembershipMigration).toContain("role not in ('owner', 'manager')");
    expect(m4MembershipMigration).toContain("create policy member_invites_permission_insert");
    expect(m4MembershipMigration).not.toMatch(/to\s+anon\b/);
    expect(m4MembershipMigration).not.toMatch(/for\s+delete\b/);
  });

  it("contains key tenant-safety constraints and indexes", () => {
    expect(schemaMigration).toContain("constraint appointments_patient_fkey foreign key (clinic_id, patient_id)");
    expect(schemaMigration).toContain("constraint appointments_doctor_member_fkey foreign key (clinic_id, doctor_member_id)");
    expect(schemaMigration).toContain("constraint invoices_clinic_number_key unique (clinic_id, number)");
    expect(schemaMigration).toContain("messaging_consent_status text not null default 'unknown'");
    expect(schemaMigration).toContain("status in ('prepared', 'opened', 'marked_sent', 'sent', 'delivered', 'failed', 'cancelled')");
    expect(schemaMigration).toContain("storage_key not like 'http%'");
    expect(constraintsMigration).toContain("appointments_no_active_doctor_overlap");
    expect(constraintsMigration).toContain("exclude using gist");
    expect(constraintsMigration).toContain("tstzrange(starts_at, ends_at, '[)')");
  });

  it("seeds plans, roles, permissions, and optional Super Admin bootstrap only", () => {
    expect(seedSql).toContain("('starter', 'starter'");
    expect(seedSql).toContain("('pro', 'pro'");
    expect(seedSql).toContain("('plus', 'plus'");
    expect(seedSql).toContain("('pilot', 'pilot'");
    expect(seedSql).toContain("insert into public.roles");
    expect(seedSql).toContain("insert into public.permissions");
    expect(seedSql).toContain("insert into public.role_permissions");
    expect(seedSql).toContain("app.super_admin_auth_user_id");
    expect(seedSql).not.toContain("password");
  });

  it("keeps role_permission_seed stable across Supabase CLI seed batching", () => {
    expect(seedSql).toContain("drop table if exists public.role_permission_seed");
    expect(seedSql).toContain("with role_permission_seed(role_code, permission_code) as");
    expect(seedSql).not.toContain("create table public.role_permission_seed");
    expect(seedSql).not.toContain("create temporary table");
    expect(seedSql).not.toContain("on commit drop");
    expect(seedSql).toMatch(/drop table if exists public\.role_permission_seed;[\s\S]*with role_permission_seed\(role_code, permission_code\) as/);
    expect(seedSql).toMatch(/insert into public\.role_permissions[\s\S]*drop table if exists public\.role_permission_seed;/);
  });

  it("keeps the seeded role-permission matrix least-privilege before M4", () => {
    expect(seedSql).toContain("with role_permission_seed(role_code, permission_code) as");
    expect(seedSql).toContain("delete from public.role_permissions");
    expect(seedSql).toContain("not exists");

    expect(hasSeededPermission("owner", "staff.manage")).toBe(true);
    expect(hasSeededPermission("manager", "staff.manage")).toBe(false);
    expect(hasSeededPermission("manager", "staff.manage_limited")).toBe(true);

    expect(hasSeededPermission("owner", "audit_log.view")).toBe(true);
    expect(hasSeededPermission("manager", "audit_log.view")).toBe(true);
    expect(hasSeededPermission("doctor", "audit_log.view")).toBe(false);
    expect(hasSeededPermission("receptionist", "audit_log.view")).toBe(false);
    expect(hasSeededPermission("accountant", "audit_log.view")).toBe(false);
    expect(hasSeededPermission("assistant", "audit_log.view")).toBe(false);

    expect(hasSeededPermission("assistant", "patient.create")).toBe(false);
    expect(hasSeededPermission("assistant", "patient.update")).toBe(false);
    expect(hasSeededPermission("assistant", "booking_request.approve")).toBe(false);
    expect(hasSeededPermission("assistant", "reminder.send")).toBe(false);
    expect(hasSeededPermission("assistant", "appointment.mark_arrived")).toBe(true);

    expect(hasSeededPermission("doctor", "patient.create")).toBe(false);
    expect(hasSeededPermission("doctor", "patient.update")).toBe(false);
    expect(hasSeededPermission("doctor", "payment.record")).toBe(false);
    expect(hasSeededPermission("doctor", "staff.manage")).toBe(false);
    expect(hasSeededPermission("doctor", "settings.manage")).toBe(false);
    expect(hasSeededPermission("doctor", "treatment_note.write")).toBe(true);
    expect(hasSeededPermission("doctor", "treatment_plan.write")).toBe(true);

    expect(hasSeededPermission("receptionist", "payment.record")).toBe(true);
    expect(hasSeededPermission("receptionist", "invoice.create")).toBe(true);
    expect(hasSeededPermission("receptionist", "invoice.void")).toBe(false);
    expect(hasSeededPermission("receptionist", "payment.reverse")).toBe(false);
    expect(hasSeededPermission("receptionist", "patient.medical_alerts.view")).toBe(true);

    expect(hasSeededPermission("accountant", "payment.record")).toBe(true);
    expect(hasSeededPermission("accountant", "payment.reverse")).toBe(true);
    expect(hasSeededPermission("accountant", "invoice.create")).toBe(true);
    expect(hasSeededPermission("accountant", "invoice.void")).toBe(true);
    expect(hasSeededPermission("accountant", "patient.medical_alerts.view")).toBe(false);
    expect(hasSeededPermission("accountant", "settings.manage")).toBe(false);

    expect(hardeningMigration).not.toContain("create policy subscriptions_permission_insert");
    expect(hardeningMigration).not.toContain("create policy subscription_payments_permission_insert");
  });
});
