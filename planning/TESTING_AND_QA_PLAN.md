# Ayadajo — Testing & QA Plan

A production-minded test strategy. **Tenant isolation tests and permission tests are mandatory launch blockers** — V1 does not ship to a real clinic if they fail.

Test pyramid: many **unit** tests, focused **integration** tests, a few critical **E2E** tests, plus targeted **security** and **manual** QA.

---

## 1. Unit tests
- Pure logic: phone normalization (Jordan), money/outstanding calculations, date/timezone (Asia/Amman) conversions, template rendering (variable whitelist), permission matrix (`can(role, action)`), status-transition validators (appointment/subscription), invoice numbering/totals.
- Fast, no DB; run on every commit.

## 2. Integration tests (with a test DB)
- Server actions through the **scoped data layer**: create/edit patients, appointments, payments, notes, plans, invoices — verifying `clinic_id` is enforced and side effects (status history, audit rows) happen.
- Subscription lifecycle: trial create/extend, record payment, activate, status sweeps.
- Reminder event generation + cancellation on appointment cancel/reschedule.
- Public booking request → approval → appointment creation (with overlap re-check).

## 3. E2E tests (Playwright, a few critical flows)
- **Daily loop:** login → Today's Schedule → add patient → book → arrive → complete → record payment → send reminder.
- **Public booking:** submit request → staff approve → appointment appears.
- **Auth:** login, forgot/reset, invite/set-password, logout.
- **Super Admin:** create clinic → start trial → record payment → activate → suspend.
- Run on RTL/Arabic UI; check key screens render correctly.

## 4. Manual QA
- Exploratory testing of new features each release.
- Real-device checks (reception desktop, doctor tablet, owner phone).
- Arabic copy review (no broken strings, correct RTL, correct numerals).
- "Weak internet" check: throttle network, verify save/retry/optimistic states.

## 5. Security tests
- Authz: every mutation rejects unauthorized roles (drive from the permission matrix).
- AuthN: rate limiting on login/reset; session revocation on member-remove/password-reset; no user enumeration; password hashing.
- Input: Zod rejects malformed/unknown fields; injection attempts on search/booking are neutralized; XSS payloads in patient/booking fields render as text.
- File access: a signed URL expires; a user from clinic B cannot fetch clinic A's file; no public medical URLs.
- Secrets/logs: no PHI or secrets in logs/Sentry (scrubbing verified); generic error messages; 404 (not 403) on cross-tenant.
- Cron/job endpoints reject calls without the secret.

## 6. RLS tenant isolation tests — **MANDATORY LAUNCH BLOCKER** (ADR-001)
- For **every** tenant table: seed clinic A + clinic B; authenticate as a **normal clinic-A user** (RLS in force via the user-scoped Supabase client); assert A cannot **read, list, search, update, or delete** any of B's rows (returns nothing / rejected).
- **Assert RLS blocks cross-tenant even when the app omits a `clinic_id` filter** — the database is the guarantee, prove it.
- Assert every tenant table actually has **RLS ENABLED + policies** (a test that fails if any tenant table lacks RLS).
- Assert composite-FK / cross-clinic references are rejected (a clinic-A appointment cannot reference a clinic-B patient/doctor).
- **Assert the service-role client is not used in any clinic-user code path** (see §6b) and that Super Admin cross-tenant reads occur only via the audited admin path (and are logged).
- **CI-blocking. A failure stops the release.**

## 6b. Service-role boundary test — **LAUNCH BLOCKER**
- Lint/test fails if `lib/supabase/admin.ts` (service role) is imported anywhere outside Super-Admin/job code.
- Assert the service-role key is never bundled to the client.

