import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const serviceRoleEnvName = ["SUPABASE", "SERVICE", "ROLE", "KEY"].join("_");

function readSourceFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return readSourceFiles(fullPath);
    }

    if (!/\.(ts|tsx|js|mjs)$/.test(entry)) {
      return [];
    }

    return [fullPath];
  });
}

function readInitialMigration(): string {
  return readFileSync(
    path.join(root, "supabase", "migrations", "0001_init.sql"),
    "utf8",
  ).toLowerCase();
}

describe("Supabase service-role boundary", () => {
  it("reads the service-role env var only inside the server-only admin client", () => {
    const files = [
      ...readSourceFiles(path.join(root, "app")),
      ...readSourceFiles(path.join(root, "components")),
      ...readSourceFiles(path.join(root, "lib")),
      path.join(root, "middleware.ts"),
    ];

    const hits = files
      .filter((filePath) => existsSync(filePath))
      .filter((filePath) => readFileSync(filePath, "utf8").includes(serviceRoleEnvName))
      .map((filePath) => path.relative(root, filePath).replaceAll("\\", "/"));

    expect(hits).toEqual(["lib/supabase/admin.ts"]);
  });

  it("does not import the admin Supabase client from M4 auth, audit, or app routes", () => {
    const files = [
      ...readSourceFiles(path.join(root, "app")),
      ...readSourceFiles(path.join(root, "lib", "auth")),
      ...readSourceFiles(path.join(root, "lib", "audit")),
    ];

    const hits = files
      .filter((filePath) => existsSync(filePath))
      .filter((filePath) => readFileSync(filePath, "utf8").includes("createAdminSupabaseClient"))
      .map((filePath) => path.relative(root, filePath).replaceAll("\\", "/"));

    expect(hits).toEqual([]);
  });

  it("keeps Milestone 2 migration limited to platform base tables", () => {
    const migration = readInitialMigration();

    expect(migration).toContain("create table public.users");
    expect(migration).toContain("create table public.plans");
    expect(migration).not.toMatch(/create table public\.(clinics|patients|appointments|payments|files)\b/);
  });

  it("enables minimal RLS on Milestone 2 platform tables", () => {
    const migration = readInitialMigration();

    expect(migration).toContain("alter table public.users enable row level security");
    expect(migration).toContain("alter table public.plans enable row level security");
    expect(migration).toContain("create policy users_select_own_profile");
    expect(migration).toContain("using (auth_user_id = auth.uid())");
    expect(migration).toContain("create policy plans_select_active");
    expect(migration).toContain("using (is_active = true)");
    expect(migration).not.toMatch(/for\s+(insert|update|delete)\s+to\s+authenticated/);
  });
});
