# Ayadajo by AtlasJo — Planning Package

> **A browser-based operating system for modern dental clinics in Jordan.**

The complete, **implementation-ready** planning package for **Ayadajo** (product) by **AtlasJo** (company). Any coding agent or developer should read these before building. **No production code yet.**

> **Product target = Production-Ready Core / Pilot-Ready V1** — a version a real clinic can **trust** with real patient data during a 14-day trial. **"MVP"** = only the *smallest technical starting slice*. **Stack is LOCKED: Supabase (Postgres + Auth + Storage) + RLS as primary isolation, Next.js + TS + Tailwind + shadcn/ui, Vercel, Resend, Vercel Cron, Sentry — see [ADR-001](ADR-001-STACK-AUTH-TENANCY.md).** Start here: **[ADR-001](ADR-001-STACK-AUTH-TENANCY.md)**, **[PRODUCTION_READY_V1_SCOPE.md](PRODUCTION_READY_V1_SCOPE.md)**, **[PLANNING_REVIEW.md](PLANNING_REVIEW.md)**.

## Read order

**Start / scope**
- **PLANNING_REVIEW.md** — review, scores, gaps, top-10 decisions.
- **PRODUCTION_READY_V1_SCOPE.md** — what V1 is, includes, excludes, launch blockers.

**Product & technical**
1. PRODUCT_STRATEGY.md · 2. PRODUCT_REQUIREMENTS.md · 3. SYSTEM_ARCHITECTURE.md · 4. DATABASE_SCHEMA.md · 5. MODULES_PLAN.md · 6. USER_ROLES_AND_PERMISSIONS.md · 7. APPOINTMENTS_AND_CALENDAR.md · 8. REMINDERS_AND_MESSAGING_SYSTEM.md · 9. PUBLIC_BOOKING_SYSTEM.md · 10. SUBSCRIPTION_AND_TRIAL_SYSTEM.md · 11. SUPER_ADMIN_PLAN.md · 12. UI_UX_PLAN.md · 13. ANALYTICS_AND_REPORTING.md · 14. SECURITY_AND_PRIVACY_PLAN.md

**Decisions (read first)**
- **ADR-001-STACK-AUTH-TENANCY.md** — locked stack/auth/tenancy.

**Build & quality**
- MVP_ROADMAP.md · IMPLEMENTATION_TASKS.md · AI_AGENT_INSTRUCTIONS.md · TESTING_AND_QA_PLAN.md · LAUNCH_READINESS_CHECKLIST.md · RELEASE_AND_DEPLOYMENT_PROCESS.md · DEMO_DATASET_AND_SEED_PLAN.md · DATA_MIGRATION_AND_IMPORT_PLAN.md · OBSERVABILITY_AND_BACKUP_PLAN.md · INCIDENT_RESPONSE_PLAN.md · PRE_LAUNCH_SECURITY_REVIEW.md · SLA_AND_STATUS_COMMUNICATION.md

**Business & go-to-market**
- PRICING_AND_PACKAGING.md · COMPETITOR_ANALYSIS.md · GO_TO_MARKET_PLAN.md · OUTREACH_MESSAGES.md · DEMO_SCRIPT.md · CLINIC_ONBOARDING_PLAYBOOK.md · SUPPORT_AND_OPERATIONS.md · BRAND_AND_INTERFACE_DIRECTION.md

**Risk & compliance**
- RISK_ANALYSIS.md · LEGAL_AND_COMPLIANCE_CHECKLIST.md · QUESTIONS_AND_ASSUMPTIONS.md · FIRST_30_DAYS_PLAN.md

## Decisions
- **LOCKED (ADR-001):** stack, auth (Supabase Auth), tenancy (RLS primary), storage (Supabase private), hosting (Vercel), jobs (Vercel Cron), file attach in V1 (yes, minimal secure), reminders in V1 (assisted WhatsApp + optional email; WhatsApp deep links never auto-marked "sent"), Super Admin 2FA mandatory before first trial clinic.
- **Still requires human/legal before first PAID clinic:** pricing validation (PRICING doc hypotheses), hosting/**data residency** [LEGAL], legal pack lawyer-review [LEGAL], work-week default + services seed, receipt/invoice format, pilot count/terms. See PLANNING_REVIEW.md + LEGAL_AND_COMPLIANCE_CHECKLIST.md.

## Non-negotiables (every phase)
- **Tenant isolation = Supabase RLS (primary)** on every tenant table + app `authorize()` second layer + **RLS isolation tests for every table** (launch blocker). Service role never in clinic-user paths.
- Server-side authorization on every mutation; subscription status gating; **permission tests** (launch blocker).
- Arabic-first / RTL / `Asia/Amman`; money in JOD `numeric`; outstanding = issued invoice balances.
- No PHI in logs; private files via signed URLs; audit sensitive actions; **backups + tested restore**; monitoring.
- Ship a **trustworthy V1**, not a thin MVP — and not a bloated ERP (see PRODUCTION_READY_V1_SCOPE.md exclusions).
