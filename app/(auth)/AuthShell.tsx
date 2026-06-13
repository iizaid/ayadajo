import type { ReactNode } from "react";
import { t } from "@/lib/i18n";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-canvas px-4 py-6 text-text-primary sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center justify-center">
        <section className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <aside className="ay-panel flex flex-col justify-between gap-8 p-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-accent">{t("app.kicker")}</p>
              <h1 className="max-w-xl text-3xl font-semibold leading-tight text-text-primary">
                {t("auth.shell.title")}
              </h1>
              <p className="max-w-lg text-sm leading-7 text-text-secondary">
                {t("auth.shell.description")}
              </p>
            </div>
            <p className="text-xs leading-6 text-text-muted">{t("auth.shell.privacy")}</p>
          </aside>

          <div className="ay-card p-5 sm:p-6">
            <div className="mb-6 space-y-2">
              <h2 className="text-2xl font-semibold text-text-primary">{title}</h2>
              <p className="text-sm leading-7 text-text-secondary">{description}</p>
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
