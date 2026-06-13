# Ayadajo — Questions & Assumptions

Planning proceeded on the assumptions below. **Do not block building on open questions** — the assumptions are reasonable defaults; revise as real answers arrive.

---

## Assumptions made (defaults used in planning)
1. **Buyer = clinic owner**, often also a practicing dentist; small clinics (1–4 chairs, 1–6 staff).
2. **Pricing (source of truth = [PRICING_AND_PACKAGING.md](PRICING_AND_PACKAGING.md)):** Starter **35**, Pro **60**, Plus **95** JOD/month; yearly ≈ 2 months free; Pilot (first 3–5 clinics) free 1–2 months → discounted founder rate. **Hypotheses to validate with clinics.** (Earlier "20–40 JOD" figures are superseded.)
3. **Manual onboarding + manual payment** (CliQ/cash/bank) at first; no gateway.
4. **Arabic-first, RTL**, English later. Currency **JOD**. Timezone **Asia/Amman**.
5. **Work week configurable** per clinic (Sun–Thu or includes Sat) — dental clinics often work Saturdays.
6. **Request-mode** public booking (not instant) for MVP.
7. **One 24h reminder** by default; WhatsApp via **manual deep links** first.
8. **Multi-tenant = shared DB + `clinic_id`**; isolation **enforced primarily by Supabase RLS** (DECIDED — [ADR-001](ADR-001-STACK-AUTH-TENANCY.md)), with app `authorize()` as second layer.
9. **Patients do not log in** (no patient portal); only a public booking page.
10. **AtlasJo is the data processor; the clinic is the controller** of patient data (for DPA framing).
11. **Treatment notes are free-text** in MVP (no tooth chart yet).
12. **One clinic = one location** in MVP (multi-branch later).
13. **Outstanding balance** computed from **issued invoices** (single source of truth).
14. **Solo developer / very small team**, leaning on AI coding agents.
15. Hosting/data may sit outside Jordan (Vercel/Neon) — **data residency to be confirmed** [LEGAL].

---

## Questions for you (founder) — answer when you can
- Final **pricing** and packaging (monthly/yearly, pilot discount, per-staff or flat)?
- **Brand/domain** confirmed (`ayadajo.com`, `app.ayadajo.com`)? Logo/colors?
- ~~Which stack fork?~~ **DECIDED — Supabase + RLS ([ADR-001](ADR-001-STACK-AUTH-TENANCY.md)).** No longer open.
- How many **pilot clinics** can you realistically support at once?
- Do you have a **Jordanian lawyer** lined up for Privacy Policy/ToS/DPA?
- Your **CliQ/bank** details for receiving subscription payments?
- Do you want a **Support Admin** seat from the start, or just you (Super Admin)?
- Appetite for **data residency** constraints (host in-region) vs convenience (Vercel/Neon)?

## Questions for real dental clinics (validate demand)
- How do you currently manage appointments, patients, and payments? What's the most painful part?
- How many no-shows per week, and what do they cost you?
- Who would use this daily (receptionist? you?) and how tech-comfortable are they?
- Would you pay monthly for this? How much feels fair?
- What would make you *not* switch from your current way?
- Do you already send reminders? How (personal WhatsApp)? Would one-click help?
- Do you need treatment plans / per-tooth notes, or mainly scheduling + money?
- Do you handle insurance? How important is that to you? (Gauge the rabbit hole.)
- Do patients ask to book online? Would a booking link (Instagram bio) help?

## Questions for receptionists
- Walk me through a typical busy hour. Where do you lose the most time?
- How do you find a returning patient today?
- What information do you need on screen when a patient walks in?
- What would make a tool *faster* than your current paper/Excel?
- What fields are essential vs annoying when adding a patient/appointment?

## Questions for doctors
- During a busy day, how much time will you give to entering a note? (Seconds.)
- What do you need to see instantly when you open a patient?
- Do you want a tooth chart, or is free text + a plan list enough at first?
- Who actually writes notes — you, an assistant, the receptionist?

## Questions about pricing/business
- Flat per-clinic or per-staff/per-chair? Annual discount size?
- One-time onboarding/setup fee, or free to reduce friction?
- Pilot terms (free months) in exchange for feedback + testimonial?
- Expected trial→paid conversion you'd be happy with?

## Questions about WhatsApp / SMS
- Are clinics okay starting with **manual** one-click WhatsApp (no automation)?
- Is automated WhatsApp (paid API) worth it at your price point, and when?
- Is SMS needed at all, given WhatsApp ubiquity in Jordan?
- Patient consent norms for messaging — what do clinics already do?

## Questions about legal / privacy [LEGAL — confirm with a Jordanian lawyer]
- Jordan Personal Data Protection Law obligations for **health data** specifically?
- Required **medical record retention** period?
- **Data residency** requirements (must patient data stay in Jordan)?
- Breach **notification** obligations and timelines?
- **DPA** content expectations (processor/controller, sub-processors)?
- **VAT / e-invoicing** rules for AtlasJo's subscription billing and for clinic-issued patient invoices?
- Consent requirements for **messaging** patients (WhatsApp/SMS/email)?

## Questions about payment methods in Jordan
- Is **CliQ** acceptance set up for AtlasJo to receive subscriptions?
- Do clinics prefer monthly CliQ vs yearly bank transfer?
- Is PayPal needed (diaspora/card payers)?
- When (if ever) is a card gateway worth integrating, and which PSP supports JOD well?

---

> **Principle:** every assumption above is a hypothesis to test cheaply (a 15-minute clinic chat), not a fact. Update this file as answers come in; flag any change that affects architecture (especially the stack fork and legal/data-residency).
