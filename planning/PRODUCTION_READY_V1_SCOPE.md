# Ayadajo — Production-Ready Core / Pilot-Ready V1 Scope

> This document supersedes the "smallest MVP" framing as the **product target**. The term **MVP** now refers only to the smallest *technical* starting slice on the way to V1. The thing we sell and pilot is **Production-Ready Core / Pilot-Ready V1** (short: **V1**).

---

## What "Production-Ready V1" means
A version that a **real dental clinic in Jordan can trust to run its day during a 14-day trial**, with **real patient data**, without losing data, leaking data, or embarrassing itself — and that **AtlasJo can onboard, support, bill, and operate** safely. It is not feature-complete; it is **trustworthy, secure, fast, and complete enough** to replace the paper book + Excel + personal WhatsApp for the core daily loop.

The bar is not "does the feature exist?" but **"would I let a clinic put 500 real patients in it and depend on it Monday morning?"**

Three tests V1 must pass:
1. **Trust test:** secure, isolated, backed up, audited, no data loss, no cross-tenant leak.
2. **Daily-loop test:** a receptionist and a doctor can run a full real day without paper.
3. **Operate test:** AtlasJo can create, onboard, support, bill, and suspend a clinic cleanly.

---

## What V1 includes (the scope)
Core platform & security:
- **Auth** (email/password, reset, invite/set-password, revocable sessions)
- **Multi-tenancy** with strict isolation (scoped data layer + tests; RLS if Supabase fork)
- **Roles & permissions** (fixed roles, server-enforced) — onboard pilots with Owner/Receptionist/Doctor; Manager/Accountant/Assistant available
- **Audit logs** for sensitive actions + support access
- **Tenant isolation tests + permission tests** (launch blockers)
- **Backup + tested restore**
- **Support access rules** (time-boxed, reason-tagged, logged)

Clinic daily operations:
- **Arabic-first RTL interface**, `Asia/Amman`
- **Clinic dashboard** (operational + role-gated financial cards)
- **Today's Schedule** (the hero screen)
- **Patients** (CRUD, fast search, dedupe warning) + **patient profile** (360°)
- **Appointments** (full lifecycle, double-book prevention, status history)
- **Calendar** (day + week, doctor columns)
- **Basic treatment notes** (dated free-text, optional tooth/area, follow-up)
- **Basic treatment plan** (items, price, status, totals, outstanding)
- **Simple payments** (record, methods, outstanding balance, reversals)
- **Simple invoice/receipt** (per-clinic numbering, print-friendly, void)
- **Minimal secure file attach** (single X-ray/image per record; private + signed URLs) — *upgraded from "P2" because dental trust needs it*
- **Manual WhatsApp reminder links** (one-click `wa.me`, logged) + **optional automated email reminder**
- **Public booking request page** (`/book/{slug}`, request mode, anti-spam) + **booking requests queue**

Clinic configuration:
- **Staff management** (invite/role/suspend/remove, session revocation)
- **Clinic settings** (profile, language)
- **Working hours** (per weekday + breaks)
- **Services** (name, duration, price; seeded dental list)
- **Doctors setup** (clinical members + availability)

AtlasJo operations:
- **Super Admin** (create clinic, fleet list, per-clinic ops view)
- **Trial 14 days** (auto-create, extend)
- **Subscription states** (trial/active/past_due/read_only/suspended/cancelled)
- **Read-only mode** (grace → read-only before suspend)
- **Manual payment recording + activation**
- **Basic analytics** (dashboard cards + simple monthly summary)
- **Monitoring** (error tracking, health check, uptime)

---

## What V1 excludes (explicitly not built yet)
- WhatsApp **Business API** automation · **SMS** automation
- **Payment gateway** / online card processing
- **Full accounting** (ledgers, VAT filing, P&L), **payroll**, **inventory**
- **Insurance claims** engine
- **DICOM/PACS** viewer · **complex interactive tooth chart** (if it delays launch)
- **Native mobile apps** · **patient portal login**
- **Advanced BI** (cohorts, custom dashboards) · scheduled email reports
- **Custom domains** / subdomains per clinic
- **Self-serve signup** + automated billing
- **Custom-role editor** · **multi-branch** clinics
- **Automated patient messaging at scale** / two-way conversations
- **Merge-duplicate-patients tool** (warn only in V1)

---

