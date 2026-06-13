# Ayadajo — Database Schema

> **⬆️ V1 + ADR-001 note:** Schema supports **Production-Ready Core / Pilot-Ready V1**. **Stack is LOCKED to Supabase + RLS ([ADR-001](ADR-001-STACK-AUTH-TENANCY.md))** — **every tenant table gets RLS enabled + policies** keyed on clinic membership as the **primary** isolation line (P0 launch blocker). The **`files`** table is a **V1** table (minimal secure attach). Patients carry an `import_id` for safe bulk import + rollback (DATA_MIGRATION_AND_IMPORT_PLAN.md). **Outstanding balance = issued invoice balances only** (single source of truth; treatment-plan totals are *estimates*, never the official balance). Patient **messaging consent is NOT defaulted to true** (see `patients` below).

PostgreSQL. Conventions below apply to **every** table.

## Global conventions
- **IDs:** `id` = `uuid` (v7 preferred for sortable) primary key, default generated.
- **Tenant column:** every clinic-owned table has `clinic_id uuid NOT NULL REFERENCES clinics(id)`. **This is the isolation backbone.**
- **Timestamps:** `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz NOT NULL DEFAULT now()` (trigger or app-maintained). All stored **UTC**.
- **Soft delete:** sensitive/clinical/financial tables use `deleted_at timestamptz NULL` (archive) instead of hard delete. Never hard-delete patients, notes, payments, invoices, appointments, audit logs.
- **Money:** `numeric(12,2)`, currency assumed JOD MVP (add `currency char(3)` later).
- **Enums:** Postgres enums OR `text` + CHECK. Recommend `text` + CHECK + app-level Zod (easier to evolve than PG enums).
- **Indexing rule:** every tenant table has an index leading with `clinic_id` (e.g. `(clinic_id, created_at)`, `(clinic_id, <lookup col>)`).

> **Tenant query rule (non-negotiable) — RLS is the primary guarantee (ADR-001):** every tenant table has **RLS ENABLED + policies** scoping rows to clinics the authenticated user (`auth.uid()`) is an active member of. Clinic-user code accesses tables via the **user-scoped Supabase client** so RLS applies. The **service role bypasses RLS** and is restricted to Super Admin/background-job server code only — never clinic-user paths, never client-side. App code may still pass `clinic_id` for clarity/authorization, but a missed app filter cannot leak because RLS refuses it. **RLS policies + RLS isolation tests are P0 launch blockers.**

---

## Platform (non-tenant) tables

### users
Identity for anyone who can log in (staff + platform admins). **Not** patients.
- `id uuid PK`
- `auth_user_id uuid UNIQUE NOT NULL` → references the **Supabase Auth** user (`auth.users.id`). Passwords/credentials live in Supabase Auth, **not** here. (ADR-001)
- `email citext UNIQUE NOT NULL`
- `full_name text NOT NULL`
- `phone text NULL`
- `is_platform_admin boolean NOT NULL DEFAULT false`
- `mfa_enabled boolean NOT NULL DEFAULT false` — **MANDATORY true for platform admins (Super Admin) before the first real trial clinic**; Owner MFA = P2 (enforced via Supabase Auth MFA/TOTP)
- `platform_role text NULL CHECK in ('super_admin','support_admin')` — only when is_platform_admin
- `last_login_at timestamptz NULL`
- `created_at`, `updated_at`, `deleted_at`
- Indexes: unique(email). Security: never expose `password_hash`; not tenant-scoped (global identity).

### sessions
- `id uuid PK`, `user_id uuid FK→users`, `active_clinic_id uuid NULL FK→clinics`
- `expires_at timestamptz NOT NULL`, `created_at`, `ip text`, `user_agent text`
- Index: (user_id), (expires_at). Revoke by delete (instant offboarding).

### password_reset_tokens
- `id uuid PK`, `user_id uuid FK`, `token_hash text NOT NULL`, `expires_at`, `used_at NULL`, `created_at`
- Index: unique(token_hash). Single-use.

