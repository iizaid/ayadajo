# Ayadajo — Support & Operations

How AtlasJo supports clinics without compromising patient privacy. V1 support is **human, WhatsApp-first, founder-led**, with clear rules on what AtlasJo can and cannot see.

---

## Support channels
- **WhatsApp** (primary) — a dedicated AtlasJo support number; how Jordan clinics expect to communicate.
- **Phone call** for urgent issues.
- **Email** for records/formal requests (exports, cancellations, invoices).
- **In-app help** (P2) — a help link / FAQ; in V1 a simple Arabic help page + WhatsApp button.

## Support hours
- V1: best-effort during clinic working hours (roughly Sun–Thu + Sat mornings), with fast response for pilots.
- Set expectations clearly ("نرد خلال ساعات العمل"). Don't promise 24/7.
- Tiered later: Pro/Plus get priority response targets (e.g. same business day).

## Support ticket workflow (lightweight in V1)
1. Clinic messages support (WhatsApp/email).
2. Log it (a simple sheet/Notion/Linear): clinic, issue, severity, status, owner, timestamps.
3. Triage severity: **P1** (clinic blocked / data/security) → immediate; **P2** (feature broken, workaround exists) → same/next day; **P3** (question/request) → within a few days.
4. Resolve; if it needs clinic-data access → open a **support access grant** (see rules below).
5. Close with a confirmation message; log resolution; note recurring issues for product fixes.

## Common problems & playbooks

### Password reset
- Self-serve: "forgot password" → email reset link. Guide them to it.
- If email issues: verify identity (owner via known phone), trigger reset, confirm. Logged.

### Staff access issue (can't log in / wrong access)
- Check member status (active/invited/suspended/removed) and role.
- Re-send invite, re-activate, or fix role (Owner/Manager normally does this themselves; support guides them).
- Removed-by-mistake: re-invite. Logged.

### Appointment conflict issue (double-book / wrong time)
- Usually self-fixable (reschedule/cancel; history shows changes).
- If a bug suspected: reproduce on a test clinic, check the exclusion constraint, file an issue. Don't touch clinic data without a grant.

### Reminder failure (message didn't go / wrong text)
- Manual WhatsApp links: confirm staff clicked send; check phone format/consent.
- Email reminders: check Messages log status; check provider (Resend/Brevo) + bounce; verify template variables.
- Fix template if wrong; never expose message bodies in support logs.

### Payment / subscription issue
- Subscription state wrong (e.g. still showing trial after payment): verify `subscription_payments`, re-activate, sync `clinics.status`. Super Admin only. Logged.
- Clinic disputes a recorded payment: check the payment record + reference; correct via reversal/record (never silent edit). Logged.

### Clinic data export request
- Owner can request an export of **their** clinic data (CSV/JSON). Verify requester is the owner.
- Generate export; deliver securely; **audit** (who requested, what, when). See DATA_MIGRATION + LEGAL docs.

### Clinic cancellation request
- Verify owner identity + intent. Set status `cancelled` (Super Admin). Offer data export first.
- Communicate retention/deletion timeline per LEGAL policy. Logged. Don't hard-delete immediately — grace + export window.

---

## Support access rules (privacy gate — critical)
- **Default:** AtlasJo support sees **operational metadata only** — clinic status, dates, plan, counts (patients/appointments/messages/storage), last login, payment records. **NOT** patient names, notes, medical alerts, message bodies, or files.
- To see clinic-internal data for troubleshooting, support must open a **support access grant** (`support_access_grants`): choose clinic, enter a **reason**, time-boxed (e.g. 1–2h).
- While active, support gets a **read-only clinic view**; **every data load is audited** (`support.access`). Medical notes/files need an **extra confirmation** and are still logged.
- Grants auto-expire; can be revoked early. (P2: notify the clinic owner when used.)
- This means AtlasJo *can* help when asked, but **cannot casually browse** patient health data — and there's always a trail.

## What AtlasJo can see by default
- Clinic profile + status + subscription + payments (AtlasJo's billing).
- Usage counts and dates, last login/activity.
- Audit log entries (metadata).
- Aggregate platform stats.

## What AtlasJo should NOT see without a support grant
- Patient names, phones, DOB, medical alerts.
- Appointment details (who/when).
- Treatment notes / plans.
- Message bodies.
- Files / X-rays.

## Internal support notes
- Per-clinic **internal notes** (in Super Admin) for context (e.g. "owner prefers WhatsApp," "renewal due," "wants tooth chart"). Not visible to the clinic. Don't put PHI in notes.

## Support audit logs
- Every support access grant + each data view under it is in `audit_logs`.
- Periodically review support-access logs (self-audit): was every access justified and logged? Catch misuse early.

---

## Operations cadence (AtlasJo internal)
- **Daily:** check support queue, monitoring alerts, failed jobs/messages, new trials.
- **Weekly:** review trials ending + renewals due; pilot check-ins; metrics (GTM doc); triage product issues.
- **Monthly:** reconcile subscription payments; review churn/feedback; security/audit-log spot check; backup-restore test (quarterly minimum).
- **On status changes:** ensure clinics get clear comms (trial ending, past_due, read_only, suspended).

## Escalation
- Security/privacy incident → **INCIDENT_RESPONSE_PLAN.md** immediately.
- Legal request (data, subpoena, complaint) → LEGAL review before acting.
- Outage → incident plan + status comms to affected clinics.
