# Ayadajo — Instructions for AI Coding Agents

Read this before writing any code for Ayadajo. These rules are **binding**.

> **⬆️ V1 + ADR-001 (stack LOCKED):** You are building **Production-Ready Core / Pilot-Ready V1** ([PRODUCTION_READY_V1_SCOPE.md](PRODUCTION_READY_V1_SCOPE.md)) — a version a real clinic **trusts** with patient data, not a thin MVP. **"MVP"** = only the smallest technical slice built first. **The stack is decided in [ADR-001](ADR-001-STACK-AUTH-TENANCY.md): Supabase (Postgres + Auth + Storage) with RLS as PRIMARY tenant isolation, Next.js + TS + Tailwind + shadcn/ui, Vercel, Resend, Vercel Cron, Sentry. Do NOT use Prisma/Neon/Auth.js/custom sessions. Do NOT change the stack without a new ADR.** Binding rules for V1: (a) **every tenant table ships with RLS enabled + policies**; clinic-user code uses the **user-scoped Supabase client** (RLS applies); the **service-role key is forbidden in clinic-user paths** (Super-Admin/jobs only, server-only) — if a task seems to need it in a clinic path, **stop and ask**; (b) **RLS isolation + permission tests are launch blockers** — write them alongside the feature; (c) production must-haves (backups+restore, monitoring, audit, no-PHI-in-logs, private files, Super Admin 2FA) are **V1**, not deferrable; (d) schema/RLS via **SQL Supabase migrations** (no ORM migrations); (e) follow the first-25 task order at the end of [IMPLEMENTATION_TASKS.md](IMPLEMENTATION_TASKS.md).

---

## 0. Orientation (do this first, every time)
1. **Read the planning docs first** — at minimum: `PRODUCT_REQUIREMENTS.md`, `SYSTEM_ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `MODULES_PLAN.md`, `USER_ROLES_AND_PERMISSIONS.md`, `SECURITY_AND_PRIVACY_PLAN.md`, and the doc(s) for the module you're touching.
2. **Confirm the current phase** (`MVP_ROADMAP.md`) and the specific task (`IMPLEMENTATION_TASKS.md`). Build only what's in scope for that task.
3. If the request conflicts with the plan or architecture, **stop and ask** before proceeding.

## 1. Scope discipline
- **Do not build the whole system in one request.** Work **module by module**, task by task.
- **Do not overbuild** features that aren't in the MVP (see PRODUCT_STRATEGY §12). If tempted, note it as a "later" item and move on.
- Prefer the smallest change that satisfies the task's acceptance criteria.

## 2. Tenant isolation (non-negotiable)
- **Tenant isolation is enforced by RLS first.** Every tenant table must have RLS enabled + policies. Access clinic data through the **user-scoped Supabase client** so RLS applies; still pass/assert `clinic_id` + membership for authorization (second layer). **Never** use the service-role client in clinic-user paths (it bypasses RLS).
- Derive `clinicId` from the **session**, never from a client-supplied URL/body param (the slug is for routing only and must be validated against membership).
- Cross-tenant access → return **404**, not 403 (don't reveal existence).
- **Add/maintain isolation tests** for any tenant table you touch (clinic A cannot access clinic B).

## 3. Authorization (every mutation + sensitive read)
- Call the central `authorize(session, action, resource)` helper **before** touching data.
- Deny by default. Enforce the role matrix from `USER_ROLES_AND_PERMISSIONS.md`. UI hiding is not security.
- Respect subscription gating: call `assertClinicWritable(clinic)` in mutating actions (`read_only`/`suspended` block writes).

## 4. Validation & types
- **TypeScript strict** always. No `any` without justification; model domain types.
- Validate **every** input with **Zod** server-side (even if validated client-side). Reject unknown fields. Normalize phones.
- Use parameterized ORM queries only — never string-concatenate SQL.

## 5. Privacy & logging
- **Do not expose patient data in logs**, Sentry, error messages, or URLs. Log IDs (clinic_id, user_id, request_id), never names/phones/notes/message bodies/file contents.
- User-facing errors are generic and Arabic-friendly; details go to internal logs only.
- Files are **private**; access only via short-lived signed URLs after an authz check. No public medical URLs.

## 6. Secrets & config
- **No secrets in code.** Use environment variables; document names in `.env.example` (names only, no values).
- Validate env at boot (Zod). Never commit `.env`.

## 7. Auditing
- Write an `audit_logs` entry for sensitive actions (payments, invoices, member/role changes, settings, subscription/status, deletes, exports, support access) — in the same transaction where feasible. No PHI in the payload.

## 8. Testing (deliverable, not optional)
- For tenant tables: **isolation tests**. For roles: **permission tests**. For appointments: **double-book/race test**. For auth: **session-revocation test**. For reminders: **idempotency + cancel test**.
- A change that breaks isolation or permission tests is not shippable.

## 9. Internationalization & RTL
- **Arabic + RTL from the start.** No hardcoded UI strings — use the i18n key layer. Use logical CSS (`start`/`end`), not left/right. Verify mirrored layout.
- Times: store **UTC**, render in `Asia/Amman` via a tz library — never hardcode `+3`.

## 10. Architecture stability
- **Ask for confirmation before changing architecture** (stack, tenancy model, auth model, monolith→services, adding a queue/Redis, swapping the DB/ORM).
- Prefer **boring, stable technology** over trendy complexity. No microservices, no premature queues/caches/abstractions.
- Keep the modular-monolith boundaries from `MODULES_PLAN.md`.

## 11. Money & correctness
- Money is `numeric`, 2 decimals, JOD; never floats. Outstanding/collected follow the single definitions in `ANALYTICS_AND_REPORTING.md`. Don't double-count.
- No hard-deletes of patients/notes/payments/invoices/appointments/audit — soft-delete/reversal only.

## 12. Process hygiene
- **Update documentation** in `/planning` (and module docs) when behavior/schema changes.
- **Update `CHANGELOG.md`** after each major step (what changed, why).
- Small, reviewable commits with clear messages. Run typecheck + lint + tests before declaring done.
- Don't introduce new dependencies casually; justify each.

## 13. When unsure
- If acceptance criteria are ambiguous, or a security/tenancy/privacy implication exists, **stop and ask** rather than guessing. A wrong tenancy assumption is a data breach.

---

### Quick checklist before "done"
- [ ] In scope for the current task only.
- [ ] All clinic data access via scoped repo with `clinic_id`.
- [ ] `authorize()` + `assertClinicWritable()` on every mutation.
- [ ] Zod validation on all inputs; strict types.
- [ ] No PHI/secrets in logs or code; env-based config.
- [ ] Audit entries for sensitive actions.
- [ ] Isolation/permission tests added/passing.
- [ ] Arabic/RTL + Asia/Amman correct.
- [ ] Docs + CHANGELOG updated.
