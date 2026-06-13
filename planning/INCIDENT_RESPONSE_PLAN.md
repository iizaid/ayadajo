# Ayadajo — Incident Response Plan

For a health-data product, an incident plan is not optional. This is a practical runbook for a solo/small team. **[LEGAL]** items require review by a qualified Jordanian legal professional.

---

## Severity levels
- **SEV-1 (critical):** patient-data exposure/leak, cross-tenant breach, account compromise, total outage, data loss. → Drop everything; respond immediately.
- **SEV-2 (high):** partial outage, wrong patient message sent at scale, payment/subscription errors affecting clinics, file exposure (single). → Same-day.
- **SEV-3 (low):** isolated bug, single wrong record, minor degradation. → Normal queue.

## General response loop (every incident)
1. **Detect** (monitoring alert, clinic report, self-audit).
2. **Triage** severity; start an **incident log** (timeline, facts, actions — no PHI in the log).
3. **Contain** (stop the bleeding — disable feature, revoke session/key, take affected surface offline).
4. **Assess** scope (who/what affected, how many clinics/patients).
5. **Remediate** (fix root cause, restore data if needed).
6. **Notify** affected parties as required **[LEGAL]**.
7. **Post-incident review** (root cause, prevention, action items).
8. Update tests/monitoring so it can't recur silently.

---

## Playbooks

### 1. Cross-tenant data exposure (clinic A saw clinic B's data) — SEV-1
- **Detect:** clinic report, audit-log anomaly, isolation-test regression.
- **Respond:** immediately identify the code path; **disable** the affected feature/endpoint; deploy a fix; add/repair the isolation test that should have caught it.
- **Assess:** use `audit_logs` + access logs to determine exactly what cross-tenant data was viewed and by whom; quantify exposure.
- **Notify:** affected clinics (both A and B), honestly and promptly; regulators/patients if required **[LEGAL]**.
- **Log:** what leaked, to whom, when, fix, scope. **Prevent:** isolation test for that path becomes permanent; review all similar paths.

### 2. Data leak (any unauthorized data disclosure) — SEV-1
- Contain the source (revoke keys/tokens, close the endpoint, rotate secrets).
- Determine data type (PHI? credentials?) and volume.
- Notify per **[LEGAL]**; preserve evidence; engage legal.
- Root-cause + prevent (often a missing authz check or a public URL).

### 3. Wrong reminder sent (wrong patient/time/clinic) — SEV-2/3
- Stop further sends (pause the job / disable the template).
- Identify affected patients via `messages` log.
- Have the clinic send a correction message (manual WhatsApp) where needed; apologize.
- Root-cause (template variable bug? stale reminder after reschedule?); add a reminder-cancellation/idempotency test.

### 4. Deleted data (accidental) — SEV-1/2
- Most clinical/financial data is **soft-deleted** → restore by clearing `deleted_at` (verify scope).
- Hard loss → restore from backup (PITR / daily dump) to a staging copy, extract the affected rows, re-insert scoped to the correct clinic.
- Confirm with the clinic; log; review why a hard delete was possible.

### 5. Payment record mistake — SEV-2/3
- Never silently edit money. Correct via **reversal/adjusting entry**; record a clear note + reference.
- For subscription billing: verify `subscription_payments`, correct status, communicate with the clinic.
- Log; if it affected the clinic's patient-payment data, involve the clinic to confirm the true state.

### 6. System outage — SEV-1/2
- Check host (Vercel) + DB (Neon/Supabase) status pages; check health endpoint + monitoring.
- If platform-side: post status to clinics (WhatsApp/status note), give ETA, escalate with the provider.
- If our deploy: roll back to the last good deploy.
- Log timeline; post-mortem; add monitoring/alerts for the failure mode.

### 7. Database failure / corruption — SEV-1
- Engage managed-DB support; assess PITR.
- Restore to a known-good point (staging first, validate, then production) — accept defined RPO.
- Communicate downtime/RPO to clinics; log; review backup adequacy.

### 8. File exposure (medical file reachable without authz) — SEV-1/2
- Revoke/rotate signing keys; confirm no public bucket/URL; patch the access path.
- Determine which files were reachable and by whom (access logs).
- Notify if patient files were exposed **[LEGAL]**; add file-access tests.

### 9. Account compromise (clinic user account taken over) — SEV-1
- Revoke all that user's sessions; force password reset; check `audit_logs` for actions taken.
- Notify the clinic owner; review/repair any malicious changes; check for data exfiltration.
- Encourage/enable 2FA (P2); review how it happened (phishing? weak password?).

### 10. Suspicious login (anomalous access) — SEV-2/3
- Detect via login patterns (new IP, many failures, odd hours).
- Challenge/lock the account; force reset; notify the user.
- Review `audit_logs`; add rate-limit/alerting if needed.

---

## How to detect (detection sources)
- Monitoring/alerts (errors spike, job failures, downtime).
- `audit_logs` review (esp. support access + unusual cross-tenant activity).
- Clinic reports (the most common detector — make it easy to report).
- CI test regressions (isolation/permission failing).
- Provider status pages.

## What to log (incident log — NO PHI)
- Timeline (detect → contain → remediate → notify → close).
- Severity, systems/clinics affected, scope (counts, not patient contents).
- Actions taken + who; root cause; prevention items.
- Store securely; reference IDs, never patient data in the incident log.

## Who to notify
- **Affected clinic owner(s):** promptly, honestly, with what happened + what you're doing.
- **Affected patients:** only via/with the clinic, and where required **[LEGAL]**.
- **Regulators:** if/when required under Jordan law **[LEGAL]** — confirm thresholds + timelines with a lawyer in advance.
- **Provider support** (Vercel/Neon/Supabase/email) for platform incidents.

## What requires legal review **[LEGAL]**
- Any patient-data breach/exposure: notification obligations, timelines, content.
- Data loss affecting medical records.
- Law-enforcement/data requests.
- Cross-border data implications of the incident.
> Pre-arrange a lawyer contact **before** launch so you're not searching during a SEV-1.

## Prevention (post-incident → permanent)
- Every SEV-1/2 yields: a new/repaired automated test, a monitoring rule, and a documented root cause.
- Quarterly: review incident log trends; run a restore drill; spot-check support-access logs; dependency/security updates.
