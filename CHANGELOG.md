# Changelog

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
