# Ayadajo — User Roles & Permissions

Principle: **least privilege**, **server-side enforcement**, **fixed roles in MVP**. UI hiding is convenience, never security.

Two enforcement layers on every mutation/sensitive read:
1. **Tenancy:** user is an active member of the resource's clinic (else → 404).
2. **Permission:** the member's role allows the action.

---

## Roles

### Platform (AtlasJo) roles — `users.is_platform_admin = true`
- **Super Admin:** full platform control — create/manage clinics, subscriptions, plans, status, audit. The only role that may change billing/status. Cannot casually read patient medical data (requires support access grant + logging).
- **Support Admin:** operational support — view clinic operational status, message usage, last login; can **request** time-boxed support access to a clinic for troubleshooting (logged). Cannot change billing/plans or delete data.

### Clinic roles — `clinic_members.role`
- **Clinic Owner:** full control of their clinic — everything below + staff management, settings, financials, exports, view audit. The buyer.
- **Clinic Manager:** like Owner minus the most sensitive (cannot remove Owner, cannot transfer ownership, may be restricted from some exports/settings by Owner).
- **Doctor:** clinical — own schedule, patient profiles, treatment notes/plans, mark arrived/completed. Limited financial view.
- **Receptionist:** front desk — patients (CRUD), appointments (full), reminders, payments (record only), booking requests.
- **Accountant:** money — payments, invoices, financial reports/exports. No clinical write.
- **Assistant:** helper — limited view of schedule + patient basics; minimal write (e.g. mark arrived). No financial, no clinical write, no sensitive medical detail.

---

## Permission matrix (MVP)

Legend: ✅ allowed · 👁 view-only · ⚠ limited/own-only · ❌ none.

| Capability | Owner | Manager | Doctor | Receptionist | Accountant | Assistant |
|---|---|---|---|---|---|---|
| View dashboard (operational) | ✅ | ✅ | ⚠ own | ✅ | 👁 | 👁 |
| View dashboard (financial) | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Patients — create/edit | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠ basic |
| Patients — view medical alerts | ✅ | ✅ | ✅ | 👁 | ❌ | ❌ |
| Patients — archive/delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Appointments — full manage | ✅ | ✅ | ⚠ own | ✅ | ❌ | ⚠ mark arrived |
| Treatment notes — write | ✅ | ⚠ | ✅ | ❌ | ❌ | ❌ |
| Treatment notes — view full | ✅ | ✅ | ✅ | 👁 summary | ❌ | ❌ |
| Treatment plans — write/pricing | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Payments — record | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Payments — reverse | ✅ | ⚠ | ❌ | ❌ | ✅ | ❌ |
| Invoices — create/issue | ✅ | ✅ | ❌ | ⚠ | ✅ | ❌ |
| Invoices — void | ✅ | ⚠ | ❌ | ❌ | ✅ | ❌ |
| Reports/exports | ✅ | ⚠ | ❌ | ❌ | ✅ | ❌ |
| Settings (hours/services/profile) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Message templates | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Send reminders | ✅ | ✅ | ⚠ | ✅ | ❌ | ⚠ |
| Booking requests — approve | ✅ | ✅ | ❌ | ✅ | ❌ | ⚠ |
| Staff — invite/remove/role | ✅ | ⚠ (not owner/mgr) | ❌ | ❌ | ❌ | ❌ |
| View audit log | ✅ | ⚠ | ❌ | ❌ | ❌ | ❌ |
| Subscription/billing changes | ❌ (SA only) | ❌ | ❌ | ❌ | ❌ | ❌ |

> The financial vs clinical split is the heart of the model: **Accountant sees money, not clinical detail; Doctor sees clinical, limited money; Receptionist runs the desk; Assistant is a constrained helper.**

---

## Per-role detail

### Clinic Owner
- **See:** everything in the clinic.
- **Create/Edit:** everything.
- **Delete:** archive patients, void invoices, reverse payments, remove staff (not self/last owner).
- **Never access:** other clinics; platform billing internals.
- **Owner-only sensitive actions:** manage staff, change settings, view audit, run exports, edit/configure templates.

