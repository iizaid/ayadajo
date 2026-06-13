import { Building2 } from "lucide-react";
import { redirect } from "next/navigation";
import { AuthShell } from "../AuthShell";
import { StatusMessage } from "../StatusMessage";
import { chooseClinicAction, logoutAction } from "@/lib/auth/actions";
import { requireAuthSession } from "@/lib/auth/session";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

type ChooseClinicPageProps = {
  searchParams?: Promise<{
    status?: string;
    error?: string;
  }>;
};

export default async function ChooseClinicPage({ searchParams }: ChooseClinicPageProps) {
  const session = await requireAuthSession();
  const params = await searchParams;

  if (session.activeMemberships.length === 1 && session.activeClinic && !session.requiresClinicSelection) {
    redirect("/");
  }

  const statusMessage =
    params?.status === "invalid" || params?.error === "permission"
      ? t("auth.chooseClinic.errors.invalid")
      : undefined;

  return (
    <AuthShell
      title={t("auth.chooseClinic.title")}
      description={t("auth.chooseClinic.description")}
    >
      <div className="space-y-5">
        <StatusMessage message={statusMessage} tone="danger" />
        {session.activeMemberships.length > 0 ? (
          <div className="grid gap-3">
            {session.activeMemberships.map((membership) => (
              <form
                key={membership.id}
                action={chooseClinicAction}
                className="rounded-card bg-surface-recessed p-3 shadow-[var(--shadow-inset-subtle)]"
              >
                <input type="hidden" name="clinicId" value={membership.clinicId} />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <Building2 className="mt-1 h-5 w-5 text-accent" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-text-primary">{membership.clinicName}</p>
                      <p className="text-sm text-text-muted">{t(`auth.roles.${membership.role}`)}</p>
                    </div>
                  </div>
                  <Button type="submit" size="sm">
                    {t("auth.chooseClinic.submit")}
                  </Button>
                </div>
              </form>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title={t("auth.chooseClinic.empty.title")}
            description={t("auth.chooseClinic.empty.description")}
          />
        )}
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" className="w-full">
            {t("auth.common.logout")}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
