# Changelog

## 2026-06-13 - Milestone 4 membership lifecycle completion patch

### Added

- Added server-only membership lifecycle helpers for listing members, creating invite records, role changes, suspension, and removal.
- Added app-layer staff lifecycle rules for owner full staff management and manager limited staff management.
- Added protections against manager management of owner/manager roles, manager assignment of elevated roles, self offboarding, and removing/suspending/demoting the last active owner.
- Added a narrow M4 RLS migration allowing `staff.manage_limited` only for non-owner/non-manager staff lifecycle rows.
- Added role-permission parity tests that compare `ROLE_PERMISSIONS` directly against `supabase/seed.sql`.
- Added membership lifecycle rule tests and extended tenancy tests for removed memberships.

### Clarified

- Invite helpers only create `member_invites` rows. Supabase Auth admin invitation/user creation and email delivery remain deferred to a trusted path.
- Offboarding revokes clinic access on the next request because active session loading ignores suspended/removed memberships; hard Supabase Auth token revocation remains deferred.
- Audit helper summaries are sanitized, but current RLS may reject normal-user audit inserts until a dedicated trusted audit path/function is added.

### Scope Guard

- No product feature UI, Super Admin, patients, appointments, payments, dashboard, public booking, reminders, treatment notes, files, service-role clinic-user paths, or stack changes were added.

## 2026-06-13 - Milestone 4 auth membership and authorization

### Added

- Added Arabic RTL auth pages for login, forgot password, reset password, set password, and active clinic selection.
- Added Supabase Auth server actions for login, forgot password, logout, and trusted clinic selection.
- Added the server-side session layer that maps Supabase Auth users to `public.users` and loads active clinic memberships through the user-scoped Supabase client.
- Added a typed `authorize(session, action, resource)` permission layer aligned with the seeded role-permission matrix.
- Added reusable tenancy guard rules that redirect unauthenticated users and return not found behavior for cross-tenant resource mismatches.
- Added a server-only audit helper with PHI-resistant audit summary validation for future sensitive workflows.
- Added a minimal in-process rate-limit abstraction for login/reset attempts.
- Added unit/static tests for authorization, tenancy guard behavior, audit summary safety, rate limiting, and service-role boundaries.

### Scope Guard

- No patient, appointment, payment, dashboard, Super Admin, public booking, reminder, treatment, or file feature screens were created.
- No migrations were changed.
- No service-role code was added to clinic-user auth paths.

## 2026-06-13 - Milestone 3 permission matrix hardening patch

### Security

- Tightened the seeded role-permission matrix used by `public.has_clinic_permission(...)`.
- Added seed cleanup logic so removed role-permission pairs do not remain after re-running `supabase/seed.sql`.
- Removed broad patient create/update, reminder, and booking approval permissions from Assistant.
- Removed broad patient create/update permissions from Doctor while preserving treatment note and treatment plan permissions.
- Kept Manager on `staff.manage_limited` instead of full `staff.manage`.
- Kept audit log view restricted to Owner and Manager.
- Preserved Receptionist front-desk permissions for patient CRUD, appointments, payment recording, invoice creation, reminders, and booking request approval.
- Kept Accountant limited to financial permissions.

### Scope Guard

- No migrations, UI, auth flows, API routes, server actions, product features, stack changes, or Milestone 4 work were added.

## 2026-06-13 - Milestone 3 RLS hardening patch

### Security

- Added `supabase/migrations/0005_m3_rls_hardening.sql` to narrow broad active-member write policies before Milestone 4 application authorization exists.
- Added `public.has_clinic_permission(clinic_id, permission)` as a `security definer` helper with `search_path = public`.
- Removed broad active-member `INSERT` and `UPDATE` policies from sensitive clinic tables.
- Replaced safe write paths with permission-based policies for settings, staff, patients, appointments, treatment records, invoices, payments, message templates, reminders, messages, and booking request staff updates.
- Kept `audit_logs`, `files`, `notifications`, `subscriptions`, `subscription_payments`, and `support_access_grants` closed to normal-user writes or read-only until their dedicated server-side workflows exist.
- Kept public anonymous booking policies deferred to Milestone 10.

### Scope Guard

- No Milestone 4 work, UI, auth flows, API routes, server actions, product features, or clinic-user data-access paths were added.

## 2026-06-13 - Milestone 3 database schema and RLS

### Added

