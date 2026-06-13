type StatusMessageProps = {
  message?: string;
  tone?: "info" | "danger" | "success";
};

const toneClassName = {
  info: "bg-surface-recessed text-text-secondary",
  danger: "bg-danger/10 text-danger",
  success: "bg-success/10 text-success",
} as const;

export function StatusMessage({ message, tone = "info" }: StatusMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <p className={`rounded-input px-3 py-2 text-sm leading-6 ${toneClassName[tone]}`}>
      {message}
    </p>
  );
}
