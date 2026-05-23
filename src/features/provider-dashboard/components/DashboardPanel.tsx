import type { HTMLAttributes, ReactNode } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardPanelProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  eyebrow?: string;
  icon?: ReactNode;
  headerAction?: ReactNode;
  contentClassName?: string;
}

export function DashboardPanel({
  title,
  description,
  eyebrow,
  icon,
  headerAction,
  className,
  contentClassName,
  children,
  ...props
}: DashboardPanelProps) {
  const hasHeader = !!(title || description || headerAction);

  return (
    <Card
      className={cn(
        "rounded-[17px] border border-[var(--c3d-card-border)] bg-[var(--c3d-card-bg)] shadow-[var(--c3d-card-shadow)] overflow-hidden",
        className
      )}
      {...props}
    >
      {hasHeader && (
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 px-5 pb-[11px] pt-4 border-b border-[var(--c3d-card-border-soft)]">
          <div className="flex items-center gap-3">
            {icon ? (
              <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-primary/10 text-primary">
                {icon}
              </div>
            ) : null}
            <div>
              {eyebrow ? (
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-1.5">{eyebrow}</p>
              ) : null}
              {title ? (
                <h3 className="font-[Montserrat] text-[16px] font-bold tracking-[-0.005em] leading-[1.2] text-[var(--c3d-text-strong)]">
                  {title}
                </h3>
              ) : null}
              {description ? (
                <p className="mt-0.5 text-[12px] leading-[1.5] text-[var(--c3d-text-muted)]">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </CardHeader>
      )}
      <CardContent className={cn(hasHeader ? "px-5 pb-[18px] pt-[14px]" : "p-5", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
