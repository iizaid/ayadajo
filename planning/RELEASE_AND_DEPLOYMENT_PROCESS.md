# Ayadajo — Release & Deployment Process

Lean process for a solo dev on **Vercel + Supabase** (ADR-001). Goal: ship safely, never break a live clinic, never run an unreviewed migration against production.

---

## Environments
- **Local:** dev Supabase project (or branch) + `.env.local`. Synthetic data only.
- **Preview:** every PR auto-deploys to Vercel preview, pointed at a **staging Supabase project** (never production). Used for QA + restore drills.
- **Production:** `app.ayadajo.com`, production Supabase project. Restricted access; real clinic data.
- **Never** test or run experiments against production data.

## Branching & commits
- `main` is always deployable. Work on short-lived feature branches → PR → merge.
- Small, reviewed PRs. CI must be green to merge.
- Conventional, clear commit messages; link to the IMPLEMENTATION_TASKS task.

## CI gates (block merge)
- Typecheck (TS strict) + lint (incl. **service-role import guard**).
- Unit + integration tests.
- **RLS tenant-isolation tests** + **permission tests** (launch blockers — see TESTING_AND_QA_PLAN.md).
- No-PHI-in-logs test.
- Build succeeds.

## Database migrations (Supabase SQL)
- Schema/RLS changes are **SQL migrations** in `supabase/migrations/*.sql` — reviewed in the PR.
- **Forward-only**; no destructive change without an explicit, reviewed plan + backup confirmation.
- **RLS policies ship in the same migration as the table** (a tenant table is never live without RLS).
- Apply order: run migration on **staging** → verify (incl. RLS tests) → then production.
- Destructive migrations (drop/alter column, data backfill): take a fresh backup first, run in a low-traffic window, have a rollback/restore plan.

## Deploy flow
1. PR opened → CI runs → preview deploy on staging.
2. QA the preview (daily-loop smoke + the feature; Arabic/RTL check).
3. Merge to `main` → production deploy.
4. **Run pending migrations against production** (guarded step; confirm backup is current first).
5. **Post-deploy smoke check** on production: `/healthz` green, login works, Today's Schedule loads, create a test appointment in a test clinic.
6. Watch Sentry + logs for ~15–30 min after deploy.

## Release cadence
- Ship small and often during early build; **avoid deploying right before/at a pilot clinic's busy hours.**
- For changes touching auth/RLS/payments/migrations: deploy in a quiet window, double-check the post-deploy smoke + isolation.

## Rollback
- **App:** Vercel → promote the previous good deployment (instant).
- **DB:** forward-only migrations mean rollback = a new corrective migration (preferred) or restore from backup for data loss (see OBSERVABILITY_AND_BACKUP_PLAN.md). Never blind-revert a migration that dropped data.
- Decide before deploying a risky migration: what's the rollback?

## Secrets & config
- All secrets in Vercel/Supabase env (per environment). `.env.example` documents names only.
- **`SUPABASE_SERVICE_ROLE_KEY` is production-server-only**, never in client bundles or preview logs. Rotate on suspected exposure.
- Env validated at boot (Zod) — missing var fails the build/boot loudly.

## Pre-deploy checklist (quick)
- [ ] CI green (incl. RLS + permission tests).
- [ ] Migration reviewed + RLS included + staging-verified.
- [ ] Backup current (for risky migrations).
- [ ] Not a pilot clinic's peak hour.
- [ ] Post-deploy smoke plan ready; Sentry watched.

## First-clinic / production launch specifics
- Confirm LAUNCH_READINESS_CHECKLIST Gate 3 before pointing a real clinic at production.
- Tag a release; note what changed (CHANGELOG.md).
- Have the INCIDENT_RESPONSE_PLAN handy.
