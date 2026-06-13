# Ayadajo — Implementation Tasks

> **⬆️ V1 reframe:** These tasks build **Production-Ready Core / Pilot-Ready V1**. Promotions to **V1 (were P2):** **S3 file upload/private storage/signed URLs**, **backups+restore (C5)**, **monitoring (A4 + health/uptime)** — now V1, not later. **New V1 tasks:** **H3 — assisted patient import** (CSV/Excel, normalize, dedupe, preview, batch+rollback, audited — see DATA_MIGRATION_AND_IMPORT_PLAN.md); **U4 — uptime monitor + alerts**; **V4 — Arabic receptionist cheat sheet + onboarding intake form**. The **first 25 V1 tasks** are listed at the end of this file. Isolation (E2) + permission (F2) tests remain **launch blockers**.

Implementation-ready tasks, groupable into GitHub issues. Each: **Title · Description · Priority · Dependencies · Expected files · Acceptance criteria.** No code yet.

Priority: **P0** (foundation/MVP-critical) · **P1** (MVP) · **P2** (later).
**Stack is LOCKED — [ADR-001](ADR-001-STACK-AUTH-TENANCY.md): Supabase (Postgres + Auth + Storage) with RLS as primary isolation, Next.js + TS + Tailwind + shadcn/ui, Vercel, Resend, Vercel Cron, Sentry.** Schema/RLS via **SQL Supabase migrations** (`supabase/migrations/*.sql`) — **no Prisma**. The **service role bypasses RLS** → server-only, Super-Admin/jobs only, never clinic-user paths, never client. Paths below are illustrative.

---

## A. Project Setup
**A1 — Initialize Next.js + TS strict + Tailwind + shadcn/ui (RTL)** · P0 · deps none · files: `package.json`, `tsconfig.json` (strict), `tailwind.config.ts`, `app/layout.tsx` (`dir="rtl" lang="ar"`), `components/ui/*` · AC: app boots RTL, Arabic font loads, lint+typecheck pass.
**A2 — Env schema + config** · P0 · deps A1 · files: `lib/env.ts` (Zod), `.env.example` · AC: missing env fails at boot with clear message; `.env.example` lists all names.
**A3 — CI (typecheck, lint, test) + Vercel deploy + preview** · P0 · deps A1 · files: `.github/workflows/ci.yml`, Vercel config · AC: PRs run checks + preview deploy.
**A4 — Error tracking (Sentry) with PII scrubbing** · P1 · deps A1 · files: `lib/observability.ts` · AC: errors captured, no PII in payloads.
**A5 — CHANGELOG + docs wiring** · P0 · deps A1 · files: `CHANGELOG.md`, `README.md` linking `/planning` · AC: present.

## B. UI Foundation
**B1 — Design system primitives (RTL)** · P0 · deps A1 · files: `components/ui/*`, `components/StatusBadge.tsx`, `MetricCard`, `EmptyState`, `ConfirmDialog`, `DataTable`, `FormField` · AC: reusable, RTL-correct, colorblind-safe statuses with labels.
**B2 — App shell + role-filtered nav + subscription banner** · P1 · deps B1, F1 · files: `app/(clinic)/layout.tsx`, `components/Sidebar.tsx`, `components/SubscriptionBanner.tsx` · AC: nav items filter by role; banner reflects status.
**B3 — Loading/empty/error state patterns** · P1 · deps B1 · AC: skeletons, friendly Arabic empties, retrying errors.
**B4 — i18n key layer (ar only shipped)** · P1 · deps A1 · files: `lib/i18n/*`, `locales/ar.json` · AC: no hardcoded UI strings.

