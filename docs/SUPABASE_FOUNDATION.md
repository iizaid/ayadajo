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
