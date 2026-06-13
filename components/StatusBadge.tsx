import { AlertTriangle, CheckCircle2, Circle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusBadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClasses: Record<StatusBadgeTone, string> = {
  neutral: "bg-surface-recessed text-text-secondary shadow-[var(--shadow-inset-subtle)]",
  info: "bg-info/10 text-info shadow-[inset_0_0_0_1px_rgb(3_105_161/0.16)]",
  success: "bg-success/10 text-success shadow-[inset_0_0_0_1px_rgb(21_128_61/0.16)]",
  warning: "bg-warning/10 text-warning shadow-[inset_0_0_0_1px_rgb(180_83_9/0.18)]",
  danger: "bg-danger/10 text-danger shadow-[inset_0_0_0_1px_rgb(180_35_24/0.18)]",
};

const toneIcons = {
  neutral: Circle,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
};

type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
  className?: string;
};

export function StatusBadge({ label, tone = "neutral", className }: StatusBadgeProps) {
  const Icon = toneIcons[tone];

  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
