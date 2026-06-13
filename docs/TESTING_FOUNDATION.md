# Testing Foundation

Milestone 5 separates fast repository checks from live local Supabase launch-blocker checks.

## Test Categories

- Static tests: inspect migrations, seeds, service-role boundaries, and generated source patterns without a database.
- Unit tests: verify pure TypeScript rules such as `authorize()`, role-permission parity, tenancy guard decisions, membership lifecycle rules, rate limiting, and audit summary sanitization.
- Live local Supabase tests: run against the local Supabase API and database after migrations and seed apply. These tests prove RLS behavior through real authenticated Supabase clients.

## Commands

```powershell
pnpm test
```

Runs normal unit/static tests only. This command intentionally excludes `tests/live/**` so it can run in CI and in environments without Docker.

```powershell
pnpm test:unit
```

Runs component/auth unit tests.

```powershell
pnpm test:security
```

Runs static security and auth tests.

```powershell
pnpm supabase:db:reset
pnpm test:db
```

Runs the live local Supabase/RLS launch-blocker tests. Docker Desktop and Supabase local must be running. The harness refuses non-local URLs.

## Live Supabase Harness

The live harness is under `tests/live/`.

- It reads local Supabase URL and keys from `SUPABASE_LOCAL_URL`, `SUPABASE_LOCAL_ANON_KEY`, and `SUPABASE_LOCAL_SERVICE_ROLE_KEY`, or from `pnpm supabase status -o env`.
- It accepts only `localhost`, `127.0.0.1`, or `::1`.
- It uses the local service-role key only inside test setup to create synthetic users, clinics, memberships, and tenant rows.
- It verifies RLS using normal anon/authenticated Supabase clients.
- Service-role access is not imported into `app/`, `components/`, `lib/auth/`, or clinic-user paths.

## Launch-Blocker Coverage In M5

`pnpm test:db` creates two synthetic clinics and users for Owner, Manager, Receptionist, Doctor, Assistant, Accountant, suspended/removed users, and a no-membership user.

It verifies:

- Clinic A cannot read Clinic B tenant rows across the seeded tenant table set, even when the app omits a `clinic_id` filter.
- Clinic B cannot read Clinic A patient data.
- Active members can read their own clinic rows.
- Suspended, removed, and no-membership users cannot read clinic rows.
- Anonymous users cannot read or insert private clinic data, and public booking inserts remain closed before M10.
- Cross-tenant inserts and cross-clinic composite foreign keys are rejected.
- Permission-based RLS writes behave for owner, manager limited staff management, receptionist front-desk writes, and denied doctor/assistant/accountant writes.
- Sensitive deferred tables remain closed to normal clinic users.
- The appointment overlap exclusion constraint blocks overlapping active appointments while allowing non-overlap, cancelled/no-show exclusions, different doctors, and different clinics.

## CI Decision

Current CI runs `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.

Live Supabase tests are kept as local launch-blocker tests for M5 because they require Docker services and local Supabase startup. Before M6 review, run:

```powershell
pnpm supabase:db:reset
pnpm test:db
```

Future CI can add Supabase service integration, but M5 does not overcomplicate CI.

## Deferred Coverage

- Appointment race/idempotency tests are added in M9 with appointment workflows.
- Public booking abuse tests are added in M10.
- File storage policy and signed URL tests are added in M11.
- Payment correctness tests are added in M12.
- Reminder and WhatsApp status tests are added in M13.
- Subscription gating tests are completed in M14.
- No-PHI logging, backups, restore, and production monitoring gates are completed in M15/M16.
