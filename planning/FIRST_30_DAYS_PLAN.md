# Ayadajo — First 30 Days Plan

> **⬆️ V1 reframe + realistic timeline:** The stack is **already decided ([ADR-001](ADR-001-STACK-AUTH-TENANCY.md): Supabase + RLS)** — Week 1 is *applying* it, not choosing. Production must-haves move into the build: backups + monitoring stand up with the DB (Week 3); onboarding kit + patient import (Week 4).
>
> **Be honest about scope:** **30 days for a solo developer realistically produces a clickable demo + the technical foundations + the first real slice of V1 (auth, RLS multi-tenancy, patients, appointments, today's schedule) — NOT a complete Production-Ready V1.** A full Pilot-Ready V1 (all features + launch blockers: RLS tests, backups+restore, monitoring, 2FA, audit, file attach, legal drafts) realistically needs **~45–60 days** for one developer. **Do not promise a complete production system in 30 days unless you cut scope.** Keep selling + clinic conversations from Day 1 regardless — demand validation does not wait for the build.

A practical month for a solo founder. Theme: **validate demand and build a sellable demo before deep engineering.** Talking to clinics and building the clickable demo run in parallel.

> Anti-goal: spending 30 days building backend nobody has agreed to buy. (See RISK_ANALYSIS R14.)

---

## Week 1 — Validate + foundations
**Talk to clinics (start immediately, don't wait for the demo):**
- Build a target list of **20–30 dental clinics** in Jordan (Instagram, Google Maps, WhatsApp directories, referrals).
- Reach out (Arabic DM/WhatsApp); aim to **book 5+ short calls/visits**.
- Run the clinic/receptionist/doctor questions from `QUESTIONS_AND_ASSUMPTIONS.md`. Listen for: biggest pain, no-show cost, who'd use it, willingness to pay.

**Build/decide:**
- **Apply ADR-001** — create the Supabase project (Postgres + Auth + Storage), wire SQL migrations, confirm brand/domain. (Stack is locked, not a decision.)
- Scaffold the project (Tasks A1–A5, B1): Next.js + TS strict + Tailwind + shadcn/ui, **RTL + Arabic font**, design-system primitives, CI, deploy.
- Decide pricing hypothesis (e.g. 25/month, 250/year, free pilot).

**Validate:** is the core pain real and worth paying for? Who is the daily user?

**By end of week:** project boots (RTL), 3–5 clinic conversations done, target list growing.

---

## Week 2 — Clickable demo (sell tool)
**Build (UI only, mock data — Phase 1):**
- Landing page (Arabic value prop + "request a demo"/WhatsApp CTA).
- Clinic Dashboard (sample cards), **Today's Schedule** (the hero screen), Calendar (static day/week), Patients list + Patient profile, Add appointment modal, Add patient form.
- A glimpse of Treatment note/plan, Payments, Public booking page.
- Make it **believable on a phone and a laptop**, Arabic/RTL.

**Talk to clinics:**
- Continue outreach; **demo the clickable prototype** to the clinics you've reached.
- Record reactions: what excites them, what confuses them, what's missing, would they pilot?

**Validate:** does the demo make a clinic say "I want this / when can I start?"

**By end of week:** a shareable clickable demo + 2–3 demo sessions done.

---

## Week 3 — Real MVP core begins
**Build (Phase 2 start, in order):**
- Database schema + migrations + seed (Tasks C1–C3).
- **Scoped data-access layer + isolation test harness** (C4, E2) — do this *before* features.
- Auth (login, sessions, reset) + tenancy guard + permission helper (D1–D5, E1, F1).
- Clinic creation + settings + working hours/services/doctors (G1–G2).
- Patients CRUD + search + dedupe (H1–H2).

**Talk to clinics:**
- Keep outreach warm; line up **1–2 pilot commitments** for when the MVP is usable.
- Share progress screenshots with interested clinics (keep them engaged).

**Validate:** can a clinic be created and isolated cleanly? Do isolation tests pass?

**By end of week:** auth + tenancy + patients working with passing isolation tests; pilots tentatively lined up.

---

## Week 4 — Make the daily loop real
**Build:**
- Appointments lifecycle + double-book prevention + status history (I1, C2).
- **Today's Schedule** (live) + Calendar day/week (I2, J1).
- Basic dashboard cards (K1–K2).
- Super Admin: create clinic, start trial, record payment, activate, suspend, fleet list (R1–R3, O1–O2).
- Assisted WhatsApp reminder deep link + message log (M3, M2).
- Audit logging on sensitive actions (S1).

**Talk to clinics:**
- Convert one warm lead into a **pilot setup** (create their trial, import a handful of patients, book a few real appointments together).
- Schedule a follow-up to watch them use it.

**Validate:** can one real clinic run a real day (book → arrive → complete → record payment → send reminder)?

**By end of week:** an end-to-end usable slice + one pilot clinic onboarded (or scheduled).

---

## What to build (month summary)
RTL foundation → clickable demo → DB + scoped isolation + tests → auth/tenancy/permissions → clinic/settings → patients → appointments/today/calendar → basic dashboard → super admin lifecycle → assisted reminders + audit.

## What to validate (month summary)
- Is the pain real and payable? (Week 1)
- Does the demo create demand? (Week 2)
- Is isolation airtight? (Week 3)
- Can a real clinic run its day on it? (Week 4)

## Who to talk to
- 20–30 clinics targeted, 5+ conversations, 2–3 demos, 1+ pilot. Owners + receptionists + at least one doctor.

## Demo screens to prepare (priority order)
1. Today's Schedule (hero) 2. Add/book appointment 3. Patient profile 4. Owner dashboard 5. Public booking page 6. Reminder one-click.

## Questions to ask clinics (must-ask five)
1. How do you manage appointments/patients/money today, and what hurts most?
2. How many no-shows/week and what do they cost?
3. Who would use this daily and how tech-comfortable are they?
4. Would you pay monthly? How much is fair?
5. What would stop you from switching?

## How to approach first pilot clinics
- Offer a **free pilot** (1–2 months) in exchange for honest feedback + a testimonial.
- Do the setup *with* them (import patients, book real appointments).
- Check in twice during the pilot; fix blockers fast; watch a receptionist + doctor use it.
- Convert to paid before/at trial end with a clear, simple price.

## How to avoid wasting time
- Don't build features not in the MVP list. Don't polish the demo past "believable."
- Build the scoped data layer + isolation tests **before** features (cheap now, painful later).
- Talk to clinics every week — let reality, not imagination, drive the build.
- Cut anything that delays the first real clinic running its day.
