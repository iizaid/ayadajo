# Ayadajo — Product Requirements

> **⬆️ V1 reframe:** Target is **Production-Ready Core / Pilot-Ready V1** ([PRODUCTION_READY_V1_SCOPE.md](PRODUCTION_READY_V1_SCOPE.md)). Read **"MVP"** below as **"V1 core."** Changes vs the original list: **File Attachments (§22) is promoted from P2 to V1** (minimal secure single-file attach). **Reminders (§14)** are clarified as **assisted WhatsApp + optional automated email** in V1 (automated WhatsApp = post-V1). **Outstanding balance** has one source of truth: **issued invoice balances** (no double-counting with plans). Production must-haves — backups+restore, monitoring, audit, isolation/permission tests — are launch blockers (see LAUNCH_READINESS_CHECKLIST.md, TESTING_AND_QA_PLAN.md).

Functional requirements per feature. Each feature lists: **Purpose · User story · Priority · Acceptance criteria · Edge cases · Security**.

Priorities: **MVP** (Phase 2 build) · **P2** (Phase 2-later / pre-scale) · **Later**.

Global rules that apply to every feature:
- **Tenant scope:** every read/write of clinic-owned data is scoped by `clinic_id` derived from the authenticated session — never from a request parameter the client controls.
- **Authorization:** every action checks role permission server-side. UI hiding is not security.
- **Timezone:** all clinic-facing times render in `Asia/Amman`; all timestamps stored in UTC.
- **Status gating:** `read_only` and `suspended` clinics block writes (see SUBSCRIPTION_AND_TRIAL_SYSTEM.md).
- **Audit:** sensitive actions write an `audit_logs` row (who, what, when, clinic).

---

## 1. Clinic Onboarding — MVP
**Purpose:** Get a new clinic into a working state quickly, operated by AtlasJo.
**User story:** As AtlasJo, I create a clinic with its name, owner contact, and a trial so the clinic can start using Ayadajo during/after the demo.
**Acceptance criteria:**
- Super Admin can create a clinic with: clinic name, slug (auto from name, editable, unique), owner full name, owner email, owner phone, timezone (default Asia/Amman), language (default `ar`).
- Creating a clinic creates: the clinic record, an owner `user` + `clinic_member` (role Owner), default `clinic_settings`, default `working_hours`, a `subscription` in `trial` status with 14-day end date.
- Owner receives an email/WhatsApp link to set their password (or a temp credential during the demo).
- A new clinic has zero patients/appointments (clean slate).
**Edge cases:** duplicate slug → suggest alternative; duplicate owner email across clinics is allowed (a person can own/work in multiple clinics — model membership, not global email uniqueness as identity); clinic created but owner never sets password → resend invite.
**Security:** only Super Admin can create clinics. Slug sanitized (lowercase, hyphenated, reserved words blocked: `admin`, `api`, `book`, `super`, `www`).

## 2. Trial Creation — MVP
**Purpose:** 14-day evaluation with full feature access.
**User story:** As AtlasJo, I start a 14-day trial so the clinic can evaluate with real data.
**Acceptance criteria:** trial auto-created on clinic creation; `trial_ends_at = now + 14 days`; dashboard shows trial banner with days remaining; Super Admin can extend (set new end date, logged).
**Edge cases:** trial already expired at first login → "trial expired, contact us", allow read-only of entered data; extending an expired trial reactivates it.
**Security:** only Super Admin changes trial dates; every change audited.

## 3. Login — MVP
**Purpose:** Authenticate staff into their clinic.
**User story:** As a staff member, I log in with email + password and land in my clinic.
**Acceptance criteria:** email+password login; session cookie (httpOnly, secure, sameSite=Lax); "forgot password" via email link; failed-login rate limiting; a user in multiple clinics chooses which to enter (or defaults to last used).
**Edge cases:** disabled member loses access immediately; suspended clinic → owner reaches a "subscription expired" screen, staff cannot write; wrong clinic in URL → 404, never another clinic's data.
**Security:** **auth via Supabase Auth** (Supabase manages password hashing); generic errors ("invalid email or password"); no user enumeration; lockout/backoff; sessions invalidated on password reset and member removal; **Super Admin 2FA required**.

