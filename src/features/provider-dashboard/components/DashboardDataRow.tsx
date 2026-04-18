import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DashboardDataRowProps {
  selected?: boolean;
  onClick: () => void;
  columnsClassName?: string;
  children: ReactNode;
  className?: string;
}

export function DashboardDataRow({
  selected = false,
  onClick,
  columnsClassName,
  children,
  className,
}: DashboardDataRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover",
        selected
          ? "border-primary/25 bg-primary/[0.06] shadow-card"
          : "border-border/70 bg-white hover:border-primary/15",
        className
      )}
    >
      <div className={cn("grid gap-3 lg:items-center", columnsClassName)}>{children}</div>
    </button>
  );
}

export function DashboardDataLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground lg:hidden">
      {children}
    </p>
  );
}

export function DashboardDataValue({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <DashboardDataLabel>{label}</DashboardDataLabel>
      {children}
    </div>
  );
}
