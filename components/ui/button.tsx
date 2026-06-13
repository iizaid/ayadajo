import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-pill px-5 py-2.5 text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-accent/25 disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        default: "bg-text-primary text-white hover:bg-[#121212]",
        secondary:
          "bg-surface-recessed text-text-primary shadow-[var(--shadow-inset-subtle)] hover:bg-border-subtle",
        outline:
          "bg-transparent text-text-primary shadow-[var(--shadow-inset-subtle)] hover:bg-surface-recessed",
        ghost: "text-text-secondary hover:bg-surface-recessed hover:text-text-primary",
        destructive: "bg-danger text-white hover:bg-danger/90",
      },
      size: {
        default: "min-h-11 px-5 py-2.5",
        sm: "min-h-10 px-4 py-2 text-sm",
        lg: "min-h-12 px-6 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
