import { describe, expect, it } from "vitest";
import {
  authorize,
  hasPermission,
  ROLE_PERMISSIONS,
  type ClinicRole,
  type PermissionCode,
  type PermissionSession,
} from "@/lib/auth/permissions";

function session(role: ClinicRole, status: "active" | "invited" | "suspended" | "removed" = "active") {
  return {
    user: {
      id: "00000000-0000-0000-0000-000000000001",
      authUserId: "00000000-0000-0000-0000-000000000002",
    },
    activeClinic: {
      clinicId: "00000000-0000-0000-0000-000000000010",
      role,
      status,
    },
  } satisfies PermissionSession;
}

describe("Milestone 4 authorize()", () => {
  it("denies by default when unauthenticated or no active clinic exists", () => {
    expect(authorize(null, "dashboard.view")).toMatchObject({
      allowed: false,
      reason: "unauthenticated",
    });

    expect(authorize({ ...session("owner"), activeClinic: null }, "dashboard.view")).toMatchObject({
      allowed: false,
      reason: "no_active_clinic",
    });
  });

  it("requires an active membership", () => {
    expect(authorize(session("owner", "suspended"), "dashboard.view")).toMatchObject({
      allowed: false,
      reason: "inactive_membership",
    });
  });

  it("returns cross-tenant denial instead of granting access to another clinic", () => {
    expect(
      authorize(session("owner"), "patient.update", {
        clinicId: "00000000-0000-0000-0000-000000000099",
      }),
    ).toMatchObject({
      allowed: false,
      reason: "cross_tenant",
    });
  });

  it("keeps owner powerful while manager is not equal for staff ownership-sensitive actions", () => {
    expect(hasPermission("owner", "staff.manage")).toBe(true);
    expect(hasPermission("manager", "staff.manage")).toBe(false);
    expect(hasPermission("manager", "staff.manage_limited")).toBe(true);
  });

  it("keeps assistant limited to non-sensitive daily support permissions", () => {
    expect(hasPermission("assistant", "dashboard.view")).toBe(true);
    expect(hasPermission("assistant", "appointment.mark_arrived")).toBe(true);

    const denied: PermissionCode[] = [
      "patient.create",
      "patient.update",
      "booking_request.approve",
      "payment.record",
      "settings.manage",
      "staff.manage",
      "audit_log.view",
    ];

    for (const permission of denied) {
      expect(authorize(session("assistant"), permission)).toMatchObject({
        allowed: false,
        reason: "forbidden",
      });
    }
  });

  it("does not grant doctor broad patient, payment, staff, or settings permissions", () => {
    expect(hasPermission("doctor", "treatment_note.write")).toBe(true);
    expect(hasPermission("doctor", "treatment_plan.write")).toBe(true);

    for (const permission of [
      "patient.create",
      "patient.update",
      "payment.record",
      "settings.manage",
      "staff.manage",
    ] satisfies PermissionCode[]) {
      expect(authorize(session("doctor"), permission).allowed).toBe(false);
    }
  });

  it("keeps receptionist in front-desk scope only", () => {
    expect(hasPermission("receptionist", "patient.create")).toBe(true);
    expect(hasPermission("receptionist", "patient.update")).toBe(true);
    expect(hasPermission("receptionist", "appointment.manage")).toBe(true);
    expect(hasPermission("receptionist", "payment.record")).toBe(true);
    expect(hasPermission("receptionist", "invoice.create")).toBe(true);

    expect(hasPermission("receptionist", "invoice.void")).toBe(false);
    expect(hasPermission("receptionist", "payment.reverse")).toBe(false);
    expect(hasPermission("receptionist", "staff.manage")).toBe(false);
    expect(hasPermission("receptionist", "settings.manage")).toBe(false);
  });

  it("keeps the local matrix aligned with the seeded least-privilege roles", () => {
    expect(ROLE_PERMISSIONS.assistant).toEqual(["dashboard.view", "appointment.mark_arrived"]);
    expect(ROLE_PERMISSIONS.accountant).not.toContain("patient.medical_alerts.view");
    expect(ROLE_PERMISSIONS.doctor).not.toContain("appointment.manage");
    expect(ROLE_PERMISSIONS.manager).toContain("audit_log.view");
    expect(ROLE_PERMISSIONS.owner).toContain("audit_log.view");
  });
});