### plans (platform catalog)
- `id uuid PK`, `code text UNIQUE` (e.g. `monthly`, `yearly`, `pilot`), `name text`
- `price numeric(12,2)`, `interval text CHECK in ('month','year','custom')`
- `max_staff int NULL`, `max_messages_month int NULL`, `storage_mb int NULL` (limits, nullable = unlimited)
- `is_active boolean DEFAULT true`, `created_at`, `updated_at`
- Not tenant-scoped (shared catalog).

---

## Tenant root

### clinics
- `id uuid PK`
- `name text NOT NULL`
- `slug citext UNIQUE NOT NULL` (public booking; reserved-word blocked)
- `clinic_type text NOT NULL DEFAULT 'dental'` (future expansion)
- `timezone text NOT NULL DEFAULT 'Asia/Amman'`
- `language text NOT NULL DEFAULT 'ar'`
- `status text NOT NULL DEFAULT 'trial' CHECK in ('trial','active','past_due','read_only','suspended','cancelled')`
- `phone text`, `address text`, `logo_file_id uuid NULL`
- `created_at`, `updated_at`, `deleted_at`
- Indexes: unique(slug). The `status` here is the **effective access gate** (denormalized from subscription for fast checks).

### clinic_settings (1:1 with clinic)
- `clinic_id uuid PK FK→clinics`
- `booking_enabled boolean DEFAULT false`
- `booking_mode text DEFAULT 'request' CHECK in ('request','instant')`
- `quiet_hours_start time NULL`, `quiet_hours_end time NULL`
- `reminder_default_hours int DEFAULT 24`
- `default_appointment_minutes int DEFAULT 30`
- `currency char(3) DEFAULT 'JOD'`
- `created_at`, `updated_at`

### clinic_members (user ↔ clinic with role)
- `id uuid PK`
- `clinic_id uuid NOT NULL FK→clinics`
- `user_id uuid NOT NULL FK→users`
- `role text NOT NULL CHECK in ('owner','manager','doctor','receptionist','accountant','assistant')`
- `status text NOT NULL DEFAULT 'active' CHECK in ('active','invited','suspended','removed')`
- `is_clinical boolean DEFAULT false` (true for doctors → appear as bookable)
- `created_at`, `updated_at`
- **Unique:** (clinic_id, user_id). Index: (clinic_id, status), (user_id).
- Tenant note: membership *defines* a user's access to a clinic; authz checks this on every request.

### member_invites
- `id uuid PK`, `clinic_id FK`, `email citext`, `role text`, `token_hash text`, `invited_by uuid FK→users`, `expires_at`, `accepted_at NULL`, `created_at`
- Unique: (clinic_id, email) where not accepted. Index: unique(token_hash).

---

## RBAC tables (seeded; code-enforced in MVP)

### roles
- `id uuid PK`, `code text UNIQUE`, `name text`, `is_system boolean DEFAULT true`
- (MVP: seeded from the fixed role list; per-clinic custom roles = later, would add nullable `clinic_id`.)

### permissions
- `id uuid PK`, `code text UNIQUE` (e.g. `patient.create`, `payment.reverse`), `description text`

### role_permissions
- `role_id uuid FK→roles`, `permission_id uuid FK→permissions`
- PK (role_id, permission_id).
- MVP note: the matrix is also encoded in code (source of truth for enforcement); these tables document/seed it and enable the future editor.

---

## Patients & clinical