### Clinic Manager
- Same as Owner **except:** cannot remove/role-change Owner, cannot transfer ownership; Owner may restrict exports/some settings. All else operational.

### Doctor
- **See:** own schedule, full patient clinical history, treatment notes/plans, basic patient contact.
- **Create/Edit:** treatment notes/plans, mark own appointments arrived/in_progress/completed, add follow-up instructions.
- **Delete:** none (corrections via new notes).
- **Never access:** financial reports, staff management, settings, other doctors' private notes editing (can view).

### Receptionist
- **See:** schedule (all doctors), patient list/contact, today's flow, booking requests, payments they recorded.
- **Create/Edit:** patients, appointments (book/reschedule/cancel/confirm/arrived/no-show), record payments, send reminders, approve booking requests.
- **Delete:** none.
- **Never access:** full clinical notes detail (summary only), financial reports, settings, staff, audit.

### Accountant
- **See:** payments, invoices, financial reports, outstanding balances.
- **Create/Edit:** payments, invoices, reversals, voids; exports.
- **Never access:** clinical notes, settings, staff management.

### Assistant
- **See:** today's schedule, patient name/basic contact, arrival status.
- **Create/Edit:** mark arrived, minimal helper actions.
- **Never access:** clinical detail, medical alerts, money, settings, staff, audit.

---

## Staff lifecycle

### Invite a staff member
1. Owner/Manager enters email + role.
2. System creates `member_invite` (token, expiry), sends email/WhatsApp link.
3. Invitee sets password (new user) or accepts (existing user) → `clinic_member` created `active`.
4. Logged in audit (`member.invite`, `member.accept`).
- Edge: existing account → add membership (no new identity); pending invite re-send/expire.

### Remove a staff member
1. Owner/Manager clicks remove.
2. `clinic_member.status = 'removed'`; **all that user's sessions for this clinic are revoked immediately**; pending invites voided.
3. Their authored data (notes, payments) is retained (attributed to them historically).
4. Logged (`member.remove`). Cannot remove the last Owner.

### Suspend a staff member
- `status = 'suspended'` → cannot log into the clinic, data retained, reversible. Use for "on leave" or "under review." Logged.

### When an employee leaves the clinic
- Remove (or suspend) immediately → access gone, sessions revoked.
- Their historical attribution stays (audit/clinical integrity).
- Reassign any "owned" pending items (e.g. their future appointments stay; their login is dead).
- Review whether they had exports/elevated access (audit log review).

---

## Logging sensitive actions
Write `audit_logs` for: login, member invite/accept/role-change/suspend/remove, payment create/reverse, invoice issue/void, settings change, template change, reminder bulk send, data export, patient/treatment delete/archive, subscription/trial/status change (SA), **and every Super Admin/Support read of clinic data under a support grant.**

---

## AtlasJo support access (privacy-preserving)
- By default, Super/Support Admin dashboards show **operational metadata** (status, counts, dates, message usage) — **not** patient names, notes, or files.
- To view clinic-internal data for support, an admin must create a **support access grant** (`support_access_grants`): pick clinic, enter reason, time-boxed (e.g. 2h).
- While a grant is active, the admin can open a read-only clinic view; **every screen/data load is audited** (`support.access`, with what was viewed).
- Medical notes/files require an explicit higher confirmation and are still logged. Goal: AtlasJo *can* help, but cannot *casually browse* patient health data, and there's always a trail.
- (Later) notify the clinic owner when support access is used.

---

## MVP permission model (recommended)
- **Fixed roles**, matrix encoded in code as the single source of truth, mirrored in `roles/permissions/role_permissions` for documentation/seed.
- Single `can(member, action)` / `authorize(...)` helper called in every server action.
- No custom-role editor.

## Advanced model (later)
- DB-driven permissions with a per-clinic role editor (add `clinic_id` to `roles`).
- Granular per-doctor data visibility settings.
- Field-level permissions (e.g. hide pricing from some staff).
- Approval workflows (e.g. void invoice requires Owner approval).
- 2FA enforcement for Owner + platform admins.
