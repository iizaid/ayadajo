# Ayadajo — SLA & Status Communication

Honest, modest commitments for a solo/small team — under-promise, over-deliver. Clinics depend on this daily, so **communication during problems matters as much as uptime.**

> V1 stance: set *realistic* expectations, not enterprise SLAs you can't meet. Trust comes from honesty + responsiveness, not big numbers.

---

## Availability target (internal goal, communicate modestly)
- Internal aim: **~99% monthly uptime** (best-effort). Don't publish a hard "99.9% guaranteed" you can't back with credits/redundancy yet.
- To clinics, say: *"Ayadajo is built on reliable cloud infrastructure (Supabase + Vercel). We monitor it continuously and respond quickly to any issue. We'll always tell you if something's wrong."*
- Planned maintenance: schedule in low-traffic windows, notify in advance when it could affect them.

## Support response targets (by plan — see PRICING)
| Severity | Description | Target first response |
|---|---|---|
| **Urgent (P1)** | Clinic blocked, data/security issue, outage | ASAP within working hours; same day |
| **High (P2)** | Important feature broken, workaround exists | Within 1 business day |
| **Normal (P3)** | Question / minor issue / request | Within ~2–3 business days |
- Pro/Plus get **priority**; Pilot clinics get **founder-level** fast response.
- Support hours: clinic working hours (≈ Sun–Thu + Sat mornings); communicate them clearly. Don't imply 24/7.
- Channels: WhatsApp (primary), phone (urgent), email (records). See SUPPORT_AND_OPERATIONS.md.

## Status communication (when something goes wrong)
**Principle: tell clinics before they tell you, in plain Arabic, with what + impact + ETA + next update.**

### Channels
- **Direct WhatsApp** to affected clinic owners (primary for V1 — personal + immediate).
- A simple **status note/page** (even a lightweight hosted status page) for broader incidents (P2).
- Email for formal/record follow-up.

### Incident communication flow (ties to INCIDENT_RESPONSE_PLAN.md)
1. **Detect** (monitoring/clinic report).
2. **Acknowledge fast:** "We're aware of an issue affecting [X]. We're on it. Next update in [time]." (Even before you have a fix.)
3. **Update on the promised cadence** (e.g. every 30–60 min for an outage) — even "still working on it" maintains trust.
4. **Resolve:** "Resolved as of [time]. Cause: [plain summary]. What we're doing to prevent it."
5. **Follow-up** for serious incidents: a short written note to affected clinics.

### What to communicate
- What's affected + the user impact (in their terms, not jargon).
- What you're doing + realistic ETA (don't over-promise).
- Workarounds if any.
- When the next update will come.
- **No blame, no PHI, no internal detail.** Honest and calm.

### Severity → who to tell
- **Outage / data / security (SEV-1):** all affected clinic owners immediately; regulators/patients only as required **[LEGAL]** (via INCIDENT_RESPONSE_PLAN).
- **Degraded / single-feature (SEV-2):** affected clinics; status note if broad.
- **Minor (SEV-3):** the reporting clinic; fix in normal flow.

## Maintenance windows
- Prefer evenings/low-traffic; avoid pilot clinics' busy hours.
- Notify ≥1 day ahead if downtime is expected; keep it short; confirm when done.

## Data & continuity commitments (state plainly to clinics)
- "Your data is backed up daily and we test restores." (OBSERVABILITY_AND_BACKUP_PLAN.md)
- "Your data is yours — you can export it, and we'll never share it." (LEGAL docs)
- "If our subscription ends, you get a window to export before deletion." (SUBSCRIPTION + LEGAL)

## What NOT to promise (yet)
- 24/7 support, instant response, a contractual uptime % with financial credits, or features not in V1. Grow these as the business matures; honesty now beats broken promises later.

## Internal cadence
- Daily: check monitoring + support queue.
- During an incident: follow the comms flow above; log timeline (no PHI).
- Post-incident: brief clinics affected; capture prevention actions.
