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
        "group relative overflow-hidden rounded-[15px] border p-[15px] transition-all duration-200 hover:-translate-y-0.5",
        "border-[var(--c3d-card-border)] bg-[var(--c3d-card-bg)] shadow-[var(--c3d-card-shadow)]",
        "hover:border-primary/20",
        isHot && "bg-gradient-to-br from-[var(--c3d-card-bg)] to-primary/[0.04]",
        className
      )}
    >
      {/* Hot left accent bar */}
      {isHot && (
        <div className="absolute left-0 top-0 h-full w-[3px] bg-primary" />
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex flex-col">
          <p className="font-[Montserrat] text-[10px] font-bold uppercase leading-none tracking-[0.16em] text-[var(--c3d-text-faint)]">
            {title}
          </p>
          <p className="mt-[7px] break-words font-[Montserrat] text-[24px] font-extrabold tracking-[-0.02em] leading-none tabular-nums text-[var(--c3d-text-strong)]">
            {value}
            {valueSuffix ? (
              <small className="ml-[3px] font-[Montserrat] text-[13px] font-semibold text-[var(--c3d-text-muted)]">
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
            "flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] transition-colors",
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
