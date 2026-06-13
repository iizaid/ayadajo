# Supabase Foundation

Milestone 2 establishes Supabase wiring only. It does not create tenant feature tables, full tenant RLS policies, product pages, or auth UI flows.

## Local Setup Assumptions

- Install the Supabase CLI locally or make it available on `PATH`.
- Docker must be running for `supabase start`.
- Use names from `.env.example`; never commit real values.
- Clinic-user application code must use `createUserScopedSupabaseClient()` so RLS applies.
- `createAdminSupabaseClient()` is server-only, dangerous, and reserved for Super Admin and trusted background jobs.

## Local Commands

```powershell
pnpm supabase:start
pnpm supabase:db:push
```

To reset a local database during development:

```powershell
pnpm supabase:db:reset
```

## Staging and Production Migration Order

1. Review SQL migrations in `supabase/migrations/`.
2. Apply to a non-production Supabase project first.
3. Run app checks: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
4. Apply to production only after staging succeeds.
5. Never edit an applied migration; add a new forward-only migration.

## Milestone 2 Migration Scope

`0001_init.sql` creates only:

- `public.users`, linked to `auth.users`
- `public.plans`
- shared `set_updated_at()` trigger helper

Full tenant schema, tenant RLS policies, seeds, clinic tables, and product feature tables belong to later milestones.

## Milestone 2 Base Table RLS

Milestone 2 base platform tables have RLS enabled even before the full tenant RLS work in Milestone 3:

- `public.users` uses `users_select_own_profile`, allowing authenticated users to select only their own platform profile where `auth_user_id = auth.uid()`.
- `public.plans` uses `plans_select_active`, allowing authenticated users to select only active plans where `is_active = true`.
- No anonymous access policies are defined.
- No normal-user insert, update, or delete policies are defined for these tables.

Super Admin, seed, and trusted background behavior remains reserved for service-role-only code in later milestones. Full tenant RLS still belongs to Milestone 3.

## Milestone 3 Schema and RLS

Milestone 3 adds the V1 database schema through forward-only SQL migrations:

- `supabase/migrations/0002_tenant_tables.sql` creates tenant, clinical, financial, messaging, booking, file metadata, audit, support-access, and RBAC tables.
- `supabase/migrations/0003_rls.sql` enables RLS and adds tenant membership policies.
- `supabase/migrations/0004_constraints.sql` adds the appointment overlap exclusion constraint.
- `supabase/seed.sql` seeds plans, roles, permissions, and role-permission mappings. Super Admin profile bootstrap is optional and requires local/staging `app.super_admin_*` settings pointing to an existing Supabase Auth user.

Tenant isolation is enforced by:

- `clinic_id NOT NULL` on clinic-owned tables.
- RLS enabled on every clinic-owned table.
- Policies scoped through `public.is_clinic_member(clinic_id)`, which requires the authenticated user to be an active clinic member.
- Composite foreign keys such as `(clinic_id, patient_id)` and `(clinic_id, appointment_id)` so the database rejects cross-clinic references where practical.
- Tenant-leading indexes for clinic-owned lookup paths.

Intentional deferrals:

- Role-specific application authorization belongs to Milestone 4.
- Live RLS isolation tests against a running Supabase database belong to Milestone 5.
- Public anonymous booking insert policies belong to Milestone 10.
- Storage object policies and signed URL file access belong to Milestone 11.

No app features, UI screens, API routes, server actions, or clinic-user data-access paths are created by Milestone 3.

## Milestone 3 RLS Hardening Patch

`supabase/migrations/0005_m3_rls_hardening.sql` narrows the original Milestone 3 write policies before Milestone 4 application authorization exists.

- Tenant reads still use active clinic membership through `public.is_clinic_member(clinic_id)`.
- Sensitive writes now require `public.has_clinic_permission(clinic_id, '<permission>')` where a seeded permission has a clear mapping.
- Broad active-member `INSERT` and `UPDATE` policies were removed from sensitive tables.
- `audit_logs`, `files`, `notifications`, `subscriptions`, `subscription_payments`, and `support_access_grants` remain read-only or closed to normal-user writes until their dedicated server-side workflows exist.
- Public anonymous booking policies remain deferred to Milestone 10.

This patch keeps cross-tenant RLS in place while avoiding direct table API writes by any authenticated active clinic member before role-aware authorization is implemented.

## Milestone 4 Auth, Session, and Authorization Layer

Milestone 4 adds the application auth boundary without changing the database schema:

- `lib/auth/session.ts` calls Supabase Auth `getUser()` through `createUserScopedSupabaseClient()`, maps `auth.uid()` to `public.users.auth_user_id`, and loads the current user's clinic memberships through RLS.
- Active clinic context is selected only from active memberships and stored in the server-readable `ayadajo_active_clinic_id` cookie. A multi-clinic user is sent to `/choose-clinic` until they choose one.
- `lib/auth/permissions.ts` provides the typed `authorize(session, action, resource)` helper aligned with the seeded role-permission matrix.
- `lib/auth/tenancy.ts` and `lib/auth/tenancy-rules.ts` provide reusable guards for authenticated active-clinic access. Cross-tenant resource mismatches return not found behavior.
- Auth pages exist only for login, forgot password, reset password, set password, and clinic selection. No clinic product feature screens are created in M4.
- Login and password reset requests use a minimal in-process rate-limit abstraction. A durable shared store remains deferred until production infrastructure hardening.
- `lib/audit/*` provides a server-only audit helper and PHI-resistant summary sanitizer for future sensitive actions. Existing M3 RLS keeps direct normal-user audit table writes closed; feature milestones must wire audited server workflows deliberately.

Milestone 5 remains responsible for live Supabase/RLS isolation validation. M4 tests are unit/static checks unless a local Supabase project is available.

## Milestone 4 Membership Lifecycle Completion

The M4 completion patch adds narrow server-only membership lifecycle helpers:

- `lib/auth/membership.ts` exposes member listing, invite creation, role change, suspend, and remove helpers.
- Every helper requires an active clinic session and checks `authorize()` before touching membership tables.
- Owner uses `staff.manage`. Manager uses `staff.manage_limited` and is constrained to non-owner/non-manager staff.
- Managers cannot assign `owner` or `manager`, cannot manage owners/managers, and cannot remove/suspend owners.
- Users cannot suspend or remove themselves.
- Last active owner protection is enforced in the helper from currently visible clinic membership data.
- Offboarding changes `clinic_members.status` to `suspended` or `removed`; `getCurrentAuthSession()` only exposes active memberships, so an older active-clinic cookie becomes unusable on the next request.
- Supabase Auth token/session revocation is not implemented from clinic-user paths because that requires a trusted admin path. M6/Super Admin or a dedicated audited trusted workflow must handle hard Auth token revocation later.
- Invite creation writes `member_invites` rows only. It does not create Supabase Auth users and does not send email yet.

`supabase/migrations/0006_m4_membership_lifecycle.sql` narrows staff lifecycle RLS so `staff.manage_limited` can operate only on non-owner/non-manager membership and invite rows. It does not add anonymous policies, delete policies, broad audit writes, or service-role usage.

Audit helper caveat:

- `writeAuditLog()` sanitizes summaries and rejects obvious email/phone PHI.
- Under current RLS, normal clinic users may receive `rls_rejected` when writing audit rows.
- Feature milestones must handle that result explicitly and should add a dedicated trusted audit path/function before claiming sensitive-action audit writes are fully operational.
