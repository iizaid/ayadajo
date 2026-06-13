# Ayadajo by AtlasJo

Ayadajo is a Production-Ready Core / Pilot-Ready V1 SaaS for dental clinics in Jordan. This repository is currently in Milestone 0: repository and environment preparation only.

No product features, app pages, auth flows, database schema, Supabase migrations, or RLS policies have been scaffolded yet. Build order is controlled by [planning/BUILD_ORDER_V1.md](planning/BUILD_ORDER_V1.md).

## Locked Stack

- Next.js App Router
- TypeScript strict
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase Postgres
- Supabase RLS as the primary tenant isolation layer
- Supabase Storage
- Vercel
- Resend or Brevo
- Vercel Cron
- Sentry

Forbidden for V1: Prisma, Neon, Auth.js, NextAuth, Drizzle unless explicitly approved later, ORM migrations, service-role clients in clinic-user paths, and real secrets in files.

## Package Manager

Package manager chosen for the project: `pnpm`.

No package manager files exist yet because Milestone 0 must not scaffold the application. Milestone 1 should initialize the Next.js app with `pnpm` unless a later human decision changes this.

## Planning

Start with:

- [planning/README.md](planning/README.md)
- [planning/BUILD_ORDER_V1.md](planning/BUILD_ORDER_V1.md)
- [planning/ADR-001-STACK-AUTH-TENANCY.md](planning/ADR-001-STACK-AUTH-TENANCY.md)
- [planning/AI_AGENT_INSTRUCTIONS.md](planning/AI_AGENT_INSTRUCTIONS.md)
- [planning/PRODUCTION_READY_V1_SCOPE.md](planning/PRODUCTION_READY_V1_SCOPE.md)
- [planning/SYSTEM_ARCHITECTURE.md](planning/SYSTEM_ARCHITECTURE.md)
- [planning/TESTING_AND_QA_PLAN.md](planning/TESTING_AND_QA_PLAN.md)
- [planning/LAUNCH_READINESS_CHECKLIST.md](planning/LAUNCH_READINESS_CHECKLIST.md)

Repository conventions are documented in [docs/CONVENTIONS.md](docs/CONVENTIONS.md). The external design reference has been translated into Ayadajo-specific design rules in [docs/DESIGN_REFERENCE.md](docs/DESIGN_REFERENCE.md).

## Milestone Rule

Execute exactly one milestone at a time from [planning/BUILD_ORDER_V1.md](planning/BUILD_ORDER_V1.md), then stop and report. Do not start Milestone 1 until Milestone 0 has been reviewed.