- Synchronized `README.md` with the current M0-M3 implementation state and locked Supabase/RLS stack rules.
- Added `supabase/migrations/0002_tenant_tables.sql` with the V1 schema for clinics, membership, RBAC metadata, patients, appointments, treatment records, financial records, subscriptions, messaging/reminders, public booking requests, file metadata, audit logs, support access grants, and notifications.
- Added `supabase/migrations/0003_rls.sql` with tenant-membership helper functions and RLS policies.
- Added `supabase/migrations/0004_constraints.sql` with the database-level appointment overlap exclusion constraint.
- Added `supabase/seed.sql` for plans, roles, permissions, role-permission mappings, and optional Super Admin profile bootstrap against an existing Supabase Auth user.
- Added `docs/RLS_POLICIES.md` with one-line policy summaries and explicit deferrals.
- Added static M3 security tests for migration existence, tenant table `clinic_id`, RLS enablement, helper functions, policy patterns, key constraints, seed content, and M2 hardening preservation.

### Security

- Added `public.current_app_user_id()`, `public.is_platform_admin(text)`, and `public.is_clinic_member(uuid)` as `security definer` helpers with `search_path = public`.
- Enabled RLS on all M3 protected tables.
- Scoped clinic-owned table policies through active clinic membership.
- Kept private clinic data closed to anonymous users.
- Reserved subscription writes and support-grant writes for later Super Admin/server-only workflows.
- Blocked tenant-table hard deletes by omitting normal-user delete policies unless a later milestone adds explicit authorization and policy support.

### Scope Guard

- No UI screens, auth flows, API routes, server actions, clinic-user data access paths, or Milestone 4 work were added.
- Public anonymous booking policies are deferred to Milestone 10.
- Storage object policies and signed URL access are deferred to Milestone 11.
- Full live RLS isolation tests remain a Milestone 5 gate.

## 2026-06-13 - Milestone 2 hardening patch

### Security

- Hardened Milestone 2 base platform tables with RLS before applying migrations to a real Supabase project.
- Enabled RLS on `public.users` with `users_select_own_profile`, allowing authenticated users to select only their own profile through `auth_user_id = auth.uid()`.
- Enabled RLS on `public.plans` with `plans_select_active`, allowing authenticated users to select only active plans through `is_active = true`.
- Kept anonymous access and normal-user insert, update, and delete policies undefined for both base tables.

### Scope Guard

- Edited `supabase/migrations/0001_init.sql` directly because the migration has not been applied yet.
- Full tenant RLS remains Milestone 3 scope.

## 2026-06-13 - Milestone 2 Supabase foundation

### Added

- Supabase local project configuration in `supabase/config.toml`.
- First SQL migration in `supabase/migrations/0001_init.sql` for base platform skeleton only:
  - `public.users` linked to `auth.users`
  - `public.plans`
  - shared `public.set_updated_at()` trigger helper
- Supabase client factories:
  - `lib/supabase/client.ts` for browser anon client
  - `lib/supabase/server.ts` for user-scoped server client using request cookies so RLS applies
  - `lib/supabase/admin.ts` for server-only service-role client
- `lib/env.ts` with Zod validation for public and server environment variables.
- `middleware.ts` for Supabase SSR session refresh.
- `lib/supabase/database.types.ts` with a typed base schema skeleton for M2 tables.
- `docs/SUPABASE_FOUNDATION.md` documenting local setup assumptions and migration apply order.
- Supabase boundary tests in `tests/security/supabase-boundary.test.ts`.
- Package scripts for Supabase CLI commands:
  - `pnpm supabase:start`
  - `pnpm supabase:stop`
  - `pnpm supabase:db:push`
  - `pnpm supabase:db:reset`

### Dependencies

- Added `@supabase/ssr`.
- Added `@supabase/supabase-js`.
- Added `zod`.
- Added `server-only`.

### Security Boundary

- `SUPABASE_SERVICE_ROLE_KEY` is read only in `lib/supabase/admin.ts`.
- The admin client is marked server-only and dangerous, and is documented as Super Admin / trusted job code only.
- No clinic-user path imports the admin client.

