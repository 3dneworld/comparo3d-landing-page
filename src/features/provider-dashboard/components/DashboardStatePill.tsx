import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DashboardPillTone =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

const toneStyles: Record<DashboardPillTone, string> = {
  default: "border-border/80 bg-background text-foreground",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-300 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  muted: "border-border/70 bg-muted/60 text-muted-foreground",
};

interface DashboardStatePillProps {
  children: ReactNode;
  tone?: DashboardPillTone;
  className?: string;
}

export function DashboardStatePill({
  children,
  tone = "default",
  className,
}: DashboardStatePillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-[9px] py-1 text-[11px] font-bold leading-none tracking-[0.04em]",
        toneStyles[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
