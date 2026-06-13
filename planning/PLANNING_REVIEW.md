# Ayadajo — Planning Review

A critical review of the existing planning package, scored and gap-analyzed before upgrading to **Production-Ready Core / Pilot-Ready V1**.

---

## Scores

- **As MVP planning: 9 / 10.** Comprehensive, well-sequenced, security-aware, realistic for a solo dev. Loses a point for leaving a few hard decisions open (stack fork) and under-specifying business/ops execution.
- **As Production-Ready V1 planning: 6.5 / 10.** Strong technical core, but several production realities are thin or missing: pricing, competitors, go-to-market execution, onboarding/support operations, QA depth, incident response, legal execution, data import, observability detail, and brand/UI direction. The product scope also defaults to "smallest thing" rather than "strong enough for a real clinic to trust for 14 days."

This review + the new docs close that gap.

---

## Strong areas
- **Tenant isolation thinking** — scoped data layer, composite FKs, isolation tests as a deliverable, 404-on-mismatch. This is the right obsession.
- **Security & privacy** — authz everywhere, no PHI in logs, private files via signed URLs, support-access gating so AtlasJo can't casually browse patient data.
- **Subscription/status model** — `read_only` middle state is a thoughtful retention design; manual-payment-first is correct for Jordan.
- **Reminder restraint** — refusing to over-message (one 24h reminder) and starting with manual WhatsApp deep links avoids cost/Meta-approval traps.
- **Clear "is not" guardrails** — explicit anti-scope (not ERP/accounting/PACS/etc.).
- **Schema quality** — `clinic_id` everywhere, soft deletes, per-clinic invoice numbering, exclusion constraint for double-booking.
- **Roadmap discipline** — "sell before you over-build," clickable demo first.

## Weak areas (to fix)
1. **Business execution under-planned** — no pricing numbers, no competitor analysis, no concrete GTM/outreach/demo scripts, no onboarding playbook, no support ops. A solo founder needs these as much as the schema.
2. **"MVP" framing too small** — "smallest sellable" risks a product clinics won't *trust* with real patients for 14 days. Need a "Production-Ready Core" bar.
3. **QA plan is scattered** across docs, not a single strategy with a pre-launch gate.
4. **No incident response plan** — for a health-data product, the lack of a breach/outage runbook is a real gap.
5. **Legal items listed but not operationalized** — need a checklist with owners and a "before first paid clinic" gate.
6. **Data import not planned** — clinics arrive with Excel/paper; without an import path, onboarding stalls.
7. **Observability/backup detail thin** — mentioned but no concrete alerting, restore-test cadence, or "what not to log" enforcement.
8. **Brand/UI direction absent** — "Arabic-first, clean" is stated but not directed (tone, color, type, trust elements).
9. **Open architectural fork** (Neon+Prisma vs Supabase+RLS) still undecided — blocks coding.
10. **File attachments ambiguous** — listed P2 but X-rays are core to dental trust; need a clear V1 decision.

## Missing documents (now being created)
PLANNING_REVIEW, PRODUCTION_READY_V1_SCOPE, PRICING_AND_PACKAGING, COMPETITOR_ANALYSIS, GO_TO_MARKET_PLAN, OUTREACH_MESSAGES, DEMO_SCRIPT, CLINIC_ONBOARDING_PLAYBOOK, SUPPORT_AND_OPERATIONS, TESTING_AND_QA_PLAN, LAUNCH_READINESS_CHECKLIST, INCIDENT_RESPONSE_PLAN, LEGAL_AND_COMPLIANCE_CHECKLIST, DATA_MIGRATION_AND_IMPORT_PLAN, OBSERVABILITY_AND_BACKUP_PLAN, BRAND_AND_INTERFACE_DIRECTION.

## Contradictions / unclear assumptions
- **Reminders "MVP automated email" vs "assisted only"** — slightly inconsistent across PRODUCT_REQUIREMENTS and REMINDERS docs. **Resolution:** V1 = assisted WhatsApp deep links + *optional* automated email; automated WhatsApp is post-V1.
- **Outstanding-balance source** — invoices vs treatment-plan totals appear in different docs. **Resolution:** single source = issued invoice balances (already chosen in ANALYTICS; enforce everywhere).
- **File attachments** — "P2" but dental needs X-ray attach for credibility. **Resolution:** a *minimal, secure* single-file attach is **in V1** (private + signed URLs), galleries/before-after later.
- **Roles count** — six clinic roles may be more than a pilot clinic uses. **Resolution:** keep the six in the model, but onboard pilots with Owner/Receptionist/Doctor only; others available, not pushed.
- **Auth choice** — Auth.js vs custom sessions left open. **Resolution:** pick one in the stack-fork decision (see below).
- **Invoice vs receipt** — V1 clinics often just want a **receipt**. **Resolution:** V1 ships a simple receipt/invoice hybrid; full invoicing later.

## What must be improved before coding
- Decide the **stack fork** and **auth** approach (top of the decision list).
- Promote the plan's target from "MVP" to **Production-Ready Core / Pilot-Ready V1** with a clear scope + launch-blocker list (PRODUCTION_READY_V1_SCOPE.md).
- Make **isolation + permission tests** explicit launch blockers (TESTING_AND_QA_PLAN.md, LAUNCH_READINESS_CHECKLIST.md).
- Operationalize **legal, incident response, backup/restore, import, support**.
- Settle **pricing** and **GTM** so building and selling proceed together.

## What must NOT be built yet (reaffirmed)
WhatsApp Business API, SMS automation, payment gateway, full accounting/payroll/inventory, insurance claims, DICOM/PACS, complex tooth chart (if it delays launch), native apps, patient portal login, advanced BI, custom domains, self-serve signup, custom-role editor, multi-branch.

---

## Top 10 decisions to finalize before implementation
> **Update:** Decisions **#1 and #2 are now RESOLVED in [ADR-001](ADR-001-STACK-AUTH-TENANCY.md): Supabase + RLS + Supabase Auth.** Items #3–#10 remain (mostly human/legal/pricing). The text below is kept for historical context.

1. ~~**Stack fork**~~ **DECIDED → Supabase + RLS (ADR-001).** (Was: Neon+Prisma vs Supabase+RLS; chose database-enforced isolation for a solo-dev health-data product.)
2. ~~**Auth**~~ **DECIDED → Supabase Auth (ADR-001).**
3. **Pricing:** confirm Starter/Pro/Plus + yearly + pilot JOD numbers (see PRICING doc).
4. **File attachments in V1:** yes (minimal secure single-file) — confirm.
5. **Reminders in V1:** assisted WhatsApp deep links + optional automated email — confirm (no automated WhatsApp).
6. **Hosting / data residency:** Vercel + Neon/Supabase (likely outside Jordan) acceptable, or must data stay in-region? [LEGAL]
7. **Work week default & services seed:** default Sun–Thu or include Sat; seed a standard dental services list.
8. **Receipt vs invoice for V1:** simple receipt/invoice hybrid — confirm format + numbering.
9. **Legal pack timing:** Privacy/ToS/DPA drafted now, lawyer-reviewed **before first paid clinic** — confirm the lawyer.
10. **Pilot count & terms:** how many concurrent pilots (recommend ≤3) and free-pilot terms.

> With these ten settled and the new docs in place, the plan is ready to start the Production-Ready V1 build.
