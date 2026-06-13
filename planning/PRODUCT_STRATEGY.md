# Ayadajo — Product Strategy

> **Ayadajo by AtlasJo** — A browser-based operating system for modern dental clinics in Jordan.

> **⬆️ V1 reframe (read first):** The product target is now **Production-Ready Core / Pilot-Ready V1** (see [PRODUCTION_READY_V1_SCOPE.md](PRODUCTION_READY_V1_SCOPE.md)). The term **"MVP"** in this document now means only the *smallest technical starting slice* on the way to V1 — **not** the thing we sell. We sell/pilot a version a real clinic can **trust** with real patient data for 14 days. Where this doc says "MVP," read it as "the V1 core" unless it explicitly means the first technical slice.

---

## 1. What Ayadajo Is

Ayadajo is an **internal operating system for dental clinics**. It is the daily control center that the receptionist, doctor, accountant, and owner all open in their browser at the start of the working day and keep open until they close.

It unifies the operational core of a clinic:
- Patients (records, history, contact)
- Appointments + calendar
- Treatment notes and treatment plans
- Payments, invoices, outstanding balances
- Reminders / follow-ups (manual-first, automated-later)
- A public booking page per clinic
- Operational analytics for the owner

It is **multi-tenant SaaS**: one platform, many clinics, each clinic strictly isolated from every other.

AtlasJo (the parent company) operates Ayadajo as a product: it onboards clinics, runs trials, collects payment, and manages the whole fleet from a **Super Admin** dashboard.

## 2. What Ayadajo Is NOT (and must resist becoming)

- **Not a generic CRM.** A CRM models "leads → deals." A clinic models "patients → visits → treatments → balances." The data model is clinic-shaped, not sales-shaped.
- **Not just a booking widget.** Booking is one feature; the value is running the whole day.
- **Not a marketing website builder.** The public booking page is a thin, functional surface, not a CMS.
- **Not an accounting/ERP system.** It records payments and outstanding balances in plain terms. It is not a general ledger; no payroll, no VAT filing, no double-entry. (Export/integrate later, do not rebuild.)
- **Not a medical imaging / PACS system.** It can *attach* an X-ray image as a file. It is not a DICOM viewer.
- **Not an insurance claims engine** (a real Jordan pain point but a Phase-Later rabbit hole — see Risks).
- **Not a national EMR.** No interoperability standards (HL7/FHIR) in MVP. Health-record-grade compliance is later, but privacy discipline starts day one.

> **Strategic guardrail:** every time a feature feels like it belongs to an "is not" category, it is a candidate to *delay or refuse*. The product wins by being the simplest reliable daily tool, not the most complete.

## 3. Why Dental Clinics in Jordan First

**Why dental (vs. general clinics):**
- High-frequency, **repeat-visit** businesses. A treatment plan = many appointments over weeks/months, making follow-ups, reminders, and plans genuinely valuable.
- **No-shows are expensive and common** — a reminder system has obvious, immediate ROI the owner can feel.
- Usually **small (1–4 chairs, 1–6 staff)** and **owner-operated** — the buyer is the user, short sales cycle, one decision-maker.
- Workflows are **standardized enough** to model (book → arrive → treat → note → charge → follow-up) but **specialized enough** that Google Calendar + Excel + WhatsApp feels painful.
- Treatment plans + per-tooth notes give a defensible "built for dentists" wedge that a generic booking app cannot match.

**Why Jordan first:**
- AtlasJo is local: Arabic-first language, local payment habits (CliQ, cash, bank transfer), and native outreach channels (Instagram, WhatsApp).
- The market is **underserved by modern software** — many clinics run on paper books, Excel, and a personal WhatsApp number.
- Small enough to dominate a niche, large enough to matter (thousands of dental clinics in Jordan).
- Manual onboarding + WhatsApp support is feasible at this scale for a solo/small team.

## 4. Main Problems Clinics Face Today

1. **Appointment chaos.** Paper book or shared Google Calendar; double-bookings, lost slots, no clear "today" view.
2. **No-shows and forgotten appointments.** Reminders sent manually (or not at all) from a personal phone.
3. **Scattered patient history.** Notes on paper cards, a notebook, or the dentist's memory — hard to find, easy to lose, impossible to analyze.
4. **Fuzzy money.** "Who still owes us?" has no quick answer. Plans span months; partial payments tracked in a notebook.
5. **No owner visibility.** No reliable answer to "how many patients this month? how much collected? what's outstanding? which doctor is busiest?"
6. **Staff turnover loses knowledge.** When a receptionist leaves, the appointment book and relationships can walk out the door.
7. **WhatsApp overload.** Booking, reminders, and follow-up all in one messy personal inbox with no structure.

## 5. The Business Opportunity

