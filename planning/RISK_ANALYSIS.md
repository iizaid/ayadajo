# Ayadajo — Risk Analysis

Each risk: **Description · Probability · Impact · Mitigation · Backup plan.** Probability/Impact: Low/Medium/High.

> **⬆️ V1 reframe — added production risks:** **R21 No backup/restore tested** (Prob Low/Impact Very High → mitigate: PITR + daily dump + a tested restore before any real clinic; backup-failure alert). **R22 PHI leaks into logs/Sentry** (Prob Medium/Impact High → denylist + scrubber + a test; see OBSERVABILITY doc). **R23 No legal pack before paid clinic** (Prob Medium/Impact High → draft now, lawyer-review before first paid clinic — hard gate). **R24 Bad patient import** (Prob Medium/Impact Medium → mandatory preview + batch rollback + white-glove import). **R25 No incident plan when a SEV-1 hits** (Prob Low/Impact Very High → INCIDENT_RESPONSE_PLAN.md + pre-arranged lawyer contact). The original Top-5 (overbuilding, cross-tenant leakage, adoption, demand, legal) still stand.

---

### R1 — Clinics won't switch from paper/Excel
- **Desc:** Inertia; "we've always done it this way."
- **Prob:** High · **Impact:** High (no sales = no business).
- **Mitigation:** Tiny wedge (just appointments + reminders) that's obviously easier; do the migration *for* them (import patients); free pilot; show no-show savings in JOD; on-site setup.
- **Backup:** If full system resists, sell the single sharpest feature (reminder + today's schedule) and expand once trust is built.

### R2 — Receptionists find it hard
- **Desc:** The heaviest user struggles → reverts to paper.
- **Prob:** Medium · **Impact:** High (they're the daily driver).
- **Mitigation:** Obsessive receptionist-speed UX (3-click book, instant search, 1-click actions); watch real receptionists use it; minimal fields; Arabic.
- **Backup:** In-person training + a 1-page Arabic cheat sheet; simplify ruthlessly based on observation.

### R3 — Doctors don't enter treatment notes consistently
- **Desc:** Busy doctors skip notes → clinical value erodes.
- **Prob:** High · **Impact:** Medium.
- **Mitigation:** Make notes ≤20s (single box, optional fields); "My Day" minimal view; don't force structure in MVP; let assistants/receptionists capture basics.
- **Backup:** Position notes as optional-but-valuable; lean the product's value on scheduling/money where adoption is easier; add quick templates later.

### R4 — WhatsApp automation expensive/limited
- **Desc:** WhatsApp Business API needs Meta verification, template approval, per-message cost; rules change.
- **Prob:** High · **Impact:** Medium.
- **Mitigation:** MVP uses **manual deep links** (free, no API); automate email first; only adopt the API once paying clinics justify cost; gate API behind plan.
- **Backup:** Stay on assisted deep links + email indefinitely if API economics don't work; SMS fallback for critical reminders.

### R5 — SMS cost high in Jordan
- **Desc:** Per-SMS fees erode margin.
- **Prob:** Medium · **Impact:** Medium.
- **Mitigation:** SMS optional/later; prefer WhatsApp/email; pass cost via plan limits.
- **Backup:** Don't offer SMS, or only as a paid add-on.

### R6 — Manual payment tracking gets messy
- **Desc:** CliQ/cash records scattered → billing confusion, lost revenue.
- **Prob:** Medium · **Impact:** Medium.
- **Mitigation:** Record every subscription payment in `subscription_payments` with reference; Super Admin is the single source of truth; renewal reminders + dashboard of due/overdue.
- **Backup:** Reconcile monthly; adopt a gateway sooner if volume grows.

### R7 — Privacy/security breach
- **Desc:** Leak/loss of patient health data → legal + reputational catastrophe.
- **Prob:** Low (if disciplined) · **Impact:** Very High.
- **Mitigation:** Tenant isolation + tests, authz everywhere, private files, no PHI in logs, audit, backups, [LEGAL] policies/DPA, least privilege, support-access gating.
- **Backup:** Incident response plan, breach notification process [LEGAL], insured backups, ability to revoke/rotate fast.

### R8 — Cross-tenant data leakage
- **Desc:** Clinic A sees clinic B's data — the worst bug class.
- **Prob:** Medium (easy to introduce) · **Impact:** Very High.
- **Mitigation:** **Supabase RLS enabled on every tenant table (primary, P0)** + RLS isolation tests in CI; user-scoped client on clinic paths; service-role restricted to Super-Admin/jobs (guard test); composite FKs; app `authorize()` + 404-on-mismatch as second layer. (ADR-001)
- **Backup:** If discovered: immediate fix, audit-log review of exposure, notify affected clinics [LEGAL].

### R9 — Appointment mistakes (double-book, wrong time)
- **Desc:** Scheduling errors erode trust in the tool.
- **Prob:** Medium · **Impact:** Medium.
- **Mitigation:** DB exclusion constraint + app overlap check; tz correctness; clear conflict UX; status history; idempotent create.
- **Backup:** Easy manual fix + visible history; race test in CI.

### R10 — Duplicate patients
- **Desc:** Same patient entered twice → split history/balance.
- **Prob:** High · **Impact:** Medium.
- **Mitigation:** Phone-match warning at create; search-before-add UX; dedupe on booking-approval.
- **Backup:** Merge tool (P2).

### R11 — No-shows persist
- **Desc:** Even with reminders, patients skip.
- **Prob:** Medium · **Impact:** Medium (it's a headline value prop).
- **Mitigation:** Reliable 24h reminder; confirmations; no-show tracking visible to owner (proves value even if imperfect).
- **Backup:** Add 2h reminder, require confirmation, surface chronic no-show patients.

### R12 — Weak clinic internet
- **Desc:** Slow/dropping connections frustrate users mid-task.
- **Prob:** Medium · **Impact:** Medium.
- **Mitigation:** Lightweight pages, SSR, optimistic UI on hot actions, idempotent saves, clear retry states, small bundles.
- **Backup:** Offline-tolerant drafts (P2); graceful degradation.

### R13 — Support burden on AtlasJo
- **Desc:** Many clinics × manual onboarding/support overwhelms a solo founder.
- **Prob:** Medium · **Impact:** Medium.
- **Mitigation:** Self-service onboarding checklist, good empty states, FAQ/Arabic help, support-access tooling, Support Admin role to delegate later.
- **Backup:** Cap concurrent pilots; hire part-time support; automate onboarding incrementally.

### R14 — Overbuilding before selling
- **Desc:** Months of code, zero customers/feedback.
- **Prob:** High (classic founder trap) · **Impact:** High.
- **Mitigation:** Phase 1 clickable demo to sell first; strict MVP scope; talk to 5 clinics before heavy build; ship the smallest sellable thing.
- **Backup:** This whole roadmap is the mitigation — follow it.

### R15 — Competitors
- **Desc:** Existing dental software (regional/global) or a fast follower.
- **Prob:** Medium · **Impact:** Medium.
- **Mitigation:** Win on Arabic-first, Jordan payment rails, local support, dental specificity, price, and speed-to-onboard — hard for foreign generic tools to match.
- **Backup:** Deepen the dental moat + local relationships; move fast on feedback.

### R16 — Legal/privacy requirements (Jordan)
- **Desc:** Data protection / medical-record / VAT obligations not met.
- **Prob:** Medium · **Impact:** High.
- **Mitigation:** [LEGAL] review of Jordan PDP law, DPA (AtlasJo = processor), retention, consent, e-invoicing **before** first paying clinic; draft policies early.
- **Backup:** Pause paid launch until compliant; adjust data residency/retention.

### R17 — AI-generated code quality issues
- **Desc:** Subtle bugs, especially around tenancy/authz/money, from AI coding agents.
- **Prob:** Medium · **Impact:** High (in security-critical paths).
- **Mitigation:** `AI_AGENT_INSTRUCTIONS.md` rules; mandatory isolation/permission/race tests; human review of auth/tenancy/money code; small scoped tasks; code review skill passes.
- **Backup:** Manual audit of critical modules; revert + rewrite risky areas.

### R18 — Lack of real clinic feedback
- **Desc:** Building in a vacuum → wrong product.
- **Prob:** Medium · **Impact:** High.
- **Mitigation:** Interview 5 clinics before deep build; demo early; pilot with 1–3; weekly feedback loops.
- **Backup:** If feedback is thin, slow down build and increase outreach.

### R19 — Trial-to-paid conversion is low
- **Desc:** Clinics try, don't pay.
- **Prob:** Medium · **Impact:** High.
- **Mitigation:** High-touch onboarding, prove ROI (no-show savings, time saved), pilot pricing, make switching cost real (their data lives in it), check in before trial end.
- **Backup:** Adjust pricing/packaging; extend trials for promising leads; learn objections.

### R20 — Solo-founder bandwidth / burnout
- **Desc:** One person doing dev + sales + support can't sustain pace.
- **Prob:** Medium · **Impact:** High.
- **Mitigation:** Ruthless scope, automation where it pays, cap pilots, reuse boring tech, planning docs reduce rework.
- **Backup:** Bring in part-time help (support first, then dev); slow growth to sustainable pace.

---

## Top 5 risks to watch (ranked)
1. **R14 Overbuilding before selling** — the most likely killer; the roadmap exists to prevent it.
2. **R8/R7 Cross-tenant leakage / breach** — highest-impact; isolation tests are mandatory.
3. **R1 Clinics won't switch** — validate demand with real clinics before heavy build.
4. **R2/R3 Adoption (receptionist/doctor)** — UX speed is the moat; watch real users.
5. **R16 Legal/privacy** — get [LEGAL] review before the first paying clinic.
