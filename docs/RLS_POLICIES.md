# Milestone 3 RLS Policies

Milestone 3 creates the V1 database schema and the first tenant-isolation policy layer. Supabase RLS is the primary cross-tenant boundary; application authorization and role-specific permissions are added in later milestones.

## Helper Functions

- `public.current_app_user_id()` maps `auth.uid()` to `public.users.id`.
- `public.is_platform_admin(required_role text)` checks platform admin identity for later Super Admin paths.
- `public.is_clinic_member(target_clinic_id uuid)` checks that the authenticated user is an active member of the target clinic.

All helper functions are `security definer`, use `set search_path = public`, and expose only boolean or ID checks needed by policies.

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
| `public.clinics` | Authenticated active clinic members can select and update their clinic root row. Inserts remain service-role/Super Admin only. |
| `public.clinic_settings` | Authenticated active clinic members can select, insert, and update rows for their clinic only. |
| `public.clinic_members` | Authenticated active clinic members can select, insert, and update rows for their clinic only; role authorization is deferred to M4. |
| `public.member_invites` | Authenticated active clinic members can select, insert, and update invites for their clinic only. |
| `public.working_hours` | Authenticated active clinic members can select, insert, and update rows for their clinic only. |
| `public.services` | Authenticated active clinic members can select, insert, and update rows for their clinic only. |
| `public.doctors_availability` | Authenticated active clinic members can select, insert, and update rows for their clinic only. |
| `public.patients` | Authenticated active clinic members can select, insert, and update patients for their clinic only. |
| `public.appointments` | Authenticated active clinic members can select, insert, and update appointments for their clinic only. |
| `public.appointment_status_history` | Authenticated active clinic members can select and insert status history for their clinic only; rows are append-only. |
| `public.treatment_notes` | Authenticated active clinic members can select, insert, and update treatment notes for their clinic only. |
| `public.treatment_plans` | Authenticated active clinic members can select, insert, and update treatment plans for their clinic only. |
| `public.treatment_plan_items` | Authenticated active clinic members can select, insert, and update treatment plan items for their clinic only. |
| `public.invoices` | Authenticated active clinic members can select, insert, and update invoices for their clinic only; hard deletes are blocked. |
| `public.invoice_items` | Authenticated active clinic members can select, insert, and update invoice items for their clinic only. |
| `public.payments` | Authenticated active clinic members can select, insert, and update payment rows for their clinic only; reversals use linked rows and hard deletes are blocked. |
| `public.subscriptions` | Authenticated active clinic members can select subscription rows for their clinic only; writes are reserved for later Super Admin/subscription workflows. |
| `public.subscription_payments` | Authenticated active clinic members can select subscription payment rows for their clinic only; writes are reserved for later Super Admin billing workflows. |
| `public.message_templates` | Authenticated users can read platform defaults; clinic templates require active clinic membership for select, insert, and update. |
| `public.reminders` | Authenticated active clinic members can select, insert, and update reminders for their clinic only. |
| `public.reminder_events` | Authenticated active clinic members can select, insert, and update reminder events for their clinic only. |
| `public.messages` | Authenticated active clinic members can select, insert, and update message logs for their clinic only. |
| `public.public_booking_requests` | Authenticated active clinic members can select, insert, and update booking requests for their clinic only. Anonymous public booking policies are deferred to M10. |
| `public.files` | Authenticated active clinic members can select, insert, and update file metadata for their clinic only. Storage object policies and signed URL access are deferred to M11. |
| `public.audit_logs` | Authenticated active clinic members can select and insert clinic audit rows only; rows are append-only and platform-level rows remain service-role only. |
| `public.support_access_grants` | Authenticated active clinic members can select support grants for their clinic only; grant creation/revocation is reserved for later Super Admin support workflows. |
| `public.notifications` | Authenticated active clinic members can select, insert, and update notifications for their clinic only. |

## Intentional Deferrals

- M4 adds application-level `authorize()` and role-specific permission checks on top of RLS.
- M5 adds live database RLS isolation tests for every tenant table.
- M6 adds Super Admin workflows and audited support access paths.
- M10 adds public booking anonymous insert rules, rate limits, and abuse controls.
- M11 adds Supabase Storage bucket policies and signed URL access for files.

No UI, feature routes, server actions, or clinic-user data-access paths were created in M3.