## 4. Clinic Dashboard — MVP
**Purpose:** The owner's at-a-glance control center.
**User story:** As an owner, I open the dashboard and immediately see this month's appointments, new patients, money collected, outstanding balance, no-shows, and today's upcoming appointments.
**Acceptance criteria:** cards for appointments this month, appointments today, new patients (this month), returning patients, cancelled, no-show count/rate, collected (this month), outstanding total; list of today's upcoming appointments; trial/subscription banner. All clinic-scoped. (Detail in ANALYTICS_AND_REPORTING.md.)
**Edge cases:** empty clinic → friendly empty states; partial month → "this month so far".
**Security:** financial cards visible only to Owner/Manager/Accountant; doctors/receptionists see operational cards only.

## 5. Patient Management — MVP
**Purpose:** The patient record and history.
**User story:** As a receptionist, I add and find patients fast; as a doctor, I open a patient and see history.
**Acceptance criteria:**
- Add patient: full name (required), phone (required, Jordan format), gender, DOB (optional), notes, optional email, optional medical alerts (allergies/conditions free text).
- Search by name or phone, instant (debounced), within the clinic only.
- Patient profile: contact, upcoming + past appointments, treatment notes, treatment plan, outstanding balance, files.
- Edit and soft-delete (archive).
**Edge cases:** duplicate warning if same phone exists ("possible duplicate, open existing?"); merging duplicates is **P2**; phone validation accepts `07XXXXXXXX` and `+9627XXXXXXXX`; deleting a patient with history → archive, never hard delete.
**Security:** strictly clinic-scoped; medical alerts sensitive; role-based access (Assistant limited); archived excluded from default lists.

## 6. Appointment Management — MVP
**Purpose:** Core scheduling. (Full detail in APPOINTMENTS_AND_CALENDAR.md.)
**User story:** As a receptionist, I book/reschedule/cancel/confirm appointments and track arrival/no-show.
**Acceptance criteria:** create with patient, doctor, service, date, start time, duration; lifecycle booked→confirmed→arrived→completed / cancelled / no_show; reschedule keeps history; cancel with reason; prevent double-booking the same doctor at the same time; respect working hours.
**Edge cases:** see APPOINTMENTS_AND_CALENDAR.md.
**Security:** clinic-scoped; status changes audited; staff-only.

## 7. Calendar — MVP
**Purpose:** Visual schedule. **User story:** As staff, I view the day/week to find free slots.
**Acceptance criteria:** day view (default workhorse), week view; per-doctor columns when multiple doctors; shows working hours, blocks outside-hours; click empty slot → pre-filled new appointment.
**Edge cases:** overlaps rendered clearly; many doctors → scroll/select doctor; render times via tz library, never manual offsets.
**Security:** clinic-scoped; doctors may see only their own column (P2 setting).

## 8. Treatment Notes — MVP (basic)
**Purpose:** Clinical record of a visit.
**User story:** As a doctor, I add a dated note describing treatment and observations.
**Acceptance criteria:** note tied to patient (optionally appointment); fields date (default now), doctor (default current), tooth/area (optional free text MVP), note text, follow-up instruction (optional); append-style, newest-first in history; author can edit within a window, else add a correction note.
**Edge cases:** note without appointment (walk-in); note edited by another doctor → record who.
**Security:** clinical data; visible to Doctors/Owner/Manager; receptionist sees summary not full detail (configurable); edits audited.

## 9. Treatment Plans — MVP (basic)
**Purpose:** Multi-visit plan with cost and progress.
**User story:** As a doctor, I create a plan listing procedures, each with price and status.
**Acceptance criteria:** plan belongs to patient; items (procedure, tooth/area optional, price, status planned/in_progress/done/cancelled); plan total + completed total computed; items markable done; outstanding = plan cost − payments allocated.
**Edge cases:** price changes after items added; item cancelled after partial payment; plan spanning months.
**Security:** clinical + financial; Doctor/Owner/Manager; pricing edits audited.

