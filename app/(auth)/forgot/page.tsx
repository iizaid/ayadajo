import Link from "next/link";
import { AuthShell } from "../AuthShell";
import { StatusMessage } from "../StatusMessage";
import { forgotPasswordAction } from "@/lib/auth/actions";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";

type ForgotPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

export default async function ForgotPage({ searchParams }: ForgotPageProps) {
  const params = await searchParams;
  const sent = params?.status === "sent";

  return (
    <AuthShell title={t("auth.forgot.title")} description={t("auth.forgot.description")}>
      <form action={forgotPasswordAction} className="space-y-5">
        <StatusMessage
          message={sent ? t("auth.forgot.status.sent") : undefined}
          tone="success"
        />
        <FormField id="email" label={t("auth.fields.email")} hint={t("auth.forgot.hint")}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t("auth.fields.emailPlaceholder")}
            required
          />
        </FormField>
        <Button type="submit" className="w-full">
          {t("auth.forgot.submit")}
        </Button>
        <Link className="block text-sm font-medium text-accent hover:text-text-primary" href="/login">
          {t("auth.common.backToLogin")}
        </Link>
      </form>
    </AuthShell>
  );
}
