# Changelog

## 2026-06-13 - Milestone 0 repository preparation

### Added

- Root `README.md` with planning links, locked stack summary, package manager decision, and milestone execution rule.
- `.env.example` with required environment variable names only and no real values.
- `.gitignore` for Node, Next.js, Vercel, env files, logs, coverage, OS/editor files, and local Python artifacts.
- `.nvmrc` with Node.js 22.
- `docs/CONVENTIONS.md` documenting locked stack rules, forbidden stack rules, Supabase and RLS rules, service-role boundaries, Arabic RTL rules, no-PHI logging, naming conventions, milestone execution, External Design usage, UI quality bar, anti-generic design rules, and the requirement to follow `BUILD_ORDER_V1.md`.
- `docs/DESIGN_REFERENCE.md` translating the External Design reference into Ayadajo-specific design rules.
- UI/UX Pro Max skill files under `.codex/skills/ui-ux-pro-max/` via the requested installer.

### Verified

- Read all files in `planning/`.
- Read `planning/BUILD_ORDER_V1.md` and confirmed only Milestone 0 is in scope.
- Read External Design files: `DESIGN.md`, `theme.css`, `tokens.json`, and `variables.css`.
- Confirmed the repository is fresh and contains planning/design materials, with no app scaffold yet.
- Confirmed no conflicting stack files were found: no `prisma/`, `schema.prisma`, Drizzle files, NextAuth/Auth.js files, or Neon-specific configuration outside planning materials.
- Confirmed no package manager files exist yet; selected `pnpm` for future initialization per Milestone 0 guidance.

### UI/UX Skill Initialization

- Command run:

```powershell
uipro init --ai codex https://ui-ux-pro-max-skill.nextlevelbuilder.io/
```

- Result: success. The installer created `.codex/skills/ui-ux-pro-max/`.

### External Design Ingestion

- The external reference was summarized into Ayadajo-specific rules in `docs/DESIGN_REFERENCE.md`.
- The reference is treated as design-system inspiration only. Brand names, logos, copy, fintech concepts, and unrelated illustration ideas must not be copied.

### Conflicts or Blockers

- No conflicting stack files found.
- No blockers found for Milestone 0.
