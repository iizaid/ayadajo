# Ayadajo — UI/UX Plan

**Arabic-first, RTL-first, receptionist-speed.** The product lives or dies on whether a non-technical receptionist can run the day without training.

---

## Design principles
1. **Speed over beauty.** Fewer clicks, instant search, big tap targets. The hottest paths (find patient, book, mark arrived, remind) must be 1–3 actions.
2. **One screen for "today."** Today's Schedule is the home base for reception; everything is reachable from it.
3. **Familiar, not clever.** Mirror the mental model of a paper appointment book + patient card. No jargon.
4. **Show, then let act.** Each list row exposes its key actions inline (no deep menus for common actions).
5. **Forgiving.** Confirmations for destructive actions; undo where possible; clear error recovery on weak internet.
6. **Calm density.** Information-dense but not noisy; clear hierarchy; generous spacing for touch.
7. **Arabic & RTL are first-class**, not an afterthought layer.

---

## RTL & Arabic specifics
- App default `dir="rtl"`, `lang="ar"`. Build components RTL-first; verify mirrored layouts (icons, chevrons, progress, calendars flip).
- **Typography:** a clean Arabic UI font — **IBM Plex Sans Arabic**, **Cairo**, or **Noto Sans Arabic** (test rendering weights/numerals). Slightly larger base size + line-height for Arabic legibility.
- **Numerals:** default Western digits (`0-9`) for phones, money, times (clearer for data); allow Eastern Arabic numerals as a later preference.
- **Dates/times:** localized Arabic, `Asia/Amman`; clinic-configurable week start (Sat/Sun).
- **Mixed content:** handle Latin names/phone numbers inside RTL text correctly (bidi isolation).
- **Don't** hardcode left/right; use logical CSS (`start`/`end`, `margin-inline`).

## Responsiveness
- **Desktop-first dashboard** (reception desktop is the primary device) but fully responsive.
- **Tablet-friendly** (chairside doctor use): large touch targets, readable at arm's length.
- **Mobile** (owner on the go, doctor glancing): dashboard cards, today's list, patient lookup work well one-handed.

## Accessibility basics
- Sufficient contrast (and a colorblind-safe palette — note: the operator's theme is daltonized; don't rely on color alone for status — use labels/icons too).
- Keyboard navigable; focus states; semantic HTML; labelled inputs; `aria` on interactive components (shadcn/ui helps).
- Status conveyed by text + icon, not color only.
- Hit targets ≥ 44px; readable font sizes.

## State design (every list/page)
- **Empty states:** friendly Arabic + a primary action ("No patients yet — add your first patient").
- **Loading states:** skeletons for lists/cards (not spinners that hide layout).
- **Error states:** clear Arabic message + retry; never a raw error; preserve form input.
- **Optimistic UI** for the hottest actions (mark arrived, status change) with rollback on failure.

---

## Making the receptionist workflow fast
- **Global search** (patient by name/phone) always in the header; keyboard shortcut; instant results.
- **Quick add patient** inline from the booking flow (don't force leaving the screen).
- **Today's Schedule** with inline actions: confirm / arrived / complete / no-show / remind — one click each.
- **Book in ≤3 steps:** pick slot (or click empty calendar slot) → pick/quick-add patient → confirm.
- **Reminder = one click** (WhatsApp deep link opens pre-filled).
- Sticky "today" and "new appointment" buttons.

## Making the doctor workflow minimal
- Doctor landing = **My Day** (their appointments only, big and simple).
- Open patient → history visible immediately (newest note on top).
- **Add note in ≤20 seconds:** a single text box + optional tooth/area + save. No mandatory structured fields in MVP.
- Mark complete from the same screen.

---

## Main pages (with purpose + key elements)

| Page | Purpose | Key elements |
|---|---|---|
| **Landing Page** | Marketing/sell | Arabic value prop, screenshots, "request a demo" CTA, contact (WhatsApp) |
| **Login** | Auth | email/password, forgot link, clinic chooser if multi |
| **Forgot/Reset Password** | Recovery | email entry, reset form |
| **Trial Onboarding** | First-run | welcome, set password, quick setup checklist (hours, services, first patient) |
| **Clinic Dashboard** | Owner overview | metric cards (operational + financial gated), today's upcoming, trial/sub banner |
| **Today's Schedule** | Reception home | grouped list (upcoming/waiting/in-progress/done), inline actions, search |
| **Calendar** | Visual schedule | day (default)/week, doctor columns, click-to-book, working-hour shading |
| **Patients List** | Find/manage | search, list, add button, archived filter |
| **Patient Profile** | 360° view | contact, medical alerts, appointments, notes, plan, payments/balance, files |
| **Add/Edit Patient** | CRUD | minimal required fields, phone validation, dedupe warn |
| **Add/Edit Appointment** | Booking | patient, doctor, service, date/time, duration, note; conflict feedback |
| **Treatment Notes** | Clinical | note list (newest first), add note, follow-up instruction |
| **Treatment Plans** | Plan | items list with price/status, totals, mark done, outstanding |
| **Payments** | Money in | record payment, per-patient/day lists, balances |
| **Invoices** | Billing | invoice list, create, print/PDF, void |
| **Reports** | Insight | monthly summary, (P2) trends + export |
| **Messages** | Comms log | sent messages, statuses, resend |
| **Message Templates** | Config | edit Arabic templates, variables helper |
| **Team Members** | Staff | list, invite, role, suspend/remove |
| **Roles** | Permissions | read-only role matrix (MVP) |
| **Clinic Settings** | Config | profile, working hours, services, doctors, booking toggle, language |
| **Public Booking Page** | Patient | service/date/time/details, RTL, mobile |
| **Booking Success** | Confirm | request received + clinic contact |
| **Super Admin Dashboard** | Fleet KPIs | status breakdown, trials/renewals due, alerts |
| **SA Clinics / Clinic Details** | Fleet ops | list + per-clinic ops view + actions |
| **SA Subscriptions / Payments / Plans** | Billing | manage subscriptions, record payments, manage plans |
| **SA Audit Logs** | Oversight | filterable platform audit incl. support access |

---

## Navigation model
- **Clinic app:** left (or right, RTL → right) sidebar: Dashboard, Today, Calendar, Patients, Payments, Invoices, Messages, Reports, Settings. Role-filtered (doctor sees fewer items).
- **Header:** global patient search, clinic name/switcher, user menu, subscription banner.
- **Super Admin:** separate shell, distinct color, clearly "AtlasJo Admin."

## Component system
- shadcn/ui + Tailwind, RTL-configured. Reusable: DataTable (search/sort/paginate), StatusBadge, MetricCard, AppointmentRow, PatientCard, EmptyState, ConfirmDialog, FormField (Zod-wired).
- Consistent status colors **with labels** (booked/confirmed/arrived/completed/cancelled/no-show), colorblind-safe.

## Visual tone
- Clean, calm, trustworthy (health context). Soft neutral background, one primary accent, clear status colors. Avoid heavy gradients/animation that slow weak devices.

## English support — Later
- Architve copy via an i18n layer (keys, not hardcoded strings) from day one so adding `en` later is config, not rewrite — but ship `ar` only.
