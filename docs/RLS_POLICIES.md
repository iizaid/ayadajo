# Milestone 3 RLS Policies

Milestone 3 creates the V1 database schema and the first tenant-isolation policy layer. Supabase RLS is the primary cross-tenant boundary; application authorization and role-specific permissions are added in later milestones.

## Helper Functions

- `public.current_app_user_id()` maps `auth.uid()` to `public.users.id`.
- `public.is_platform_admin(required_role text)` checks platform admin identity for later Super Admin paths.
- `public.is_clinic_member(target_clinic_id uuid)` checks that the authenticated user is an active member of the target clinic.
- `public.has_clinic_permission(target_clinic_id uuid, required_permission text)` checks active membership and the seeded role-permission matrix before allowing write policies.

All helper functions are `security definer`, use `set search_path = public`, and expose only boolean or ID checks needed by policies.

## Hardened Write Model

Milestone 3 originally created active-membership write policies for many tenant tables. The hardening patch in `supabase/migrations/0005_m3_rls_hardening.sql` removes those broad `INSERT`/`UPDATE` policies and replaces only the safe mappings with permission-based policies.

The model after the patch:

- Active clinic membership still controls tenant-scoped reads.
- Writes require `public.has_clinic_permission(...)` where there is a clear seeded permission.
- Writes with no safe permission mapping remain closed until the relevant milestone adds server-side authorization and narrower policy coverage.
- Normal users cannot insert arbitrary audit logs.
- Subscription writes remain Super Admin/server workflow only.
- Anonymous public booking insert remains deferred to M10.

## Permission Matrix Hardening

The seeded role-permission matrix in `supabase/seed.sql` is security-sensitive because `public.has_clinic_permission(...)` reads it inside RLS policies. The matrix is intentionally least-privilege before M4:

- `owner` remains the only role with full `staff.manage`.
- `manager` keeps broad operational permissions but only has `staff.manage_limited`; owner-sensitive staff rules are enforced later in M4 app authorization.
- `receptionist` keeps front-desk permissions needed for V1: patient create/update, appointment management, payment recording, invoice creation, reminders, and booking request approval. They do not receive payment reversal, invoice void, settings, staff, audit, or full clinical-note permissions.
- `doctor` keeps clinical write permissions for treatment notes/plans and own appointment concepts, but does not receive broad patient create/update, payment, settings, or staff permissions at the RLS permission layer.
- `accountant` is limited to financial dashboard, payments, invoices, and exports; no clinical, staff, or settings permissions.
- `assistant` is constrained to operational dashboard and `appointment.mark_arrived`; broad patient, reminder, booking approval, financial, clinical, staff, settings, and audit permissions are withheld until a narrower M4/M5 authorization model exists.

The seed includes cleanup logic so removed role-permission pairs are deleted on re-run instead of lingering from older seed versions.

## Milestone 4 Application Authorization Layer

Milestone 4 does not weaken or replace RLS. It adds an app-layer authorization check above the existing database policies:

- `authorize(session, action, resource)` answers whether the active clinic role may perform a specific action.
- RLS still answers which clinic rows the Supabase user-scoped client can access.
- The local typed permission matrix is aligned with `supabase/seed.sql` and denies by default.
- Suspended or removed memberships are denied at the app layer and are already excluded by `public.is_clinic_member(...)` / `public.has_clinic_permission(...)`.
- Cross-tenant resource mismatches are handled as not found behavior to avoid leaking resource existence.
- The M4 completion migration allows `staff.manage_limited` only for non-owner/non-manager staff lifecycle rows; self-offboarding and last-owner protection stay in the server helper because they need request-aware application checks.

Live tenant isolation tests remain a Milestone 5 blocker.

## Milestone 5 Live Test Grants

`supabase/migrations/0007_m5_api_grants.sql` grants table privileges to `authenticated` and `service_role` so PostgREST can evaluate RLS policies during app and live test requests.

- These grants do not disable RLS and do not add anonymous table privileges.
- `service_role` is used only by the live test harness for synthetic setup.
- Normal tenant isolation remains enforced by the RLS policies summarized below.

## Policy Summary

