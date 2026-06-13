import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
};

export function EmptyState({ icon: Icon, title, description, actionLabel }: EmptyStateProps) {
  return (
    <section className="ay-panel flex min-h-64 flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 rounded-full bg-surface p-4 text-accent shadow-[var(--shadow-inset-subtle)]">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-text-secondary">{description}</p>
      {actionLabel ? (
        <Button type="button" variant="secondary" className="mt-5">
          {actionLabel}
        </Button>
      ) : null}
    </section>
  );
}