## C. Database
**C1 — Supabase SQL schema: platform + tenant tables** · P0 · deps A2 · files: `supabase/migrations/0001_init.sql` · AC: all tables from DATABASE_SCHEMA.md with `clinic_id`, indexes, constraints, composite FKs; created via SQL migration (no Prisma).
**C1b — RLS: enable + policies on every tenant table** · **P0 — LAUNCH BLOCKER** · deps C1, D1 · files: `supabase/migrations/0002_rls.sql` · AC: RLS ENABLED on every tenant table; SELECT/INSERT/UPDATE/DELETE policies scope rows to clinics where `auth.uid()` is an **active member** (via `clinic_members`); platform-admin/service-role path documented; no tenant table left without RLS.
**C2 — Appointment overlap exclusion constraint** · P0 · deps C1 · files: migration (raw SQL `EXCLUDE USING gist`) · AC: DB rejects overlapping active appts per doctor.
**C3 — Seed: plans, permissions, role_permissions, platform admin bootstrap** · P0 · deps C1 · files: `prisma/seed.ts` · AC: roles/permissions seeded; first super admin via secure seed.
**C4 — Supabase client factories (user-scoped vs service-role)** · P0 · deps C1, C1b · files: `lib/supabase/server.ts`, `lib/supabase/admin.ts` · AC: a **user-scoped** server client (uses the request user's JWT → RLS applies) for all clinic-user paths; a **service-role** client isolated in `admin.ts`, server-only, importable **only** by Super-Admin/job code (lint rule forbids import elsewhere); helper that asserts current clinic membership for authorization (second layer on top of RLS).
**C5 — DB backup job (pg_dump) + restore runbook** · P1 · deps C1 · files: `scripts/backup.ts`, `docs/RESTORE.md` · AC: daily encrypted dump; documented tested restore.

## D. Auth
**D1 — Supabase Auth integration (email/password + reset + SSR sessions)** · P0 · deps C1 · files: `lib/supabase/server.ts`, `app/(auth)/login`, `middleware.ts` · AC: Supabase Auth email/password + reset; httpOnly cookie sessions via `@supabase/ssr`; app `users`/profile row linked to `auth.users.id`; instant offboarding revokes the user's sessions/refresh tokens; rate-limited; no enumeration.
**D6 — Mandatory 2FA for platform admins (Super Admin)** · **P0 — blocker before first trial clinic** · deps D1, R1 · AC: Supabase Auth MFA (TOTP) enforced on the admin surface; Super Admin cannot reach admin tools without MFA; Owner MFA = P2.
**D2 — Password reset (single-use expiring token + email)** · P1 · deps D1, M1 · files: `app/(auth)/forgot`, `reset` · AC: secure reset; sessions invalidated on reset.
**D3 — Invite accept / set password** · P1 · deps D1, G1 · files: `app/(auth)/set-password` · AC: invitee sets password → active member.
**D4 — Choose-clinic / clinic context in session** · P1 · deps D1, E1 · AC: multi-clinic users pick clinic; session stores `activeClinicId`; scope derived from session not URL.
**D5 — Login rate limiting + lockout** · P0 · deps D1 · files: `lib/ratelimit.ts` · AC: backoff on repeated failures; generic errors.

## E. Multi-tenancy
**E1 — Tenancy guard + membership check (404 on mismatch)** · P0 · deps C4, D1 · files: `lib/auth/tenancy.ts` · AC: every request verifies active membership; cross-tenant → 404.
**E2 — RLS isolation test harness (every tenant table)** · **P0 — LAUNCH BLOCKER** · deps C1b, D1 · files: `tests/isolation/*` · AC: under a **normal user session** (RLS in force), clinic A cannot read/write/list/search clinic B for **every** tenant table; a missing app filter still cannot leak (RLS proves it); CI-blocking.
**E3 — Service-role-usage guard test** · P0 · deps C4 · files: `tests/security/service-role.test.ts` · AC: the service-role client is not importable/used in any clinic-user route; a test/lint fails if `admin.ts` is imported outside Super-Admin/job paths.

## F. Roles & Permissions
**F1 — Permission matrix + `authorize()` helper** · P0 · deps D1 · files: `lib/auth/permissions.ts` · AC: central check; deny by default; used in all actions.
**F2 — Permission tests** · P1 · deps F1 · files: `tests/permissions/*` · AC: each role allowed/denied per matrix.

## G. Clinic Setup
**G1 — Clinic + owner + defaults creation (used by SA)** · P0 · deps C1 · files: `lib/clinic/create.ts` · AC: creates clinic+settings+hours+owner member+trial atomically.
**G2 — Clinic settings: profile, working hours, services, doctors, booking toggle, language** · P1 · deps G1, F1 · files: `app/(clinic)/settings/*` · AC: Owner/Manager edit; validations; audited.
**G3 — Team members: invite/role/suspend/remove** · P1 · deps G1, F1, D3 · files: `app/(clinic)/team/*` · AC: lifecycle works; sessions revoked on remove; last-owner protected; audited.

## H. Patients
**H1 — Patient CRUD + Jordan phone validation + dedupe warn** · P1 · deps E1, F1 · files: `app/(clinic)/patients/*`, `lib/validation/phone.ts` · AC: create/edit/archive; search name+phone; duplicate-phone warning.
**H2 — Patient profile (history aggregation)** · P1 · deps H1, I1 · files: `app/(clinic)/patients/[id]/page.tsx` · AC: shows appts, notes, plan, payments/balance, files.

## I. Appointments
**I1 — Appointment lifecycle + status history + double-book prevention** · P0 · deps H1, C2, G2 · files: `app/(clinic)/appointments/*`, `lib/appointments/*` · AC: full lifecycle; app+DB overlap block; working-hours enforce; idempotent create.
**I2 — Today's Schedule (grouped, inline actions)** · P1 · deps I1 · files: `app/(clinic)/today/page.tsx` · AC: grouped sections + 1-click actions + search.
**I3 — Reschedule/cancel side-effects (reminder cancel/regen hooks)** · P1 · deps I1, N2 · AC: cancel cancels pending reminders; reschedule regenerates.

## J. Calendar
**J1 — Day/week calendar, doctor columns, click-to-book, hour shading** · P1 · deps I1 · files: `app/(clinic)/calendar/*` · AC: day default + week; per-doctor; empty-slot prefilled booking.

## K. Dashboard
**K1 — Core metric computations (clinic-scoped, tz-correct)** · P1 · deps I1, P1payments · files: `lib/metrics/*` · AC: matches ANALYTICS definitions; role-gated financials.
**K2 — Dashboard page (cards + today list + banner)** · P1 · deps K1, B2 · files: `app/(clinic)/dashboard/page.tsx` · AC: correct numbers; empty states; financials hidden per role.

## L. Public Booking
**L1 — Public page `/book/[slug]` (RTL, request mode)** · P1 · deps G2 · files: `app/book/[slug]/page.tsx` · AC: service/date/time/details; working-hours; mobile.
**L2 — Submit request + anti-spam (honeypot, rate limit)** · P1 · deps L1, E1 · files: `app/api/book/*`, `lib/ratelimit.ts` · AC: creates `public_booking_request`; rate-limited; validated.
**L3 — Staff booking-requests queue (approve/reject/spam)** · P1 · deps L2, I1 · files: `app/(clinic)/booking-requests/*` · AC: approve creates appointment (re-checks overlap), dedupes patient.

## M. Messaging
**M1 — Email sending (Resend/Brevo) wrapper** · P1 · deps A2 · files: `lib/email/*` · AC: send transactional email; failures logged (no PHI).
**M2 — Message templates (Arabic defaults, variable whitelist render)** · P1 · deps G2 · files: `lib/templates/*`, `app/(clinic)/templates/*` · AC: render with whitelist; editable text; no injection.
**M3 — Assisted WhatsApp deep-link + accurate send status** · P1 · deps I2, M2 · files: `lib/whatsapp/link.ts` · AC: generate `wa.me` prefilled link → log `messages` row `status='prepared'`; opening the link sets `opened`; **a separate explicit staff action "I sent it" sets `marked_sent` (with `marked_sent_by`/`marked_sent_at`)**. **Never auto-mark `sent` on click** — opening wa.me is not proof of delivery. Staff can mark `cancelled`/`failed`.

## N. Reminders (P2)
**N1 — Generate reminder_events on create/confirm (idempotent anchor)** · P2 · deps I1 · AC: one event per (appt,type,channel); respects quiet hours.
**N2 — Cron processor (SKIP LOCKED, retries, status flips)** · P2 · deps N1, M1 · files: `app/api/jobs/process-reminders/route.ts`, cron config · AC: idempotent; re-checks appt validity; retries with backoff; cron-secret protected.
**N3 — Quiet hours + cancel/reschedule integration** · P2 · deps N2, I3 · AC: no sends in quiet hours; stale reminders never sent.

## O. Subscriptions
**O1 — Trial create/extend + manual payment record + activate** · P0 · deps G1, SA-shell · files: `lib/subscription/*` · AC: trial 14d; record payment; activate sets period; audited.
**O2 — Status gating guard (`assertClinicWritable`)** · P0 · deps O1, E1 · files: `lib/subscription/gate.ts` · AC: read_only blocks writes/allows reads; suspended blocks all but status screen.
**O3 — Daily expiry/grace job + owner email reminders** · P1 · deps O1, M1 · files: `app/api/jobs/subscription-sweep/route.ts` · AC: trial→read_only on expiry; active→past_due→read_only; T-3/T-0 emails.
**O4 — Clinic status screens/banners** · P1 · deps O2, B2 · AC: each status shows correct UX.

## P. Payments & Invoices
**P1 — Record payment + outstanding computation + reversal entries** · P1 · deps H1, F1 · files: `app/(clinic)/payments/*`, `lib/payments/*` · AC: record; per-patient balance; reversal not delete; audited.
**P2 — Simple invoice (per-clinic numbering, items, print, void)** · P1 · deps P1 · files: `app/(clinic)/invoices/*` · AC: sequential per-clinic number; print-friendly; void keeps number; audited.

## Q. Treatment
**Q1 — Treatment notes (dated, append, edit window)** · P1 · deps H2, F1 · files: `app/(clinic)/patients/[id]/notes/*` · AC: quick note ≤20s; author edit window; correction notes; audited edits.
**Q2 — Treatment plans + items (status, totals, outstanding link)** · P1 · deps H2, P1 · files: `.../plan/*` · AC: items with price/status; totals; mark done; pricing edits audited.

## R. Super Admin
**R1 — Admin shell + separate auth guard (`is_platform_admin`) + service-role boundary** · P0 · deps D1 · files: `app/(admin)/layout.tsx`, `lib/auth/admin.ts` · AC: only platform admins; distinct UI; **MFA required (D6)**; the **service-role** Supabase client is used **only** here/in jobs (the one place cross-tenant reads are allowed), and every cross-tenant data view is **audited** (support-access gating).
**R2 — Clinics list + create + clinic details (ops view)** · P1 · deps R1, G1, O1 · files: `app/(admin)/clinics/*` · AC: list/filter; create; per-clinic status/subscription/payments/usage/notes.
**R3 — Subscription/payment/plan management** · P1 · deps R2, O1 · files: `app/(admin)/subscriptions`, `payments`, `plans` · AC: record payment, activate, set status, manage plans.
**R4 — Support access grants + audited read-only clinic view** · P1 · deps R1, S1 · files: `app/(admin)/support/*`, `lib/support/*` · AC: time-boxed grant + reason; every read logged; medical needs extra confirm.
**R5 — Platform audit log view** · P1 · deps S1 · files: `app/(admin)/audit/*` · AC: filter by clinic/actor/action/date.

## S. Security
**S1 — Audit logging helper (append-only, no PHI)** · P0 · deps C1 · files: `lib/audit/*` · AC: writes in action transaction; reference IDs only.
**S2 — Rate limiting middleware (login, booking, signed URLs, jobs)** · P0 · deps A1 · AC: per-IP/identifier windows; cron-secret on jobs.
**S3 — File upload + private storage + signed URLs** · **P1 — V1 (launch-required minimal attach)** · deps C1b, S1 · files: `lib/files/*` · AC: **Supabase Storage private bucket**; keys namespaced `clinics/{clinicId}/...`; **signed URLs only, no public medical URLs**; file **type + size limits** (allow images/pdf, **block risky/executable types**); **EXIF stripping for images**; access via signed URL **after authz**; **access audited**. (Virus scanning may be later if unavailable, but risky file types must be blocked now.)
**S4 — Security review pass + checklist sign-off** · P1 · deps most · AC: SECURITY checklist all green before pilot.

## T. Testing
**T1 — Tenant isolation suite** (see E2) · P0.
**T2 — Permission suite** (see F2) · P1.
**T3 — Appointment race/double-book test** · P0 · deps I1 · AC: concurrent booking → one succeeds.
**T4 — Session revocation / offboarding test** · P1 · deps D1, G3 · AC: removed member loses access immediately.
**T5 — Reminder idempotency + cancel test** · P2 · deps N2 · AC: no double-send; stale never sent.
**T6 — E2E daily-loop (book→arrive→complete→pay→remind)** · P1 · deps core · AC: happy path passes.

## U. Deployment
**U1 — Prod + preview environments, migrations on deploy** · P0 · deps A3, C1 · AC: guarded forward-only migrations; separate DBs.
**U2 — Custom domains (app + /book) + HTTPS/HSTS** · P1 · deps U1 · AC: `app.ayadajo.com`, `ayadajo.com/book/*`.
**U3 — Healthcheck + uptime monitor** · P1 · deps U1 · files: `app/healthz/route.ts` · AC: monitored.

## V. Documentation
**V1 — README + run/setup docs** · P0 · deps A1 · AC: a new dev/agent can boot locally.
**V2 — Keep `/planning` + CHANGELOG updated each major step** · P0 · ongoing.
**V3 — Privacy Policy / ToS / DPA drafts (for [LEGAL] review)** · P1 · deps none · files: `docs/legal/*` · AC: drafts ready for a Jordanian lawyer.
**V4 — Onboarding kit (Arabic receptionist cheat sheet + intake form)** · P1 · deps core · files: `docs/onboarding/*` · AC: 1-page Arabic cheat sheet + intake form ready (see CLINIC_ONBOARDING_PLAYBOOK.md).

## New V1 tasks (added in the V1 reframe)
**H3 — Assisted patient import (CSV/Excel)** · P1 · deps H1, S1 · files: `app/(clinic)/patients/import/*`, `lib/import/*` · AC: template download; upload xlsx/csv; auto-map by header; Jordan phone normalize; dedupe detection; **preview before commit**; batch `import_id` + rollback; partial-import error list; Owner/Manager + Super-Admin only; audited (counts only, no PHI). See DATA_MIGRATION_AND_IMPORT_PLAN.md.
**U4 — Uptime monitor + alerting** · P1 · deps U3 · AC: external monitor pings `/healthz` + landing; alerts on downtime + job/backup failure (see OBSERVABILITY_AND_BACKUP_PLAN.md).
**S5 — "No-PHI-in-logs" enforcement + test** · P0 · deps S1, A4 · files: `lib/observability.ts`, `tests/security/no-phi-logs.test.ts` · AC: sensitive-field denylist; Sentry scrubber; test asserts patient data never serialized to logs.

---

## First 25 implementation tasks for Production-Ready V1 (ordered)
1. A1 — Next.js + TS-strict + Tailwind + shadcn/ui (RTL/Arabic)
2. A2 — Zod env schema + `.env.example`
3. A3 — CI (typecheck/lint/test) + Vercel preview
4. B1 — Design-system primitives (RTL, status badges)
5. **Apply ADR-001** — Supabase project + Supabase Auth + SQL migration tooling (stack is locked, not a decision)
6. C1 — Supabase SQL schema (all tables, `clinic_id`, indexes, constraints, composite FKs)
7. D1 — Supabase Auth integration (email/password + reset + SSR sessions)
8. **C1b — RLS enabled + policies on every tenant table (LAUNCH BLOCKER)**
9. C4 — Supabase client factories (user-scoped vs service-role boundary)
10. C2 — Appointment overlap exclusion constraint
11. C3 — Seed (plans/permissions/roles + super-admin bootstrap)
12. E1 — Tenancy/membership guard + `authorize()` second layer (404 on mismatch)
13. **E2 — RLS isolation test harness, every tenant table (LAUNCH BLOCKER)**
14. E3 — Service-role-usage guard test
15. F1 — Permission matrix + `authorize()` helper
16. **F2 — Permission tests (LAUNCH BLOCKER)**
17. G1 — Clinic + owner + defaults creation (Super Admin)
18. G2 — Clinic settings (hours/services/doctors/profile/booking)
19. G3 — Team members (invite/role/suspend/remove + session revoke)
20. H1 — Patients CRUD + Jordan phone + dedupe warn + consent status
21. H2 — Patient profile (history aggregation)
22. I1 — Appointment lifecycle + double-book prevention + status history
23. I2 — Today's Schedule (grouped, inline actions)
24. J1 — Calendar (day/week, doctor columns, click-to-book)
25. O1+O2 — Trial/subscription create + manual payment + activation + gating; S1 — Audit logging; D6 — Super Admin 2FA

> Then continue: payments/invoices (P1–P2), treatment notes/plans (Q1–Q2), public booking (L1–L3), assisted reminders (M1–M3), file attach (S3), import (H3), backups+restore (C5), monitoring+uptime (A4/U3/U4), QA suites (T*), legal drafts (V3) → Gate 3 launch.
