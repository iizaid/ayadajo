# Ayadajo — Observability & Backup Plan

Production-minded but lean. Two non-negotiables: **you find out when something breaks**, and **you can get the data back**. Throughout: **never log patient data.**

---

## Error monitoring
- **Sentry** (or similar), free tier, on server + client.
- **PII scrubbing ON:** scrub request bodies/headers; never capture patient names/phones/notes/message bodies/files. Allow IDs (clinic_id, user_id, request_id) only.
- Group errors; alert on new/spiking errors.
- Tag errors with clinic_id + request_id (IDs, not data) for triage.

## Application logs
- **Structured JSON logs** with: timestamp, level, request_id, clinic_id, user_id, route, action, outcome, duration.
- **No PHI/secrets** — reference IDs and action names, not contents. (A lint/util that forbids logging known sensitive fields helps.)
- Retain a reasonable window; don't ship logs to third parties without scrubbing.

## Audit logs (distinct from app logs)
- `audit_logs` table (append-only) for sensitive + support actions (see SECURITY + SUPPORT docs). This is a security/compliance record, not a debug log. No PHI in payloads.

## Health checks
- `/healthz` endpoint: checks app up + DB reachable (cheap query) + (optionally) storage reachable. Returns 200/503.
- Used by the uptime monitor and for deploy verification.

## Uptime monitoring
- External monitor (UptimeRobot/BetterStack/etc.) pinging `/healthz` + the landing page every few minutes.
- Alert (WhatsApp/email/Telegram) on downtime.

## Alerts (what pages you)
- App down / health check failing.
- Error rate spike (Sentry).
- **Background job failures** (reminder processor, subscription sweep) — alert if a run fails or a batch of messages fails.
- Backup job failure.
- (P2) auth anomalies (many failed logins), unusual support-access volume.
- Keep alert volume low/meaningful so you actually react.

---

## Database backups
- **Primary:** managed Postgres **PITR** (Neon/Supabase) — confirm enabled + note retention window (RPO).
- **Secondary (independent):** scheduled **daily `pg_dump`**, **encrypted**, to controlled object storage (don't rely on a single provider for patient data). Retain ~30 days.
- **Frequency:** PITR continuous; dump daily (more often near launch if cheap).
- **Residency:** backups inherit data-residency considerations — store in an acceptable region **[LEGAL]**.

## Restore testing
- **Test a restore before the first real clinic**, then **quarterly**. An untested backup is not a backup.
- Restore to a **staging** DB, validate row counts + spot-check a clinic's data integrity + isolation, document the runbook (`docs/RESTORE.md`) and the measured RTO.

## File backups
- Object storage with versioning/retention enabled; confirm the provider's durability + backup story.
- Files referenced by `files` rows; ensure DB backup + file backup are consistent enough to restore a patient's record + its attachments.
- Deletion respects retention policy; no orphaned public objects.

## What NOT to log (hard rules)
- Patient names, phones, emails, DOB, gender, medical alerts.
- Treatment notes, plan details, diagnoses.
- Message bodies / rendered templates.
- File contents or signed URLs.
- Passwords/hashes, tokens, secrets, full payment references.
- Anything that, combined, re-identifies a patient.
> Log **IDs and actions**, never **contents**. When in doubt, don't log it.

## How to avoid logging patient data (enforcement)
- Centralized logger that takes structured fields; a denylist of sensitive field names that are dropped/redacted.
- Code review + a test that asserts known sensitive fields never appear in serialized logs.
- Sentry beforeSend scrubber strips request bodies on PHI-handling routes.
- Generic user-facing errors (details only in scrubbed internal logs).

## Production vs staging monitoring
- **Separate** environments + databases; never test against prod.
- Staging: looser, used for restore drills + QA; seed/synthetic data only (no real patient data in staging).
- Production: full monitoring + alerting + backups; restricted access; secrets per-env.
- Distinguish environments in logs/Sentry (env tag) so you don't confuse them.

## Incident detection (ties to INCIDENT_RESPONSE_PLAN.md)
- Detection sources: uptime/Sentry/job-failure alerts, audit-log review (esp. support access + cross-tenant anomalies), clinic reports, CI test regressions.
- On a real alert → open the incident loop; don't sit on SEV-1/2.

---

## Observability checklist (pre-launch)
- [ ] Sentry live, PII scrubbing verified (no patient data in a captured error).
- [ ] Structured logs with IDs only; sensitive-field denylist in place.
- [ ] `/healthz` live; uptime monitor pinging + alerting.
- [ ] Job-failure + backup-failure alerts configured.
- [ ] PITR enabled + retention noted; daily encrypted dump running.
- [ ] One successful **test restore** documented (RTO measured).
- [ ] File storage versioning/retention on.
- [ ] Prod/staging separated; no real data in staging.
- [ ] "No-PHI-in-logs" test passing.