- **Low-friction wedge:** even just "clean appointments + patient records + one reminder" replaces 3 tools (paper book, Excel, manual WhatsApp).
- **Recurring revenue:** monthly/yearly subscription per clinic.
- **Sticky:** once a clinic's patient history and schedule live in Ayadajo, switching cost is high.
- **Expandable:** start dental, expand to other small clinics (derma, physio, beauty) reusing ~80% of the platform.
- **Defensible locally:** Arabic-first, Jordan payment rails, local support, and dental specificity are hard for a foreign generic SaaS to match quickly.

**Rough unit economics to validate (assumptions, not facts):** pricing is defined in **[PRICING_AND_PACKAGING.md](PRICING_AND_PACKAGING.md)** (source of truth) — **Starter 35 / Pro 60 / Plus 95 JOD/month**, hypotheses to validate. With manual onboarding, 30–50 paying clinics is a meaningful solo-founder business; 200+ is a real company. (Pricing **must** be validated with real clinics.)

## 6. Product Positioning

> **"Ayadajo is the browser-based operating system that runs your dental clinic's day — appointments, patients, treatments, and payments in one place, in Arabic, built for Jordan."**

Positioning pillars:
- **Made for dentists in Jordan** (not a translated foreign tool).
- **Simple enough for your receptionist on day one.**
- **One screen for today's schedule.**
- **You finally know your numbers.**

## 7. Target Users

| User | Role in clinic | What they care about |
|---|---|---|
| **Clinic Owner** (often also a dentist) | Buys + decides | Money, no-shows, growth, control, "is my clinic running well?" |
| **Receptionist / front desk** | Heaviest daily user | Speed: book, find patient, mark arrived, send reminder — fast, no friction |
| **Doctor / dentist** | Clinical user | Minimal clicks during busy hours; quick history; quick note |
| **Accountant / owner (money hat)** | Periodic user | Collected vs outstanding, simple reports |
| **Assistant** | Support | Limited helper access |
| **AtlasJo Super Admin** | Operator (you) | Fleet health, trials, subscriptions, support |

## 8. User Personas

**Dr. Layla — Owner-Dentist, 38, Amman.** Owns a 2-chair clinic, one part-time dentist, one receptionist. Runs on paper + a wall calendar. Loses ~3–5 appointments/week to no-shows. Wants monthly numbers but never has time to total them. Not very technical; fluent on Instagram and WhatsApp. **Will buy if:** obviously simple, in Arabic, and her receptionist can use it immediately without a week of training.

**Rama — Receptionist, 24.** Answers the phone, books, reschedules, greets patients, chases payments, sends reminders from her own phone. Overloaded at peak. **Will love it if:** finding a patient takes 2 seconds, booking takes 3 clicks, "today" is one clear screen. **Will reject it if:** it has more fields than her paper book.

**Dr. Omar — Associate dentist, 31.** In 3 days/week. Wants to glance at his day, open a patient, see last treatment, add a 1-line note, move on. **Will ignore it if:** a note takes more than 20 seconds. (A real adoption risk — see Risks.)

**You / AtlasJo operator.** Need to spin up a trial in <2 minutes during a demo, track who's paying, and support clinics over WhatsApp without casually exposing patient medical data.

## 9. Value Proposition

- **For the owner:** "Stop losing money to no-shows and lost records. See your whole clinic on one screen."
- **For the receptionist:** "Book, find, and remind in seconds — no paper, no chaos."
- **For the doctor:** "Open a patient, see their history, add a note — done."
- **For AtlasJo:** "A recurring-revenue product you can sell, demo, and support from your laptop."

One-line: **You finally run the clinic instead of the clinic running you.**

## 10. Main Workflows (the spine of the product)

1. **Daily front-desk loop:** open Today's Schedule → patient calls → search patient (or add new) → book/reschedule → mark arrived → mark done/no-show → (optionally) send reminder/follow-up.
2. **Clinical loop:** doctor opens their day → opens patient → reads history → adds treatment note / updates treatment plan → adds follow-up instruction.
3. **Money loop:** patient pays at desk → payment recorded against the visit/plan → outstanding balance updates → owner sees collected vs pending.
4. **Public booking loop:** patient opens `/book/clinic-slug` → picks reason + time → submits → request lands in clinic's queue → staff approve → patient + staff notified.
5. **AtlasJo loop:** find clinic → demo → create trial → clinic uses 14 days → record manual payment → activate → monitor → renew or suspend.

## 11. MVP Definition (the smallest thing worth selling)

The MVP must let **one real clinic run its actual day** and let **AtlasJo control the account.** Nothing more.

**In MVP:**
- Auth + multi-tenant clinics with strict isolation
- Roles: Owner, Receptionist, Doctor (minimal permission model)
- Patients (add, search, edit, profile, history)
- Appointments + Today's Schedule + simple day/week calendar
- Appointment statuses (booked → confirmed → arrived → completed / no-show / cancelled)
- Double-booking prevention + clinic working hours
- Basic treatment notes (free text per visit) + basic treatment plan (list of planned items with status)
- Payments (record a payment, see outstanding) + simple invoice view
- Simple owner dashboard (this month: appts, new patients, collected, outstanding, no-show count)
- **One** automated/assisted reminder: 24h-before, via **manual WhatsApp deep link** (staff clicks, message pre-filled) + optional email
- Super Admin: create clinic, start/extend trial, mark paid/active/suspended, fleet list, basic per-clinic view
- Trial + subscription **status** gating (trial / active / past_due / read_only / suspended)
- Audit log for sensitive actions
- Arabic-first RTL UI, Asia/Amman timezone

