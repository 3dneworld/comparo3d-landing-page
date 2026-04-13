import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DashboardPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: DashboardPageHeaderProps) {
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
          {meta ? <div className="flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
