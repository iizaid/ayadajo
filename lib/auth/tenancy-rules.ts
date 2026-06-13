import type { AuthSession, ClinicMembership } from "./session";

export type TenantGuardResult =
  | { ok: true; session: AuthSession; activeClinic: ClinicMembership }
  | { ok: false; response: "redirect:/login" | "redirect:/choose-clinic" | "notFound" };

export function evaluateTenantGuard(
  session: AuthSession | null,
  resourceClinicId?: string,
): TenantGuardResult {
  if (!session) {
    return { ok: false, response: "redirect:/login" };
  }

  if (!session.activeClinic || session.requiresClinicSelection) {
    return { ok: false, response: "redirect:/choose-clinic" };
  }

  if (session.activeClinic.status !== "active") {
    return { ok: false, response: "redirect:/choose-clinic" };
  }

  if (resourceClinicId && resourceClinicId !== session.activeClinic.clinicId) {
    return { ok: false, response: "notFound" };
  }

  return { ok: true, session, activeClinic: session.activeClinic };
}
