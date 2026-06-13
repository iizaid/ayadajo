# Ayadajo — Super Admin Plan (AtlasJo)

The control tower AtlasJo uses to run the whole fleet. Separate auth surface from clinics. **Designed so AtlasJo can operate the business without casually seeing patient medical data.**

Access: `users.is_platform_admin = true`, `platform_role ∈ {super_admin, support_admin}`. Separate login route (`/admin`). **2FA is MANDATORY for Super Admin before the first real trial clinic** (Supabase Auth MFA/TOTP) — this surface holds the service-role power, so it must be the best-protected login in the system.

---

## Privacy principle (read this first)
AtlasJo's default views show **operational metadata only** — clinic status, dates, counts, payments, message *usage* (counts, not contents), staff count, last login. They do **not** show patient names, treatment notes, medical alerts, message bodies, or files.

To see clinic-internal data for support, an admin must open a **time-boxed support access grant** (reason required), and **every data view under that grant is audited**. Medical notes/files require an extra confirmation. This is the difference between "AtlasJo can help when asked" and "AtlasJo can snoop." Build it from day one — it's also a trust selling point.

---

## Pages

### 1. Overview Dashboard
- Fleet KPIs: total clinics, by status (trial/active/past_due/read_only/suspended), trials ending in 7 days, renewals due in 7 days, new clinics this month, churned this month, estimated MRR (sum of active plans).
- Operational health: reminder jobs processed/failed, messages sent (counts), error rate.
- Quick links: clinics needing attention (past_due, trial ending, failed messages).

### 2. Clinics List
- Table: clinic name, slug, status, plan, trial/period end, last payment, staff count, last login, message usage (this month), created date.
- Filters: status, plan, ending soon, inactive (no login N days).
- Search by name/slug/owner.
- Action: **Create Clinic**.

### 3. Clinic Details
- **Profile:** name, slug, owner contact, type, timezone, created.
- **Subscription:** status, plan, trial end, period start/end, grace, history.
- **Payments:** `subscription_payments` list (amount, method, reference, date, recorded_by).
- **Usage:** messages this month, storage used, staff count, patients count (count only), appointments count (count only).
- **Activity:** last login, last activity date.
- **Support notes / Internal notes:** free-text admin notes about the clinic (not visible to clinic).
- **Audit:** recent platform actions on this clinic.
- **Actions:** start/extend trial, record payment, activate, change plan, set status, suspend, cancel, **request support access**.

### 4. Create Clinic
- Form: clinic name, slug (auto/edit), owner name/email/phone, plan (default trial), timezone (Asia/Amman), language (ar).
- Creates clinic + owner user + membership + default settings/hours + trial subscription. Sends owner invite. Audited.

### 5. Subscriptions
- Cross-fleet subscription view: all subscriptions with status, plan, period end, grace; bulk-spot trials ending and renewals due.
- Actions per row mirror Clinic Details subscription actions.

### 6. Payments
- All `subscription_payments` across clinics: filter by date/method/clinic; totals (manual MRR/revenue). Export (audited).

### 7. Plans
- Manage `plans` (code, name, price, interval, limits, active). Create/edit/deactivate. Changing a plan's price does not retroactively change active subscriptions (snapshot on activation — note for implementation).

### 8. Audit Logs
- Platform-wide audit view: filter by clinic, actor, action, date. Especially surfaces **support access events** and **status/billing changes**.

### 9. Support Access (the privacy gate)
- List active/expired support grants.
- Create grant: pick clinic, reason, duration (e.g. 1–2h). While active, admin can open a **read-only clinic view**; each data load logged. Medical data needs extra confirm.
- Revoke grant early. (P2: notify clinic owner when used.)

---

## What requires support access vs visible by default

| Data | Default (no grant) | Under support grant |
|---|---|---|
| Clinic status, dates, plan, payments | ✅ visible | ✅ |
| Counts (patients, appts, messages, storage, staff) | ✅ visible (numbers only) | ✅ |
| Last login / activity | ✅ | ✅ |
| Patient names / contacts | ❌ | ✅ (logged) |
| Appointment details (who/when) | ❌ | ✅ (logged) |
| Treatment notes / medical alerts | ❌ | ✅ extra confirm (logged) |
| Message bodies | ❌ | ✅ (logged) |
| Files / images | ❌ | ✅ extra confirm + signed URL (logged) |

---

## Roles within AtlasJo
- **Super Admin:** all of the above, including billing/status/plans and support access.
- **Support Admin:** overview + clinics list + clinic operational details + support access requests; **cannot** change billing/plans/status or delete data. (Lets you add a support hire later without giving away the keys.)

---

## Security for the admin surface
- Separate route group + middleware requiring `is_platform_admin`.
- **Mandatory 2FA for platform admins (Super Admin) — before the first real trial clinic** (not P2). Clinic Owner 2FA = P2.
- All admin mutations audited with actor + IP.
- Cross-tenant reads only via the audited admin path (never the clinic-scoped repo's normal flow).
- Rate-limit + strong session handling; short session lifetime.
- Bootstrap: the first super admin is created via a secure seed/CLI (not a public signup), credentials from env, then rotated.

---

## MVP scope
- Overview (basic KPIs), Clinics list, Create Clinic, Clinic Details (status/subscription/payments/usage/notes), start/extend trial, record payment, activate, set status/suspend, Plans (basic), Audit Logs view, Support Access grant + audited read-only clinic view (at least the gating; the read-only viewer can be minimal).

## Later
- Rich analytics/charts, churn/cohort views, automated dunning, impersonation-with-consent, granular support roles, owner notification on support access, billing gateway reconciliation, multi-admin activity feed.
