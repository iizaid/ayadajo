# Ayadajo Project Conventions

This document records the binding repository conventions established in Milestone 0. Follow [planning/BUILD_ORDER_V1.md](../planning/BUILD_ORDER_V1.md) one milestone at a time.

## 1. Locked Stack Rules

- Framework: Next.js App Router.
- Language: TypeScript strict.
- Styling: Tailwind CSS and shadcn/ui.
- Auth: Supabase Auth.
- Database: Supabase Postgres.
- Tenant isolation: Supabase RLS is the primary enforcement layer.
- Storage: Supabase Storage with private buckets.
- Hosting: Vercel.
- Email: Resend or Brevo.
- Jobs: Vercel Cron.
- Monitoring: Sentry with PII scrubbing.
- Validation: Zod shared between client and server where appropriate.
- Package manager: `pnpm`.
- Runtime target: Node.js 22, recorded in `.nvmrc`.

## 2. Forbidden Stack Rules

- Do not introduce Prisma.
- Do not introduce Neon.
- Do not introduce Auth.js or NextAuth.
- Do not introduce Drizzle unless explicitly approved later.
- Do not use ORM migrations. Schema changes must use SQL Supabase migrations.
- Do not add a custom session system.
- Do not commit real secrets.
- Do not scaffold product features outside the current milestone.

## 3. Supabase and RLS Rules

- Every tenant-owned table must have `clinic_id NOT NULL`.
- Every tenant-owned table must have RLS enabled before it is used by app code.
- RLS policies must scope access through the authenticated user's active clinic membership.
- Clinic-user data access must use the user-scoped Supabase client so RLS applies.
- App authorization remains required on top of RLS for role permissions.
- Cross-tenant access should return 404, not 403.
- Schema and RLS changes belong in forward-only SQL migrations under `supabase/migrations/`.

## 4. Service-Role Boundary Rules

- The Supabase service-role key bypasses RLS.
- The service-role key is server-only and env-only.
- The service-role client may be used only for clearly marked Super Admin or trusted background job paths.
- Service-role use is forbidden in clinic-user request paths.
- If a clinic-user flow appears to need the service role, stop and ask before implementing.
- Future code should keep the service-role client in one obvious server-only module and test that it is not imported elsewhere.

## 5. Arabic RTL Rules

- Arabic is the first shipped language.
- UI defaults must be `lang="ar"` and `dir="rtl"`.
- Use logical CSS properties and Tailwind utilities that respect start/end semantics.
- Do not hardcode left/right layout assumptions.
- Use an i18n key layer from the beginning; avoid hardcoded UI strings.
- Render dates and times for `Asia/Amman`; store timestamps in UTC.
- Prefer Western digits for operational clarity unless a later product decision changes this.
- Handle mixed Arabic, Latin names, phone numbers, and amounts with bidi-safe rendering.

## 6. No PHI Logging Rules

- Do not log patient names, phone numbers, medical notes, message bodies, file contents, or other PHI.
- Do not put PHI in URLs, Sentry events, cron logs, analytics, or audit summaries.
- Logs may contain IDs such as `clinic_id`, `user_id`, `request_id`, and entity IDs.
- User-facing errors must be Arabic-friendly and generic.
- Sensitive actions must be audited without PHI in payloads.

## 7. File and Folder Naming Conventions

- Use kebab-case for route folders and documentation file names unless an established convention requires otherwise.
- Use PascalCase for React components.
- Use camelCase for variables, functions, and TypeScript values.
- Use UPPER_SNAKE_CASE for environment variables.
- Keep module code grouped by domain once product features begin.
- Keep Supabase SQL migrations ordered, forward-only, and descriptive.
- Keep planning documents in `planning/` and operational conventions in `docs/`.

## 8. Milestone Execution Rules

- Follow [planning/BUILD_ORDER_V1.md](../planning/BUILD_ORDER_V1.md) exactly.
- Execute one milestone per run.
- Stop and report after each milestone.
- Do not start later milestone work early.
- Update `CHANGELOG.md` after each milestone.
- Run the milestone's required checks or document why none exist.
- If a conflict appears with stack, auth, tenancy, money, consent, or service-role boundaries, stop and ask.

## 9. External Design Usage Rules

- Use `external design/` as visual inspiration, not as product copy.
- Do not copy brand names, logos, fintech concepts, or irrelevant illustrations.
- Extract the system: warm canvas, off-white surfaces, inset borders, typography density, pill actions, restrained accents, and calm spacing.
- Adapt the feel to Ayadajo, AtlasJo, Arabic RTL, and dental clinic operations.
- Document translated rules in [DESIGN_REFERENCE.md](DESIGN_REFERENCE.md).

## 10. UI Quality Bar

- The interface should feel premium, human, practical, and trustworthy.
- Reception workflows must be fast and dense without becoming noisy.
- Use accessible contrast and do not rely on color alone for status.
- Use consistent iconography from a real icon set such as Lucide.
- Buttons and inputs must have clear hover, focus, disabled, loading, empty, and error states.
- Touch targets should be at least 44px for tablet and mobile workflows.
- Verify desktop, tablet, and mobile layouts when UI exists.

## 11. Anti-AI-Generic Design Rules

- Avoid generic blue or purple SaaS gradients.
- Avoid random glassmorphism.
- Avoid overused dashboard templates.
- Avoid decorative elements that do not help the clinic workflow.
- Avoid pure white page canvases; use a warm cream foundation.
- Avoid heavy shadows on operational cards.
- Avoid cartoon decoration that weakens medical trust.
- Use accent colors sparingly and intentionally.

## 12. Build Order Requirement

[planning/BUILD_ORDER_V1.md](../planning/BUILD_ORDER_V1.md) is the single source of execution order. Milestone 0 establishes repository preparation only. Milestone 1 is the earliest point to scaffold the Next.js application and UI foundation.

## UI/UX Pro Max Initialization

The UI/UX Pro Max skill was initialized during Milestone 0 with:

```powershell
uipro init --ai codex https://ui-ux-pro-max-skill.nextlevelbuilder.io/
```

Result: success. The installer created `.codex/skills/ui-ux-pro-max/`.
