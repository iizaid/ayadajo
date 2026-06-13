import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricTone = "neutral" | "success" | "warning";

const toneClasses: Record<MetricTone, string> = {
  neutral: "text-accent bg-accent/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
};

type MetricCardProps = {
  label: string;
  value: string;
  context: string;
  trend?: string;
  icon: LucideIcon;
  tone?: MetricTone;
};

export function MetricCard({
  label,
  value,
  context,
  trend,
  icon: Icon,
  tone = "neutral",
}: MetricCardProps) {
  return (
    <section className="ay-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-sm font-medium text-text-secondary">{label}</p>
          <p className="text-4xl font-semibold tracking-[-0.03em] text-text-primary">{value}</p>
          <p className="text-sm leading-6 text-text-muted">{context}</p>
        </div>
        <span className={cn("rounded-full p-3", toneClasses[tone])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      {trend ? (
        <p className="mt-5 rounded-full bg-surface-recessed px-3 py-2 text-xs font-semibold text-text-secondary">
          {trend}
        </p>
      ) : null}
    </section>
  );
}
