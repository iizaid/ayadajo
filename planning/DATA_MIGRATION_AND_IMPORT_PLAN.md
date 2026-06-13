# Ayadajo — Data Migration & Import Plan

Clinics arrive with patients in **Excel, phone contacts, or paper**. A smooth import is make-or-break for trial onboarding. V1 supports **assisted patient import** (CSV/Excel) — nothing more.

> Principle: import the **minimum to be useful now** (active patients + phone), not a perfect historical migration. Don't let a messy spreadsheet block the trial.

---

## Scope: what to import in V1
- **Patients only.** Name + phone (required), plus optional email, DOB, gender, notes.
**What NOT to import in V1:**
- Historical appointments, treatment notes, treatment plans, payments, invoices, files.
- Reason: high mapping/quality risk, low immediate value, and clinical/financial history rarely exists cleanly in Excel. Start fresh going forward; keep old records as the clinic's reference. (Historical import = post-V1, case-by-case, white-glove.)

---

## Required vs optional columns

**Required:**
| Column | Notes |
|---|---|
| `full_name` | non-empty |
| `phone` | Jordan number; normalized on import |

**Optional:**
| Column | Notes |
|---|---|
| `email` | validated if present |
| `date_of_birth` | parsed to date; multiple input formats tolerated |
| `gender` | mapped to male/female/other |
| `notes` | free text |
| `medical_alerts` | free text (sensitive) |

- Provide a **template file** (Arabic + English headers) so clinics fill it correctly.
- Accept `.xlsx` and `.csv`; tolerate extra/unknown columns (ignored) and column-order differences (map by header).

## Phone normalization (Jordan)
- Accept: `07XXXXXXXX`, `+9627XXXXXXXX`, `009627XXXXXXXX`, with spaces/dashes.
- Normalize all to canonical `+9627XXXXXXXX`.
- Reject/flag numbers that can't be normalized (too short/long, non-Jordan) — show in the error list, don't silently drop.
- Landlines / non-mobile: allow but flag (reminders need mobile/WhatsApp).

## Duplicate detection
- Within the file: flag rows with the same normalized phone.
- Against existing clinic patients: flag matches on normalized phone (and optionally close name match).
- Default behavior: **skip duplicates** (don't create), list them for review; let the importer choose "skip" or "create anyway" per the preview.

## Import preview (mandatory before commit)
- Show: total rows, valid rows, rows with warnings, rows with errors, detected duplicates.
- Let the importer review a sample table (mapped fields) and the error/duplicate lists.
- **Nothing is written until the importer confirms** the preview.

## Validation errors
- Per-row: missing name/phone, unnormalizable phone, invalid email/DOB.
- Surface a clear, downloadable error list (row number + reason) so the clinic can fix and re-upload.
- Valid rows can be imported while invalid rows are reported (partial import) — or all-or-nothing if the importer prefers; default = import valid, report the rest.

## Rollback strategy
- Each import is a **batch** with an `import_id`; imported patients tagged with it.
- If an import was wrong, AtlasJo can **revert that batch** (archive the patients created by that `import_id`) — provided they have no appointments/notes/payments yet.
- Always preview first to avoid needing rollback; keep batches small for early imports.

## Manual import option (white-glove)
- For messy/large lists, AtlasJo does the import **for** the clinic: clean the file, map columns, run the preview, confirm.
- This is part of onboarding (and the optional paid onboarding add-on) — reduces friction and protects data quality.

## Who can import
- **Clinic side:** Owner / Manager (gated).
- **AtlasJo side:** Super Admin (on behalf, during onboarding) — under the normal tenant-scoped path (imports write to that clinic only).
- Receptionist/Doctor/Accountant/Assistant: no bulk import (avoid accidental mass creation).

## Audit logging
- Log every import: `data.import` with importer, clinic, `import_id`, row counts (created/skipped/errored). **No patient contents in the audit payload** — counts and IDs only.
- Log reverts similarly.

## Security & isolation
- Import always scoped to the target clinic (`clinic_id` from context); never cross-tenant.
- Validate + sanitize all fields (Zod); treat the uploaded file as untrusted input; cap file size/row count.
- Store the uploaded file privately and delete it after processing; don't leave patient lists in temp storage.
- Medical alerts are sensitive — handle like all PHI (no logs).

## UX notes
- Arabic-first import screen: upload → map (auto by header) → **preview** → confirm → result summary.
- Show progress for large files; clear success/error summary; offer the error list to download.
- Encourage starting with **active/recent patients** (e.g. last 1–2 years) rather than everything.

---

## Step-by-step import flow (summary)
1. Download template (or upload existing file).
2. Upload `.xlsx`/`.csv`.
3. Auto-map columns by header; importer adjusts mapping if needed.
4. System validates + normalizes phones + detects duplicates.
5. **Preview** (counts, sample, warnings, errors, duplicates).
6. Importer confirms (choose duplicate handling).
7. System creates valid patients in a batch (`import_id`); logs audit.
8. Result summary + downloadable error list; option to fix & re-import the rest.
9. (If needed) revert the batch.

## Post-V1 (later)
- Historical appointments/treatments import (white-glove, structured templates).
- Contacts/Google import, de-dup merge tool, scheduled syncs.
