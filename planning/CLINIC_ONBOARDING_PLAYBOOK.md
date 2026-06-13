# Ayadajo — Clinic Onboarding Playbook

Onboarding is where trials succeed or die. **Do it WITH the clinic** (don't hand them an empty system). Target: a clinic running its real day within **24–48 hours** of trial start. Keep it under ~45 minutes of the clinic's time.

---

## Information AtlasJo needs from the clinic (collect before/at setup)
- Clinic name (Arabic + any Latin), city/address, clinic phone/WhatsApp, logo (optional).
- Owner name, email, phone.
- Doctors: names, which days they work.
- Staff: receptionist(s)/others to invite (name, email, role).
- Working hours per day (incl. breaks, days closed, Saturday?).
- Services they offer + typical durations + typical prices (or use the dental defaults).
- Whether they want the **public booking** link enabled.
- A sample of their current patient list (Excel/contacts) if they want import.

> Capture this in a short intake form/checklist (WhatsApp or a simple form) so setup is fast.

---

## Clinic setup checklist (AtlasJo does this in Super Admin + Settings)
- [ ] Create clinic (name, slug, owner) → trial 14 days auto-starts.
- [ ] Set clinic profile (phone, address, logo, language = ar).
- [ ] Configure **working hours** (per weekday + breaks; confirm Saturday).
- [ ] Add/confirm **services** (seed dental list; adjust durations/prices).
- [ ] Add **doctors** (clinical members) + their availability/days.
- [ ] Invite **staff** (receptionist as Receptionist, owner as Owner).
- [ ] Configure **appointment default duration**.
- [ ] Configure **public booking** (on/off, request mode).
- [ ] Review/adjust **Arabic message templates** (reminder text).
- [ ] Import or hand-add **initial patients**.
- [ ] Book a **test appointment** + send a **test reminder**.
- [ ] Walk the receptionist + doctor through their daily view.

## Staff setup
- Invite owner (Owner role) and receptionist (Receptionist role). Add a second doctor as Doctor.
- Keep V1 onboarding to **Owner / Receptionist / Doctor** — don't overwhelm with Manager/Accountant/Assistant unless asked.
- Show how to set their password from the invite link.

## Doctors setup
- Add each doctor as a clinical member; set the days/hours they work.
- Confirm how they want to appear in the calendar (one column each).

## Working hours setup
- Enter open/close per weekday, breaks, closed days. **Confirm Saturday** (many dental clinics work Saturdays).
- Times are clinic-local (Asia/Amman).

## Services setup
- Start from a **standard dental services list** (consultation, cleaning, filling, extraction, root canal, crown, whitening, orthodontic visit, implant consult, follow-up).
- Adjust names/durations/prices to the clinic. Keep it short — they can add more later.

## Appointment durations
- Set sensible defaults per service (e.g. checkup 20–30m, cleaning 30m, filling 30–45m, RCT 60m).
- Confirm the clinic's typical slot length for the default.

## Public booking configuration
- Decide with the clinic: enable the `/book/{slug}` link or not (V1 = request mode, staff approve).
- If enabled: share the link for their Instagram bio/WhatsApp; show the **booking requests queue** to staff.
- Set expectations: requests need approval (not auto-confirmed).

## Importing initial patients
- Use the assisted import (see DATA_MIGRATION_AND_IMPORT_PLAN.md): map Name + Phone (required), optional email/DOB/notes.
- **Normalize Jordan phones**; review **duplicate warnings**; preview before commit.
- For messy lists, AtlasJo can do the import for them (white-glove). Don't block the trial on a perfect import — start with the active/recent patients.

## Training the receptionist (≤20 min — the key session)
- Today's Schedule: find it, read it, mark arrived/completed/no-show.
- Search/add a patient; book/reschedule/cancel an appointment.
- Send a WhatsApp reminder (one click).
- Record a payment; print a receipt.
- Approve a booking request.
- Leave a **1-page Arabic cheat sheet** + your WhatsApp for questions.

## Training the doctor (≤10 min)
- "My Day" view; open a patient; read history.
- Add a treatment note fast (<20s); add/update a treatment plan item; mark complete.
- Keep it minimal — doctors won't sit through more.

## Testing the first appointment (do it together)
- Book a real appointment for a real upcoming patient.
- Mark the flow: confirmed → arrived → completed.
- Confirm it shows correctly on Today's Schedule + calendar.

## Testing the reminder workflow
- For a real upcoming appointment, click "WhatsApp reminder," confirm the Arabic message is correct, send it.
- (If email enabled) confirm an email reminder renders correctly.
- Confirm the send is logged in Messages.

## First-day support
- Be reachable on WhatsApp the first day; respond fast.
- Proactively check in after their first real busy session: "كيف كان اليوم على النظام؟"
- Fix any blocker immediately; note recurring confusion for UX fixes.

## End-of-trial check-in
- Around day 10–11: review **their** numbers with them (appointments, no-shows, collected, new patients).
- Ask what worked / what's missing; address objections.
- Present the plan + price; offer yearly; share payment details.

## Conversion to paid account
- Clinic pays (CliQ/transfer/cash) → AtlasJo records payment (`subscription_payments`) → activates subscription (status `active`, set period).
- Send a subscription receipt; confirm the banner cleared.
- Schedule a light follow-up in 2–4 weeks; ask for a testimonial/referral once they've had a win.

---

## Onboarding success criteria
- Clinic ran ≥1 real day on Ayadajo within 48h.
- Receptionist can book + remind without help.
- ≥20–50 real patients in the system.
- At least one real reminder sent.
- Owner has seen their dashboard numbers.