### patients
- `id uuid PK`
- `clinic_id uuid NOT NULL FK→clinics`
- `full_name text NOT NULL`
- `phone text NOT NULL` (Jordan format, normalized to `+9627XXXXXXXX`)
- `email citext NULL`
- `gender text NULL CHECK in ('male','female','other')`
- `date_of_birth date NULL`
- `medical_alerts text NULL` (allergies/conditions — sensitive)
- `notes text NULL`
- `messaging_consent_status text NOT NULL DEFAULT 'unknown' CHECK in ('unknown','consented','opted_out')` — **never defaulted to consented**
- `messaging_consent_source text NULL` (e.g. `staff`, `public_booking`, `import`, `verbal`)
- `messaging_consent_at timestamptz NULL`
- `import_id uuid NULL` (set for bulk-imported patients; enables batch rollback)
- `created_by uuid FK→users`, `created_at`, `updated_at`, `deleted_at`
- **Messaging consent rules:** imported patients default to `unknown`; the clinic (controller) is responsible for obtaining consent; staff may set `consented`/`opted_out` if permitted; `opted_out` **blocks all reminders**; `unknown` should warn before messaging (clinic policy). Public booking may capture consent **only if legally approved**. All consent wording **[LEGAL]** — review with a Jordanian lawyer.
- **Indexes:** (clinic_id, phone), (clinic_id, full_name text_pattern_ops) or trigram for search, (clinic_id, created_at). Consider unique-ish (clinic_id, phone) as a **soft** dedupe (warn, not hard-unique — same family/number reuse happens).
- Security: medical_alerts sensitive; never log; archive not delete.

### appointments
- `id uuid PK`, `clinic_id FK`
- `patient_id uuid NOT NULL FK→patients`
- `doctor_member_id uuid NOT NULL FK→clinic_members` (the doctor)
- `service_id uuid NULL FK→services`
- `starts_at timestamptz NOT NULL`, `ends_at timestamptz NOT NULL` (UTC; computed from start + duration)
- `status text NOT NULL DEFAULT 'booked' CHECK in ('booked','confirmed','arrived','in_progress','completed','cancelled','no_show')`
- `source text DEFAULT 'staff' CHECK in ('staff','public_booking','walk_in')`
- `cancel_reason text NULL`, `notes text NULL`
- `created_by uuid FK`, `created_at`, `updated_at`, `deleted_at`
- **Indexes:** (clinic_id, starts_at), (clinic_id, doctor_member_id, starts_at), (clinic_id, patient_id), (clinic_id, status, starts_at).
- **Double-book prevention:** enforce in app (transactional overlap check) + optionally a Postgres exclusion constraint per doctor: `EXCLUDE USING gist (doctor_member_id WITH =, tstzrange(starts_at, ends_at) WITH &&) WHERE (status NOT IN ('cancelled','no_show'))`. (DB-level guarantee against races — recommended.)

### appointment_status_history
- `id uuid PK`, `clinic_id FK`, `appointment_id FK`, `from_status text`, `to_status text`, `changed_by uuid FK→users`, `reason text NULL`, `created_at`
- Index: (clinic_id, appointment_id, created_at). Append-only.

### treatment_notes
- `id uuid PK`, `clinic_id FK`, `patient_id FK`, `appointment_id uuid NULL FK`
- `doctor_member_id uuid FK→clinic_members`
- `tooth_area text NULL` (free text MVP)
- `note text NOT NULL`
- `follow_up_instruction text NULL`
- `created_by uuid FK`, `edited_by uuid NULL FK`, `created_at`, `updated_at`, `deleted_at`
- Index: (clinic_id, patient_id, created_at). Clinical/sensitive.

### treatment_plans
- `id uuid PK`, `clinic_id FK`, `patient_id FK`, `title text`, `status text CHECK in ('draft','active','completed','cancelled') DEFAULT 'active'`, `created_by uuid FK`, `created_at`, `updated_at`, `deleted_at`
- Index: (clinic_id, patient_id).

### treatment_plan_items
- `id uuid PK`, `clinic_id FK`, `treatment_plan_id FK`, `procedure_name text`, `tooth_area text NULL`, `price numeric(12,2) NOT NULL DEFAULT 0`, `status text CHECK in ('planned','in_progress','done','cancelled') DEFAULT 'planned'`, `done_at timestamptz NULL`, `created_at`, `updated_at`
- Index: (clinic_id, treatment_plan_id).

---

## Financial

