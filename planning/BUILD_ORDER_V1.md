# Ayadajo — BUILD_ORDER_V1 (Codex Execution Control)

> **This file is the ONLY execution order Codex should follow** to build **Ayadajo by AtlasJo — Production-Ready Core / Pilot-Ready V1**. It converts the planning package into exact, ordered milestones.

---

## 1. Overview

- **This is the single source of build order.** When asked to build Ayadajo, Codex follows the milestones below **in order (M0 → M16)**. It does not invent its own order or jump ahead.
- **One milestone at a time.** Codex works on exactly **one** milestone per run, completes its scope, and does **not** start the next.
- **Stop and report after each milestone.** At the end of every milestone Codex must: (a) summarize exactly what files it created/modified, (b) state which acceptance criteria are met, (c) run or describe the required tests with results, (d) update `CHANGELOG.md`, and (e) **STOP and wait for human review** before continuing.
- **Stack is LOCKED by [ADR-001](ADR-001-STACK-AUTH-TENANCY.md)** — Next.js App Router · TypeScript strict · Tailwind · shadcn/ui · **Supabase** (Postgres + Auth + Storage) · **RLS as primary tenant isolation** · Vercel · Resend/Brevo · Vercel Cron · Sentry. **No Prisma. No Neon. No Auth.js/NextAuth. No service-role client in clinic-user paths.** Arabic-first, RTL-first, `Asia/Amman`.
- **Launch blockers (must be green before any real clinic):** RLS enabled + policies on every tenant table, RLS isolation tests, permission tests, service-role boundary test, appointment race test, no-PHI-in-logs, backups + tested restore, Super Admin 2FA. These are built/verified across M3–M5 and re-verified in M15–M16.
- Task IDs referenced below (e.g. `C1b`, `E2`) are from [IMPLEMENTATION_TASKS.md](IMPLEMENTATION_TASKS.md). Read [PRODUCTION_READY_V1_SCOPE.md](PRODUCTION_READY_V1_SCOPE.md) for what is in/out of V1.

