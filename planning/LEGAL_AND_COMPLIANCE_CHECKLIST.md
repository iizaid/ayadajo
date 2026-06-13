# Ayadajo — Legal & Compliance Checklist

> **This is NOT legal advice.** Every item marked **[LEGAL]** — which is effectively all of them — **must be reviewed and finalized with a qualified legal professional licensed in Jordan** before the first **paid** clinic (drafts before the first trial). This checklist organizes what to prepare and review; it does not substitute for counsel.

Framing: AtlasJo is the **data processor**; the clinic is the **data controller** of its patients' data. Patient health data is sensitive — treat the bar as high.

---

## Documents to prepare (drafts now, lawyer-reviewed before paid launch)

### Privacy Policy **[LEGAL]**
- What data is collected (clinic data, staff accounts, patient records incl. health data), why, legal basis, retention, sharing, security, data-subject rights, contact.
- Clinic-facing and (where relevant) patient-facing versions.

### Terms of Service **[LEGAL]**
- AtlasJo ↔ clinic relationship, acceptable use, uptime/SLA expectations, liability limits, payment terms, cancellation, governing law (Jordan), dispute resolution.

### Data Processing Agreement (DPA) **[LEGAL]**
- AtlasJo as processor: scope/purpose, sub-processors (hosting, email, storage), security measures, breach notification, data return/deletion on termination, controller (clinic) responsibilities (incl. obtaining patient consent).

### Clinic Agreement / Order Form **[LEGAL]**
- Plan, price, billing terms, trial terms, start/renewal, who owns the data (clinic owns its data), support terms.

### Patient consent for reminders **[LEGAL]**
- Mechanism for the clinic (controller) to obtain patient consent for WhatsApp/email reminders; consent tracked in-app via `patients.messaging_consent_status` (**default `unknown`; never pre-consented**; `opted_out` blocks reminders) + `messaging_consent_source`/`_at`; clarify AtlasJo facilitates but the clinic is responsible for consent.

---

## Policy areas to define **[LEGAL]**

| Area | What to define |
|---|---|
| **Data retention** | How long patient/medical and financial records are kept (active + post-cancellation). Confirm **medical record retention** requirements in Jordan. |
| **Data export** | Clinics can export their data on request and on cancellation; format; identity verification; audited. |
| **Data deletion** | Soft-delete vs hard-delete timelines; deletion on request/cancellation per retention rules; how patient deletion requests are handled. |
| **Support access** | AtlasJo's limited, time-boxed, logged access to clinic data; documented in DPA; clinic informed. |
| **Hosting location / data residency** | Where data physically lives (Vercel/Neon/Supabase regions, likely outside Jordan). Confirm whether Jordan law/clients require in-region storage; document sub-processors + locations. |
| **Sensitive health data handling** | Extra safeguards for medical data (encryption at rest/in transit, access controls, audit, minimal exposure). |
| **Staff access** | Least-privilege roles; offboarding revokes access; logged. |
| **Audit logs** | Sensitive actions + support access logged; retention of audit logs. |
| **Backup policy** | Backup frequency, encryption, retention, restore testing, where backups live (residency applies to backups too). |
| **Cancellation policy** | Notice, data export window, deletion timeline, refunds (if any). |
| **Trial terms** | 14-day free trial, no obligation, data handling during/after trial, what happens to data if they don't convert. |
| **Payment terms** | Manual payment (CliQ/transfer/cash), invoicing, late/non-payment → read_only/suspended, currency (JOD), taxes. |
| **VAT / e-invoicing** | Whether AtlasJo must charge/report VAT on subscriptions; whether clinic patient-invoices have tax/e-invoicing obligations. **[LEGAL]** |
| **Liability limitations** | Cap liability; disclaim indirect damages; clarify Ayadajo is an operational tool, not a medical device / clinical decision system; clinic responsible for clinical decisions and record accuracy. |

---

## Compliance considerations to confirm with counsel **[LEGAL]**
- **Jordan Personal Data Protection Law** obligations specific to **health data** (lawful basis, consent, sensitive-data rules, data-subject rights, cross-border transfer).
- **Breach notification** obligations: thresholds, timelines, who to notify (regulator, controller, patients). Pre-arrange this so INCIDENT_RESPONSE_PLAN can act fast.
- **Cross-border data transfer** rules given non-Jordan hosting; safeguards required.
- Any **healthcare-sector-specific** regulations for clinic software.
- Whether Ayadajo could be construed as a **medical device** in any feature (avoid clinical-decision features that would trigger this; V1 stays operational).
- Marketing/outreach rules (anti-spam) for WhatsApp/Instagram/email outreach.

---

## Process / gates
- [ ] Draft Privacy Policy, ToS, DPA, Clinic Agreement, Trial Terms (plain Arabic + clear).
- [ ] Define retention/deletion/export/backup/cancellation policies in writing.
- [ ] Confirm hosting/data-residency stance + document sub-processors.
- [ ] Define patient-consent mechanism + in-app tracking.
- [ ] **Engage a qualified Jordanian lawyer** to review **all** of the above. **[LEGAL]**
- [ ] **Legal review complete before the first PAID clinic.** (Drafts shown to trial clinics.) — **hard gate**
- [ ] Pre-arrange a legal contact for incident/breach scenarios.
- [ ] Keep policies versioned; re-review when features change (e.g. adding WhatsApp API, file galleries, automated messaging).

> **Bottom line:** prepare thorough drafts now (they're also a trust/sales asset), but do not take a paying clinic until a Jordanian lawyer has reviewed the legal pack. Health data raises the stakes — when unsure, ask counsel, not assumptions.
