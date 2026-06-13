import "server-only";

import { notFound, redirect } from "next/navigation";
import { authorize, type PermissionCode } from "./permissions";
import { evaluateTenantGuard } from "./tenancy-rules";
import { getCurrentAuthSession } from "./session";

export async function requireActiveClinic(resourceClinicId?: string) {
  const decision = evaluateTenantGuard(await getCurrentAuthSession(), resourceClinicId);

  if (decision.ok) {
    return decision;
  }

  if (decision.response === "redirect:/login") {
    redirect("/login");
  }

  if (decision.response === "redirect:/choose-clinic") {
    redirect("/choose-clinic");
  }

  notFound();
}

export async function requireAuthorizedClinic(action: PermissionCode, resourceClinicId?: string) {
  const guard = await requireActiveClinic(resourceClinicId);
  const decision = authorize(guard.session, action, { clinicId: resourceClinicId });

  if (!decision.allowed && decision.reason === "cross_tenant") {
    notFound();
  }

  if (!decision.allowed) {
    redirect("/choose-clinic?error=permission");
  }

  return { ...guard, authorization: decision };
}
