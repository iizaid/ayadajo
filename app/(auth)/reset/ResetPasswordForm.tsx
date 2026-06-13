"use client";

import { useState } from "react";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { t } from "@/lib/i18n";

type FormState = "idle" | "saving" | "success" | "error";

export function ResetPasswordForm() {
  const [state, setState] = useState<FormState>("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password.length < 10 || password !== confirmPassword) {
      setState("error");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password });

    setState(error ? "error" : "success");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {state === "success" ? (
        <p className="rounded-input bg-success/10 px-3 py-2 text-sm leading-6 text-success">
          {t("auth.reset.status.success")}
        </p>
      ) : null}
      {state === "error" ? (
        <p className="rounded-input bg-danger/10 px-3 py-2 text-sm leading-6 text-danger">
          {t("auth.reset.errors.invalid")}
        </p>
      ) : null}
      <FormField id="password" label={t("auth.fields.newPassword")} hint={t("auth.fields.passwordHint")}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </FormField>
      <FormField id="confirmPassword" label={t("auth.fields.confirmPassword")}>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={state === "saving"}>
        {state === "saving" ? t("auth.common.saving") : t("auth.reset.submit")}
      </Button>
    </form>
  );
}
