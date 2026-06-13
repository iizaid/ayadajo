# Ayadajo — Launch Readiness Checklists

Four gates, increasing in rigor. Each builds on the previous. **Bold items are hard blockers.**

---

## Gate 1 — Internal Demo (you can show it to yourself/advisors)
**Purpose:** a believable clickable/working demo to validate and rehearse.
- [ ] Core screens render (Today's Schedule, patients, booking, dashboard) in Arabic/RTL.
- [ ] Sample/seed data loads; no crashes on the demo path.
- [ ] Demo dataset prepared (clinic-shaped); backup screen recording exists.
- [ ] DEMO_SCRIPT.md flows rehearsed (3/5/10 min).
- [ ] Known-broken areas hidden/disabled.

## Gate 2 — First Clinic Demo (you can demo to a real clinic)
**Purpose:** show a prospect without embarrassment.
- [ ] All Gate 1 items.
- [ ] Daily-loop flow works end-to-end on demo data (book→arrive→complete→pay→remind).
- [ ] WhatsApp reminder deep link opens correctly with Arabic text.
- [ ] Owner dashboard shows plausible numbers.
- [ ] Public booking page renders on mobile.
- [ ] App is fast enough on a normal connection; no obvious bugs on the demo path.
- [ ] You can create a trial clinic live in <2 minutes (Super Admin).

## Gate 3 — First Trial Clinic (a real clinic uses it with real data) — **the big gate**
**Purpose:** safe for real patient data during a 14-day trial.

### Product readiness
- [ ] All V1 scope features work for the daily loop (PRODUCTION_READY_V1_SCOPE.md).
- [ ] **E2E daily-loop test passes.**
- [ ] Arabic/RTL correct on all V1 pages; Asia/Amman times correct.
- [ ] Mobile/tablet + cross-browser smoke passed.

### Security & tenant isolation readiness
- [ ] **RLS enabled on every tenant table; RLS isolation tests green for every table (CI); service-role boundary test green.**
- [ ] **Super Admin 2FA enforced; patient messaging consent defaults to `unknown` (opt-out blocks reminders); WhatsApp deep links never auto-marked "sent".**
- [ ] **Permission tests green for the role matrix (CI).**
- [ ] **Appointment double-book + race tests green.**
- [ ] **Auth: session revocation on member-remove/password-reset verified; login/reset rate-limited.**
- [ ] **Subscription gating verified (read_only/suspended).**
- [ ] **Files private + signed-URL-only; no public medical URLs.**
- [ ] **No PHI in logs/Sentry (scrubbing verified); generic errors; 404 on cross-tenant.**
- [ ] Public booking rate-limited + spam-protected; cron endpoints secret-protected.
- [ ] **Audit logging for sensitive + support actions verified.**
- [ ] Support-access gating works (time-boxed, reason, logged).

### Backup readiness
- [ ] **Automated DB backup enabled (managed PITR + independent daily dump).**
- [ ] **At least one successful test restore documented.**
- [ ] File storage backup/retention defined.

### Monitoring readiness
- [ ] Error tracking (Sentry, PII-scrubbed) live.
- [ ] Health check endpoint + uptime monitor live.
- [ ] Alerting on errors/job failures configured.

### Onboarding readiness
- [ ] CLINIC_ONBOARDING_PLAYBOOK ready; intake form prepared.
- [ ] Patient import path works (assisted CSV/Excel) + dedupe + preview.
- [ ] Arabic 1-page receptionist cheat sheet ready.
- [ ] Seeded dental services list + default durations ready.

### Support readiness
- [ ] WhatsApp support number live; hours communicated.
- [ ] Support ticket log + access-grant flow ready.

### Legal readiness (trial)
- [ ] Privacy Policy / ToS / Trial terms **drafted** and shown to the clinic. (Full lawyer review required before *paid* — Gate 4.)
- [ ] DPA draft ready (AtlasJo = processor).
- [ ] Patient-messaging consent approach defined.

### Trial readiness
- [ ] Trial auto-creates (14 days); banner + days-left; extend works.
- [ ] Status sweeps job runs (trial→read_only).

## Gate 4 — First Paid Clinic (billing goes live)
**Purpose:** safe to take money and run a production subscription.
- [ ] All Gate 3 items.
- [ ] **Legal pack reviewed by a qualified Jordanian legal professional (Privacy/ToS/DPA/clinic agreement).**
- [ ] Billing readiness: CliQ/bank receiving set up; manual payment → record → activate flow tested; subscription receipt/invoice works.
- [ ] Subscription state machine fully tested (trial→active→past_due→read_only→suspended; reactivation).
- [ ] Renewal + trial-ending owner email reminders working.
- [ ] Cancellation + data-export + retention process defined (LEGAL).
- [ ] Incident response plan in place (INCIDENT_RESPONSE_PLAN.md); you know who to notify and how.
- [ ] Landing page readiness: Arabic, clear value prop, pricing or "contact", trust elements, demo CTA, working contact (WhatsApp).
- [ ] Outreach readiness: lead list, CRM sheet, OUTREACH_MESSAGES ready, GTM routine set.
- [ ] Pricing finalized (PRICING_AND_PACKAGING.md) and communicable.

---

## Master "go/no-go" rule
**No real clinic** (Gate 3+) without: isolation tests ✅, permission tests ✅, backup+restore ✅, no-PHI-in-logs ✅, audit logging ✅, monitoring ✅. **No paid clinic** (Gate 4) without legal review ✅. These are non-negotiable.
