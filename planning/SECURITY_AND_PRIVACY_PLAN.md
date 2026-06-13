# Ayadajo — Security & Privacy Plan

> **⬆️ V1 reframe:** For **Production-Ready Core / Pilot-Ready V1**, the following are **hard launch blockers** (not aspirations): tenant isolation tests + permission tests green in CI; session revocation on offboarding; subscription gating; private files via signed URLs; **no PHI in logs** (enforced + tested); audit logging; **backups + one tested restore**; monitoring live. See [LAUNCH_READINESS_CHECKLIST.md](LAUNCH_READINESS_CHECKLIST.md) Gate 3, [TESTING_AND_QA_PLAN.md](TESTING_AND_QA_PLAN.md), [INCIDENT_RESPONSE_PLAN.md](INCIDENT_RESPONSE_PLAN.md), and [OBSERVABILITY_AND_BACKUP_PLAN.md](OBSERVABILITY_AND_BACKUP_PLAN.md). Legal pack drafted now, **lawyer-reviewed before the first PAID clinic** ([LEGAL_AND_COMPLIANCE_CHECKLIST.md](LEGAL_AND_COMPLIANCE_CHECKLIST.md)).

Ayadajo holds patient and health-related data. Security is **product-critical**, but the plan must stay practical for a solo dev. Priorities: **tenant isolation, authn/authz, no data leakage, auditability.**

> **Legal disclaimer:** Items marked **[LEGAL]** are not legal advice and **must be reviewed with a qualified legal professional in Jordan** before launch.

---

## 1. Tenant isolation (top priority) — Supabase RLS primary (ADR-001)
- Every clinic-owned table has `clinic_id NOT NULL`.
- **PRIMARY: Supabase RLS is ENABLED on every tenant table** with policies scoping rows to the user's active clinic membership (`auth.uid()` → `clinic_members`). The database refuses cross-tenant access even if app code forgets a filter. **P0 launch blocker.**
- **Clinic-user code uses the user-scoped Supabase client** so RLS applies on every query. The **service-role client bypasses RLS** → Super-Admin/jobs only, server-only, never clinic-user paths/client (guard test enforces this).
- **Second layer:** app `authorize()` check on every request — session user is an **active member** of the resource's clinic, else **404** (don't reveal existence) — and role permissions (RLS does not enforce role).
- Composite foreign keys `(clinic_id, id)` where practical so the DB rejects cross-clinic references.
- Per-clinic sequences for human-visible numbers (invoices) — no global counters that leak volume.
- **Super Admin** is the only cross-tenant path; it's separate, uses the service role intentionally, and is audited.

### Testing tenant isolation (a required deliverable)
- For **every** tenant table: an automated test seeds clinic A and clinic B, authenticates as a normal clinic-A user (RLS in force), and asserts every read/write/list/search of B's rows returns nothing / is rejected — **including when the app omits the `clinic_id` filter** (RLS alone must block).
- A test that **RLS is enabled** on every tenant table (fails if any lacks it).
- A test that the **service-role client is not used in clinic-user code paths**.
- A test that direct cross-clinic FK references are rejected.
- Include these in CI; treat a failure as a release blocker.

