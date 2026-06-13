# Ayadajo — Demo Dataset & Seed Plan

Two distinct needs: (1) a **seed** for local/dev and a new clinic's baseline config, and (2) a **realistic demo dataset** for selling. **Never use real patient data in demos or non-production environments.**

---

## 1. Baseline seed (every environment / new clinic)
Minimum data so the app is usable out of the box:
- **Plans:** Starter / Pro / Plus / Pilot (from PRICING_AND_PACKAGING.md).
- **Permissions + roles + role_permissions:** the fixed role matrix (USER_ROLES_AND_PERMISSIONS.md).
- **Platform super admin:** bootstrapped via secure seed/CLI (credentials from env, not committed), **MFA set up before first trial clinic**.
- **Default dental services list** (per new clinic): consultation, cleaning/scaling, filling, extraction, root canal (RCT), crown, whitening, orthodontic visit, implant consult, follow-up — each with a default duration + placeholder price (clinic edits).
- **Default working hours:** a sensible Sun–Thu (+ Sat configurable) template the clinic adjusts.
- **Default Arabic message templates:** reminder_24h, confirmation, reschedule, cancellation, noshow_rebook, followup.

> The seed creates *config*, not patients. Real clinics start with **zero patients** (clean slate) + import their own (DATA_MIGRATION_AND_IMPORT_PLAN.md).

## 2. Demo dataset (sales/demos only)
A believable **fake clinic** to make demos feel real. Synthetic, clearly fictional, Arabic.

Contents:
- **One demo clinic** ("عيادة الابتسامة — تجريبي" or similar), on a trial, with logo + hours + services.
- **Staff:** 1 owner-dentist, 1 associate doctor, 1 receptionist (fake accounts).
- **~30–60 fake patients** with realistic Jordanian names + **fake but format-valid** phone numbers (use a reserved/clearly-fake range; never a real person's number).
- **Appointments across "today" + this week:** a full Today's Schedule — some booked, confirmed, arrived (waiting), completed, one no-show, one cancelled — so every status renders.
- **A few treatment notes + a treatment plan** with items/prices/status.
- **A few payments + one issued invoice/receipt** showing an outstanding balance (from invoices, per the locked rule).
- **A couple of public booking requests** in the queue.
- **A couple of prepared/marked_sent WhatsApp message logs** (so the messages screen isn't empty).

Design so the **demo script** (DEMO_SCRIPT.md) flows: open Today's Schedule → add a patient → book → patient profile → reminder → owner dashboard with non-zero numbers.

## 3. How it's generated
- A **seed script** (`supabase/seed` or a `scripts/seed-demo.ts`) idempotently creates the demo clinic + data, tagged so it can be wiped/recreated.
- "**Reset demo**" command restores the demo clinic to a clean, known state before each demo (so a previous demo's edits don't confuse the next).
- Time-relative data: appointments anchored to "now" (e.g. today ± a few days) so the demo always shows a populated *today*, not a stale date.

## 4. Hard rules
- **No real patient data** anywhere except production clinics' own tenants.
- Demo phone numbers must be **fake/reserved** — never message them; demo consent statuses set so nothing auto-sends.
- The demo clinic lives in **staging/its own tenant**, never mixed with a real clinic's data (RLS keeps it isolated anyway).
- Demo data is obviously fictional (names/labels) to avoid any impression it's real.
- Seed scripts contain **no secrets**; admin bootstrap creds come from env.

## 5. Refresh & maintenance
- Keep the demo dataset current as features land (e.g. when file attach ships, add a sample X-ray placeholder image — a fake image, not a real patient's).
- Re-anchor dates before a demo (reset command).
- Keep a **backup screen recording** of the ideal demo in case of live issues (DEMO_SCRIPT.md).