## 10. Payments — MVP
**Purpose:** Record money received.
**User story:** As a receptionist/accountant, I record a payment and see remaining balance.
**Acceptance criteria:** fields patient, amount, method (cash/cliq/bank_transfer/card_manual/other), date, optional link to invoice/plan, note; **outstanding per patient = sum of issued-invoice balances (single source of truth) − it is NOT derived from treatment-plan totals** (plan totals are estimates only); lists per patient and per day.
**Edge cases:** overpayment → credit (P2) or warn; refund (reversal entry, P2); on-account payment; currency fixed JOD.
**Security:** financial; record by Receptionist (limited)/Accountant/Owner/Manager; no deletion — reversal entries; all writes audited.

## 11. Invoices — MVP (simple)
**Purpose:** Printable/shareable record of charges and payments.
**User story:** As an accountant, I generate a simple invoice.
**Acceptance criteria:** invoice belongs to patient; line items (description, qty, unit price, total), subtotal, total, paid, balance; sequential per-clinic invoice number; print-friendly HTML (PDF enough for MVP); status draft/issued/paid/partial/void.
**Edge cases:** void issued invoice (keep number); edit after issue → P2 lock + credit note; VAT line optional, off by default (legal review).
**Security:** financial; per-clinic numbering must never collide/leak across clinics; void audited.

## 12. Public Booking Page — MVP (request mode)
**Purpose:** Patients request appointments online. (Full detail in PUBLIC_BOOKING_SYSTEM.md.)
**User story:** As a patient, I visit `/book/clinic-slug`, pick a reason+time, enter details, submit a request the clinic confirms.
**Acceptance criteria:** public unauthenticated page per slug; service/reason select, date+time within working hours, name+phone form, optional email/notes; submits a `public_booking_request` (not instant appointment) in MVP; confirmation screen; staff queue to approve/reject; rate limiting + spam protection.
**Edge cases:** spam, double submit, requesting a taken slot (request mode tolerates; staff resolve); closed clinic.
**Security:** unauthenticated surface = highest risk; rate limit, validate everything, no leakage about other patients; CAPTCHA if abused.

## 13. Notifications (in-app) — P2
**Purpose:** Tell staff about new booking requests, arrivals, etc.
**Acceptance criteria:** in-app list; unread count; types new_booking_request, reminder_due, subscription warnings.
**Security:** clinic-scoped; super-admin notifications separate.

## 14. Reminder System — MVP (assisted) → P2 (automated)
**Purpose:** Reduce no-shows. (Full detail in REMINDERS_AND_MESSAGING_SYSTEM.md.)
**User story (MVP):** As a receptionist, for tomorrow's appointments I click "Remind via WhatsApp" and a pre-filled Arabic message opens in WhatsApp.
**Acceptance criteria (V1):** each upcoming appointment has "Send WhatsApp reminder" → `wa.me` deep link with filled template (patient, clinic, date/time, doctor); logged as a `message` with `status='prepared'` → `opened` on click → **`marked_sent` only after explicit staff confirmation** (opening wa.me is NOT proof of delivery — never auto-`sent`); optional automated email reminder via Resend/Brevo (`sent` when accepted by provider).
**Acceptance criteria (P2):** scheduled `reminder_events` 24h before, processed by cron, idempotent, cancellable on cancel/reschedule.
**Edge cases:** cancel after scheduled → cancel reminder; reschedule → regenerate; quiet hours; duplicates.
**Security:** phone is PII; **messaging consent status (`unknown`/`consented`/`opted_out`) tracked, default `unknown` — `opted_out` blocks reminders**; the clinic is the consent controller [LEGAL]; never message after cancellation; log every message.

