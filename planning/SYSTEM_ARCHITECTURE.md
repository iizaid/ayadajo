# Ayadajo — System Architecture

Audience: a solo developer or very small team. Goal: **simple, safe, cheap to run, hard to leak data.**

> **✅ STACK DECISION LOCKED — see [ADR-001](ADR-001-STACK-AUTH-TENANCY.md).** This architecture serves **Production-Ready Core / Pilot-Ready V1**. The stack is **Supabase (Postgres + Auth + Storage) with RLS as the PRIMARY tenant-isolation layer**, on **Next.js + TypeScript + Tailwind + shadcn/ui**, hosted on **Vercel**, email via **Resend/Brevo**, jobs via **Vercel Cron**, errors via **Sentry**. **Neon + Prisma is an alternative we explicitly did NOT choose** (Prisma's pooled connection bypasses RLS; we want database-enforced isolation for health data built by a solo dev + AI agents). Wherever older text below implies Neon/Prisma/app-only isolation, **ADR-001 overrides it.**

---

## 1. Recommended Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + React + TypeScript (strict)** | One codebase for UI + server (Server Actions / Route Handlers). SSR for fast first paint on weak clinic internet. Huge ecosystem. Matches your baseline. |
| Styling | **Tailwind CSS + shadcn/ui** | Fast, consistent, RTL-capable, owned components (no vendor lock). |
| DB | **PostgreSQL** | Relational data with strong constraints — exactly what multi-tenant clinic data needs (FKs, unique indexes, transactions). |
| DB | **Supabase Postgres** | Managed Postgres + Auth + Storage + RLS in one platform; fewer integration surfaces for a solo dev to secure. |
| **Tenant isolation** | **Supabase RLS (primary)** | Database refuses cross-tenant rows even if app code forgets a filter — the decisive safety property for health data. (See §6, ADR-001.) |
| DB access | **Supabase server client (user-scoped, RLS applies)** + **SQL Supabase migrations** | Clinic-user paths use the user's JWT so RLS enforces scope; schema via reviewed SQL migrations. **Service role only in Super Admin/jobs.** |
| Auth | **Supabase Auth** (email/password + reset) | JWT carries the user id; RLS policies read `auth.uid()` — one coherent identity→row model. (See §4.) |
| Email | **Resend** (or Brevo) | Simple transactional email (password reset, email reminders, owner notices). Brevo also does SMS later. |
| File storage | **Supabase Storage** | Private buckets + signed URLs + storage policies. No public medical URLs. |
| Background jobs | **Vercel Cron → idempotent endpoint** | Enough for "scan due reminders / subscription sweep every N min." Inngest is a later option, not V1. |
| Hosting | **Vercel** | Zero-ops deploys, preview branches, cron. |
| Error monitoring | **Sentry** (PII scrubbing on) | Exceptions only; never patient data. |
| Validation | **Zod** | One schema for input validation + types, shared client/server. |
| WhatsApp | **`wa.me` deep links (V1)** → **WhatsApp Business API via BSP (later)** | Avoid Meta verification + template approval + per-message cost until clinics pay. |

### 1.1 Why Supabase + RLS (and not Neon + Prisma) — DECIDED
See **[ADR-001](ADR-001-STACK-AUTH-TENANCY.md)** for the full rationale. Summary:
- **Chosen: Supabase + RLS.** Postgres refuses cross-tenant access at the database level. For **health data**, built by a **solo dev + AI agents**, this database-enforced isolation beats relying on never-forgotten `WHERE clinic_id` discipline.
- **Not chosen (alternative): Neon + Prisma.** Prisma's pooled service connection **bypasses RLS**, which would force **application-level-only** isolation — exactly the fragile discipline we're avoiding. Kept on record as a reasonable option we declined; revisit only via a new ADR that preserves database-enforced isolation.
- **Service role caution:** the Supabase service role **bypasses RLS** — use it **only** in Super Admin/background-job server code, never in clinic-user request paths, never client-side.

## 2. Architecture Style

**Modular monolith.** A single Next.js app, internally organized into modules (see MODULES_PLAN.md), one database, deployed as one unit.

**Why:**
- A solo dev shipping an MVP should never run microservices. Distributed systems multiply ops, debugging, and failure modes for zero early benefit.
- A monolith with clean module boundaries gives you 90% of the structure with 10% of the pain. You can extract a service later *if* you ever need to.

**What to avoid at the beginning:**
- Microservices / service mesh.
- Event-sourcing / CQRS / Kafka.
- Separate API gateway + SPA + backend (use Next.js full-stack instead).
- A self-hosted Kubernetes cluster.
- Redis/queues before you have reminders that need them (Vercel Cron first).
- GraphQL (REST/Server Actions are simpler here).
- Premature caching layers.

## 3. Multi-Tenant Strategy

**Model: shared database, shared schema, `clinic_id` discriminator column.**

- Every clinic-owned table has a non-null `clinic_id` FK to `clinics`.
- One row of `clinics` = one tenant. Cheapest, simplest, scales to thousands of clinics on one Postgres.
- **Avoid** schema-per-tenant and database-per-tenant: they multiply migration and ops cost for a solo dev with no early benefit.

Future expansion (other clinic types) reuses the same model with a `clinic_type` column — no tenancy change needed.

## 4. Authentication Strategy (Supabase Auth — see ADR-001)

- **Identity = Supabase Auth user** (email/password + reset). A `users`/profile row links to the auth user; a user may belong to many clinics via `clinic_members`.
- **Sessions:** Supabase sessions via httpOnly cookies (`@supabase/ssr`). The JWT carries `auth.uid()`, which **RLS policies use to scope rows.**
- **Instant offboarding:** on member remove/suspend, revoke the user's sessions/refresh tokens; RLS membership checks then deny that user's access to the clinic immediately.
- **Active clinic context:** stored server-side per session; the server derives the operating `clinicId` from session + membership, **never** from a client-supplied URL/body (the slug is routing only and must be checked against membership). RLS is the backstop if app code slips.
- **Authorization is separate:** RLS decides *which clinic's rows*; an app-layer `authorize(role, action)` decides *what this role may do*. Both are required (see §5).
- **Super Admin** is a separate, flagged admin surface. **2FA is MANDATORY for Super Admin before the first real trial clinic** (the service role lives behind this surface). Clinic Owner 2FA = P2.

## 5. Authorization Strategy

Two checks on **every** mutation and sensitive read:
1. **Tenancy check:** does the session's active clinic match the resource's `clinic_id`, and is the user an active member of that clinic? If not → 404 (not 403 — don't reveal existence).
2. **Permission check:** does the member's role permit this action?

- MVP uses **fixed roles** mapped to a permission matrix in code (see USER_ROLES_AND_PERMISSIONS.md). No DB-driven custom permission editor yet (the `roles`/`permissions` tables exist for the future but MVP can seed/enforce from code).
- Implement a single `authorize(session, action, resource)` helper used everywhere. Centralizing this is your main defense against drift.
- Server Actions / route handlers must call authz **before** touching data — never rely on hidden UI.

## 6. Tenant Isolation Strategy (the most important section)

**Primary enforcement = Supabase RLS at the database. App checks are defense-in-depth.** (See ADR-001.)

- **Every tenant table has RLS ENABLED + policies** that scope rows to clinics the authenticated user (`auth.uid()`) is an **active member** of (joined via `clinic_members`). Postgres refuses to return/modify other clinics' rows even if app code forgets a filter. **This is P0 and a launch blocker.**
- **Clinic-user data access uses the user-scoped Supabase client** (the user's JWT) so RLS applies on every query. App code does not hand-roll `WHERE clinic_id` as the *only* defense — it can still pass `clinicId` for clarity/authorization, but RLS is the guarantee.
- **The Supabase service role bypasses RLS** and is therefore **restricted to Super Admin/platform operations and trusted background jobs**, server-side, env-only — **never** in clinic-user request paths, **never** client-side. Misusing the service role is the one way to defeat RLS; guard it like a secret weapon (audited where used).
- **Cross-tenant reads** (Super Admin) go through the clearly-separated, audited admin path using the service role intentionally.
- **Tests are a deliverable and a launch blocker:** for every tenant table, an automated RLS test creates two clinics and asserts clinic A can never read/write/list/search clinic B's rows under a normal user session (see SECURITY doc + TESTING doc + IMPLEMENTATION_TASKS).
- **App-layer tenancy/authorization** (the `authorize()` helper, 404-on-mismatch) remains as a second layer and for role permissions — but is no longer the *only* line.

## 7. Background Jobs / Reminder Scheduling Strategy

- **MVP:** reminders are *assisted* (staff click a WhatsApp deep link) — minimal background work. A single **Vercel Cron** (e.g. every 15 min) can hit `/api/jobs/scan-reminders` to (later) generate due email reminders.
- **P2 automated:** a `reminder_events` table holds scheduled sends with `scheduled_for` + `status`. A cron job every few minutes selects `status='scheduled' AND scheduled_for <= now()`, processes each, marks `sent`/`failed`. **Idempotency** via a unique key per (appointment, reminder_type) and a `processing` lock / `SELECT ... FOR UPDATE SKIP LOCKED`.
- **P2+ scale:** move to **Inngest** for durable scheduling, retries with backoff, and visibility, without managing Redis/BullMQ.
- See REMINDERS_AND_MESSAGING_SYSTEM.md for the full design (statuses, cancellation, retries).

## 8. File Storage Strategy

- Private bucket(s); object keys namespaced by clinic: `clinics/{clinicId}/patients/{patientId}/{fileId}`.
- DB `files` table holds metadata + key; the object store holds bytes.
- Access **only** via short-lived signed URLs generated after an authz check. **No public medical URLs, ever.**
- Validate content-type + size server-side; cap sizes; reject executables.
- Lifecycle: deleting a patient archives files (P2: scheduled hard-delete per retention policy).

## 9. Audit Logging Strategy

- `audit_logs` table, append-only, with `clinic_id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `summary`, `ip`, `created_at`.
- Write in the same transaction as the audited mutation where possible (so a rolled-back action leaves no false audit).
- Log sensitive actions (see PRODUCT_REQUIREMENTS §21) and **all Super Admin support access** to clinic data.
- Never put PHI/secrets in `summary`. Reference IDs, not contents.

## 10. Deployment Strategy

- **Vercel** with a `production` and a `preview` environment; every PR gets a preview deploy.
- DB migrations via **SQL Supabase migrations** (`supabase/migrations/*.sql`, Supabase CLI), run in CI on deploy (guarded). **RLS policies are part of migrations** and reviewed. Keep migrations forward-only.
- Two databases minimum: **dev/preview** and **production** (never test against prod).
- Custom domain `app.ayadajo.com`; public booking at `ayadajo.com/book/{slug}` (subdomains later).

## 11. Environment Variables Strategy

- All secrets in env vars; **never** in code or committed files. `.env.example` documents names (no values).
- Minimum set: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (**server-only, Super-Admin/jobs paths only — never exposed to the client**), `SUPABASE_DB_URL` (migrations), `RESEND_API_KEY`, `APP_URL`, `CRON_SECRET`, `SENTRY_DSN`, `SUPER_ADMIN_BOOTSTRAP_*`.
- Separate values per environment in Vercel project settings. Rotate on suspected exposure.
- Validate presence at boot with a Zod env schema so a missing var fails fast and loudly.

## 12. Backup Strategy

- Rely on managed Postgres **point-in-time recovery** (Neon/Supabase both offer it) — verify it's enabled and note the retention window.
- **Additionally:** a scheduled `pg_dump` (daily) to object storage you control, encrypted, retained 30 days. Don't trust a single provider for patient data.
- **Test restores** quarterly (an untested backup is not a backup).
- Document RPO/RTO targets (e.g. RPO 24h via daily dump, better via PITR).

## 13. Scaling Plan

- One Postgres + Vercel handles hundreds of clinics comfortably with proper indexes.
- Scale order when needed: (1) add indexes / fix N+1; (2) read replicas for analytics; (3) move heavy jobs to Inngest/worker; (4) partition large tables (appointments, messages, audit_logs) by clinic or time; (5) only then consider extracting a service.
- Keep analytics queries off the hot path (precompute daily rollups — see ANALYTICS doc) before they become slow.

## 14. Observability & Logs

- Structured server logs (JSON) with request id + clinic id (id, **not** patient data).
- Error tracking: **Sentry** (free tier) for exceptions, with PII scrubbing on.
- Uptime check on `/healthz`.
- A lightweight admin metrics page (active clinics, jobs processed, failed messages) in Super Admin.
- **Never log** patient names, phones, notes, or file contents.

## 15. Error Handling Strategy

- Server actions return typed results (`{ ok: true, data } | { ok: false, error }`); validation errors map to field messages.
- User-facing errors are generic + friendly (Arabic); internal details go to Sentry only.
- Mutations are transactional; partial failures roll back.
- Network drop mid-edit (weak clinic internet): client retains form state, shows "couldn't save — retry," and the save is idempotent so a retry doesn't double-create (use client-generated idempotency keys for create actions).

## 16. How to Keep It Simple but Safe

- One app, one Supabase project, fixed roles. **RLS is the primary tenant guarantee; app `authorize()` is the second layer.**
- Boring, stable tech over trendy. No microservices, no queues you don't need, no premature abstractions.
- Every tenant table has `clinic_id` **and RLS enabled + policies**; every mutation is authorized + (when sensitive) audited; the **service role never touches clinic-user paths.**
- Ship a **trustworthy V1** that runs a real clinic's day; RLS + 2FA (Super Admin) + backups are V1, not "later." Harden further (automated reminders, Owner 2FA) as clinics start paying.
