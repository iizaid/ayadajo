import Link from "next/link";
import { AuthShell } from "../AuthShell";
import { StatusMessage } from "../StatusMessage";
import { loginAction } from "@/lib/auth/actions";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/FormField";

type LoginPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

function statusMessage(status?: string): { message?: string; tone?: "info" | "danger" | "success" } {
  if (status === "invalid") {
    return { message: t("auth.login.errors.invalid"), tone: "danger" };
  }

  if (status === "limited") {
    return { message: t("auth.login.errors.limited"), tone: "danger" };
  }

  if (status === "signed-out") {
    return { message: t("auth.login.status.signedOut"), tone: "success" };
  }

  return {};
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const status = statusMessage(params?.status);

  return (
    <AuthShell title={t("auth.login.title")} description={t("auth.login.description")}>
      <form action={loginAction} className="space-y-5">
        <StatusMessage message={status.message} tone={status.tone} />
        <FormField id="email" label={t("auth.fields.email")}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t("auth.fields.emailPlaceholder")}
            required
          />
        </FormField>
        <FormField id="password" label={t("auth.fields.password")}>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder={t("auth.fields.passwordPlaceholder")}
            required
          />
        </FormField>
        <Button type="submit" className="w-full">
          {t("auth.login.submit")}
        </Button>
        <Link className="block text-sm font-medium text-accent hover:text-text-primary" href="/forgot">
          {t("auth.login.forgot")}
        </Link>
      </form>
    </AuthShell>
  );
}
