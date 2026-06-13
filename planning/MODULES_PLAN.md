# Ayadajo — Modules Plan

The app is a **modular monolith**. Each module below lists: Purpose · Main users · Main pages · DB tables · Main actions · Permissions · API/server actions · Validation · Edge cases · MVP scope · Later.

Conventions: all clinic-owned actions are tenant-scoped (`clinicId` from session) and authorized server-side. "SA" = Super Admin. Server actions named `verbNoun` (e.g. `createPatient`).

---

## 1. Auth Module
- **Purpose:** Authenticate users, manage sessions, password reset, clinic-context switching.
- **Users:** all.
- **Pages:** Login, Forgot Password, Reset Password, Set Password (invite), Choose Clinic.
- **Tables:** `users`, `sessions`, `password_reset_tokens`, (`clinic_members` for context).
- **Actions:** `login`, `logout`, `requestPasswordReset`, `resetPassword`, `setPasswordFromInvite`, `switchClinic`.
- **Permissions:** public for login/reset; authenticated for switch.
- **API/actions:** server actions + `/api/auth/*`.
- **Validation:** email format; password min length + strength; token validity/expiry; rate-limit login + reset.
- **Edge cases:** removed member's active session revoked; reset token reuse; multi-clinic user.
- **MVP:** email+password, reset, invite set-password, choose-clinic. **Later:** 2FA, magic links, SSO.

## 2. Clinic Module
- **Purpose:** The tenant entity and its core profile.
- **Users:** SA (create), Owner/Manager (profile).
- **Pages:** (SA) Create Clinic; (clinic) Clinic Settings → Profile.
- **Tables:** `clinics`, `clinic_settings`.
- **Actions:** `createClinic` (SA), `updateClinicProfile`, `setClinicSlug`.
- **Permissions:** create = SA only; profile edit = Owner/Manager.
- **Validation:** unique slug (reserved-word blocklist); name length; phone format; timezone in allowed set.
- **Edge cases:** slug change breaks existing booking links → keep old slug as redirect (P2); duplicate names allowed.
- **MVP:** create + profile + slug + settings. **Later:** subdomains, multi-branch (one clinic, multiple locations).

## 3. Team Members Module
- **Purpose:** Manage who works at the clinic and their role.
- **Users:** Owner/Manager.
- **Pages:** Team Members list, Invite Member, Member detail.
- **Tables:** `clinic_members`, `member_invites`, (`users`).
- **Actions:** `inviteMember`, `acceptInvite`, `changeMemberRole`, `suspendMember`, `removeMember`.
- **Permissions:** Owner full; Manager limited (cannot manage Owner/Manager).
- **Validation:** valid role; cannot remove last Owner; email format.
- **Edge cases:** invite an existing user (add membership); re-invite removed member; suspend vs remove.
- **MVP:** invite, role assign, suspend, remove. **Later:** ownership transfer, per-member working hours.

## 4. Roles & Permissions Module
- **Purpose:** Define what each role can do.
- **Users:** system (enforced), Owner (views).
- **Pages:** Roles (read-only matrix view) in MVP.
- **Tables:** `roles`, `permissions`, `role_permissions` (seeded; code-enforced in MVP).
- **Actions:** `authorize(action)` helper everywhere; (later) `editRolePermissions`.
- **Permissions:** editing = Owner (later only).
- **Validation:** action exists in permission catalog.
- **Edge cases:** role downgrade mid-session re-evaluated per request.
- **MVP:** fixed roles enforced from a code matrix. **Later:** DB-driven custom roles/permissions editor.

## 5. Patients Module
- **Purpose:** Patient records + history.
- **Users:** Receptionist, Doctor, Owner/Manager, Accountant (limited).
- **Pages:** Patients List, Patient Profile, Add Patient, Edit Patient.
- **Tables:** `patients`.
- **Actions:** `createPatient`, `updatePatient`, `archivePatient`, `searchPatients`.
- **Permissions:** create/edit = Receptionist/Doctor/Manager/Owner; archive = Manager/Owner; medical alerts edit = Doctor/Owner.
- **Validation:** name required; Jordan phone; DOB sane; dedupe warn on phone.
- **Edge cases:** duplicate phone; archived excluded from lists; search across name+phone, clinic-scoped.
- **MVP:** CRUD + search + profile + dedupe warning. **Later:** merge duplicates, tags, custom fields.