**Explicitly NOT in MVP (see §12).**

> **V1 promotions over the original MVP list (see PRODUCTION_READY_V1_SCOPE.md):** (1) a **minimal secure file attach** (single X-ray/image, private + signed URLs) is now **in V1** — dental trust needs it; (2) reminders are clarified as **assisted WhatsApp deep links + optional automated email** (no automated WhatsApp in V1); (3) production must-haves — **backups + tested restore, monitoring, audit, isolation/permission tests as launch blockers** — are explicit V1 requirements, not "nice to have." Onboard pilots with **Owner/Receptionist/Doctor** roles (others available, not pushed).

## 12. Features to Avoid in the First Version

Delay all of these — they look impressive but delay the first sale:

- Full automated multi-step reminders (24h+2h+10min+"starting soon"). → One reminder only.
- WhatsApp Business API (Meta verification, template approval, BSP cost). → Manual deep links first.
- SMS gateway. → Later.
- Online payment gateway / card processing. → Manual CliQ/cash/bank, recorded by hand.
- Interactive tooth chart / odontogram. → Free-text + simple plan items first.
- Before/after image galleries, DICOM, large file pipelines. → Single basic file attach, later.
- Insurance claims / approvals. → Out of scope for a long time.
- Inventory / stock / lab order tracking. → Later or never.
- Advanced RBAC with custom permission editor. → Fixed role set first.
- Subdomain-per-clinic (`clinic.ayadajo.com`). → Path-based `/book/slug` first.
- English UI / language switcher polish. → Arabic-first; English later.
- Native mobile apps. → Responsive web only.
- Self-serve signup + automated billing. → Manual onboarding + manual payment (a *feature* early: it forces you to talk to every clinic).
- Analytics beyond the core dashboard cards.
- Patient-facing portal/login. → Public booking page only.

## 13. How Ayadajo Expands Beyond Dental (without hurting v1)

Keep the **core platform generic** and the **clinical layer pluggable.**

- **Generic core (reused by any clinic type):** auth, tenancy, staff/roles, patients, appointments, calendar, payments, invoices, reminders, public booking, dashboard, super admin, settings, audit.
- **Vertical layer (dental-specific now):** treatment note structure, treatment plan items, (later) tooth chart, dental services list.

To expand to derma/physio/beauty later: introduce a `clinic_type` and make clinical note/plan templates and the services list **configurable per type** rather than hardcoded. Do **not** build this abstraction now — just *don't hardcode "tooth" into table names or core logic.* Keep dental specifics in clearly separated modules so generalization is a refactor, not a rewrite.

> **Rule:** v1 ships dental-only and hardcoded-enough to be fast. The only concession to the future is naming/boundaries, not abstraction machinery.

## 14. Why Browser-Based Is the Right Fit

- **Zero install** — works on the reception desktop, doctor's laptop, a chairside tablet, and the owner's phone. No IT, no app store, no pushed updates.
- **Instant onboarding** — AtlasJo sends a link during the demo; the clinic is "in" immediately.
- **One codebase, one update** — a solo dev cannot maintain web + iOS + Android.
- **Multi-device by nature** — same live data across desktop/tablet/phone.
- **Easy to demo and sell** — share a screen or a link, not a build.

Trade-off to manage: **clinic internet can be weak** (see Risks). Mitigation: lightweight pages, optimistic UI for the hottest actions, clear save/error states, avoid heavy client bundles.

## 15. How AtlasJo Sells It Through Outreach

High-touch, manual, founder-led — a strength early.

1. **Find:** Instagram (dental clinics post heavily), WhatsApp Business directories, Google Maps, referrals, lead tools (e.g. Findly). Build a target list of Jordan dental clinics.
2. **Reach:** DM/WhatsApp with a short, specific Arabic message ("show your clinic's day on one screen, stop losing no-shows"). Lead with a *clickable demo* link or a 60-sec screen recording.
3. **Demo:** 15-minute screen-share or in-person. Show Today's Schedule, add a patient live, book, send a reminder, show the owner dashboard.
4. **Trial:** create the trial account on the spot (Super Admin, <2 min). 14 days, their real data.
5. **Support during trial:** WhatsApp them, help import a few patients, check in twice.
6. **Convert:** after trial, manual payment (CliQ/cash/bank), AtlasJo marks the account active.
7. **Retain:** monthly check-ins, ship small requested improvements, become indispensable.

**Selling principle:** the product must be demoable *before* it's fully built — hence Phase 1 is a **clickable demo** (UI only) to start conversations and collect feedback while the real MVP is built. Offer pilot pricing/discounts to the first 3–5 clinics in exchange for feedback and a testimonial.
