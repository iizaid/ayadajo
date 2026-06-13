import Link from "next/link";
import { AuthShell } from "../AuthShell";
import { ResetPasswordForm } from "../reset/ResetPasswordForm";
import { t } from "@/lib/i18n";

export default function SetPasswordPage() {
  return (
    <AuthShell title={t("auth.setPassword.title")} description={t("auth.setPassword.description")}>
      <div className="space-y-5">
        <ResetPasswordForm />
        <Link className="block text-sm font-medium text-accent hover:text-text-primary" href="/login">
          {t("auth.common.backToLogin")}
        </Link>
      </div>
    </AuthShell>
  );
}
