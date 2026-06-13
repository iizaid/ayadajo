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