## 6. Appointments Module
- **Purpose:** Schedule and track visits. (Detail in APPOINTMENTS_AND_CALENDAR.md.)
- **Users:** Receptionist (primary), Doctor, Manager/Owner.
- **Pages:** Add/Edit Appointment, Today's Schedule, (Calendar in next module).
- **Tables:** `appointments`, `appointment_status_history`.
- **Actions:** `createAppointment`, `rescheduleAppointment`, `cancelAppointment`, `confirmAppointment`, `markArrived`, `markCompleted`, `markNoShow`.
- **Permissions:** manage = Receptionist/Manager/Owner; Doctor can mark arrived/completed on own appointments.
- **Validation:** within working hours; no doctor double-book; duration > 0; patient + doctor belong to clinic.
- **Edge cases:** overlap, walk-in, cancel after reminder scheduled, reschedule after reminder sent.
- **MVP:** full lifecycle + double-book prevention + status history. **Later:** recurring appointments, resources/chairs.

## 7. Calendar Module
- **Purpose:** Visual day/week schedule.
- **Users:** Receptionist, Doctor, Manager/Owner.
- **Pages:** Calendar (day default, week).
- **Tables:** reads `appointments`, `working_hours`, `doctors_availability`.
- **Actions:** `getCalendar(range, doctorId?)`, create via slot click.
- **Permissions:** view = all staff; doctor-own-only optional.
- **Validation:** range bounds; doctor filter belongs to clinic.
- **Edge cases:** many doctors, overlaps, outside-hours shading.
- **MVP:** day + week, per-doctor columns. **Later:** month overview, drag-to-reschedule, resource lanes.

## 8. Treatment Notes Module
- **Purpose:** Clinical visit notes.
- **Users:** Doctor (primary), Owner/Manager (view).
- **Pages:** within Patient Profile → Notes tab; Add Note.
- **Tables:** `treatment_notes`.
- **Actions:** `createTreatmentNote`, `editTreatmentNote` (window), `addCorrectionNote`.
- **Permissions:** create/edit = Doctor/Owner; Receptionist view-summary only (configurable).
- **Validation:** note text required; appointment (if linked) belongs to patient/clinic.
- **Edge cases:** edit by non-author; note without appointment.
- **MVP:** dated free-text notes + optional tooth/area + follow-up instruction. **Later:** structured templates, tooth chart linkage.

## 9. Treatment Plans Module
- **Purpose:** Multi-visit procedure plans with cost/progress.
- **Users:** Doctor, Owner/Manager.
- **Pages:** Patient Profile → Plan tab; Add/Edit Plan.
- **Tables:** `treatment_plans`, `treatment_plan_items`.
- **Actions:** `createPlan`, `addPlanItem`, `updatePlanItem`, `markItemDone`, `cancelPlanItem`.
- **Permissions:** create/edit = Doctor/Owner/Manager; pricing edit audited.
- **Validation:** item price ≥ 0; status enum; plan belongs to patient/clinic.
- **Edge cases:** price change after payment; item cancel after partial pay; long-running plans.
- **MVP:** plan + items + status + totals + outstanding link. **Later:** plan templates, acceptance signature, versioning.

## 10. Payments Module
- **Purpose:** Record money received.
- **Users:** Receptionist (limited), Accountant, Owner/Manager.
- **Pages:** Payments list, Record Payment, Patient Profile → Payments.
- **Tables:** `payments`.
- **Actions:** `recordPayment`, `reversePayment` (entry, not delete), `allocatePaymentToPlan/Invoice`.
- **Permissions:** record = Receptionist/Accountant/Owner/Manager; reverse = Accountant/Owner.
- **Validation:** amount > 0; method enum; date not future (warn); patient in clinic.
- **Edge cases:** overpayment/credit, refund, on-account payment, JOD only.
- **MVP:** record + outstanding computation + per-patient/day lists. **Later:** credits, refunds, gateway integration.