## 2. Authentication security
- **Auth = Supabase Auth** (ADR-001): Supabase manages password hashing/storage (we don't store password hashes). Email/password + reset.
- Generic auth errors (no user enumeration). Rate-limit + exponential backoff on login and password reset.
- Sessions: **DB-backed**, httpOnly+secure+sameSite=Lax cookie; short lifetime + sliding renewal; **revoke instantly** on password reset and member removal.
- Password reset: single-use, expiring, hashed tokens.
- **2FA (TOTP) is MANDATORY for AtlasJo platform admins (Super Admin) before the first real trial clinic** (enforced via Supabase Auth MFA). Clinic Owner 2FA = P2.

## 3. Authorization
- Central `authorize(session, action, resource)` helper called in **every** server action/route before data access.
- Two checks: tenancy (membership) + permission (role matrix). Server-side only; UI hiding is not security.
- Deny by default; explicitly allow.

## 4. Input validation
- **Zod** schemas validate every input (server-side, even if also client-side). Reject unknown fields.
- Normalize phones; validate enums; bound string lengths; validate dates/ranges.

## 5. SQL injection
- Use the ORM / parameterized queries exclusively. No string-concatenated SQL. If raw SQL is ever needed, use parameter binding.

## 6. XSS
- React escapes by default; never use `dangerouslySetInnerHTML` with user/clinic/patient content. Public booking inputs rendered as text. Template rendering uses a whitelist of variables, no HTML.

## 7. CSRF
- Server Actions / same-site cookies + CSRF protection on state-changing requests (sameSite=Lax + origin checks + CSRF token where applicable). Avoid GET for mutations.

## 8. Rate limiting
- Login, password reset, public booking submit, signed-URL generation. Per-IP + per-identifier sliding windows (edge middleware). Stricter on the public surface.

## 9. File upload security
- Validate content-type + size server-side; whitelist (images/pdf); reject executables/scripts.
- Store in **private** bucket, keys namespaced `clinics/{clinicId}/...`.
- Access **only** via short-lived signed URLs generated after an authz check. **No public medical file URLs, ever.**
- (P2) scan/limit; strip EXIF if needed; enforce per-clinic storage caps.

## 10. Private file access
- Download endpoint: authz → check file's `clinic_id` == session clinic → issue signed URL with short TTL. Log medical-file access under support grants.

## 11. Audit logs
- Append-only `audit_logs` (no update/delete). Log sensitive actions (see PRODUCT_REQUIREMENTS §21) + **all Super Admin/Support reads of clinic data**.
- Write in the same transaction as the action where feasible.
- **No PHI/secrets in log payloads** — reference IDs and action names, not contents.

## 12. Logging without leaking patient data
- Structured logs carry IDs (clinic_id, user_id, request_id), **never** names/phones/notes/file contents/message bodies.
- Sentry with PII scrubbing on; scrub request bodies of sensitive fields.
- Error messages to users are generic; details only in internal logs.

## 13. Error handling without exposure
- Catch and map errors to safe messages; no stack traces or DB errors to the client; 404 (not 403) for cross-tenant to avoid existence disclosure.

## 14. Secrets & environment variables
- All secrets in env vars; nothing in code or committed. `.env.example` documents names only.
- Validate env at boot (Zod). Rotate on exposure. Separate values per environment. Restrict who can read Vercel/host secrets.

## 15. API protection
- Auth required on all non-public endpoints; public endpoints (booking) rate-limited + validated.
- Job endpoints (cron) protected by a secret header / Vercel cron auth, not publicly callable.
- No sensitive data in URLs/query strings (they get logged).

## 16. Backups & recovery
- Managed Postgres PITR **+** independent encrypted daily `pg_dump` to controlled storage (30-day retention).
- **Test restores** quarterly. Document RPO/RTO.

## 17. Data export
- Owner can export their clinic's data (CSV/JSON) — gated, **audited** (who/what/when).
- Super Admin export of fleet billing data — audited. No bulk patient-data export by AtlasJo without a logged support grant.

## 18. Data deletion & retention
- Soft-delete (archive) clinical/financial data; hard-delete only per a defined retention policy + on verified request. **[LEGAL]** retention periods for medical/financial records in Jordan must be confirmed.
- On clinic cancellation: retain for a grace window, offer export, then delete per policy. **[LEGAL]**

## 19. Staff offboarding
- Remove/suspend member → instant session revocation + access loss; pending invites voided. Historical attribution retained. Review their prior elevated access via audit.

## 20. Least privilege
- Fixed roles, server-enforced; financial/clinical split; Assistant minimal; platform admins separated; support access time-boxed + logged.

## 21. Tenant isolation model — DECIDED: Supabase RLS primary ([ADR-001](ADR-001-STACK-AUTH-TENANCY.md))
- **Primary = Supabase RLS:** every tenant table has RLS enabled + policies scoping rows to the user's active clinic membership (`auth.uid()` → `clinic_members`). The database refuses cross-tenant access even if app code forgets a filter. **P0 launch blocker.**
- **Clinic-user code uses the user-scoped Supabase client** so RLS applies; app `authorize()` + membership checks are the **second** layer (and enforce role permissions, which RLS does not).
- **Service role bypasses RLS** → restricted to Super Admin/background-job server code, env-only, never client, never in clinic-user paths; misuse is the one way to defeat RLS (guard + audit it). A guard test ensures it isn't imported elsewhere.
- **RLS isolation tests are mandatory** before any real clinic.

## 22. Privacy by design for AtlasJo (support)
- Default admin views = operational metadata only.
- Patient data only under a time-boxed, reason-tagged **support access grant**, every read audited; medical/files require extra confirmation. (See SUPER_ADMIN_PLAN.md.)

## 23. Transport & platform
- HTTPS everywhere (HSTS). Secure cookies. Dependency updates / `npm audit`. Principle of minimal third-party scripts on the app (none on patient-data pages).

---

## Legal / compliance items — **[LEGAL] must be reviewed with a qualified Jordanian legal professional**
- **Jordan Personal Data Protection Law (and any health-data specifics):** lawful basis, patient consent, data subject rights, breach notification, cross-border transfer (your hosting region — consider data residency). **[LEGAL]**
- **Privacy Policy** (clinic-facing + patient-facing): what data is collected, why, retention, rights, contact. **[LEGAL]**
- **Terms of Service** between AtlasJo and clinics. **[LEGAL]**
- **Data Processing Agreement (DPA):** AtlasJo is the **processor**, the clinic is the **controller** of patient data — define responsibilities, sub-processors (hosting, email, storage), security commitments, breach handling. **[LEGAL]**
- **Patient consent for messaging** (WhatsApp/SMS/email) and for storing health data. **[LEGAL]**
- **VAT / e-invoicing** obligations for AtlasJo's own subscription billing and for clinic invoices. **[LEGAL]**
- **Medical record retention** periods. **[LEGAL]**

> Action: draft plain-language Privacy Policy / ToS / DPA early (they're also a sales-trust asset), then have them reviewed by a Jordanian lawyer before the first paying clinic.

---

## Security checklist (release gate for MVP)
- [ ] Every tenant table has `clinic_id` **+ RLS enabled + policies**; clinic-user access via the user-scoped Supabase client.
- [ ] Isolation tests pass for every tenant table (A cannot touch B).
- [ ] Authz helper enforced on every mutation + sensitive read.
- [ ] Auth via Supabase Auth; sessions revocable on offboarding; reset single-use; **Super Admin 2FA enforced**.
- [ ] **RLS enabled + policies on every tenant table; RLS isolation tests green (launch blocker).**
- [ ] Service role used only in Super-Admin/jobs (guard test passing); never in clinic-user paths/client.
- [ ] Patient messaging consent = `unknown` by default; `opted_out` blocks reminders.
- [ ] File attach: private bucket, signed URLs only, type/size limits, risky types blocked, EXIF stripped, access audited.
- [ ] Zod validation on all inputs; phones normalized.
- [ ] Public booking rate-limited + honeypot; cron endpoints secret-protected.
- [ ] No PHI in logs/Sentry; generic error messages; 404 for cross-tenant.
- [ ] Files private + signed URLs only; type/size limits.
- [ ] Audit logs for sensitive + support actions; append-only.
- [ ] Secrets in env only; env validated at boot; `.env.example` present.
- [ ] Backups enabled + a test restore done.
- [ ] Privacy Policy / ToS / DPA drafted and **[LEGAL]** review scheduled.
