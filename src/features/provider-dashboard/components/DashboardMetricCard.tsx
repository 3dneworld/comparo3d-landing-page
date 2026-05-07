import type { ReactNode } from "react";

import { MetricTrend } from "@/features/provider-dashboard/components/MetricTrend";
import { Sparkline } from "@/features/provider-dashboard/components/Sparkline";
import { cn } from "@/lib/utils";

interface DashboardMetricCardProps {
  title: string;
  value: string;
  support: string;
  icon: ReactNode;
  valueSuffix?: string;
  trend?: { direction: "up" | "down" | "flat"; text: string };
  sparkline?: number[];
  isHot?: boolean;
  className?: string;
}

export function DashboardMetricCard({
  title,
  value,
  support,
  icon,
  valueSuffix,
  trend,
  sparkline,
  isHot = false,
  className,
}: DashboardMetricCardProps) {
  return (
    <div
      className={cn(
        "group rounded-2xl border border-border/70 p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-card-hover dash-accent-stripe",
        isHot ? "is-hot" : "bg-white",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {title}
          </p>
          <p className="break-words font-[Montserrat] text-[28px] font-extrabold tracking-tight text-foreground leading-none tabular-nums">
            {value}
            {valueSuffix ? (
              <small className="ml-1 text-sm font-semibold text-muted-foreground">
                {valueSuffix}
              </small>
            ) : null}
          </p>
          {trend ? (
            <MetricTrend direction={trend.direction}>{trend.text}</MetricTrend>
          ) : (
            <p className="break-words text-sm leading-relaxed text-muted-foreground">{support}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl transition-colors",
            isHot
              ? "bg-gradient-primary text-white"
              : "bg-primary/[0.10] text-primary group-hover:bg-primary group-hover:text-primary-foreground"
          )}
        >
          {icon}
        </div>
      </div>
      {sparkline ? <Sparkline values={sparkline} /> : null}
      {!trend && !sparkline ? null : trend && !sparkline ? null : null}
    </div>
  );
}