### invoices
- `id uuid PK`, `clinic_id FK`, `patient_id FK`
- `number text NOT NULL` (per-clinic sequence, e.g. `INV-2026-000123`)
- `status text CHECK in ('draft','issued','partial','paid','void') DEFAULT 'draft'`
- `subtotal numeric(12,2)`, `total numeric(12,2)`, `paid_amount numeric(12,2) DEFAULT 0`, `balance numeric(12,2)`
- `tax_amount numeric(12,2) DEFAULT 0` (VAT off by default; legal review)
- `issued_at timestamptz NULL`, `voided_at NULL`, `created_by uuid FK`, `created_at`, `updated_at`, `deleted_at`
- **Unique:** (clinic_id, number). Index: (clinic_id, patient_id), (clinic_id, status). Per-clinic numbering avoids cross-tenant leakage (a global sequence would leak total volume).

### invoice_items
- `id uuid PK`, `clinic_id FK`, `invoice_id FK`, `description text`, `quantity numeric(12,2) DEFAULT 1`, `unit_price numeric(12,2)`, `line_total numeric(12,2)`, `treatment_plan_item_id uuid NULL FK`, `created_at`
- Index: (clinic_id, invoice_id).

### payments
- `id uuid PK`, `clinic_id FK`, `patient_id FK`
- `amount numeric(12,2) NOT NULL` (positive; reversals are separate negative-linked rows)
- `method text CHECK in ('cash','cliq','bank_transfer','card_manual','other') NOT NULL`
- `paid_at timestamptz NOT NULL DEFAULT now()`
- `invoice_id uuid NULL FK`, `treatment_plan_id uuid NULL FK`
- `reverses_payment_id uuid NULL FK→payments` (for reversals)
- `note text NULL`, `recorded_by uuid FK`, `created_at`, `deleted_at` (kept null; reversal not delete)
- Index: (clinic_id, patient_id, paid_at), (clinic_id, paid_at). No hard delete.

---

## Subscription / billing (manual MVP)

### subscriptions (1 active per clinic)
- `id uuid PK`, `clinic_id FK`, `plan_id uuid NULL FK→plans`
- `status text CHECK in ('trial','active','past_due','read_only','suspended','cancelled') NOT NULL`
- `trial_ends_at timestamptz NULL`
- `current_period_start timestamptz NULL`, `current_period_end timestamptz NULL`
- `grace_until timestamptz NULL`
- `notes text NULL`, `created_at`, `updated_at`
- Index: (clinic_id), (status, current_period_end). The clinic's effective `status` is mirrored to `clinics.status` for fast gate checks (keep in sync in one transaction).

### subscription_payments (manual records)
- `id uuid PK`, `clinic_id FK`, `subscription_id FK`
- `amount numeric(12,2)`, `currency char(3) DEFAULT 'JOD'`, `method text CHECK in ('cliq','bank_transfer','cash','paypal','other')`
- `received_at timestamptz`, `recorded_by uuid FK→users` (SA), `reference text NULL`, `note text NULL`, `created_at`
- Index: (clinic_id, received_at). SA-only writes.

---

## Messaging & reminders

### message_templates
- `id uuid PK`, `clinic_id FK` (null = platform default), `code text` (e.g. `reminder_24h`, `followup`, `noshow`), `channel text CHECK in ('whatsapp','email','sms')`, `language text DEFAULT 'ar'`, `body text NOT NULL` (with `{{variables}}`), `is_active boolean DEFAULT true`, `created_at`, `updated_at`
- Index: (clinic_id, code, channel). Validation: only whitelisted variables allowed.

### reminders (config per appointment/type, the "intent")
- `id uuid PK`, `clinic_id FK`, `appointment_id FK`, `type text CHECK in ('reminder_24h','reminder_2h','followup','noshow','confirmation')`, `channel text`, `created_at`
- Unique: (clinic_id, appointment_id, type, channel) — idempotency anchor.

