# ADR-001 — Stack, Auth & Tenancy (LOCKED for V1)

- **Status:** Accepted / **LOCKED** for Production-Ready Core / Pilot-Ready V1
- **Date:** 2026-06-13
- **Decision owner:** AtlasJo (founder)
- **Supersedes:** the "stack fork" open question in PLANNING_REVIEW.md and the prior dual recommendation in SYSTEM_ARCHITECTURE.md §1.1.

> This ADR is **binding**. AI coding agents and developers must follow it. It removes the Neon+Prisma vs Supabase+RLS ambiguity. Where any other planning doc still implies Neon/Prisma/app-only isolation, **this ADR wins** until a new ADR supersedes it.

---

## Context
Ayadajo handles **dental clinic patient data** (health-related, sensitive) and is built by a **solo developer using AI coding agents**. The single largest catastrophic risk is **cross-tenant data leakage**. Application-level `WHERE clinic_id` discipline works only if it is *never* forgotten — an unrealistic guarantee for AI-assisted, fast-moving solo development. We want the **database itself** to refuse cross-tenant access so a missed filter is a non-event, not a breach.

## Decision — Final chosen stack
| Layer | Choice (LOCKED) |
|---|---|
| Framework | **Next.js (App Router) + React + TypeScript (strict)** |
| Styling | **Tailwind CSS + shadcn/ui** (RTL-first) |
| Database | **Supabase Postgres** |
| **Tenant isolation (primary)** | **Supabase Row-Level Security (RLS)** on every tenant table |
| Auth | **Supabase Auth** (email/password + reset) |
| File storage | **Supabase Storage** (private buckets, signed URLs) |
| Hosting | **Vercel** |
| Email | **Resend** (or Brevo) |
| Background jobs | **Vercel Cron** → idempotent endpoints |
| Error monitoring | **Sentry** (PII scrubbing on) |
| Validation | **Zod** (shared client/server) |
| DB access | **Supabase server client** (`@supabase/supabase-js` / `@supabase/ssr`) using the **user's JWT** so RLS applies; raw SQL via **Supabase migrations** |
| Migrations | **SQL migrations** (Supabase CLI / `supabase/migrations/*.sql`) — **not** Prisma Migrate |

## Why Supabase + RLS was chosen
1. **Database-enforced isolation:** RLS policies keyed on the authenticated user's clinic membership mean Postgres refuses to return/modify another clinic's rows even if application code forgets a filter. For health data + solo + AI agents, this is the decisive safety property.
2. **Fewer moving parts:** Postgres + Auth + Storage + RLS in one platform — less integration surface for a solo dev to secure.
3. **Auth integrates with RLS:** Supabase Auth issues a JWT carrying the user id; RLS policies read `auth.uid()` to scope data — one coherent model from login to row access.
4. **Private files first-class:** Supabase Storage gives private buckets + signed URLs + (RLS-style) storage policies out of the box.
5. **Speed to V1:** less custom auth/session plumbing to build and get wrong.

## Why Neon + Prisma was NOT chosen for V1
- **Prisma + RLS don't compose:** Prisma's pooled service connection bypasses RLS, so you'd be relying on **application-level** `WHERE clinic_id` only — exactly the discipline we don't trust for a solo/AI build with health data.
- Choosing Neon+Prisma would make isolation depend on never forgetting a filter and on test coverage being perfect. RLS makes the database the backstop.
- Prisma's DX is nice, but **not worth trading away database-enforced isolation** for this product.
- Neon+Prisma remains a **reasonable alternative that we explicitly did not choose**; revisit only under the conditions below.

## Auth decision
- **Supabase Auth** for clinic users (email/password + reset). The Supabase user id is the identity.
- App tables: a `users`/profile row links to the Supabase auth user; `clinic_members` maps users↔clinics↔roles (membership drives RLS + authorization).
- **Sessions** via Supabase (httpOnly cookies through `@supabase/ssr`). Offboarding/instant revocation: on member remove/suspend, revoke the user's sessions / refresh tokens and rely on RLS membership checks (a removed member's rows access is denied by policy immediately).
- **Platform admins (AtlasJo Super/Support Admin):** flagged identities with a **separate** admin surface; **2FA is MANDATORY for Super Admin before the first real trial clinic** (see SUPER_ADMIN_PLAN.md / SECURITY doc). Clinic Owner 2FA stays P2.
- **Authorization** (role permissions) remains an **application-layer** `authorize(action)` check on top of RLS. RLS enforces *which clinic's rows*; app authz enforces *what this role may do*. Both required.

