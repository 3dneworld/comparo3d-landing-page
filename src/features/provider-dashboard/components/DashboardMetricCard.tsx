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
        "group rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5",
        "border-[var(--c3d-card-border)] bg-[var(--c3d-card-bg)]",
        "hover:border-primary/20",
        isHot && "ring-1 ring-primary/20",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--c3d-text-faint)]">
            {title}
          </p>
          <p className="break-words font-[Montserrat] text-[28px] font-extrabold tracking-tight leading-none tabular-nums text-[var(--c3d-text-strong)]">
            {value}
            {valueSuffix ? (
              <small className="ml-1 text-sm font-semibold text-[var(--c3d-text-muted)]">
                {valueSuffix}
              </small>
            ) : null}
          </p>
          {trend ? (
            <MetricTrend direction={trend.direction}>{trend.text}</MetricTrend>
          ) : (
            <p className="break-words text-sm leading-relaxed text-[var(--c3d-text-muted)]">{support}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl transition-colors",
            isHot
              ? "bg-gradient-to-br from-primary to-cyan-500 text-white"
              : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
          )}
        >
          {icon}
        </div>
      </div>
      {sparkline ? <Sparkline values={sparkline} /> : null}
    </div>
  );
}