| Table | RLS summary |
|---|---|
| `public.users` | M2 hardened own-profile select only. |
| `public.plans` | M2 hardened authenticated active-plan select only. |
| `public.sessions` | Authenticated users can select, insert, update, and delete only their own session rows. |
| `public.password_reset_tokens` | RLS enabled with no normal-user policies; reset flows are deferred to M4 narrow server paths. |
| `public.roles` | Authenticated read of static role metadata only. |
| `public.permissions` | Authenticated read of static permission metadata only. |
| `public.role_permissions` | Authenticated read of static role-permission metadata only. |
| `public.clinics` | Active members can select their clinic. Updates require `settings.manage`. Inserts remain service-role/Super Admin only. |
| `public.clinic_settings` | Active members can select. Inserts/updates require `settings.manage`. |
| `public.clinic_members` | Active members can select. Inserts/updates require `staff.manage`, or `staff.manage_limited` when both old and new role scope are non-owner/non-manager. Self-offboarding and last-owner checks are app-layer. |
| `public.member_invites` | Active members can select. Inserts/updates require `staff.manage`, or `staff.manage_limited` for non-owner/non-manager invite roles. Email delivery and Auth user creation are deferred. |
| `public.working_hours` | Active members can select. Inserts/updates require `settings.manage`. |
| `public.services` | Active members can select. Inserts/updates require `settings.manage`. |
| `public.doctors_availability` | Active members can select. Inserts/updates require `settings.manage`. |
| `public.patients` | Active members can select. Inserts require `patient.create`; updates require `patient.update`. |
| `public.appointments` | Active members can select. Inserts/updates require `appointment.manage`; own-doctor limited rules are deferred to M4. |
| `public.appointment_status_history` | Active members can select. Inserts require `appointment.manage`; rows remain append-only. |
| `public.treatment_notes` | Active members can select. Inserts/updates require `treatment_note.write`. |
| `public.treatment_plans` | Active members can select. Inserts/updates require `treatment_plan.write`. |
| `public.treatment_plan_items` | Active members can select. Inserts/updates require `treatment_plan.write`. |
| `public.invoices` | Active members can select. Inserts/updates require `invoice.create`; void-specific app authorization remains M12. |
| `public.invoice_items` | Active members can select. Inserts/updates require `invoice.create`. |
| `public.payments` | Active members can select. Inserts require `payment.record` or `payment.reverse`; updates remain closed to preserve financial history. |
| `public.subscriptions` | Authenticated active clinic members can select subscription rows for their clinic only; writes are reserved for later Super Admin/subscription workflows. |
| `public.subscription_payments` | Authenticated active clinic members can select subscription payment rows for their clinic only; writes are reserved for later Super Admin billing workflows. |
| `public.message_templates` | Authenticated users can read platform defaults. Clinic template inserts/updates require `message_template.manage`. |
| `public.reminders` | Active members can select. Inserts/updates require `reminder.send`. |
| `public.reminder_events` | Active members can select. Inserts/updates require `reminder.send`; automated job handling is added later. |
| `public.messages` | Active members can select. Inserts/updates require `reminder.send`; WhatsApp status semantics are enforced later in message workflows. |
| `public.public_booking_requests` | Active members can select. Staff updates require `booking_request.approve`; inserts, including anonymous public insert, are deferred to M10. |
| `public.files` | Active members can select file metadata. Inserts/updates remain closed until M11 storage policy and signed URL work. |
| `public.audit_logs` | Active members can select clinic audit rows only. Normal-user inserts are closed until a safe server path/function exists. |
| `public.support_access_grants` | Authenticated active clinic members can select support grants for their clinic only; grant creation/revocation is reserved for later Super Admin support workflows. |
| `public.notifications` | Active members can select. Inserts/updates remain closed until notification workflows exist. |

## Intentional Deferrals

- M4 adds application-level `authorize()` and role-specific permission checks on top of RLS.
- M5 adds live database RLS isolation tests for every tenant table.
- M6 adds Super Admin workflows and audited support access paths.
- M10 adds public booking anonymous insert rules, rate limits, and abuse controls.
- M11 adds Supabase Storage bucket policies and signed URL access for files.

No UI, feature routes, server actions, or clinic-user data-access paths were created in M3.