## What must be secure from day one (non-negotiable)
- **Tenant isolation via Supabase RLS (primary)** on every tenant table — no cross-clinic read/write, ever — proven by **RLS isolation tests** in CI (ADR-001).
- **Service role never in clinic-user paths** (Super-Admin/jobs only); guard test passing.
- AuthN via **Supabase Auth** (Supabase-managed hashing), revocable sessions, rate-limited login/reset.
- **Super Admin 2FA enforced before the first real trial clinic.**
- AuthZ (`authorize()`) on every mutation + sensitive read; subscription gating.
- Private files (Supabase Storage) via signed URLs only; no public medical URLs; risky types blocked + EXIF stripped.
- **Patient messaging consent = `unknown` by default; `opted_out` blocks reminders** (clinic is the controller of consent).
- WhatsApp deep links **never auto-marked "sent"** — only on explicit staff confirmation.
- No PHI in logs/Sentry/URLs; generic user-facing errors.
- Audit logs for sensitive + support actions.
- Backups enabled + a tested restore before the first real clinic.
- Super Admin cannot casually view patient data (support-access gating).

## What can be manual in V1
- **Onboarding** (AtlasJo creates clinics, helps import patients).
- **Payments** (CliQ/cash/bank, recorded by Super Admin) and **activation**.
- **WhatsApp reminders** (staff click pre-filled deep links).
- **Patient import** (assisted CSV/Excel import, AtlasJo-run if needed).
- **Trial extensions, pilot pricing, suspensions** (Super Admin actions).
- **Support** (WhatsApp/phone, human).

## What must be automated in V1
- Tenant scoping + authz checks (never manual).
- Double-booking prevention (DB + app).
- Subscription **status sweeps** (trial expiry → read_only; period end → past_due → read_only) via daily job.
- **Optional email reminders** (24h) if enabled.
- Audit logging.
- Backups (scheduled).
- Health checks + error capture.

## Launch blockers (V1 will not go live to a real clinic without these)
1. **RLS enabled + policies on every tenant table; RLS isolation tests pass for every table (CI-green); service-role boundary test green.**
2. Permission tests pass for the role matrix.
3. Appointment double-book + race tests pass.
4. Auth: session revocation on member-remove/password-reset verified.
5. Subscription gating verified (read_only blocks writes, allows reads; suspended locks).
6. Files private + signed-URL-only verified; no public medical URLs; risky types blocked + EXIF stripped.
6b. **Super Admin 2FA enforced; patient messaging consent defaults to `unknown` (opt-out blocks reminders); WhatsApp deep links never auto-marked sent.**
7. No PHI in logs/Sentry verified (scrubbing on).
8. Backup enabled + **one successful test restore** documented.
9. Audit logging for sensitive + support actions verified.
10. Error monitoring + health check + uptime monitor live.
11. Privacy Policy / ToS / DPA **drafted** (lawyer review before first *paid* clinic).
12. Arabic/RTL correct across all V1 pages; `Asia/Amman` times correct.
13. Super Admin can create → onboard → trial → record payment → activate → suspend a clinic end-to-end.
14. Public booking rate-limited + spam-protected.

## What can be improved after first clinics (fast-follow)
- Automated reminders (scheduled events) → then WhatsApp API.
- Tooth chart, richer treatment plans, file galleries/before-after.
- Merge-duplicate patients, bulk actions.
- Analytics rollups + trends + CSV export.
- Payment gateway + auto-renew + self-serve.
- 2FA, RLS hardening (if not already primary), English UI.

## What must work during a real 14-day trial (the daily-loop guarantee)
- Open **Today's Schedule** and see the day clearly.
- **Search/add a patient** in seconds; open a 360° **patient profile**.
- **Book / reschedule / cancel / confirm / arrive / complete / no-show** without conflicts.
- **Calendar** day/week with multiple doctors.
- **Add a treatment note** in ≤20s; maintain a **treatment plan**.
- **Record a payment**; see **outstanding balance**; print a **receipt/invoice**.
- **Send a WhatsApp reminder** in one click; optionally an email reminder.
- Attach an **X-ray/image** securely to a patient.
- Take **online booking requests** and approve them.
- Owner sees **dashboard numbers** that are correct.
- Nothing leaks, nothing is lost, AtlasJo can support and (after trial) bill.

> **Scope guardrail:** if a proposed addition doesn't serve the trust/daily-loop/operate tests above, it's post-V1. V1 is *strong and trustworthy*, not *broad*.
