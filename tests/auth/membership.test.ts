import { describe, expect, it } from "vitest";
import { evaluateStaffLifecyclePermission, type StaffLifecycleMember } from "@/lib/auth/membership-rules";

const owner: StaffLifecycleMember = {
  id: "00000000-0000-0000-0000-000000000101",
  userId: "00000000-0000-0000-0000-000000000001",
  role: "owner",
  status: "active",
};

const manager: StaffLifecycleMember = {
  id: "00000000-0000-0000-0000-000000000102",
  userId: "00000000-0000-0000-0000-000000000002",
  role: "manager",
  status: "active",
};

const otherManager: StaffLifecycleMember = {
  id: "00000000-0000-0000-0000-000000000104",
  userId: "00000000-0000-0000-0000-000000000004",
  role: "manager",
  status: "active",
};

const assistant: StaffLifecycleMember = {
  id: "00000000-0000-0000-0000-000000000103",
  userId: "00000000-0000-0000-0000-000000000003",
  role: "assistant",
  status: "active",
};

describe("Milestone 4 membership lifecycle rules", () => {
  it("allows owner to manage staff", () => {
    expect(
      evaluateStaffLifecyclePermission({
        actorUserId: owner.userId,
        actorRole: "owner",
        operation: "change_role",
        target: assistant,
        nextRole: "receptionist",
        activeOwnerCount: 2,
      }),
    ).toEqual({ allowed: true });
  });

  it("allows manager limited management for non-elevated staff", () => {
    expect(
      evaluateStaffLifecyclePermission({
        actorUserId: manager.userId,
        actorRole: "manager",
        operation: "suspend",
        target: assistant,
        activeOwnerCount: 1,
      }),
    ).toEqual({ allowed: true });
  });

  it("blocks manager from managing owners or managers", () => {
    expect(
      evaluateStaffLifecyclePermission({
        actorUserId: manager.userId,
        actorRole: "manager",
        operation: "remove",
        target: owner,
        activeOwnerCount: 2,
      }),
    ).toEqual({ allowed: false, reason: "manager_cannot_manage_elevated_role" });

    expect(
      evaluateStaffLifecyclePermission({
        actorUserId: manager.userId,
        actorRole: "manager",
        operation: "remove",
        target: otherManager,
        activeOwnerCount: 2,
      }),
    ).toEqual({ allowed: false, reason: "manager_cannot_manage_elevated_role" });
  });

  it("blocks manager from assigning owner or manager roles", () => {
    expect(
      evaluateStaffLifecyclePermission({
        actorUserId: manager.userId,
        actorRole: "manager",
        operation: "change_role",
        target: assistant,
        nextRole: "owner",
        activeOwnerCount: 1,
      }),
    ).toEqual({ allowed: false, reason: "manager_cannot_assign_elevated_role" });

    expect(
      evaluateStaffLifecyclePermission({
        actorUserId: manager.userId,
        actorRole: "manager",
        operation: "change_role",
        target: assistant,
        nextRole: "manager",
        activeOwnerCount: 1,
      }),
    ).toEqual({ allowed: false, reason: "manager_cannot_assign_elevated_role" });
  });

  it("blocks self suspend and remove", () => {
    expect(
      evaluateStaffLifecyclePermission({
        actorUserId: owner.userId,
        actorRole: "owner",
        operation: "suspend",
        target: owner,
        activeOwnerCount: 2,
      }),
    ).toEqual({ allowed: false, reason: "self_offboarding" });

    expect(
      evaluateStaffLifecyclePermission({
        actorUserId: owner.userId,
        actorRole: "owner",
        operation: "remove",
        target: owner,
        activeOwnerCount: 2,
      }),
    ).toEqual({ allowed: false, reason: "self_offboarding" });
  });

  it("blocks removing, suspending, or demoting the last active owner", () => {
    for (const operation of ["remove", "suspend"] as const) {
      expect(
        evaluateStaffLifecyclePermission({
          actorUserId: "00000000-0000-0000-0000-000000000999",
          actorRole: "owner",
          operation,
          target: owner,
          activeOwnerCount: 1,
        }),
      ).toEqual({ allowed: false, reason: "last_owner" });
    }

    expect(
      evaluateStaffLifecyclePermission({
        actorUserId: "00000000-0000-0000-0000-000000000999",
        actorRole: "owner",
        operation: "change_role",
        target: owner,
        nextRole: "manager",
        activeOwnerCount: 1,
      }),
    ).toEqual({ allowed: false, reason: "last_owner" });
  });
});
