import { describe, expect, it } from "vitest";
import { evaluateTenantGuard } from "@/lib/auth/tenancy-rules";
import type { AuthSession, ClinicMembership } from "@/lib/auth/session";

const clinicA = "00000000-0000-0000-0000-000000000010";
const clinicB = "00000000-0000-0000-0000-000000000020";

function membership(overrides: Partial<ClinicMembership> = {}): ClinicMembership {
  return {
    id: "00000000-0000-0000-0000-000000000101",
    clinicId: clinicA,
    clinicName: "عيادة تجريبية",
    clinicSlug: "demo-clinic",
    clinicStatus: "active",
    clinicTimezone: "Asia/Amman",
    role: "owner",
    status: "active",
    isClinical: false,
    ...overrides,
  };
}

function session(overrides: Partial<AuthSession> = {}): AuthSession {
  const activeClinic = membership();

  return {
    user: {
      id: "00000000-0000-0000-0000-000000000001",
      authUserId: "00000000-0000-0000-0000-000000000002",
      email: "owner@example.com",
      fullName: "Owner",
      isPlatformAdmin: false,
      platformRole: null,
    },
    memberships: [activeClinic],
    activeMemberships: [activeClinic],
    activeClinic,
    requiresClinicSelection: false,
    ...overrides,
  };
}

describe("Milestone 4 tenancy guard rules", () => {
  it("redirects unauthenticated users to login", () => {
    expect(evaluateTenantGuard(null)).toEqual({ ok: false, response: "redirect:/login" });
  });

  it("requires choosing an active clinic when session has no trusted active clinic", () => {
    expect(evaluateTenantGuard(session({ activeClinic: null }))).toEqual({
      ok: false,
      response: "redirect:/choose-clinic",
    });
  });

  it("denies suspended active-clinic context", () => {
    const suspended = membership({ status: "suspended" });

    expect(
      evaluateTenantGuard(
        session({
          memberships: [suspended],
          activeMemberships: [],
          activeClinic: suspended,
        }),
      ),
    ).toEqual({ ok: false, response: "redirect:/choose-clinic" });
  });

  it("denies removed active-clinic context", () => {
    const removed = membership({ status: "removed" });

    expect(
      evaluateTenantGuard(
        session({
          memberships: [removed],
          activeMemberships: [],
          activeClinic: removed,
        }),
      ),
    ).toEqual({ ok: false, response: "redirect:/choose-clinic" });
  });

  it("returns notFound for cross-tenant resources", () => {
    expect(evaluateTenantGuard(session(), clinicB)).toEqual({ ok: false, response: "notFound" });
  });

  it("allows matching active clinic resources", () => {
    const decision = evaluateTenantGuard(session(), clinicA);

    expect(decision.ok).toBe(true);
    if (decision.ok) {
      expect(decision.activeClinic.clinicId).toBe(clinicA);
    }
  });
});
