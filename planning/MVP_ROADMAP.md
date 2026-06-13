# Ayadajo — Roadmap (MVP → Production-Ready Core / Pilot-Ready V1 → Scale)

> **⬆️ V1 reframe:** The product target is **Production-Ready Core / Pilot-Ready V1**, not a thin MVP. **"MVP"** here = only the smallest *technical* slice you build first (auth + tenancy + patients + appointments) on the way to V1. **Phase 2 below = building V1**, and V1 includes production must-haves (backups+restore, monitoring, audit, file attach, isolation/permission tests as launch blockers — see [PRODUCTION_READY_V1_SCOPE.md](PRODUCTION_READY_V1_SCOPE.md) and [LAUNCH_READINESS_CHECKLIST.md](LAUNCH_READINESS_CHECKLIST.md)). No real clinic (Gate 3) ships without those blockers green.

Realistic for a solo dev / very small team. Each phase: Objective · Deliverables · Build · Don't build yet · Success criteria · Risks · Testing.

> **Golden rule:** sell before you over-build. Phase 1 (clickable demo) starts sales conversations while Phase 2 builds the real thing.

---

## Phase 0 — Planning ✅
**Objective:** Produce the planning package (this folder).
**Deliverables:** the full planning package + the stack decision — **RESOLVED in [ADR-001](ADR-001-STACK-AUTH-TENANCY.md): Supabase + RLS** (no longer an open fork).
**Success:** you can hand any doc to a coding agent and it knows what to build.
**Risks:** analysis paralysis — timebox to a few days, then build.

---

## Phase 1 — Clickable Demo (UI only)
**Objective:** Screens realistic enough to demo and gather clinic feedback. No real backend.
**Build:** Landing page; Login (fake); Clinic Dashboard with sample data; Today's Schedule; Calendar (day/week, static); Patients list + profile; Add appointment modal; Add patient form; Treatment note + plan views; Payments view; Public booking page; Super Admin glimpse. All Arabic/RTL, responsive. Hardcoded/mock data.
**Don't build:** DB, auth, multi-tenancy, real actions, reminders, payments logic.
**Success:** you can screen-share/walk a real clinic through a believable product and collect reactions; ≥5 clinics give feedback.
**Risks:** polishing forever — timebox; it's a sales tool, not the product.
**Testing:** manual click-through on desktop + mobile; show to 3–5 clinics.

---

## Phase 2 — Production-Ready Core / Pilot-Ready V1 (the real, sellable system)
**Objective:** One real clinic can **trust** Ayadajo to run its actual day with real patient data for a 14-day trial; AtlasJo controls accounts. This phase delivers **V1**, including its production must-haves and launch blockers — not a thin MVP. (Build the smallest technical slice — auth/tenancy/patients/appointments — first, then complete V1.) Add to the build list: **minimal secure file attach (16b)**, **assisted patient import (16c)**, **backups + tested restore (17)**, **monitoring/health/uptime (18)**. Launch gate: LAUNCH_READINESS_CHECKLIST Gate 3.
**Build (in dependency order):**
1. Project setup, env, CI, RTL UI foundation, design system. **Apply ADR-001: Supabase project + Auth + SQL migration tooling.**
2. **Supabase SQL schema + RLS enabled + policies on every tenant table + RLS isolation tests** (foundation for everything — launch blocker).
3. **Supabase Auth** (login, reset, invite/set-password, SSR sessions, choose-clinic) + user-scoped/service-role client boundary.
4. Multi-tenancy: RLS (primary) + app `authorize()` membership check (second layer) + tests; **service-role guard test**.
5. Clinic + settings + working hours + services + doctors.
6. Team members + fixed roles/permissions.
7. Patients (CRUD, search, profile, dedupe warn).
8. Appointments (lifecycle, double-book prevention, status history) + Today's Schedule.
9. Calendar (day/week).
10. Basic treatment notes + basic treatment plan.
11. Payments (record + outstanding) + simple invoice.
12. Basic owner dashboard (core cards).
13. Subscription/trial status + gating (read_only/suspended).
14. Super Admin (create clinic, trial, record payment, activate, suspend, fleet list, per-clinic ops view).
15. Audit logging woven through sensitive actions.
16. Assisted WhatsApp reminder deep links + optional email reminder.
**Don't build:** automated scheduled reminders, WhatsApp API, payment gateway, tooth chart, files (optional/minimal), advanced analytics, subdomains, custom roles.
**Success:** a pilot clinic uses it for a full week without you hand-holding daily; no cross-tenant leaks; you can onboard a clinic in <10 min.
**Risks:** scope creep (cut hard to the MVP list); isolation bugs (tests are mandatory).
**Testing:** isolation tests (every tenant table), permission tests, appointment double-book/race test, auth/session-revocation test, e2e of the daily loop.