### Verified

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test` passed, including service-role boundary and M2 migration scope checks.
- `pnpm build` passed and preserved the M1 Arabic RTL app.
- Static search found no service-role usage outside `lib/supabase/admin.ts`.

### Not Run

- Supabase local migrations were not run because the Supabase CLI is not installed on this machine (`supabase` command not found). Run `pnpm supabase:start` and `pnpm supabase:db:push` after installing the Supabase CLI and starting Docker.

### Scope Guard

- No full tenant schema was created.
- No full RLS policies were created.
- No Supabase feature data access, auth UI, product pages, patients, appointments, payments, files, reminders, booking, treatment, dashboard, or admin screens were added.

## 2026-06-13 - Milestone 1 Next.js RTL UI foundation

### Added

- Next.js App Router foundation using `pnpm`, TypeScript strict, and Node 22 project target.
- Root Arabic RTL layout in `app/layout.tsx` with `lang="ar"` and `dir="rtl"`.
- Safe font strategy using `next/font/google`: Noto Sans Arabic for Arabic UI and Inter for Latin/system fallback.
- Tailwind CSS v4 setup with warm Ayadajo design tokens inspired by `docs/DESIGN_REFERENCE.md`.
- shadcn/ui-style configuration through `components.json`, `components/ui/*`, and `lib/utils.ts`.
- Arabic-only i18n key layer in `lib/i18n/index.ts` and `locales/ar.json`.
- RTL Arabic placeholder page in `app/page.tsx` demonstrating primitives only.
- Reusable UI primitives:
  - `StatusBadge`
  - `MetricCard`
  - `EmptyState`
  - `ConfirmDialog`
  - `DataTable`
  - `FormField`
- State patterns for hover, focus, disabled, empty, error, and loading-like visual states.
- Vitest + Testing Library setup and a trivial render test.
- GitHub Actions CI workflow for install, typecheck, lint, test, and build.

### Design

- Used warm cream canvas, off-white surfaces, graphite/charcoal text, subtle inset borders, restrained teal/warm accents, pill buttons, and controlled radii.
- Avoided generic SaaS gradients, glassmorphism, decorative cartoons, and heavy card shadows.
- Kept the page operational and demonstrative only; no clinic feature workflows were implemented.

### Verified

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test` passed.
- `pnpm build` passed.
- Local dev server returned HTTP 200 on `http://127.0.0.1:3000`.

### Notes

- Current shell Node version is `v20.20.2`, while the repository target is Node 22 via `.nvmrc` and `package.json` engines. Checks pass locally with an engine warning; CI is configured to run Node 22.
- `pnpm@latest` required newer Node in this shell, so `pnpm@10.24.0` was activated and recorded in `packageManager`.
- Browser plugin visual verification could not run because the in-app browser target `iab` was unavailable in this session.
- No Supabase, Auth, database schema, RLS, service-role code, or product features were added.

## 2026-06-13 - Milestone 0 repository preparation

### Added

- Root `README.md` with planning links, locked stack summary, package manager decision, and milestone execution rule.
- `.env.example` with required environment variable names only and no real values.
- `.gitignore` for Node, Next.js, Vercel, env files, logs, coverage, OS/editor files, and local Python artifacts.
- `.nvmrc` with Node.js 22.
- `docs/CONVENTIONS.md` documenting locked stack rules, forbidden stack rules, Supabase and RLS rules, service-role boundaries, Arabic RTL rules, no-PHI logging, naming conventions, milestone execution, External Design usage, UI quality bar, anti-generic design rules, and the requirement to follow `BUILD_ORDER_V1.md`.
- `docs/DESIGN_REFERENCE.md` translating the External Design reference into Ayadajo-specific design rules.
- UI/UX Pro Max skill files under `.codex/skills/ui-ux-pro-max/` via the requested installer.

### Verified

- Read all files in `planning/`.
- Read `planning/BUILD_ORDER_V1.md` and confirmed only Milestone 0 is in scope.
- Read External Design files: `DESIGN.md`, `theme.css`, `tokens.json`, and `variables.css`.
- Confirmed the repository is fresh and contains planning/design materials, with no app scaffold yet.
- Confirmed no conflicting stack files were found: no `prisma/`, `schema.prisma`, Drizzle files, NextAuth/Auth.js files, or Neon-specific configuration outside planning materials.
- Confirmed no package manager files exist yet; selected `pnpm` for future initialization per Milestone 0 guidance.

### UI/UX Skill Initialization

- Command run:

```powershell
uipro init --ai codex https://ui-ux-pro-max-skill.nextlevelbuilder.io/
```

- Result: success. The installer created `.codex/skills/ui-ux-pro-max/`.

### External Design Ingestion

- The external reference was summarized into Ayadajo-specific rules in `docs/DESIGN_REFERENCE.md`.
- The reference is treated as design-system inspiration only. Brand names, logos, copy, fintech concepts, and unrelated illustration ideas must not be copied.

### Conflicts or Blockers

- No conflicting stack files found.
- No blockers found for Milestone 0.
