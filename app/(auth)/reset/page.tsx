import Link from "next/link";
import { AuthShell } from "../AuthShell";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { t } from "@/lib/i18n";

export default function ResetPage() {
  return (
    <AuthShell title={t("auth.reset.title")} description={t("auth.reset.description")}>
      <div className="space-y-5">
        <ResetPasswordForm />
        <Link className="block text-sm font-medium text-accent hover:text-text-primary" href="/login">
          {t("auth.common.backToLogin")}
        </Link>
      </div>
    </AuthShell>
  );
}
