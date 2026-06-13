# Ayadajo — Public Booking System

A per-clinic public page where patients request appointments. **Highest-risk surface** (unauthenticated, public). Arabic-first, mobile-first.

URL (MVP): `ayadajo.com/book/{clinic-slug}` (path-based).
Later: `{clinic-name}.ayadajo.com` (subdomains) — not MVP.

---

## Why "request mode" (not instant confirm) for MVP

**Recommendation: request mode.** A public submission creates a `public_booking_request`, NOT a confirmed appointment. Staff approve it.

Why request mode is safer early:
- No public write directly into the live calendar → no spam appointments, no slot-locking abuse.
- Staff stay in control of their schedule (clinics are protective of this).
- Tolerates imperfect availability logic (no need for perfect real-time slot math on day one).
- Easy to reason about security: the public can only create a low-privilege request row.

Instant-confirm is a P2 upgrade once availability logic and anti-abuse are proven.

---

## Public booking page UX (flow)

1. **Clinic header:** name, logo, location, phone (from clinic profile). Arabic, RTL.
2. **Select reason / service:** dropdown of active `services` (or a generic "general checkup"). Optional.
3. **Select doctor (if enabled):** optional; "no preference" default.
4. **Select date & time:** calendar limited to clinic working hours + (P2) actual free/busy. MVP: show working-hour time slots for the chosen day; don't reveal other patients or exact busy details beyond free/busy.
5. **Patient details form:** full name (required), phone (required, Jordan validation), email (optional), notes (optional).
6. **Anti-spam:** honeypot field + rate limit; CAPTCHA only if abuse appears.
7. **Submit → confirmation screen:** "We received your request — the clinic will confirm shortly." Shows requested date/time + clinic contact.

Keep it to **one short screen** on mobile. Minimal fields. Big buttons. Arabic.

---

## Booking request vs instant confirmation
- **MVP (request):** submit → `public_booking_request` (status `pending`) → staff approve → creates real `appointment` (re-checking overlap) → patient + staff notified.
- **P2 (instant):** for clinics that opt in, a submission directly creates a `booked` appointment in a truly free slot (with strong validation + OTP).

## Staff approve / reject flow
- New requests appear in a **Booking Requests** queue (badge/notification).
- For each: see details, see the requested slot's availability, **Approve** (→ creates appointment, optional confirmation message) or **Reject** (optional reason → optional message) or mark **Spam**.
- On approve, re-validate working hours + double-book; if the slot is now taken, prompt staff to pick the nearest free slot before confirming.

---

## Security & abuse prevention

| Threat | Mitigation |
|---|---|
| Spam submissions | Honeypot hidden field; per-IP + per-phone rate limit (e.g. ≤3 requests/phone/day, ≤10/IP/hour); CAPTCHA (Turnstile/hCaptcha) when thresholds tripped. |
| Slot-locking / DoS of calendar | Request mode never locks the calendar; requests are cheap rows; cap pending requests per clinic/day. |
| Data harvesting (availability/patients) | Never expose patient data; only show free/busy at coarse granularity; don't confirm whether a phone is a known patient. |
| Duplicate submissions | Debounce submit; dedupe identical (phone+slot) pending requests within a short window. |
| Fake phone numbers | Jordan phone validation (`07XXXXXXXX` / `+9627XXXXXXXX`); OTP verification = P2. |
| Injection/XSS | Validate + sanitize all inputs (Zod); render as text; no HTML from public input. |
| Enumeration of clinics | Unknown slug → generic 404; reserved slugs blocked. |

- **Rate limiting** at the edge (middleware) keyed by IP + a sliding window; stricter for the submit action.
- **CAPTCHA strategy:** start without it (friction hurts conversion); add Cloudflare Turnstile (low-friction) automatically when abuse detected, or always-on if a clinic is targeted.
- **OTP verification (P2):** SMS/WhatsApp OTP to confirm the phone before the request is accepted — strongest anti-abuse, but adds cost/friction; defer.

---

## Respecting availability
- Only offer days/times within `working_hours` (and not on closed days/holidays).
- (P2) subtract already-booked slots (free/busy) for the chosen doctor/clinic so patients don't request obviously-taken times.
- Block past datetimes and beyond a max horizon (e.g. 60 days).

---

## Notifications
- **Staff:** in-app badge + (P2) email/WhatsApp ping on new request.
- **Patient:** on submit → confirmation screen; on approve → confirmation message (WhatsApp deep link the staff sends, or automated email); on reject → optional message.

---

## Arabic-first UX
- RTL layout, Arabic labels/validation messages, Eastern-or-Western Arabic numerals per preference (default Western for phone clarity).
- Date/time pickers localized; week starts per clinic config.
- Short, friendly, mobile-optimized copy.

---

## Edge cases
- Booking disabled for clinic → page shows "online booking not available, please call" + clinic phone.
- Clinic suspended/read_only → public page hidden or shows contact-only.
- Requested slot taken by approval time → staff pick nearest free slot.
- Patient already exists (same phone) → on approval, link request to existing patient (dedupe), don't create a duplicate.
- Closed day/holiday selected → blocked client + server.
- Very long notes / weird unicode → length caps + sanitize.

---

## MVP scope
- Public page per slug, service/date/time/details, request mode, confirmation screen, anti-spam basics (honeypot + rate limit), staff approval queue, working-hours respect, patient dedupe on approve.

## Later
- Free/busy real-time slots, instant-confirm mode, OTP verification, subdomains, doctor selection with availability, multi-language, embeddable widget for clinic's own website/Instagram link.
