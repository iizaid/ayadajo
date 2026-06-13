# Ayadajo by AtlasJo

Ayadajo by AtlasJo is a Production-Ready Core / Pilot-Ready V1 SaaS for dental clinics in Jordan.

The product target is a secure Arabic-first, RTL-first clinic operations system that can support a real 14-day pilot without cross-tenant leakage, PHI exposure, or operational ambiguity.

## Current Implementation State

Before this Milestone 3 run:

- Milestone 0 completed: repository preparation and conventions.
- Milestone 1 completed: Next.js App Router + Arabic RTL UI foundation.
- Milestone 2 completed: Supabase foundation and client boundaries.
- Milestone 2 hardening patch completed: base platform tables protected with RLS.
- Milestone 3 is now being executed: database schema and RLS policies.

## Locked Stack

- Next.js App Router
- TypeScript strict
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase Postgres
- Supabase RLS as the primary tenant-isolation layer
- Supabase Storage
- Vercel
- Resend or Brevo later
- Vercel Cron later
- Sentry later
- pnpm
- Node.js 22

The V1 stack is locked by [planning/ADR-001-STACK-AUTH-TENANCY.md](planning/ADR-001-STACK-AUTH-TENANCY.md).

## Build Order

[planning/BUILD_ORDER_V1.md](planning/BUILD_ORDER_V1.md) is the only implementation order.

Codex and developers must work milestone by milestone, complete exactly one milestone per run, update `CHANGELOG.md`, run the required checks, then stop for human review. Do not build features outside the current milestone.

## Security Rules

- Supabase RLS is the primary tenant-isolation layer.
- Every tenant-owned table must have `clinic_id` unless a documented schema reason says otherwise.
- Clinic-user paths must use the user-scoped Supabase client so RLS applies.
- The service-role client is server-only and reserved for Super Admin or trusted background jobs.
- Do not use the service role in clinic-user paths.
- Do not commit real secrets or `.env` files.
- No PHI in logs, URLs, Sentry events, or audit summaries.

## Forbidden Stack Drift

Do not introduce:

- Prisma
- Neon
- Auth.js
- NextAuth
- Drizzle
- ORM migrations
- Custom session systems

Schema changes must use forward-only SQL migrations in `supabase/migrations/`.

## Planning References

Start with:

- [planning/BUILD_ORDER_V1.md](planning/BUILD_ORDER_V1.md)
- [planning/ADR-001-STACK-AUTH-TENANCY.md](planning/ADR-001-STACK-AUTH-TENANCY.md)
- [planning/PRODUCTION_READY_V1_SCOPE.md](planning/PRODUCTION_READY_V1_SCOPE.md)
- [planning/DATABASE_SCHEMA.md](planning/DATABASE_SCHEMA.md)
- [planning/SECURITY_AND_PRIVACY_PLAN.md](planning/SECURITY_AND_PRIVACY_PLAN.md)
- [planning/TESTING_AND_QA_PLAN.md](planning/TESTING_AND_QA_PLAN.md)

Repository conventions are documented in [docs/CONVENTIONS.md](docs/CONVENTIONS.md). Supabase setup and migration notes are documented in [docs/SUPABASE_FOUNDATION.md](docs/SUPABASE_FOUNDATION.md).
