import type { HTMLAttributes, ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardPanelProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  headerAction?: ReactNode;
  contentClassName?: string;
}

export function DashboardPanel({
  title,
  description,
  headerAction,
  className,
  contentClassName,
  children,
  ...props
}: DashboardPanelProps) {
  return (
    <Card
      className={cn(
        "rounded-[1.25rem] border-border/70 bg-white/95 shadow-card backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {(title || description || headerAction) && (
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 p-6">
          <div className="space-y-1">
            {title ? (
              <CardTitle className="font-[Montserrat] text-lg font-bold tracking-tight text-foreground">
                {title}
              </CardTitle>
            ) : null}
            {description ? (
              <CardDescription className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {description}
              </CardDescription>
            ) : null}
          </div>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </CardHeader>
      )}
      <CardContent className={cn(title || description || headerAction ? "p-6 pt-0" : "p-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