### Always-on rules (apply to every milestone)
- Clinic-user data access uses the **user-scoped Supabase client** so **RLS applies**. The **service-role client** (`lib/supabase/admin.ts`) is server-only and used **only** in Super-Admin/job code.
- Every tenant table has `clinic_id NOT NULL` **and RLS enabled + policies**. Schema/RLS via **SQL migrations** in `supabase/migrations/*.sql`.
- App-layer `authorize()` runs on every mutation + sensitive read (RLS handles *which clinic's rows*; `authorize()` handles *what the role may do*).
- No PHI in logs/Sentry/URLs. Money is `numeric` JOD. Outstanding balance = **issued invoice balances only**.
- Do not build features that belong to a later milestone or are excluded from V1.

---

## 2. Milestone format
Each milestone below specifies: **Goal · Read first · Tasks (IMPLEMENTATION_TASKS) · Expected files · Acceptance criteria · Required tests · Stop condition · Must NOT do.**

---

## Milestone 0 — Repository & environment preparation
- **Goal:** A clean, conventions-defined repo ready for the locked stack. No product features.
- **Read first:** ADR-001, RELEASE_AND_DEPLOYMENT_PROCESS.md, SYSTEM_ARCHITECTURE.md (§11 env), AI_AGENT_INSTRUCTIONS.md.
- **Tasks:** A2 (env schema + `.env.example`), A5 (CHANGELOG + README wiring), parts of A1 setup prep.
- **Expected files:** `.env.example`, `CHANGELOG.md`, `README.md` (links `/planning`), `.gitignore`, `docs/CONVENTIONS.md` (naming, RTL, no-Prisma/Neon/Auth.js rules), `.nvmrc`/engines.
- **Acceptance criteria:**
  - Confirm project state (is it empty / fresh?); confirm **package manager** (pick one: pnpm recommended — record it) and document it.
  - Confirm **no conflicting stack files** exist (no `prisma/`, no `schema.prisma`, no `drizzle`, no `next-auth`/`auth.js`, no Neon connection strings). If found, list them and stop for human decision (do not delete app code silently).
  - `.env.example` lists all names from ADR-001 §env (no values): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (marked server-only), `SUPABASE_DB_URL`, `RESEND_API_KEY`, `APP_URL`, `CRON_SECRET`, `SENTRY_DSN`, `SUPER_ADMIN_BOOTSTRAP_*`.
  - `docs/CONVENTIONS.md` records the binding rules (RTL-first, Supabase only, service-role boundary, SQL migrations, no-PHI logging).
- **Required tests:** none (no code yet); a lint/format config sanity check is fine.
- **Stop condition:** repo conventions + `.env.example` committed; package manager confirmed; conflicting-stack check reported. **STOP and report.**
- **Must NOT do:** install Prisma/Drizzle/Auth.js; create any feature; add real secrets; scaffold the app (that's M1).

## Milestone 1 — Next.js + RTL UI foundation
- **Goal:** A booting Next.js App Router app, **Arabic RTL-first**, with the design-system primitives. No data/auth yet.
- **Read first:** UI_UX_PLAN.md, BRAND_AND_INTERFACE_DIRECTION.md, AI_AGENT_INSTRUCTIONS.md.
- **Tasks:** A1 (Next.js + TS strict + Tailwind + shadcn/ui, RTL), A3 (CI: typecheck/lint/test + Vercel preview), B1 (design primitives), B3 (loading/empty/error patterns), B4 (i18n key layer, `ar` only).
- **Expected files:** `app/layout.tsx` (`dir="rtl" lang="ar"`, Arabic font), `tailwind.config.ts`, `tsconfig.json` (strict), `components/ui/*` (shadcn), `components/{StatusBadge,MetricCard,EmptyState,ConfirmDialog,DataTable,FormField}.tsx`, `lib/i18n/*`, `locales/ar.json`, `.github/workflows/ci.yml`.
- **Acceptance criteria:** app boots in RTL with an Arabic font; typecheck + lint pass; CI runs on PR + preview deploys; **no hardcoded UI strings** (use i18n keys); primitives render RTL-correct with colorblind-safe labeled status badges.
- **Required tests:** a trivial unit test runs in CI; build succeeds; (optional) a render test of one primitive.
- **Stop condition:** app deploys to a Vercel preview showing an RTL Arabic placeholder + primitives. **STOP and report.**
- **Must NOT do:** add Supabase/auth/DB; build real pages (patients, etc.); add English UI.

## Milestone 2 — Supabase foundation
- **Goal:** Supabase wired in: migration tooling, base schema skeleton, Auth configured, and the **client factory boundary** (user-scoped vs service-role) established.
- **Read first:** ADR-001 (all), SYSTEM_ARCHITECTURE.md (§1, §4, §6), DATABASE_SCHEMA.md (conventions + platform tables).
- **Tasks:** "Apply ADR-001" (Supabase project + Auth + SQL migration tooling), C4 (Supabase client factories), D1 setup (Auth wiring; full auth flows in M4), C1 base (platform tables: `users`, `plans`).
- **Expected files:** `supabase/config` + `supabase/migrations/0001_init.sql` (platform tables only to start: `users` linked to `auth.users`, `plans`), `lib/supabase/server.ts` (user-scoped, uses request JWT), `lib/supabase/client.ts` (browser anon), `lib/supabase/admin.ts` (**service-role, server-only, marked dangerous**), `lib/env.ts` (Zod boot validation), `middleware.ts` (Supabase SSR session).
- **Acceptance criteria:** migrations run locally + on staging; Supabase Auth enabled (email/password); env validated at boot; **`admin.ts` is the only place the service-role key is read**, server-only, never imported by client code; document migration apply order (staging → prod) per RELEASE doc.
- **Required tests:** a smoke test that the user-scoped client connects; a placeholder for the **service-role import-guard** (full enforcement in M5).
- **Stop condition:** migrations apply, Auth configured, three client factories exist with the boundary documented. **STOP and report.**
- **Must NOT do:** create tenant feature tables/RLS yet (that's M3); use the service-role client anywhere except `admin.ts`; implement login UI/flows (M4).

## Milestone 3 — Database schema + RLS policies  ⚠️ GATE
- **Goal:** **All V1 tables** created with `clinic_id` on every tenant table, **RLS enabled + policies on every tenant table**, exclusion constraint, and seed. **No app feature may proceed until this milestone passes.**
- **Read first:** DATABASE_SCHEMA.md (entire), SECURITY_AND_PRIVACY_PLAN.md (§1, §21), ADR-001, USER_ROLES_AND_PERMISSIONS.md.
- **Tasks:** C1 (full schema, all tables, indexes, composite FKs), **C1b (RLS enabled + policies — LAUNCH BLOCKER)**, C2 (appointment overlap `EXCLUDE USING gist`), C3 (seed: plans, permissions, roles, role_permissions, super-admin bootstrap).
- **Expected files:** `supabase/migrations/0002_tenant_tables.sql`, `supabase/migrations/0003_rls.sql`, `supabase/migrations/0004_constraints.sql` (exclusion), `supabase/seed.sql`, `docs/RLS_POLICIES.md` (one line per table: policy summary).
- **Acceptance criteria:**
  - Every table from DATABASE_SCHEMA.md exists; every **tenant** table has `clinic_id NOT NULL`, indexes leading with `clinic_id`, composite FKs `(clinic_id, id)` where applicable.
  - **RLS ENABLED on every tenant table**; SELECT/INSERT/UPDATE/DELETE policies scope rows to clinics where `auth.uid()` is an **active member** (via `clinic_members`).
  - Appointment exclusion constraint rejects overlapping active appts per doctor.
  - Seed creates plans (Starter/Pro/Plus/Pilot), the permission/role matrix, and the platform super-admin (creds from env).
  - `messaging_consent_status` default `unknown`; `messages.status` model supports `prepared/opened/marked_sent`; invoices per-clinic numbering — schema matches the locked decisions.
- **Required tests:** a migration-applies test; a **"RLS is enabled on every tenant table"** assertion (fails if any tenant table lacks RLS). (Full isolation suite in M5.)
- **Stop condition:** all migrations apply cleanly on staging; RLS-enabled assertion passes; seed runs. **STOP and report — this is a GATE.**
- **Must NOT do:** build UI/features; access tenant tables from app code yet; use service role for seeding tenant data in a way that becomes a normal path.

## Milestone 4 — Auth, sessions, membership & authorization
- **Goal:** Real login + clinic membership + the `authorize()`/tenancy layer (second line on top of RLS) + audit helper.
- **Read first:** USER_ROLES_AND_PERMISSIONS.md, SECURITY_AND_PRIVACY_PLAN.md (§2–§3), ADR-001 (auth), MODULES_PLAN.md (Auth/Team/Roles).
- **Tasks:** D1 (Supabase Auth login/reset/SSR sessions), D2 (reset), D3 (invite/set-password), D4 (choose-clinic / active clinic context), D5 (login rate limiting), E1 (tenancy/membership guard, 404 on mismatch), F1 (permission matrix + `authorize()`), G3 (clinic_members lifecycle: invite/role/suspend/remove + session revocation), S1 (audit logging helper).
- **Expected files:** `app/(auth)/{login,forgot,reset,set-password,choose-clinic}/*`, `lib/auth/{session,tenancy,permissions}.ts`, `lib/audit/*`, `lib/ratelimit.ts`, server actions for membership.
- **Acceptance criteria:** email/password login + reset via Supabase Auth; multi-clinic user chooses active clinic (scope from **session**, never URL); `authorize(session, action, resource)` enforced; cross-tenant → **404**; removing/suspending a member **revokes sessions immediately**; role matrix from USER_ROLES_AND_PERMISSIONS.md encoded in code; sensitive actions write `audit_logs` (no PHI).
- **Required tests:** auth happy-path; **session-revocation on offboarding (T4)**; an `authorize()` unit test (full permission matrix suite in M5).
- **Stop condition:** a user can log in, pick a clinic, and be correctly allowed/denied; offboarding revokes access. **STOP and report.**
- **Must NOT do:** build clinic features (patients/appointments); skip the 404-on-mismatch rule; rely on UI hiding for security.

## Milestone 5 — Testing foundation & launch-blocker tests  ⚠️ GATE
- **Goal:** Test infrastructure + the **mandatory launch-blocker test suites** wired into CI.
- **Read first:** TESTING_AND_QA_PLAN.md (entire), PRE_LAUNCH_SECURITY_REVIEW.md, SECURITY_AND_PRIVACY_PLAN.md.
- **Tasks:** test setup (unit + integration runners, test Supabase project/branch), **E2 (RLS isolation tests — LAUNCH BLOCKER)**, **E3 (service-role boundary guard test)**, **F2 (permission tests — LAUNCH BLOCKER)**.
- **Expected files:** `tests/setup/*`, `tests/isolation/*` (per tenant table), `tests/permissions/*`, `tests/security/service-role.test.ts`, CI updated to run + block on these.
- **Acceptance criteria:**
  - For **every** tenant table: under a normal clinic-A user session (RLS in force), clinic A cannot read/list/search/update/delete clinic B — **including when the app omits the `clinic_id` filter** (RLS alone blocks).
  - A test fails if any tenant table lacks RLS.
  - **Service-role client is not imported/used in any clinic-user path** (lint/test fails otherwise); service-role key never in client bundle.
  - Permission tests assert each role × sensitive action per the matrix (financial vs clinical split).
  - **CI blocks merge on isolation + permission + service-role failures.**
- **Required tests:** the three suites above, all green in CI.
- **Stop condition:** launch-blocker suites pass and gate CI. **STOP and report — this is a GATE.** (Race/e2e/file/payment tests are added in their feature milestones.)
- **Must NOT do:** weaken/skip a test to make it pass; proceed to features if any blocker suite is red.

## Milestone 6 — Super Admin foundation
- **Goal:** AtlasJo can create a clinic + owner + trial, see the fleet — the operate-the-business spine. Includes Super Admin 2FA.
- **Read first:** SUPER_ADMIN_PLAN.md, SUBSCRIPTION_AND_TRIAL_SYSTEM.md, USER_ROLES_AND_PERMISSIONS.md (platform roles).
- **Tasks:** R1 (admin shell + `is_platform_admin` guard + **service-role boundary**), **D6 (Super Admin 2FA — enforce)**, G1 (clinic + owner + defaults creation), O1 (trial creation), C3 (plans seed — verify), R2 (basic clinics list + details ops view).
- **Expected files:** `app/(admin)/{layout,clinics,clinics/[id]}/*`, `lib/auth/admin.ts`, `lib/clinic/create.ts`, `lib/subscription/*` (trial create).
- **Acceptance criteria:** only platform admins reach `/admin`; **2FA enforced** for Super Admin; creating a clinic atomically creates clinic + owner `users`/membership + default settings/hours + `subscription` in `trial` (14 days); fleet list shows status/trial/plan/last login; **cross-tenant reads here use the service role intentionally and are audited**; medical data not shown by default (support-access gating).
- **Required tests:** clinic-creation integration test; admin-guard test (non-admin blocked); audit row written on create.
- **Stop condition:** AtlasJo can create a trial clinic + owner and see it in the fleet list. **STOP and report.**
- **Must NOT do:** expose patient medical data in admin by default; use the admin/service-role path inside clinic-user features; build billing automation.

## Milestone 7 — Clinic shell & settings
- **Goal:** The clinic app shell (role-filtered nav + subscription banner) and configuration (profile, hours, services, doctors).
- **Read first:** UI_UX_PLAN.md, MODULES_PLAN.md (Settings), CLINIC_ONBOARDING_PLAYBOOK.md, SUBSCRIPTION_AND_TRIAL_SYSTEM.md (status banner).
- **Tasks:** B2 (app shell + role-filtered nav + subscription banner), G2 (settings: profile, working hours, services, doctors availability, booking toggle, language), O4 (subscription banner/status surfaces — read side).
- **Expected files:** `app/(clinic)/layout.tsx`, `components/{Sidebar,SubscriptionBanner}.tsx`, `app/(clinic)/settings/{profile,hours,services,doctors,booking}/*`.
- **Acceptance criteria:** nav items filter by role; subscription banner reflects status; Owner/Manager can edit hours (open/close/breaks, Saturday configurable), services (seeded dental list, durations/prices), doctors + availability; changes validated + audited; all RTL/Arabic.
- **Required tests:** settings validation unit tests; a permission test that non-Owner cannot edit settings; (RLS already covers isolation).
- **Stop condition:** a clinic can be fully configured by its Owner. **STOP and report.**
- **Must NOT do:** build patients/appointments; add holidays/multi-branch; custom-role editor.

## Milestone 8 — Patients & patient import
- **Goal:** Patient records + fast search + 360° profile + assisted CSV/Excel import with consent model.
- **Read first:** DATA_MIGRATION_AND_IMPORT_PLAN.md, MODULES_PLAN.md (Patients), DATABASE_SCHEMA.md (patients), REMINDERS_AND_MESSAGING_SYSTEM.md (consent).
- **Tasks:** H1 (patient CRUD + Jordan phone normalization + dedupe warning + **messaging consent status**), H2 (patient profile aggregation), H3 (assisted import: template, map, normalize, dedupe, **preview**, batch `import_id` + rollback, audited).
- **Expected files:** `app/(clinic)/patients/{page,[id],new,edit,import}/*`, `lib/validation/phone.ts`, `lib/import/*`.
- **Acceptance criteria:** add/edit/archive patient; instant search (name/phone) **within clinic only** (RLS-backed); duplicate-phone warning; **`messaging_consent_status` default `unknown`** (never pre-consented), `opted_out` will block reminders; profile shows appointments/notes/plan/balance/files placeholders; import: xlsx/csv, auto-map, Jordan-phone normalize, dedupe, **preview before commit**, partial-import error list, batch rollback, audited (counts only, no PHI); Owner/Manager + Super-Admin only for import.
- **Required tests:** phone-normalization unit tests; import validation/dedupe tests; a tenant-isolation test confirming search never crosses clinics; consent default test.
- **Stop condition:** a clinic can add, find, and import patients safely. **STOP and report.**
- **Must NOT do:** merge-duplicates tool; import historical appointments/treatments; default consent to true.

## Milestone 9 — Appointments & Today's Schedule
- **Goal:** Full appointment lifecycle with double-book prevention + status history + the hero Today's Schedule.
- **Read first:** APPOINTMENTS_AND_CALENDAR.md, MODULES_PLAN.md (Appointments), UI_UX_PLAN.md (receptionist speed).
- **Tasks:** I1 (lifecycle + double-book prevention + status history; uses C2 exclusion constraint), I2 (Today's Schedule grouped + one-click actions), I3 (reschedule/cancel side-effects — reminder hooks stubbed until M13).
- **Expected files:** `app/(clinic)/appointments/*`, `app/(clinic)/today/page.tsx`, `lib/appointments/*`.
- **Acceptance criteria:** create/confirm/arrive/in_progress/complete/cancel/no_show with `appointment_status_history`; **double-book blocked at app + DB** (exclusion constraint); within working hours; idempotent create (client idempotency key); Today's Schedule grouped (upcoming/waiting/in-progress/done/no-show) with 1-click actions + search; reschedule/cancel writes history and flags reminder regeneration (hook).
- **Required tests:** **appointment race/double-book test (T3)** — two concurrent bookings → one succeeds; lifecycle integration tests; working-hours validation.
- **Stop condition:** a receptionist can run the day's bookings without conflicts. **STOP and report.**
- **Must NOT do:** recurring appointments; chairs/resources; send reminders (M13); calendar drag-drop.

## Milestone 10 — Calendar & public booking request flow
- **Goal:** Day/week calendar + the public booking **request** page + staff queue, with anti-abuse.
- **Read first:** PUBLIC_BOOKING_SYSTEM.md, APPOINTMENTS_AND_CALENDAR.md (views), SECURITY_AND_PRIVACY_PLAN.md (public surface).
- **Tasks:** J1 (calendar day/week, doctor columns, click-to-book), L1 (`/book/[slug]` RTL request mode), L2 (submit + honeypot + rate limit), L3 (booking-requests queue: approve/reject/spam), S2 (rate-limiting middleware).
- **Expected files:** `app/(clinic)/calendar/*`, `app/book/[slug]/page.tsx`, `app/(clinic)/booking-requests/*`, `app/api/book/*`, `lib/ratelimit.ts`.
- **Acceptance criteria:** day (default) + week calendar, per-doctor columns, click empty slot → prefilled booking; public page (unauthenticated) submits a `public_booking_requests` row (**request mode only**, never an instant appointment); **honeypot + per-IP/per-phone rate limit**; staff queue approve (re-checks overlap, dedupes patient) / reject / spam; no leakage of other patients/availability.
- **Required tests:** **public booking abuse tests** (rate limit, honeypot, duplicate submit, sanitized input); approve→appointment integration; isolation test for the public path.
- **Stop condition:** a patient can request a slot and staff can approve it into a real appointment. **STOP and report.**
- **Must NOT do:** instant-confirm mode; OTP; subdomains; CAPTCHA-by-default (only on abuse).

## Milestone 11 — Treatment notes, treatment plans & files
- **Goal:** Basic clinical records + minimal **secure** file attach (X-ray/image), private-only.
- **Read first:** MODULES_PLAN.md (Treatment Notes/Plans/Files), SECURITY_AND_PRIVACY_PLAN.md (§9–§10 files), PRODUCTION_READY_V1_SCOPE.md (file attach = V1).
- **Tasks:** Q1 (treatment notes — dated, append, edit window), Q2 (treatment plans + items: price/status/totals), S3 (file upload + Supabase **private** Storage + signed URLs).
- **Expected files:** `app/(clinic)/patients/[id]/{notes,plan,files}/*`, `lib/files/*`, storage policies migration.
- **Acceptance criteria:** quick note (≤20s) tied to patient/appointment + follow-up instruction; plan with items (procedure/tooth-area/price/status), totals computed; **plan totals are estimates, NOT the official balance**; files in **private** bucket keyed `clinics/{clinicId}/...`, access **only via short-lived signed URLs after authz**, **no public medical URLs**, type/size limits, **risky types blocked + EXIF stripped**, access audited.
- **Required tests:** **file access tests** (signed URL expires; clinic-B user cannot fetch clinic-A file; no public URL; risky type rejected); notes/plan permission tests.
- **Stop condition:** a doctor can record notes/plan and attach an X-ray securely. **STOP and report.**
- **Must NOT do:** tooth chart/odontogram; galleries/before-after; DICOM; making files public.

## Milestone 12 — Payments, receipts/invoices & analytics
- **Goal:** Record money, issue a simple invoice/receipt, and show correct dashboard numbers.
- **Read first:** MODULES_PLAN.md (Payments/Invoices/Dashboard), ANALYTICS_AND_REPORTING.md, USER_ROLES_AND_PERMISSIONS.md (financial gating).
- **Tasks:** P1 (record payment + outstanding + reversals), P2 (simple invoice/receipt, per-clinic numbering, print, void), K1 (metric computations), K2 (dashboard cards + today list + banner).
- **Expected files:** `app/(clinic)/payments/*`, `app/(clinic)/invoices/*`, `lib/payments/*`, `lib/metrics/*`, `app/(clinic)/dashboard/page.tsx`.
- **Acceptance criteria:** record payment (cash/cliq/bank_transfer/card_manual/other), per-patient outstanding, **reversal entries (no deletes)**; simple invoice/receipt with **per-clinic sequential number**, print-friendly, void keeps number; **outstanding balance = Σ issued-invoice balances ONLY** (never plan-derived); dashboard cards correct + **financial cards gated** (Owner/Manager/Accountant); tz-correct monthly buckets (Asia/Amman).
- **Required tests:** **payment correctness tests** (outstanding from invoices only; reversals subtract; voids excluded; numeric not float; per-clinic numbering no cross-tenant collision); metric calculation tests; financial-gating permission test.
- **Stop condition:** money in/out and the owner dashboard are correct and role-gated. **STOP and report.**
- **Must NOT do:** payment gateway; double-counting via plans; full accounting/VAT engine; advanced BI.

## Milestone 13 — Reminders & messaging
- **Goal:** Templates + **assisted WhatsApp deep links with accurate status** + optional automated email + consent checks + message log.
- **Read first:** REMINDERS_AND_MESSAGING_SYSTEM.md (entire), DATABASE_SCHEMA.md (messages/reminders), LEGAL_AND_COMPLIANCE_CHECKLIST.md (consent).
- **Tasks:** M2 (Arabic templates + variable-whitelist render), M3 (assisted WhatsApp deep link + **prepared→opened→marked_sent** status), M1 (email send wrapper), N1–N3 (optional automated **email** reminder events + Vercel Cron processor — email only in V1; WhatsApp stays assisted).
- **Expected files:** `app/(clinic)/{templates,messages}/*`, `lib/templates/*`, `lib/whatsapp/link.ts`, `lib/email/*`, `app/api/jobs/process-reminders/route.ts` (cron-secret protected).
- **Acceptance criteria:** templates render only whitelisted variables (no injection); WhatsApp: link logs `messages` `status='prepared'` → `opened` on click → **`marked_sent` only on explicit staff confirmation** (records `marked_sent_by/at`) — **never auto-`sent`**; consent: **`opted_out` blocks reminders**, `unknown` warns; optional automated email reminder (24h) via idempotent cron (`FOR UPDATE SKIP LOCKED`), respects quiet hours, cancelled on appointment cancel/reschedule; full message log.
- **Required tests:** **WhatsApp status tests** (no auto-sent; consent blocks); **reminder idempotency + cancellation tests (T5)**; template render/injection test; cron-secret enforced test.
- **Stop condition:** staff can send an accurate WhatsApp reminder and optional email reminders fire safely. **STOP and report.**
- **Must NOT do:** WhatsApp Business API; SMS; two-way; logging a deep link as delivered; messaging `opted_out` patients.

## Milestone 14 — Subscription, trial, gating & billing ops
- **Goal:** Full subscription state machine + manual billing + access gating (read_only/suspended) + daily sweep + owner emails.
- **Read first:** SUBSCRIPTION_AND_TRIAL_SYSTEM.md (entire), SUPER_ADMIN_PLAN.md, PRICING_AND_PACKAGING.md.
- **Tasks:** O1 (trial create/extend + manual payment record + activate — complete), O2 (`assertClinicWritable` gating guard), O3 (daily expiry/grace sweep job + owner emails), O4 (clinic status screens/banners — complete), R3 (admin subscription/payment/plan management).
- **Expected files:** `lib/subscription/{gate,sweep}.ts`, `app/api/jobs/subscription-sweep/route.ts`, `app/(admin)/{subscriptions,payments,plans}/*`, status screens in `app/(clinic)/*`.
- **Acceptance criteria:** statuses `trial/active/past_due/read_only/suspended/cancelled`; **`assertClinicWritable` blocks writes in `read_only` (reads allowed) and locks `suspended`** (status screen only) — enforced in every mutating action; AtlasJo records manual payment (`subscription_payments`) → activates (sets period) → banner clears; daily sweep flips trial→read_only and active→past_due→read_only; owner trial-ending + renewal **emails**; all changes Super-Admin-only + audited; pricing from PRICING_AND_PACKAGING.md.
- **Required tests:** **subscription gating tests** (read_only blocks writes/allows reads; suspended locks; mid-edit status change blocks save); status-transition tests; sweep idempotency.
- **Stop condition:** a trial can be paid → activated, and unpaid clinics degrade gracefully to read_only. **STOP and report.**
- **Must NOT do:** payment gateway/auto-renew; self-serve upgrade; enforced usage limits.

## Milestone 15 — Observability, backups & release readiness
- **Goal:** Production safety net — monitoring, no-PHI logging, health/uptime, backups + tested restore, release process.
- **Read first:** OBSERVABILITY_AND_BACKUP_PLAN.md, RELEASE_AND_DEPLOYMENT_PROCESS.md, SECURITY_AND_PRIVACY_PLAN.md (logging).
- **Tasks:** A4 (Sentry + PII scrubbing), S5 (no-PHI-in-logs enforcement + test), U3 (`/healthz`), U4 (uptime monitor + alerts), C5 (backup job + restore runbook), U1 (prod/preview envs + guarded migrations).
- **Expected files:** `lib/observability.ts`, `app/healthz/route.ts`, `scripts/backup.ts`, `docs/RESTORE.md`, alerting config, CI deploy guards.
- **Acceptance criteria:** Sentry live with PII scrubbing (no patient data in a captured error); structured logs carry **IDs only**; **no-PHI-in-logs test passes**; `/healthz` checks app+DB; uptime monitor + alerts (downtime, job failure, backup failure); backups = Supabase PITR + independent encrypted daily dump; **one successful test restore documented (RTO measured)**; release process (staging→prod, RLS in migrations, post-deploy smoke) followed.
- **Required tests:** no-PHI-in-logs test; health-check test; (manual) restore drill documented.
- **Stop condition:** monitoring + backups + a tested restore are in place; release process documented. **STOP and report.**
- **Must NOT do:** ship to a real clinic yet (that's after M16); log any PHI.

## Milestone 16 — Pre-launch security review & first-trial readiness  ⚠️ FINAL GATE
- **Goal:** Verify **everything** against the checklists; prepare demo + onboarding + support; **do not onboard a real clinic until all blockers pass.**
- **Read first:** PRE_LAUNCH_SECURITY_REVIEW.md, TESTING_AND_QA_PLAN.md, LAUNCH_READINESS_CHECKLIST.md (Gate 3), DEMO_DATASET_AND_SEED_PLAN.md, CLINIC_ONBOARDING_PLAYBOOK.md, SUPPORT_AND_OPERATIONS.md, INCIDENT_RESPONSE_PLAN.md.
- **Tasks:** S4 (security review pass), T6 (E2E daily-loop), V4 (onboarding kit), demo dataset/seed (DEMO_DATASET_AND_SEED_PLAN.md), support-ops readiness.
- **Expected files:** `scripts/seed-demo.ts`, `docs/onboarding/*` (Arabic cheat sheet + intake form), a completed `docs/PRE_LAUNCH_REVIEW_SIGNOFF.md`, E2E in `tests/e2e/*`.
- **Acceptance criteria:**
  - Run **PRE_LAUNCH_SECURITY_REVIEW.md** — every **BLOCKER** green (RLS isolation, service-role boundary, permission, auth/offboarding, Super Admin 2FA, file privacy, no-PHI-logs, backups+restore, consent default, WhatsApp-never-auto-sent).
  - Run **TESTING_AND_QA_PLAN.md** pre-launch checklist — green (incl. E2E daily loop, race, abuse, payment, reminder).
  - Run **LAUNCH_READINESS_CHECKLIST.md Gate 3** — all items satisfied.
  - Demo dataset (fake clinic, fake phones, no real PHI) seeds/resets; onboarding kit ready; support channel + access-grant flow ready.
- **Required tests:** the full launch-blocker suite green in CI; E2E daily-loop green; documented sign-off.
- **Stop condition:** **STOP. Do NOT point a real clinic at the system until every Gate-3 blocker is green and signed off.** Report the sign-off. (First *paid* clinic additionally needs lawyer-reviewed legal pack — out of Codex scope.)
- **Must NOT do:** onboard a real clinic with unmet blockers; use real patient data in demo/staging; skip the security review.

---

## 3. Codex prompt template (run one milestone at a time)

```
You are building Ayadajo by AtlasJo — Production-Ready Core / Pilot-Ready V1.

EXECUTION ORDER: Follow ONLY /planning/BUILD_ORDER_V1.md. Work on exactly ONE milestone:

>>> MILESTONE: M<NUMBER> — <NAME> <<<

Before coding:
1. Read /planning/BUILD_ORDER_V1.md (this milestone) AND every file it lists under "Read first".
2. Read /planning/ADR-001-STACK-AUTH-TENANCY.md and /planning/AI_AGENT_INSTRUCTIONS.md.
3. Restate, in a few lines: the milestone Goal, the tasks, and what you must NOT do.

Hard constraints (non-negotiable):
- Stack is LOCKED: Next.js App Router, TypeScript strict, Tailwind, shadcn/ui, Supabase (Postgres+Auth+Storage), RLS = primary tenant isolation, Vercel, Resend/Brevo, Vercel Cron, Sentry.
- NO Prisma, NO Neon, NO Auth.js/NextAuth, NO ORM migrations (use SQL migrations in supabase/migrations).
- NEVER use the service-role client in clinic-user paths (server-only, Super-Admin/jobs only).
- Every tenant table: clinic_id NOT NULL + RLS enabled + policies. Clinic-user code uses the user-scoped Supabase client.
- Arabic-first, RTL-first, Asia/Amman. No PHI in logs. Outstanding = issued invoice balances only.
- Build ONLY this milestone's scope. Do not start later milestones or out-of-V1 features.

While coding:
- Implement the milestone's tasks and files.
- Add/keep the milestone's Required tests; ensure launch-blocker suites stay green.

Definition of done for THIS milestone:
1. All Acceptance Criteria met.
2. Required tests written and RUN (paste results) — or, if the environment can't run them, describe exactly how to run them and the expected outcome.
3. CHANGELOG.md updated with what changed.
4. A clear report: files created/modified, criteria status, test results, and any assumptions/risks.
5. STOP. Do not start the next milestone. Wait for human review.

If you hit a conflict with the plan, a missing decision, or something that needs the service role in a clinic path: STOP and ask — do not guess.
```

---

## 4. Rules for Codex (strict — apply every run)
1. **Do not skip milestones.** Execute M0 → M16 in order; one milestone per run; never start the next without review.
2. **Do not use Prisma, Neon, Auth.js, or NextAuth.** Supabase only; SQL migrations only.
3. **Do not use the service-role client in clinic-user paths.** Server-only, Super-Admin/jobs only; clinic-user code uses the user-scoped client so RLS applies.
4. **Do not build later or out-of-scope features.** Stay inside the current milestone and the V1 scope (PRODUCTION_READY_V1_SCOPE.md exclusions are binding).
5. **Every tenant table ships with RLS enabled + policies.** No tenant table is accessed by app code before M3 passes.
6. **Update `CHANGELOG.md` after each milestone** (what changed + why).
7. **Run or precisely describe the required tests before saying "done."** Launch-blocker suites (RLS isolation, permission, service-role boundary) must be green.
8. **Stop after each milestone and wait for human review.** Report files changed, criteria met, and test results.
9. **No PHI in logs/Sentry/URLs;** generic user-facing errors; 404 (not 403) on cross-tenant.
10. **If unsure or blocked, STOP and ask** — never guess on auth, RLS, the service-role boundary, money, or consent.

---

## 5. Milestone → launch-blocker map (quick reference)
- **RLS enabled + policies:** built M3, tested M5, re-verified M16.
- **RLS isolation tests:** M5 (gate), re-run M16.
- **Permission tests:** M5 (gate), re-run M16.
- **Service-role boundary test:** M5, re-verified M16.
- **Appointment race test:** M9.
- **File privacy/access tests:** M11.
- **Payment correctness tests:** M12.
- **WhatsApp-never-auto-sent + reminder idempotency:** M13.
- **Subscription gating tests:** M14.
- **No-PHI-in-logs + backups + tested restore + Super Admin 2FA:** M6 (2FA) / M15 (logs, backups).
- **Gate 3 full sign-off:** M16 — **the only gate that authorizes a real clinic.**
