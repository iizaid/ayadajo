import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { sanitizeAuditSummary } from "@/lib/audit/sanitize";

const root = process.cwd();
const auditHelper = readFileSync(path.join(root, "lib", "audit", "index.ts"), "utf8");

describe("Milestone 4 audit helper", () => {
  it("accepts short non-PHI operational summaries", () => {
    expect(sanitizeAuditSummary("member role changed")).toBe("member role changed");
  });

  it("rejects obvious email or phone PHI in audit summaries", () => {
    expect(() => sanitizeAuditSummary("reset for patient@example.com")).toThrow();
    expect(() => sanitizeAuditSummary("called +962 799 000 000")).toThrow();
  });

  it("stays server-side and does not import the service-role client", () => {
    expect(auditHelper).toContain('import "server-only"');
    expect(auditHelper).not.toContain("createAdminSupabaseClient");
    expect(auditHelper).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