## 15. Staff Management — MVP
**Purpose:** Manage who works in the clinic.
**User story:** As an owner, I invite staff, assign roles, remove them.
**Acceptance criteria:** invite by email with role; statuses active/invited/suspended/removed; remove → immediate access loss + session invalidation; owner cannot be removed (ownership transfer P2).
**Edge cases:** inviting an existing account → add membership; removing the only owner → blocked; re-inviting a removed member.
**Security:** Owner/Manager only; role changes audited; removed staff retain no access.

## 16. Roles & Permissions — MVP (fixed roles)
**Purpose:** Least-privilege access. (Full detail in USER_ROLES_AND_PERMISSIONS.md.)
**Acceptance criteria:** fixed roles (Owner, Manager, Doctor, Receptionist, Accountant, Assistant); enforced server-side per action; sensitive actions (delete, pricing, staff, settings, exports) gated.
**Edge cases:** dual role across two clinics; downgrade mid-session.
**Security:** server-side checks on every mutation; never trust client role.

## 17. Clinic Settings — MVP (core)
**Purpose:** Configure the clinic.
**Acceptance criteria:** working hours per weekday (open/close, breaks); services (name, default duration, default price); doctors list/availability; profile (name, phone, address, logo); language (ar default); booking on/off + mode.
**Edge cases:** changing hours conflicting with existing appointments → warn, don't auto-cancel; removing a used service → soft-disable.
**Security:** Owner/Manager only; changes audited.

## 18. Subscription Status — MVP
**Purpose:** Gate access by payment state. (Full detail in SUBSCRIPTION_AND_TRIAL_SYSTEM.md.)
**Acceptance criteria:** status drives gating (read_only blocks writes; suspended blocks all but status screen); banners warn before end; changes by Super Admin only, audited.
**Edge cases:** grace period; status change while mid-edit (block on save, clear message).
**Security:** only Super Admin changes status; clinic cannot self-elevate.

## 19. Super Admin Dashboard — MVP. (Full detail in SUPER_ADMIN_PLAN.md.)
**Acceptance criteria:** list clinics with status/trial/subscription; create clinic; start/extend trial; mark paid → activate; suspend; per-clinic view (subscription, payments, staff count, last login, message usage); platform stats; support notes.
**Security:** Super Admin separate from clinic auth; must not casually access patient medical data — support access explicit + logged.

## 20. Reports & Analytics — MVP (basic) → P2. (Full detail in ANALYTICS_AND_REPORTING.md.)
**Acceptance criteria (MVP):** dashboard cards + simple monthly summary; CSV export of patients/appointments/payments (P2).
**Security:** financial reports gated; exports audited.

## 21. Audit Logs — MVP. (Full detail in SECURITY_AND_PRIVACY_PLAN.md.)
**Acceptance criteria:** log actor, action, entity, entity_id, clinic_id, timestamp, ip, summary; actions: login, member add/remove/role change, payment create/reverse, invoice void, settings change, subscription/trial change, data export, super-admin support access, patient/treatment delete.
**Edge cases:** high volume → don't log normal reads except sensitive support access; never store secrets/PHI in payloads.
**Security:** append-only; viewable by Owner (clinic) and Super Admin (platform).

## 22. File Attachments — **V1 (promoted from P2)** — minimal secure single-file
**Purpose:** Attach X-rays/images/docs to a patient. (V1 = one image/doc per record, private + signed URLs; galleries/before-after = later.)
**Acceptance criteria:** upload to private storage; metadata row (clinic_id, patient_id, type, size, uploader); access only via short-lived signed URLs; size/type limits.
**Edge cases:** large files on weak internet; wrong type; orphaned files.
**Security:** **never** public URLs for medical files; signed, time-limited, clinic-scoped; type checks; uploads audited.

---

### Acceptance-criteria conventions
- "Scoped to clinic" = derived server-side from session, enforced in the data layer, tested.
- "Audited" = a row in `audit_logs` written in the same transaction as the action where feasible.
- "Gated" = blocked when clinic status is `read_only`/`suspended`, and when the role lacks permission.
