# Ayadajo — Analytics & Reporting

Goal: give the **owner** a true, fast picture of the clinic. Keep queries cheap and numbers trustworthy. Financial figures are gated by role and must never be wrong (better to omit than mislead).

All metrics are clinic-scoped and computed in `Asia/Amman` for date bucketing (store UTC, bucket local).

---

## Metric catalog

| Metric | MVP? | How to calculate | Source tables |
|---|---|---|---|
| **Appointments this month** | ✅ | count appointments where `starts_at` in current month (local), status not `cancelled` | appointments |
| **Appointments today** | ✅ | count where `starts_at::date = today` (local) | appointments |
| **New patients (month)** | ✅ | count patients where `created_at` in month | patients |
| **Returning patients (month)** | ✅ | count distinct patients with ≥1 completed appt this month who also have an appt before this month | appointments |
| **Cancelled (month)** | ✅ | count appointments status `cancelled` with `starts_at` in month | appointments |
| **No-show count + rate (month)** | ✅ | no_show count; rate = no_show / (completed+no_show) | appointments |
| **Revenue collected (month)** | ✅ | sum(payments.amount) − sum(reversals) where `paid_at` in month | payments |
| **Outstanding balance (total)** | ✅ | **Σ of issued-invoice balances** (`invoice.balance` across `status in ('issued','partial')`). **Single source of truth = invoices.** Treatment-plan totals are NOT counted here. | invoices, payments |
| **Top services (month)** | P2 | group completed appts by service, count | appointments, services |
| **Doctor workload (month)** | P2 | count/duration of completed appts per doctor | appointments |
| **Follow-ups due** | P2 | treatment_notes/plan items with follow-up flag in window | treatment_notes/plan_items |
| **Upcoming appointments** | ✅ (list) | next N appts `starts_at > now`, not cancelled | appointments |
| **Monthly trends** | P2 | per-month rollups (appts, revenue, new patients) over last 6–12 months | daily/monthly rollups |
| **Trial/subscription status** | ✅ | from subscription | subscriptions |

> **Outstanding-balance source-of-truth (LOCKED):** **outstanding = Σ issued-invoice balances** (`invoice.balance`). Treatment plans show **estimated/planned costs** for clinical planning but **never** define the official outstanding balance. Do **not** compute "outstanding = treatment_plan cost − payments" anywhere — it double-counts. A charge becomes "owed" only when it is on an **issued invoice**. Enforce this single definition in code.

---

## MVP dashboard (cards + one list)
Operational (all staff per role): Appointments today, Appointments this month, New patients, No-show count/rate, Upcoming appointments (list).
Financial (Owner/Manager/Accountant only): Revenue collected (month), Outstanding total.
Banner: trial/subscription status.

## P2 reports
- Monthly summary report (table) + trends chart (appts, revenue, new patients over time).
- Top services, doctor workload, cancellation/no-show trends, follow-ups due.
- **CSV export** (patients, appointments, payments) — audited (who exported what, when).

## Later
- Cohort/retention, revenue by service/doctor, capacity utilization, custom date ranges, scheduled email reports, benchmarking.

---

## Performance / avoiding slow queries
- **MVP:** compute on-the-fly with proper indexes (`(clinic_id, starts_at)`, `(clinic_id, paid_at)`, `(clinic_id, created_at)`). For a single clinic's month, these are small, fast scans.
- **As data grows (P2):** add a nightly rollup table `daily_metrics(clinic_id, date, appts, completed, no_shows, cancelled, new_patients, revenue, ...)` populated by a cron job. Dashboards read rollups for past days + live query only for "today." This keeps dashboards O(days) not O(appointments).
- Never run unbounded cross-clinic analytics on the hot path; Super Admin fleet stats use their own (cached/rollup) path.
- Avoid N+1 (aggregate in SQL, not in app loops).

## Avoiding exposing wrong financial data
- Single, documented definition for "collected" (paid_at in range, minus reversals) and "outstanding" (chosen source).
- Reversals/voids must subtract correctly; never count deleted/void rows.
- Round/display JOD to 2 decimals consistently; compute in numeric, not float.
- Gate all financial metrics by role; doctors/receptionists/assistants never see revenue/outstanding.
- If a metric can't be computed reliably (missing data), show "—" not a misleading 0.
- Timezone correctness: bucket by `Asia/Amman` local date so "this month" matches the clinic's calendar.

## Tables needed
- Core reads: appointments, patients, payments, invoices(+items), treatment_plans(+items), services, subscriptions.
- P2 rollups: `daily_metrics` (optional `monthly_metrics`).
