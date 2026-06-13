# Ayadajo — Appointments & Calendar

The operational heart of the product. Receptionist speed is the #1 success metric. Times stored UTC, rendered in `Asia/Amman`.

---

## Appointment status lifecycle

```
booked ──confirm──> confirmed ──arrive──> arrived ──start──> in_progress ──complete──> completed
   │                    │                    │
   ├── cancel ──────────┴────────────────────┴──> cancelled
   └── (time passes, patient absent) ──────────────> no_show
```

- **booked:** created, not yet confirmed by patient.
- **confirmed:** patient acknowledged (via reply or staff confirmation).
- **arrived:** patient is at the clinic (waiting room).
- **in_progress:** in the chair (optional; useful for waiting-room flow).
- **completed:** treatment done.
- **cancelled:** called off (reason recorded). Terminal.
- **no_show:** patient didn't come. Terminal (but can spawn a reschedule).

Every transition writes `appointment_status_history` (from, to, by, reason, at).

---

## Core actions

### Create appointment
- Inputs: patient (existing or quick-add), doctor, service (sets default duration/price), date, start time, duration, optional note.
- Server: validate patient+doctor belong to clinic; compute `ends_at`; check working hours; check no overlap for that doctor; insert + status `booked` + history.
- Speed UX: from calendar empty-slot click (pre-fills doctor/time) or from patient profile.

### Edit appointment
- Change service/note/duration; if time/doctor changes → treat as **reschedule** (keeps history + may affect reminders).

### Reschedule
- Move to new time/doctor; validate hours + overlap; write history (`reason='reschedule'`); **cancel existing scheduled reminder_events and regenerate** for the new time.

### Cancel
- Require/record `cancel_reason`; status → cancelled; **cancel pending reminder_events**; free the slot.

### Confirm
- Mark confirmed (manual by staff, or later via patient reply); does not change time.

### Arrival / No-show / Complete
- `markArrived` (sets arrived, timestamps), `markInProgress`, `markCompleted`, `markNoShow`. No-show may offer "send reschedule message."

---

## Preventing double-booking
- **App-level (always):** in the create/reschedule transaction, query overlapping non-cancelled/non-no_show appointments for the same `doctor_member_id` where `tstzrange(starts_at, ends_at) && new range`; if any → reject with a clear conflict message + show the conflicting slot.
- **DB-level (recommended):** a Postgres `EXCLUDE USING gist` constraint on `(doctor_member_id, tstzrange(starts_at, ends_at))` filtered to active statuses — guarantees correctness even under concurrent requests (two receptionists booking the same slot).
- Walk-ins/emergencies may override with an explicit "double-book anyway" confirmation (logged) — but default is hard-block.

---

## Multiple doctors
- Calendar shows one column per active clinical member (doctor). Receptionist picks the doctor when booking.
- Filter to a single doctor for dense schedules.
- Each doctor has `doctors_availability` (weekday windows); booking outside a doctor's availability warns (soft) while booking outside clinic hours blocks (hard) — configurable.

## Working hours & breaks
- `working_hours` per weekday (open/close, optional break, is_closed).
- Booking outside open hours or during a break → blocked (with override option for staff).
- Calendar shades closed/break times.

## Emergencies & walk-ins
- "Walk-in" quick action: quick-add patient + immediate appointment (`source='walk_in'`, often status `arrived` directly).
- Emergencies may double-book with explicit confirmation (logged).

## Late patients
- If a patient is late, staff keep them `confirmed/arrived`; no auto-no-show. A configurable "grace" only affects suggestions, never auto-changes status (avoid surprising staff).

## Waiting room flow
- Today's Schedule highlights `arrived` patients in a "waiting" group, ordered by arrival/appointment time, so the doctor sees who's next. `in_progress` shows who's in the chair. This is the chairside value.

---

## Views

### Today's Schedule (the workhorse — default landing for reception)
- Chronological list of today's appointments with: time, patient (clickable), doctor, service, status, quick actions (confirm/arrived/complete/no-show/remind).
- Grouped sections: Upcoming · Waiting (arrived) · In progress · Done · No-show/Cancelled.
- Big, fast, few clicks. Search bar always visible.

### Day view (calendar)
- Time grid, doctor columns, appointments as blocks; click empty slot → new appointment.

### Week view
- 7-day grid (respecting Jordan work week — Sun–Thu typical, but **configurable per clinic** since dental clinics often work Sat); per-doctor selectable.

### Month overview — Later
- High-level density/counts; not MVP.

---

## Edge cases (and required handling)

| Edge case | Handling |
|---|---|
| Patient books a slot that becomes unavailable (public request) | Request mode: staff resolve at approval; on approve, re-check overlap and offer nearest free slot if taken. |
| Doctor unavailable (sick/leave) | Mark availability off; existing appointments flagged for reschedule; booking blocked for that window. |
| Clinic closed (holiday) | Holiday/closed day blocks booking; existing appointments flagged (no auto-cancel). |
| Appointment cancelled after reminders scheduled | Cancel pending `reminder_events` immediately in the cancel transaction. |
| Appointment rescheduled after a reminder was already sent | Regenerate reminders for new time; optionally send a "rescheduled" message; don't resend the stale one. |
| Patient has unpaid balance | Show a non-blocking balance badge on the appointment/patient; never block care; let staff decide. |
| Patient has multiple appointments | Patient profile lists all; reminders are per-appointment; avoid merging messages confusingly. |
| Receptionist creates a duplicate patient | Phone-match warning at create ("possible duplicate — open existing?"); merge tool is P2. |
| Internet drops mid-edit | Optimistic UI + client-side draft retained; idempotency key on create so retry doesn't double-book; clear "couldn't save, retry" state. |
| Two staff book the same slot simultaneously | DB exclusion constraint rejects the second; app shows conflict, suggests next slot. |
| Timezone/DST | Always compute via tz library against `Asia/Amman`; store UTC; never hardcode +3 offset. |
| Overlapping/back-to-back appointments | Allowed for different doctors; same doctor blocked; render clearly. |

---

## MVP scope
- Create/edit/reschedule/cancel/confirm/arrived/no-show/complete + status history.
- Double-book prevention (app + DB constraint).
- Working-hours enforcement.
- Today's Schedule + Day + Week views, per-doctor columns.
- Walk-in quick action.

## Later
- Month overview, drag-to-reschedule, recurring appointments, chair/room resources, doctor leave/holiday calendars, auto-suggested next slot, SMS/WhatsApp two-way confirmation, capacity analytics.
