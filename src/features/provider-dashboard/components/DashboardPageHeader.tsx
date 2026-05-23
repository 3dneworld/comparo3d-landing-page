import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DashboardPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  metaPills?: ReactNode;
  actions?: ReactNode;
  lastSync?: string;
  variant?: "default" | "dark";
  className?: string;
}

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  meta,
  metaPills,
  actions,
  lastSync,
  variant = "default",
  className,
}: DashboardPageHeaderProps) {
  if (variant === "dark") {
    return (
      <header
        className={cn(
          "rounded-[1.5rem] overflow-hidden border border-border/70 shadow-[var(--shadow-card)]",
          className
        )}
      >
        {/* topband — dark gradient con glow */}
        <div className="dash-hero-band px-7 py-6 flex justify-between items-start gap-6">
          <div style={{ position: "relative" }}>
            {eyebrow ? (
              <p className="dash-eyebrow">{eyebrow}</p>
            ) : null}
            <h1 className="mt-2.5 font-[Montserrat] text-[30px] font-extrabold tracking-tight leading-[1.1] text-white">
              {title}
            </h1>
            {description ? (
              <p className="mt-1.5 text-sm leading-relaxed text-[hsl(var(--hero-muted))] max-w-[680px]">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 gap-2.5" style={{ position: "relative" }}>
              {actions}
            </div>
          ) : null}
        </div>

        {/* lowband — white bg with pills + última sync */}
        <div className="bg-white border-t border-[hsl(220,15%,88%,0.6)] px-7 py-[14px] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-[6px]">
            {metaPills ?? meta}
          </div>
          {lastSync ? (
            <p className="text-xs font-[Montserrat] font-medium text-[hsl(220,10%,46%)] whitespace-nowrap">
              Última sync {lastSync}
            </p>
          ) : null}
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "rounded-[1.5rem] border border-border/70 bg-white/90 px-6 py-6 shadow-card backdrop-blur-sm md:px-7 md:py-7",
        className
      )}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-2">
            <h1 className="font-[Montserrat] text-3xl font-extrabold tracking-tight text-foreground md:text-[2rem]">
              {title}
            </h1>
            {description ? (
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                {description}
              </p>
            ) : null}
          </div>
          {(meta ?? metaPills) ? (
            <div className="flex flex-wrap items-center gap-2">{meta ?? metaPills}</div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
