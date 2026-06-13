# Ayadajo — Reminders & Messaging System

The highest-ROI feature (no-show reduction) and the easiest place to **over-build and over-message**. This design starts minimal and assisted, then automates.

> **Core stance:** message *less* than you can. Fewer, well-timed messages beat a barrage. Patient trust and cost both punish over-messaging.

---

## Message types
- **Appointment reminder** (before the visit)
- **Confirmation** (request/booking confirmed)
- **Reschedule** notice
- **Cancellation** notice
- **No-show** follow-up (offer to rebook)
- **Post-treatment follow-up / thank-you**
- **Payment reminder** (Later)
- **Trial ending** (to clinic owner)
- **Subscription renewal** (to clinic owner)

---

## Reminder schedule — recommended (NOT the maximal version you described)

Your example (24h + 2h + 10min + "starting soon") is **too much** for dental and risks fatigue + cost. Recommended:

| Reminder | MVP? | Channel | Rationale |
|---|---|---|---|
| **24h before** | ✅ MVP (assisted) | WhatsApp link / email | The single highest-impact reminder. Gives time to cancel/reschedule. |
| **~2–3h before** | P2 (optional, clinic toggle) | WhatsApp/email | Catches same-day forgetfulness. Off by default. |
| 10-min / "starting soon" | ❌ Skip | — | Low value, high annoyance; the patient is already en route or not coming. |
| Staff "patient expected soon" | P2 | in-app | Useful internally, not to patient. |
| **Post-treatment follow-up** | P2 | WhatsApp/email | Good for retention; send once, hours/1 day after. |
| **No-show rebook** | P2 | WhatsApp | Recover lost visits. |
| Trial/subscription (owner) | MVP (email) | email | Operational, to owner not patient. |

**Default for a new clinic: one 24h reminder.** Everything else is opt-in per clinic.

---

