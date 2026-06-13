# Ayadajo — Pre-Launch Security Review

A focused security pass to run **before the first real trial clinic** (and re-run before the first paid clinic). Health data + solo dev + AI-generated code = do this deliberately, not casually. Most items map to automated tests (TESTING_AND_QA_PLAN.md); this doc is the human sign-off checklist.

> **Hard rule:** if any **blocker** item below is not satisfied, **do not** point a real clinic at the system.

---

## 1. Tenant isolation (Supabase RLS) — **BLOCKERS**
- [ ] **RLS is ENABLED on every tenant table** (a test fails if any tenant table lacks RLS).
- [ ] RLS policies scope rows to the user's **active** clinic membership (`auth.uid()` → `clinic_members`); removed/suspended members lose access.
- [ ] **RLS isolation tests pass for every tenant table** under a normal user session (clinic A cannot read/list/search/update/delete clinic B), **including with the app `clinic_id` filter omitted** (RLS alone must block).
- [ ] Composite FKs `(clinic_id, id)` reject cross-clinic references.
- [ ] Storage policies isolate files per clinic; no cross-tenant file access.

## 2. Service role / privileged access — **BLOCKERS**
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is **server-only**, never in client bundles or preview logs.
- [ ] Service-role client is used **only** in Super-Admin/background-job code; **service-role-import guard test passes** (forbidden elsewhere).
- [ ] Super Admin surface is separate, gated by `is_platform_admin`, with **MFA enforced**.
- [ ] Cross-tenant reads (admin) go through the audited support-access path; medical data needs explicit grant + extra confirm; every access logged.

## 3. Authentication — **BLOCKERS**
- [ ] Supabase Auth: email/password + reset; rate-limited login/reset; no user enumeration.
- [ ] **Instant offboarding:** removing/suspending a member revokes sessions/refresh tokens; access denied immediately (verify).
- [ ] **Super Admin 2FA enforced** before first trial clinic.
- [ ] Cookies httpOnly/secure/sameSite; sessions handled via `@supabase/ssr`.

## 4. Authorization (role permissions)
- [ ] `authorize()` enforced on every mutation + sensitive read (second layer on top of RLS).
- [ ] **Permission tests pass** for the role matrix (financial vs clinical split; Assistant minimal). — **BLOCKER**
- [ ] Subscription gating: `read_only` blocks writes/allows reads; `suspended` locks. — **BLOCKER**

## 5. Input / web security
- [ ] Zod validation on all inputs (server-side); unknown fields rejected; phones normalized.
- [ ] No `dangerouslySetInnerHTML` with user/clinic/patient content; public-booking inputs render as text.
- [ ] Parameterized SQL only; no string-concatenated queries.
- [ ] CSRF protections on state-changing requests; mutations not via GET.
- [ ] Rate limiting on login, password reset, **public booking submit**, signed-URL generation.
- [ ] Cron/job endpoints require the cron secret (not publicly callable).

## 6. Files / storage — **BLOCKER (V1 has file attach)**
- [ ] Private bucket; **signed URLs only; no public medical URLs** (verify a direct object URL is not reachable).
- [ ] File **type + size limits**; **risky/executable types blocked**; **EXIF stripped** from images.
- [ ] Download path checks authz + clinic ownership before signing; access **audited**.

## 7. Privacy / logging — **BLOCKER**
- [ ] **No PHI in logs/Sentry/URLs** (denylist + scrubber + test verified). Reference IDs only.
- [ ] Generic user-facing errors; no stack traces / DB errors to client; **404 (not 403)** on cross-tenant.
- [ ] Message bodies / patient data excluded from platform-admin default views.
- [ ] **Patient messaging consent defaults to `unknown`; `opted_out` blocks reminders**; WhatsApp links never auto-marked "sent".

## 8. Auditing
- [ ] Sensitive actions + **all support access** write append-only `audit_logs` (no PHI in payload).
- [ ] Audit cannot be updated/deleted via the app.

## 9. Data protection / backups — **BLOCKER**
- [ ] Backups enabled (Supabase PITR + independent encrypted daily dump).
- [ ] **One successful test restore documented** (RTO measured).
- [ ] Data-residency stance documented **[LEGAL]**.

## 10. Secrets & config
- [ ] All secrets in env (per environment); `.env.example` names only; nothing committed.
- [ ] Env validated at boot; service role + provider keys rotated if ever exposed.

## 11. Dependencies / surface
- [ ] `npm audit` / dependency review clean of known criticals.
- [ ] No unnecessary third-party scripts on patient-data pages.
- [ ] HTTPS/HSTS; secure headers.

## 12. Incident readiness
- [ ] INCIDENT_RESPONSE_PLAN.md in place; lawyer contact pre-arranged **[LEGAL]**.
- [ ] Monitoring + uptime + alerting live (Sentry, `/healthz`, job-failure alerts).

---

## Sign-off
- **Before first TRIAL clinic:** all **BLOCKER** items above green (esp. RLS isolation, permission, service-role boundary, no-PHI-logs, backups+restore, Super Admin 2FA, file privacy).
- **Before first PAID clinic:** the above **plus** legal pack reviewed by a Jordanian lawyer (LEGAL_AND_COMPLIANCE_CHECKLIST.md).
- Record date, reviewer, and results. Re-run after any change touching auth, RLS, files, payments, or migrations.

> Recommended: also run an independent review pass (a second set of eyes or a security-review agent) over auth, RLS policies, and the service-role boundary — the three places a single mistake is catastrophic.
