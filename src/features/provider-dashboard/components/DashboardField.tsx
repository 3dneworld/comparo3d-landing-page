import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DashboardFieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function DashboardField({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: DashboardFieldProps) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <Label
          htmlFor={htmlFor}
          className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
        >
          {label}
          {required ? " *" : ""}
        </Label>
      </div>
      {children}
      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