## 11. Invoices Module
- **Purpose:** Printable charge/payment records.
- **Users:** Accountant, Owner/Manager.
- **Pages:** Invoices list, Invoice detail/print, Create Invoice.
- **Tables:** `invoices`, `invoice_items`.
- **Actions:** `createInvoice`, `addInvoiceItem`, `issueInvoice`, `voidInvoice`, `printInvoice`.
- **Permissions:** Accountant/Owner/Manager.
- **Validation:** per-clinic sequential number (gap-safe, no cross-tenant leak); totals computed server-side.
- **Edge cases:** void issued invoice (keep number), VAT optional/off, edit-after-issue locked.
- **MVP:** simple invoice + print + void. **Later:** credit notes, templates, e-invoice/VAT compliance (legal review).

## 12. Dashboard & Analytics Module
- **Purpose:** Owner insight. (Detail in ANALYTICS_AND_REPORTING.md.)
- **Users:** Owner/Manager (full), others see operational subset.
- **Pages:** Clinic Dashboard, Reports.
- **Tables:** reads many; optional `daily_metrics` rollup (P2).
- **Actions:** `getDashboardMetrics(range)`, `getReport(type, range)`, `exportCsv`.
- **Permissions:** financial metrics gated; exports audited.
- **Validation:** range bounds.
- **Edge cases:** empty clinic, partial month, slow queries (precompute later).
- **MVP:** core cards + monthly summary. **Later:** trends, rollups, CSV export, custom date ranges.

## 13. Public Booking Module
- **Purpose:** Patient-facing booking. (Detail in PUBLIC_BOOKING_SYSTEM.md.)
- **Users:** public patients; staff approve.
- **Pages:** `/book/{slug}`, Booking Success, (staff) Booking Requests queue.
- **Tables:** `public_booking_requests`, reads `working_hours`/`services`/`doctors_availability`.
- **Actions:** `submitBookingRequest` (public), `approveBookingRequest`, `rejectBookingRequest`.
- **Permissions:** submit = public (rate-limited); approve/reject = Receptionist/Manager/Owner.
- **Validation:** Jordan phone, slot within hours, spam/rate limit, honeypot/CAPTCHA.
- **Edge cases:** spam, double submit, taken slot, booking disabled, closed clinic.
- **MVP:** request mode + staff queue. **Later:** instant confirm, OTP verification, subdomains.

## 14. Messaging & Reminders Module
- **Purpose:** Reminders/follow-ups. (Detail in REMINDERS_AND_MESSAGING_SYSTEM.md.)
- **Users:** Receptionist/Manager/Owner; system (jobs).
- **Pages:** Messages log, Message Templates.
- **Tables:** `message_templates`, `reminders`, `reminder_events`, `messages`.
- **Actions:** `generateReminderEvents`, `processDueReminders` (job), `sendWhatsAppDeepLink` (assisted), `logMessage`, `cancelRemindersForAppointment`, `editTemplate`.
- **Permissions:** templates edit = Manager/Owner; send = staff; jobs = system.
- **Validation:** template variables whitelist; quiet hours; phone present + consent.
- **Edge cases:** cancel/reschedule after schedule/send; duplicates; failures/retries.
- **MVP:** assisted WhatsApp deep links + email + message log + templates. **Later:** automated scheduled sends, WhatsApp API, SMS, delivery receipts.

## 15. Subscription & Trial Module
- **Purpose:** Billing state + access gating. (Detail in SUBSCRIPTION_AND_TRIAL_SYSTEM.md.)
- **Users:** SA (manage), clinic (view status).
- **Pages:** (SA) Subscriptions, Payments; (clinic) Subscription status banner/screen.
- **Tables:** `plans`, `subscriptions`, `subscription_payments` (manual records).
- **Actions:** `startTrial`, `extendTrial`, `recordManualPayment`, `activateSubscription`, `setClinicStatus`, `cancelSubscription`.
- **Permissions:** all mutations = SA only.
- **Validation:** status transitions valid; dates sane; plan exists.
- **Edge cases:** grace period, read_only vs suspended, mid-edit status change.
- **MVP:** trial + manual payment + status gating. **Later:** payment gateway, auto-renew, usage-based limits.