## MVP: assisted WhatsApp deep links (no API, no cost, no Meta approval)
- Each upcoming appointment (and Today's Schedule) has a **"Remind via WhatsApp"** button.
- It builds a `https://wa.me/<phone>?text=<url-encoded rendered template>` link and opens WhatsApp Web/app with the message pre-filled to the patient's number.
- **Accurate status (do NOT log a deep link as "sent" on click):** generating the link logs a `messages` row `status='prepared'`; opening it sets `opened`; the status becomes **`marked_sent` only when staff explicitly confirm "I sent it"** (records `marked_sent_by`/`marked_sent_at`). Opening `wa.me` is **not** proof of delivery. Staff can also mark `cancelled`/`failed`.
- **Why:** zero per-message cost, no Meta Business verification, no template approval, works day one, and clinics already message patients this way — we just make it one click with the right text.
- Also offer **email reminders** (Resend/Brevo) which *can* be automated cheaply even in MVP.

## P2: automated reminders (scheduled)
- When an appointment is created/confirmed, generate `reminders` (intent) + `reminder_events` (scheduled send at `appointment.starts_at − 24h`).
- A cron job processes due events and sends (email automatically; WhatsApp via API once available).
- Until WhatsApp API exists, "automated WhatsApp" can be a **staff task queue**: due reminders surface as a "to send" list with one-click deep links (semi-automated).

## Later: WhatsApp Business API
- Via a BSP (e.g. Meta Cloud API / Twilio / 360dialog). Requires: business verification, pre-approved templates, opt-in, per-message cost.
- Replaces deep links with true automated delivery + delivery/read receipts. Gate behind paying clinics (cost recovery).

## Later: SMS
- Higher cost in Jordan; only as fallback when no WhatsApp. Via Brevo/local gateway.

---

## Message template system
- `message_templates` (clinic-scoped, with platform defaults). Fields: code, channel, language, body, is_active.
- **Variables (whitelist only):** `{{patient_name}}`, `{{clinic_name}}`, `{{appointment_date}}`, `{{appointment_time}}`, `{{doctor_name}}`, `{{service_name}}`, `{{clinic_phone}}`, `{{booking_link}}`.
- Render server-side; reject/escape any non-whitelisted token (prevents injection / accidental data leak).
- Clinics may **edit text** but not add arbitrary variables or HTML (safe customization).

### Arabic templates (defaults, MVP)
- **reminder_24h:** `مرحبا {{patient_name}}، نذكّرك بموعدك في {{clinic_name}} يوم {{appointment_date}} الساعة {{appointment_time}} مع {{doctor_name}}. لتأكيد أو تغيير الموعد يرجى التواصل معنا.`
- **confirmation:** `تم تأكيد موعدك في {{clinic_name}} يوم {{appointment_date}} الساعة {{appointment_time}}. شكراً لك.`
- **reschedule:** `تم تغيير موعدك في {{clinic_name}} إلى يوم {{appointment_date}} الساعة {{appointment_time}}.`
- **cancellation:** `نأسف، تم إلغاء موعدك في {{clinic_name}} ليوم {{appointment_date}}. للحجز من جديد يرجى التواصل معنا.`
- **noshow_rebook:** `لقد افتقدناك في موعدك بـ {{clinic_name}}. يسعدنا إعادة جدولة موعد جديد لك في أي وقت.`
- **followup:** `نتمنى لك الصحة والعافية بعد زيارتك لـ {{clinic_name}}. إذا كان لديك أي استفسار لا تتردد بالتواصل معنا.`

### English templates — Later (same codes, `language='en'`).

---

## Background job system (P2 automated)

### Generating reminder events
- On appointment `created`/`confirmed`: if reminders enabled and `starts_at − reminder_hours > now`, upsert a `reminders` row (unique on clinic_id+appointment_id+type+channel) and a `reminder_events` row (`scheduled_for`, status `scheduled`).
- Respect **quiet hours**: if `scheduled_for` falls in quiet hours, shift to next allowed time (or skip if too close).

### Processing due events
- Cron every **5–15 min** hits `/api/jobs/process-reminders`.
- Select `status='scheduled' AND scheduled_for <= now()` with `FOR UPDATE SKIP LOCKED` (so concurrent runs don't double-process), limit a batch.
- For each: re-check the appointment is still `booked/confirmed` (not cancelled/rescheduled). If invalid → mark event `cancelled/skipped`.
- Send (email now; WhatsApp API later). On success → `sent` + write `messages` row. On failure → `failed`, increment `attempts`, set `last_error`.

### Idempotency (no double-sends)
- Unique reminder anchor `(clinic_id, appointment_id, type, channel)` means only one event per reminder type.
- Processing locks the row; status flips `scheduled → sent` atomically; a second worker sees it already taken.
- Each `messages` row optionally carries a dedupe key; never send if an equivalent `sent` message exists for the same event.

### Frequency
- Job cadence 5–15 min is plenty for 24h reminders (precision to the minute is unnecessary).

### Failures & retries
- Retry `failed` events with backoff up to N attempts (e.g. 3), then mark terminal `failed` and surface to staff ("couldn't send reminder to X").
- Email bounces recorded via provider webhook (P2).

---

## Cancelling / updating scheduled reminders
- **Appointment cancelled:** in the same transaction, set its pending `reminder_events` to `cancelled`.
- **Rescheduled:** cancel old events, generate new ones for the new time.
- **No-show:** optionally enqueue a `noshow_rebook` message (P2).
- **Status check at send time** is the final safety net: never send a reminder for a cancelled/rescheduled appointment.

---

## Delivery status
- `messages.status`: `queued → sent → delivered → read` (delivered/read only when WhatsApp API/email webhooks available; deep-link sends stop at `sent`).
- Failures captured with `error`; visible in the Messages log per clinic.

---

## Avoiding message fatigue & cost
- Default one reminder; extras opt-in.
- Per-appointment, never send the same type twice.
- Quiet hours (default e.g. 21:00–09:00 Asia/Amman) — no patient messages outside.
- (P2) per-patient daily cap; suppress if multiple appointments same day → one combined message.
- Cost guardrail when API is live: per-clinic monthly message limit (from plan); warn near cap.

---

## Timezone (Asia/Amman)
- Store everything UTC; compute `scheduled_for` and render times via a tz library against the clinic's timezone.
- Quiet hours / "24h before" computed in clinic-local time, then converted to UTC for scheduling.
- Never hardcode +3; use IANA `Asia/Amman` so any future DST/rule change is handled by the library.

---

## Consent & opt-out
- `patients.messaging_consent_status` (default **`unknown`** — never defaulted to consented; values `unknown`/`consented`/`opted_out`). **`opted_out` blocks all reminders.** For `unknown`, warn before messaging per clinic policy. The clinic (controller) is responsible for obtaining consent; consent wording **[LEGAL]**.
- Include a soft opt-out path (e.g. "reply STOP" handling once API exists; for deep links, staff respect requests and toggle consent off).
- Trial/subscription messages go to the **owner** (operational), separate from patient consent.

---

## Logging
- Every send (assisted or automated) writes a `messages` row: who/what/when, rendered body snapshot (clinic data, not platform-visible), channel, status.
- `body_snapshot` contains patient name → treat as clinic-scoped sensitive data, excluded from platform admin default views.

---

## Statuses summary
- `reminder_events`: `pending, scheduled, sent, failed, cancelled, skipped`.
- `messages`: `prepared, opened, marked_sent, sent, delivered, failed, cancelled` (WhatsApp deep links use `prepared→opened→marked_sent`; automated email uses `prepared→sent→delivered/failed`).

## MVP vs later
- **MVP:** assisted WhatsApp deep links + automated email reminder (24h) + templates (Arabic) + message log + cancel-on-cancel.
- **P2:** scheduled automated events + cron processor + quiet hours + retries + reschedule regeneration + follow-up/no-show types.
- **Later:** WhatsApp Business API, SMS, delivery/read receipts, two-way confirmation, per-clinic message limits, opt-out automation.