### reminder_events (scheduled sends — the queue)
- `id uuid PK`, `clinic_id FK`, `reminder_id FK`, `appointment_id FK`
- `scheduled_for timestamptz NOT NULL`
- `status text CHECK in ('pending','scheduled','sent','failed','cancelled','skipped') NOT NULL DEFAULT 'scheduled'`
- `attempts int DEFAULT 0`, `last_error text NULL`, `locked_at timestamptz NULL`
- `created_at`, `updated_at`
- **Indexes:** (status, scheduled_for) for the job scan; (clinic_id, appointment_id). Idempotent processing via `FOR UPDATE SKIP LOCKED` + unique reminder anchor.

### messages (the actual send log)
- `id uuid PK`, `clinic_id FK`, `appointment_id uuid NULL FK`, `patient_id uuid NULL FK`, `reminder_event_id uuid NULL FK`
- `channel text CHECK in ('whatsapp_link','email','whatsapp_api','sms')` — V1 uses `whatsapp_link` (assisted) + `email`
- `direction text DEFAULT 'outbound'`
- `to_phone text NULL`, `to_email text NULL`
- `template_code text NULL`, `body_snapshot text` (rendered text prepared; contains patient name → clinic data, not platform-visible)
- `status text NOT NULL CHECK in ('prepared','opened','marked_sent','sent','delivered','failed','cancelled') DEFAULT 'prepared'`
- `marked_sent_by uuid NULL FK→users`, `marked_sent_at timestamptz NULL` (staff confirmation for assisted WhatsApp)
- `provider text NULL`, `provider_message_id text NULL`, `error text NULL`, `created_at`
- Index: (clinic_id, created_at), (clinic_id, patient_id), (clinic_id, status).
- **Status semantics (important — do NOT mark a WhatsApp deep link as `sent` on click):**
  - `whatsapp_link` (assisted): `prepared` (link generated) → `opened` (staff opened wa.me) → `marked_sent` (staff **explicitly confirmed** they sent it) → optionally `cancelled`. Opening a `wa.me` link is **not** proof of delivery, so it never auto-sets `sent`/`delivered`. Only a staff confirmation sets `marked_sent`.
  - `email` (automated): `prepared` → `sent` (accepted by provider) → `delivered`/`failed` (via provider webhook, P2). 
  - `whatsapp_api`/`sms` (later): `sent`/`delivered`/`failed` from provider receipts.

---

## Public booking

### public_booking_requests
- `id uuid PK`, `clinic_id FK`
- `patient_name text NOT NULL`, `patient_phone text NOT NULL`, `patient_email citext NULL`
- `service_id uuid NULL FK→services`, `preferred_doctor_member_id uuid NULL FK`
- `requested_at timestamptz NOT NULL` (the desired slot)
- `notes text NULL`
- `status text CHECK in ('pending','approved','rejected','converted','spam') DEFAULT 'pending'`
- `created_appointment_id uuid NULL FK→appointments`
- `ip text`, `created_at`, `handled_by uuid NULL FK`, `handled_at NULL`
- Index: (clinic_id, status, created_at). Heavily rate-limited at the app layer.

---

## Settings / config

### working_hours
- `id uuid PK`, `clinic_id FK`, `weekday int CHECK 0..6`, `open_time time`, `close_time time`, `break_start time NULL`, `break_end time NULL`, `is_closed boolean DEFAULT false`, `created_at`, `updated_at`
- Unique: (clinic_id, weekday). Times interpreted in clinic timezone.

### services
- `id uuid PK`, `clinic_id FK`, `name text`, `default_minutes int DEFAULT 30`, `default_price numeric(12,2) DEFAULT 0`, `is_active boolean DEFAULT true`, `created_at`, `updated_at`
- Index: (clinic_id, is_active). Soft-disable instead of delete if referenced.

### doctors_availability
- `id uuid PK`, `clinic_id FK`, `doctor_member_id FK→clinic_members`, `weekday int 0..6`, `start_time time`, `end_time time`, `is_available boolean DEFAULT true`, `created_at`, `updated_at`
- Index: (clinic_id, doctor_member_id, weekday). Overrides/holidays = later.

---

## Files & audit

