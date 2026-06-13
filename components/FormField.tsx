import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

type FormFieldProps = {
  id: string;
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string;
};

export function FormField({ id, label, children, hint, error }: FormFieldProps) {
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={errorId} className="text-sm leading-6 text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={helperId} className="text-sm leading-6 text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