## Storage decision
- **Supabase Storage**, **private** buckets, keys namespaced `clinics/{clinicId}/patients/{patientId}/{fileId}`.
- Access **only** via short-lived **signed URLs** issued after an app authz check. **No public medical URLs, ever.** Storage access policies + app checks both apply.

## Hosting decision
- **Vercel** (prod + preview envs, preview deploy per PR). Supabase hosts DB/Auth/Storage. Custom domains: `app.ayadajo.com`, public booking `ayadajo.com/book/{slug}`.

## Background jobs decision
- **Vercel Cron** hitting **idempotent** endpoints (reminder processing, subscription sweep). Endpoints protected by a cron secret. No Redis/queue in V1; Inngest is a later option if durability/visibility demands grow.

## Security implications
- **RLS is now P0 and a launch blocker** (not P2): every tenant table has RLS enabled + policies, verified by **mandatory RLS isolation tests** before any real clinic.
- **Service role key is dangerous:** the Supabase **service role bypasses RLS.** It must be used **only** in narrowly-scoped server code — **Super Admin/platform operations and trusted background jobs** — **never** in normal clinic-user request paths, and **never** shipped to the client. Clinic-user data access always uses the **user-scoped** client so RLS applies. Misuse of the service role is the main way RLS can be defeated — treat it like a loaded weapon (env-only, server-only, audited where used).
- Defense in depth remains: app-layer `authorize()` + tenancy assumptions + audit logging + no-PHI-in-logs + private files + backups.
- Auth security: rate-limited login/reset, no enumeration, instant offboarding, mandatory Super Admin 2FA.

## Tradeoffs (accepted)
- **Vendor coupling to Supabase** (auth + storage + RLS). Mitigation: it's still standard Postgres + SQL migrations; data is portable; the coupling is worth the isolation guarantee for V1.
- **RLS learning curve / policy correctness:** policies must be written carefully and tested — but a tested policy is a stronger guarantee than untested app discipline.
- **Less ORM type-magic than Prisma:** acceptable; use generated Supabase types + Zod. Typed query DX is secondary to isolation.
- **Service-role footgun:** mitigated by strict usage rules + review + audit.

## How AI agents must follow this decision
1. **Use Supabase** (Postgres/Auth/Storage). Do **not** introduce Prisma, Neon, Auth.js, or a custom session system. Do **not** propose an alternative DB/auth without a new ADR.
2. **Every tenant table:** enable RLS + write policies scoping by the authenticated user's clinic membership. **No tenant table ships without RLS.**
3. **Clinic-user data access uses the user-scoped Supabase client** so RLS applies. The **service role key is forbidden in clinic-user code paths**; use it only in clearly-marked Super Admin/job code, server-side, env-only.
4. **Schema changes via SQL Supabase migrations** (`supabase/migrations/*.sql`), reviewed, forward-only.
5. App-layer `authorize()` still required on every mutation/sensitive read (RLS is *not* a substitute for role permissions).
6. **Write RLS isolation tests** alongside the schema; they are launch blockers.
7. If a task seems to require the service role in a clinic path, **stop and ask** — it's almost always wrong.

## What would justify revisiting this decision later
- Supabase pricing/limits become untenable at scale, or a hard platform limitation blocks a needed feature.
- A need for multi-region data residency Supabase can't satisfy (e.g. a Jordan in-country requirement) — would force a hosting/DB rethink **[LEGAL]**.
- RLS performance becomes a real bottleneck at high scale that policy/index tuning can't fix.
- The team grows and wants ORM ergonomics enough to re-architect isolation (only with RLS-or-equivalent preserved).
- Any revisit requires a **new ADR (ADR-002)** that explicitly preserves database-enforced (or equivalently strong) tenant isolation. **Do not** quietly drift back to app-only isolation.
