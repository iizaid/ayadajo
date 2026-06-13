export const CLINIC_ROLES = [
  "owner",
  "manager",
  "doctor",
  "receptionist",
  "accountant",
  "assistant",
] as const;

export type ClinicRole = (typeof CLINIC_ROLES)[number];

export const PERMISSIONS = [
  "dashboard.view",
  "dashboard.financial.view",
  "patient.create",
  "patient.update",
  "patient.archive",
  "patient.medical_alerts.view",
  "appointment.manage",
  "appointment.manage_own",
  "appointment.mark_arrived",
  "treatment_note.write",
  "treatment_note.view_full",
  "treatment_note.view_summary",
  "treatment_plan.write",
  "payment.record",
  "payment.reverse",
  "invoice.create",
  "invoice.void",
  "report.export",
  "settings.manage",
  "message_template.manage",
  "reminder.send",
  "booking_request.approve",
  "staff.manage",
  "staff.manage_limited",
  "audit_log.view",
] as const;

export type PermissionCode = (typeof PERMISSIONS)[number];

export type PermissionMembership = {
  clinicId: string;
  role: ClinicRole;
  status: "active" | "invited" | "suspended" | "removed";
};

export type PermissionSession = {
  user: {
    id: string;
    authUserId: string;
  };
  activeClinic: PermissionMembership | null;
};

export type AuthorizationResource = {
  clinicId?: string;
  ownerUserId?: string;
};

export type AuthorizationDecision =
  | { allowed: true; role: ClinicRole; permission: PermissionCode }
  | {
      allowed: false;
      reason: "unauthenticated" | "no_active_clinic" | "inactive_membership" | "cross_tenant" | "forbidden";
      permission: PermissionCode;
    };

export const ROLE_PERMISSIONS: Record<ClinicRole, readonly PermissionCode[]> = {
  owner: [
    "dashboard.view",
    "dashboard.financial.view",
    "patient.create",
    "patient.update",
    "patient.archive",
    "patient.medical_alerts.view",
    "appointment.manage",
    "treatment_note.write",
    "treatment_note.view_full",
    "treatment_plan.write",
    "payment.record",
    "payment.reverse",
    "invoice.create",
    "invoice.void",
    "report.export",
    "settings.manage",
    "message_template.manage",
    "reminder.send",
    "booking_request.approve",
    "staff.manage",
    "audit_log.view",
  ],
  manager: [
    "dashboard.view",
    "dashboard.financial.view",
    "patient.create",
    "patient.update",
    "patient.archive",
    "patient.medical_alerts.view",
    "appointment.manage",
    "treatment_note.write",
    "treatment_note.view_full",
    "treatment_plan.write",
    "payment.record",
    "payment.reverse",
    "invoice.create",
    "invoice.void",
    "report.export",
    "settings.manage",
    "message_template.manage",
    "reminder.send",
    "booking_request.approve",
    "staff.manage_limited",
    "audit_log.view",
  ],
  doctor: [
    "dashboard.view",
    "patient.medical_alerts.view",
    "appointment.manage_own",
    "treatment_note.write",
    "treatment_note.view_full",
    "treatment_plan.write",
    "reminder.send",
  ],
  receptionist: [
    "dashboard.view",
    "patient.create",
    "patient.update",
    "patient.medical_alerts.view",
    "appointment.manage",
    "treatment_note.view_summary",
    "payment.record",
    "invoice.create",
    "reminder.send",
    "booking_request.approve",
  ],
  accountant: [
    "dashboard.view",
    "dashboard.financial.view",
    "payment.record",
    "payment.reverse",
    "invoice.create",
    "invoice.void",
    "report.export",
  ],
  assistant: ["dashboard.view", "appointment.mark_arrived"],
} as const;

export function hasPermission(role: ClinicRole, permission: PermissionCode): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function authorize(
  session: PermissionSession | null,
  action: PermissionCode,
  resource: AuthorizationResource = {},
): AuthorizationDecision {
  if (!session) {
    return { allowed: false, reason: "unauthenticated", permission: action };
  }

  if (!session.activeClinic) {
    return { allowed: false, reason: "no_active_clinic", permission: action };
  }

  if (session.activeClinic.status !== "active") {
    return { allowed: false, reason: "inactive_membership", permission: action };
  }

  if (resource.clinicId && resource.clinicId !== session.activeClinic.clinicId) {
    return { allowed: false, reason: "cross_tenant", permission: action };
  }

  if (!hasPermission(session.activeClinic.role, action)) {
    return { allowed: false, reason: "forbidden", permission: action };
  }

  return { allowed: true, role: session.activeClinic.role, permission: action };
}