---

## Phase 3 — First Pilot Clinics (1–3 real clinics)
**Objective:** Validate with real usage; fix what reality breaks.
**Build:** only what pilots block on — import helpers (bulk-add patients), small UX fixes, the most-requested tiny features.
**Don't build:** anything not blocking a pilot.
**Success:** ≥1 clinic uses it daily and says they'd pay; you've watched a receptionist and a doctor use it live.
**Risks:** adoption resistance (doctors skipping notes, receptionists reverting to paper) — observe, simplify, don't add features.
**Testing:** real-world usage; weekly feedback calls; bug triage.

---

## Phase 4 — Payments & Subscription Control
**Objective:** Turn pilots into payers; enforce billing states.
**Build:** manual payment recording + activation flow polished; active/past_due/read_only/suspended fully wired with banners; subscription dates + grace; trial-ending + renewal **email** reminders to owners; daily expiry/grace job.
**Don't build:** payment gateway, auto-renew.
**Success:** first paid clinic; status changes work end-to-end; clinics renew.
**Risks:** read_only/suspended feels punitive — tune messaging; manual payment tracking mess — keep it in `subscription_payments`, not a spreadsheet.
**Testing:** status-transition tests; gating tests (read_only blocks writes, allows reads); job idempotency.

---

## Phase 5 — Messaging & Reminders (automation)
**Objective:** Reduce no-shows with less manual effort.
**Build:** scheduled `reminder_events` (24h) + cron processor (idempotent, SKIP LOCKED) + quiet hours + cancel-on-cancel/reschedule + message log + Arabic templates editor + automated email reminders; semi-automated WhatsApp "to-send" queue.
**Don't build:** WhatsApp Business API (unless a paying clinic funds it), SMS, two-way.
**Success:** reminders send reliably without manual scanning; measurable no-show drop at a pilot.
**Risks:** double-sends (idempotency), over-messaging (defaults to one reminder), timezone bugs (tz library only).
**Testing:** job idempotency, cancel/reschedule regeneration, quiet-hours, retry/failure paths.

---

## Phase 6 — Advanced Dental Features
**Objective:** Deepen the dental moat.
**Build:** richer treatment plans (templates, acceptance), **tooth chart** (if pilots want it), file attachments (X-rays/images, private + signed URLs), before/after images, better reporting (trends, top services, doctor workload), CSV export.
**Don't build:** insurance claims, inventory, PACS.
**Success:** dentists feel it's "built for them"; files used safely.
**Risks:** file security (private only), feature bloat — gate by real demand.
**Testing:** file access authz, signed-URL TTL, storage isolation, report correctness.

---

## Phase 7 — Scale & Automation
**Objective:** Grow the fleet efficiently.
**Build:** WhatsApp Business API (BSP), SMS fallback, payment gateway + auto-renew, analytics rollups (`daily_metrics`), Inngest for jobs, RLS hardening, 2FA, self-serve elements, subdomains, multi-language (en).
**Don't build:** microservices (still a monolith), anything without demand.
**Success:** onboarding + billing increasingly self-serve; jobs/analytics scale; isolation hardened.
**Risks:** API cost/approval (WhatsApp), premature complexity — add only when metrics demand.
**Testing:** load test hot tables, rollup correctness, RLS isolation, gateway reconciliation.

---

## Cross-phase quality gates
- No phase ships if isolation or permission tests fail.
- No PHI in logs at any phase.
- Each major step updates `CHANGELOG.md` and relevant docs.
- Keep Arabic/RTL working at every step (don't defer to "later").
