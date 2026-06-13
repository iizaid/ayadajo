import type { ClinicRole } from "./permissions";

export type StaffLifecycleOperation = "invite" | "change_role" | "suspend" | "remove";

export type StaffLifecycleMember = {
  id: string;
  userId: string;
  role: ClinicRole;
  status: "active" | "invited" | "suspended" | "removed";
};

export type StaffLifecycleDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | "forbidden"
        | "self_offboarding"
        | "target_not_found"
        | "manager_cannot_manage_elevated_role"
        | "manager_cannot_assign_elevated_role"
        | "last_owner";
    };

const managerAssignableRoles = ["doctor", "receptionist", "accountant", "assistant"] as const;

function isManagerAssignableRole(role: ClinicRole): boolean {
  return managerAssignableRoles.includes(role as (typeof managerAssignableRoles)[number]);
}

function isElevatedStaffRole(role: ClinicRole): boolean {
  return role === "owner" || role === "manager";
}

export function evaluateStaffLifecyclePermission(input: {
  actorUserId: string;
  actorRole: ClinicRole;
  operation: StaffLifecycleOperation;
  target?: StaffLifecycleMember | null;
  nextRole?: ClinicRole;
  activeOwnerCount: number;
}): StaffLifecycleDecision {
  if (input.actorRole !== "owner" && input.actorRole !== "manager") {
    return { allowed: false, reason: "forbidden" };
  }

  if (input.operation !== "invite" && !input.target) {
    return { allowed: false, reason: "target_not_found" };
  }

  if (
    input.target &&
    input.target.userId === input.actorUserId &&
    (input.operation === "suspend" || input.operation === "remove")
  ) {
    return { allowed: false, reason: "self_offboarding" };
  }

  if (input.actorRole === "manager") {
    if (input.target && isElevatedStaffRole(input.target.role)) {
      return { allowed: false, reason: "manager_cannot_manage_elevated_role" };
    }

    if (input.nextRole && !isManagerAssignableRole(input.nextRole)) {
      return { allowed: false, reason: "manager_cannot_assign_elevated_role" };
    }
  }

  if (
    input.target?.role === "owner" &&
    input.target.status === "active" &&
    input.activeOwnerCount <= 1 &&
    (input.operation === "suspend" ||
      input.operation === "remove" ||
      (input.operation === "change_role" && input.nextRole !== "owner"))
  ) {
    return { allowed: false, reason: "last_owner" };
  }

  return { allowed: true };
}