## 7. Permission tests — **MANDATORY LAUNCH BLOCKER**
- For each role × each sensitive action: assert allowed/denied per USER_ROLES_AND_PERMISSIONS.md matrix.
- Financial vs clinical split verified (Accountant can't write clinical; Doctor can't see revenue; Receptionist can't void invoices; Assistant minimal).
- Subscription gating: `read_only` blocks writes/allows reads; `suspended` blocks all but status screen.
- **CI-blocking.**

## 8. Appointment conflict tests
- Booking/rescheduling into an overlapping slot for the same doctor is rejected (app-level).
- Booking outside working hours blocked (with staff override path tested).

## 9. Appointment race-condition tests
- Two concurrent bookings for the same doctor+slot → exactly **one** succeeds (DB exclusion constraint), the other gets a clean conflict error.
- Idempotency: retrying a create (same idempotency key) does not double-book.

## 10. Public booking abuse tests
- Rate limit enforced (per IP + per phone); honeypot rejects bots.
- Duplicate/double submit deduped.
- Malicious input sanitized; no data leakage about other patients/availability.
- Booking disabled / suspended clinic → safe behavior.

## 10b. WhatsApp assisted-send status tests
- Generating a `wa.me` link creates a `messages` row with `status='prepared'` (never `sent`).
- Opening the link sets `opened`; **status only becomes `marked_sent` after an explicit staff confirmation** (with `marked_sent_by`/`marked_sent_at`).
- Assert no code path auto-marks a WhatsApp deep link as `sent`/`delivered` on click.
- `opted_out` (or `unknown` per policy) patients: reminder action is blocked/warns.

## 11. Reminder idempotency tests
- Same reminder (appointment+type+channel) is never sent twice.
- Concurrent job runs don't double-process (SKIP LOCKED).
- Failed sends retry with backoff up to N, then terminal `failed`.

## 12. Reminder cancellation tests
- Cancelling an appointment cancels its pending reminder_events.
- Rescheduling regenerates events for the new time; stale events never send.
- Quiet-hours: no patient message scheduled/sent inside quiet hours.

## 13. Subscription gating tests
- trial→read_only on expiry; active→past_due→read_only via sweep; activation restores writes.
- Mid-edit status change blocks the save with a clear message.

## 14. Payment correctness tests
- Outstanding = issued invoice balances (single source); reversals subtract correctly; voids excluded.
- Money is numeric (no float drift); JOD 2-decimal formatting; per-clinic invoice numbering has no gaps that leak / no cross-tenant collision.

## 15. Audit log tests
- Sensitive actions (payment, invoice void, member/role change, settings, subscription/status, deletes, exports, support access) each write an audit row.
- Audit rows contain **no PHI**; append-only (no update/delete path).

## 16. File access tests
- Upload type/size limits enforced; private storage; download only via signed URL after authz; cross-tenant fetch denied; access under support grant audited.

## 17. Arabic / RTL UI tests
- All V1 pages render RTL correctly (mirrored layout, icons, calendars).
- No hardcoded strings (i18n keys); Arabic copy present and correct.
- Bidi correctness for Latin names/phones inside Arabic text.

## 18. Mobile / tablet checks
- Reception desktop, doctor tablet, owner phone: key flows usable; touch targets adequate; Today's Schedule + booking + patient profile work one-handed on phone.

## 19. Browser compatibility
- Latest Chrome, Safari, Firefox, Edge; iOS Safari + Android Chrome. Verify RTL + date/time inputs + WhatsApp deep links open correctly.

---

## Pre-launch QA checklist (gate before a real clinic)
- [ ] **RLS** isolation tests green (every table, under a normal user session) — **blocker**
- [ ] RLS enabled on every tenant table; service-role boundary test green — **blocker**
- [ ] WhatsApp assisted-send never auto-marks `sent` (status test green)
- [ ] Permission tests green — **blocker**
- [ ] Appointment conflict + race tests green
- [ ] Auth/session-revocation tests green
- [ ] Subscription gating tests green
- [ ] Payment correctness tests green
- [ ] Reminder idempotency + cancellation tests green
- [ ] Public booking abuse tests green
- [ ] File access/security tests green
- [ ] Audit log tests green
- [ ] No PHI in logs/Sentry verified
- [ ] Backup enabled + one tested restore documented
- [ ] Arabic/RTL verified on all V1 pages
- [ ] Mobile/tablet + cross-browser smoke passed
- [ ] E2E daily-loop passes
- [ ] Monitoring + health check + uptime live

## CI policy
- Unit + integration + isolation + permission tests run on every PR; **isolation & permission failures block merge.**
- E2E on main/pre-deploy. Security checks in CI where automatable; manual security pass before first clinic.
