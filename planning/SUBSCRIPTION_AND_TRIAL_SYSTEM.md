# Ayadajo — Subscription & Trial System

Manual-first billing operated by AtlasJo. No payment gateway in MVP — and that's deliberate (forces direct contact with every clinic, fits Jordan payment habits, zero integration risk).

---

## Clinic statuses (the access gate)

`clinics.status` (mirrored from `subscriptions.status`) drives what a clinic can do:

| Status | Meaning | Access |
|---|---|---|
| `trial` | In 14-day trial | Full access; trial banner with days left |
| `active` | Paid + current | Full access |
| `past_due` | Payment expected/overdue, within grace | Full access + prominent "payment due" banner |
| `read_only` | Grace expired / unpaid | **Read all, write nothing**; "renew to continue" banner |
| `suspended` | Long unpaid / off-boarded | Only a "subscription expired, contact AtlasJo" screen; owner can log in, no data access except export request |
| `cancelled` | Ended | Like suspended; data retained per retention policy, then export/delete |

**Why `read_only` before hard lock:** dental clinics depend on this daily. Abruptly cutting access (losing today's schedule) creates panic and churn-with-anger. `read_only` keeps them able to *see* their data (patients, today's appointments) while clearly blocking new writes — a gentle, fair pressure to pay that preserves goodwill. Recommended path: `active → past_due (grace) → read_only → suspended`.

---

## Status transition rules
```
trial ──(pay)──> active
trial ──(expires, no pay)──> read_only ──(pay)──> active
active ──(period ends, unpaid)──> past_due ──(grace ends)──> read_only ──(long unpaid)──> suspended
any ──(SA action)──> suspended / cancelled / active
read_only/suspended ──(pay)──> active
```
- All transitions are **Super Admin actions** (manual) in MVP, except automatic `trial→read_only` on expiry and `active→past_due` on period end (a daily job flips these; SA confirms).
- Every transition is **audited**.

---

## Trial
- **14 days**, created automatically with the clinic (`trial_ends_at = now + 14d`).
- Full feature access during trial.
- Banner shows days remaining; at ≤3 days, stronger nudge + email to owner.
- On expiry with no payment → `read_only` (not suspended — keep goodwill).
- **Extend trial:** SA sets a new `trial_ends_at` (e.g. +7d) for promising leads. Logged.
- **Pilot specials:** SA can mark a clinic on a `pilot` plan (free/discounted) with a custom end date — for the first 3–5 reference clinics.

---

## Plans (MVP)
- Plans + prices are defined in **[PRICING_AND_PACKAGING.md](PRICING_AND_PACKAGING.md)** (single source of truth): **Starter 35, Pro 60, Plus 95 JOD/month**; yearly ≈ 2 months free; **Pilot** (first 3–5 clinics: free 1–2 months → discounted founder rate). All are **hypotheses to validate** with clinics.
- Plan limits (soft in MVP, enforced later): `max_staff`, `max_messages_month`, `storage_mb`. MVP can leave these null (unlimited) and just track usage.
- Plans live in `plans`; a clinic's `subscriptions.plan_id` points to one.

## Payment methods (Jordan-appropriate)
- **CliQ** (instant bank-to-bank, very common in Jordan) — primary.
- **Bank transfer** — for yearly/larger.
- **Cash** — in person.
- **PayPal** — if available/needed (diaspora/cards).
- **Manual invoice** — AtlasJo issues a simple invoice, clinic pays by any above.
- Online card gateway = **Later** (e.g. once volume justifies a Jordan-supporting PSP).

## Recording a payment & activating
1. Clinic pays (CliQ/transfer/cash). AtlasJo receives confirmation/reference.
2. SA opens the clinic → **Record Manual Payment** (`subscription_payments`: amount, method, reference, date).
3. SA **Activate Subscription**: set plan, `current_period_start = today`, `current_period_end = +1 month/year`, status → `active`. Audited.
4. Clinic banner clears; full access.

## Renewal & period end
- A daily job checks `current_period_end`: if passed and unpaid → `active → past_due` (start grace), and after `grace_until` → `read_only`.
- Before period end (e.g. 7 days), email the owner a renewal reminder; SA also sees upcoming renewals.
- On renewal payment, SA records payment + extends `current_period_end`.

## Grace period
- Recommended **3–7 days** after period end before `read_only`. Configurable per clinic (loyalty/relationship). `subscriptions.grace_until`.

---

## What the clinic sees by status
- **trial:** "Trial — N days left. Contact AtlasJo to subscribe." + how to pay.
- **past_due:** "Payment due — please renew by {date} to avoid interruption."
- **read_only:** "Your subscription has ended. You can view your data but cannot make changes. Renew to continue." (write actions disabled with a clear toast.)
- **suspended:** full-screen "Subscription expired — contact AtlasJo," with a "request my data export" option.

## What AtlasJo sees (Super Admin)
- Per clinic: status, trial end, current period end, last payment, payment history, plan, days-to-renewal, message/storage usage, staff count, last login.
- Fleet: trials ending soon, past_due/read_only list, MRR (manual sum), new clinics, churned.
- Actions: start/extend trial, record payment, activate, set status, change plan, suspend, cancel.

---

## Reminders (operational, to owner — not patient)
- **Trial ending:** at T-3 days and T-0 (email).
- **Subscription renewal:** at period_end-7 and period_end (email).
- **Past due / read_only:** notice on status change (email) + in-app banner.
- These are separate from patient consent/messaging.

---

## Invoice generation (for the clinic's own subscription)
- AtlasJo can generate a simple subscription invoice (PDF/print) for the clinic to pay against, recorded in `subscription_payments`. Distinct from the clinic's patient invoices.

## Plan limits & usage (later enforcement)
- Track `messages` count/month, `files` storage, `clinic_members` count per clinic.
- MVP: display usage; warn near limits. **Later:** block over-limit actions or prompt upgrade.

---

## Gating implementation note (for coding agents)
- A single `assertClinicWritable(clinic)` guard runs in every mutating server action: throws/blocks if status ∈ {`read_only`,`suspended`,`cancelled`}.
- Reads remain allowed in `read_only` (so the clinic still sees its data).
- `suspended` blocks even most reads (except the status screen + export request).
- Status changes (and the daily auto-flip job) are the only places that write `clinics.status`/`subscriptions.status`, kept in sync in one transaction.

## MVP vs later
- **MVP:** trial auto-create + extend, manual payment recording, manual activation, status gating (`read_only` middle state), owner email reminders, daily expiry/grace job.
- **Later:** payment gateway + auto-renew, self-serve upgrade, enforced usage limits, proration, dunning automation, multi-currency.
