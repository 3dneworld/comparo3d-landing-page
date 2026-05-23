import type { ReactNode } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

interface MetricTrendProps {
  direction: "up" | "down" | "flat";
  children: ReactNode;
}

export function MetricTrend({ direction, children }: MetricTrendProps) {
  const Icon =
    direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;
  const color =
    direction === "up"
      ? "text-[hsl(var(--success))]"
      : direction === "down"
        ? "text-[hsl(var(--destructive))]"
        : "text-muted-foreground";

  return (
    <div className={cn("mt-[6px] flex items-center gap-[5px] font-[Montserrat] text-[11px] font-semibold leading-none", color)}>
      <Icon className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}