### files
- `id uuid PK`, `clinic_id FK`, `patient_id uuid NULL FK`, `uploaded_by uuid FK→users`
- `storage_key text NOT NULL` (`clinics/{clinicId}/...`), `file_type text`, `mime text`, `size_bytes bigint`, `original_name text`
- `created_at`, `deleted_at`
- Index: (clinic_id, patient_id). **Never** a public URL column; access via signed URLs only.

### audit_logs
- `id uuid PK`, `clinic_id uuid NULL FK` (null = platform-level action), `actor_user_id uuid NULL FK→users`
- `action text NOT NULL` (e.g. `payment.create`, `support.access`, `subscription.activate`)
- `entity_type text NULL`, `entity_id uuid NULL`
- `summary text NULL` (no PHI), `ip text NULL`, `created_at timestamptz DEFAULT now()`
- Index: (clinic_id, created_at), (action, created_at). Append-only; no updates/deletes.

### support_access_grants (Super Admin support access control)
- `id uuid PK`, `clinic_id FK`, `granted_to uuid FK→users` (support admin), `reason text`, `expires_at timestamptz`, `created_at`, `revoked_at NULL`
- Index: (clinic_id, granted_to). Presence + non-expiry gates support reads of clinic data; each read logged in `audit_logs`.

### notifications (P2)
- `id uuid PK`, `clinic_id FK`, `recipient_member_id FK`, `type text`, `entity_type text`, `entity_id uuid`, `read_at NULL`, `created_at`
- Index: (clinic_id, recipient_member_id, read_at).

---

## Example relationships
- `clinics 1—* clinic_members *—1 users` (a person works in many clinics; a clinic has many staff).
- `clinics 1—* patients 1—* appointments` ; `appointments *—1 clinic_members(doctor)`.
- `patients 1—* treatment_notes` ; `patients 1—* treatment_plans 1—* treatment_plan_items`.
- `patients 1—* payments` ; `patients 1—* invoices 1—* invoice_items`.
- `appointments 1—* reminders 1—* reminder_events 1—* messages`.
- `clinics 1—1 subscriptions 1—* subscription_payments`.

## Suggested enums / status values (summary)
- clinic/subscription status: `trial, active, past_due, read_only, suspended, cancelled`
- appointment status: `booked, confirmed, arrived, in_progress, completed, cancelled, no_show`
- payment method: `cash, cliq, bank_transfer, card_manual, other`
- invoice status: `draft, issued, partial, paid, void`
- reminder_event status: `pending, scheduled, sent, failed, cancelled, skipped`
- member role: `owner, manager, doctor, receptionist, accountant, assistant`
- member status: `active, invited, suspended, removed`

## Avoiding cross-tenant data leakage (checklist)
1. Every tenant table has `clinic_id NOT NULL`.
2. **PRIMARY: every tenant table has RLS ENABLED + policies** scoping rows to the user's clinic membership (`auth.uid()` → `clinic_members`). Clinic-user code uses the **user-scoped Supabase client** so RLS always applies. (P0 launch blocker — ADR-001.)
3. App-layer `authorize()` + `clinic_id` filtering as a **second** layer (defense-in-depth, and for role permissions) — not the only line.
4. Foreign keys never let a row in clinic A reference a row in clinic B — composite FKs `(clinic_id, id)` so the DB rejects mismatches.
5. Per-clinic sequences for human-visible numbers (invoices) — never global.
6. **Service role bypasses RLS** → used only in Super Admin/background-job server code (separate, audited path); medical tables excluded from default admin views.
7. **Automated RLS isolation tests for every tenant table (clinic A cannot touch clinic B) — mandatory launch blocker.**

## Supporting future expansion
- `clinics.clinic_type` already present; clinical tables (`treatment_*`, `services`, `message_templates`) are the only vertical-specific bits and are configurable, so a new clinic type reuses everything else.
- `numeric` money + nullable `currency` allows multi-currency later.
- Plans/limits columns already model usage caps for future tiered pricing.