## 16. Super Admin Module
- **Purpose:** AtlasJo fleet operations. (Detail in SUPER_ADMIN_PLAN.md.)
- **Users:** SA, Support Admin.
- **Pages:** SA Dashboard, Clinics, Clinic Details, Subscriptions, Payments, Plans, Audit Logs.
- **Tables:** cross-clinic reads via audited admin path; `support_access_grants`.
- **Actions:** all clinic lifecycle + `grantSupportAccess`, `viewClinicAsSupport` (logged).
- **Permissions:** platform-admin flag; support access time-boxed + logged; medical data not shown by default.
- **Validation:** admin auth (separate, 2FA later); every cross-tenant read logged.
- **Edge cases:** support reading patient data must be explicit + audited.
- **MVP:** clinic CRUD/lifecycle, fleet list, per-clinic ops view (no casual medical data). **Later:** impersonation with consent, granular support roles.

## 17. Settings Module
- **Purpose:** Configure the clinic.
- **Users:** Owner/Manager.
- **Pages:** Settings → Profile, Working Hours, Services, Doctors, Booking, Templates, Language.
- **Tables:** `clinic_settings`, `working_hours`, `services`, `doctors_availability`, `message_templates`.
- **Actions:** `updateWorkingHours`, `manageServices`, `manageDoctorAvailability`, `updateBookingSettings`, `setLanguage`.
- **Permissions:** Owner/Manager.
- **Validation:** open<close; break within hours; service duration/price ≥ 0.
- **Edge cases:** hour changes vs existing appointments (warn); removing used service (soft-disable).
- **MVP:** hours, services, doctors, profile, booking toggle, language, templates. **Later:** holidays, per-doctor rooms, multi-branch.

## 18. Audit Logs Module
- **Purpose:** Accountability. (Detail in SECURITY_AND_PRIVACY_PLAN.md.)
- **Users:** Owner (clinic scope), SA (platform).
- **Pages:** (clinic) Audit view (P2), (SA) Audit Logs.
- **Tables:** `audit_logs`.
- **Actions:** `writeAuditLog` (internal), `queryAuditLogs`.
- **Permissions:** Owner sees own clinic; SA sees all.
- **Validation:** no PHI in payload.
- **Edge cases:** high volume; append-only.
- **MVP:** write + SA view. **Later:** clinic-facing view, export, alerts.

## 19. File Storage Module
- **Purpose:** Patient file attachments.
- **Users:** Doctor/Owner/Manager.
- **Pages:** Patient Profile → Files.
- **Tables:** `files`.
- **Actions:** `requestUploadUrl`, `confirmUpload`, `getSignedDownloadUrl`, `deleteFile`.
- **Permissions:** Doctor/Owner/Manager; download via signed URL after authz.
- **Validation:** type/size whitelist; key namespaced by clinic.
- **Edge cases:** large file on weak internet; orphaned upload; wrong type.
- **MVP (optional):** single image/doc attach, private. **Later:** galleries, before/after, thumbnails.

## 20. Notifications Module
- **Purpose:** In-app alerts to staff.
- **Users:** staff.
- **Pages:** notification bell/list.
- **Tables:** `notifications` (P2).
- **Actions:** `createNotification`, `markRead`.
- **Permissions:** clinic-scoped per recipient.
- **Validation:** type enum.
- **Edge cases:** entity deleted after notify.
- **MVP:** none or minimal (booking-request badge). **Later:** full center, push.

---

### Module dependency order (build sequence)
Auth → Clinic → Team/Roles → Patients → Appointments → Calendar → Dashboard(basic) → Subscription/Status → Super Admin → Treatment Notes/Plans → Payments/Invoices → Public Booking → Messaging/Reminders → Files → Notifications → Audit (woven throughout).
