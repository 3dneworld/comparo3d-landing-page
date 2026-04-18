import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DashboardMetricCardProps {
  title: string;
  value: string;
  support: string;
  icon: ReactNode;
  className?: string;
}

export function DashboardMetricCard({
  title,
  value,
  support,
  icon,
  className,
}: DashboardMetricCardProps) {
  return (
    <div
      className={cn(
        "group rounded-2xl border border-border/70 bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-card-hover",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
          <p className="break-words font-[Montserrat] text-xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="break-words text-sm leading-relaxed text-muted-foreground">{support}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/[0.12] text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          {icon}
        </div>
      </div>
    </div>
  );
}
