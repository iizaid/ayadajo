import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migrationsDir = path.join(root, "supabase", "migrations");

const m2Migration = readMigration("0001_init.sql");
const schemaMigration = readMigration("0002_tenant_tables.sql");
const rlsMigration = readMigration("0003_rls.sql");
const constraintsMigration = readMigration("0004_constraints.sql");

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

describe("Milestone 3 schema and RLS", () => {
  it("creates the expected Milestone 3 migration files", () => {
    expect(existsSync(path.join(migrationsDir, "0002_tenant_tables.sql"))).toBe(true);
    expect(existsSync(path.join(migrationsDir, "0003_rls.sql"))).toBe(true);
    expect(existsSync(path.join(migrationsDir, "0004_constraints.sql"))).toBe(true);
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

  it("uses tenant-scoped policy patterns and avoids broad private-data policies", () => {
    expect(rlsMigration).toContain("public.is_clinic_member(clinic_id)");
    expect(rlsMigration).toContain("public.is_clinic_member(id)");
    expect(rlsMigration).not.toMatch(/to\s+anon\b/);
    expect(rlsMigration).not.toMatch(/for select\s+to authenticated\s+using\s*\(\s*true\s*\)/);
    expect(rlsMigration).not.toMatch(/for all\s+to authenticated/);
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
    const seed = readFileSync(path.join(root, "supabase", "seed.sql"), "utf8").toLowerCase();

    expect(seed).toContain("('starter', 'starter'");
    expect(seed).toContain("('pro', 'pro'");
    expect(seed).toContain("('plus', 'plus'");
    expect(seed).toContain("('pilot', 'pilot'");
    expect(seed).toContain("insert into public.roles");
    expect(seed).toContain("insert into public.permissions");
    expect(seed).toContain("insert into public.role_permissions");
    expect(seed).toContain("app.super_admin_auth_user_id");
    expect(seed).not.toContain("password");
  });
});
