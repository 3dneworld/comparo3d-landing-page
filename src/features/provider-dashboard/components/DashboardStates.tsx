import type { ReactNode } from "react";

import { AlertTriangle, ArrowRight, LoaderCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardFeedbackStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryAction?: ReactNode;
  className?: string;
}

function DashboardFeedbackState({
  title,
  description,
  icon,
  actionLabel,
  actionHref,
  onAction,
  secondaryAction,
  className,
}: DashboardFeedbackStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[60vh] items-center justify-center px-6 py-10",
        className
      )}
    >
      <div className="w-full max-w-xl rounded-[1.75rem] border border-border/70 bg-white/95 p-8 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-primary">
          {icon}
        </div>
        <div className="mt-5 space-y-3">
          <h1 className="font-[Montserrat] text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {actionLabel && (actionHref || onAction) ? (
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {actionHref ? (
              <Button
                asChild
                className="h-11 rounded-xl bg-gradient-primary px-5 text-primary-foreground shadow-cta hover:opacity-95"
              >
                <Link to={actionHref}>
                  {actionLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button
                onClick={onAction}
                className="h-11 rounded-xl bg-gradient-primary px-5 text-primary-foreground shadow-cta hover:opacity-95"
              >
                {actionLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {secondaryAction}
          </div>
        ) : secondaryAction ? (
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {secondaryAction}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function DashboardLoadingState({
  title = "Preparando tu panel",
  description = "Estamos validando la sesión y armando el resumen operativo del proveedor.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <DashboardFeedbackState
      icon={<LoaderCircle className="h-6 w-6 animate-spin" />}
      title={title}
      description={description}
    />
  );
}

export function DashboardEmptyState(props: DashboardFeedbackStateProps) {
  return <DashboardFeedbackState icon={props.icon ?? <AlertTriangle className="h-6 w-6" />} {...props} />;
}

export function DashboardErrorState(props: DashboardFeedbackStateProps) {
  return <DashboardFeedbackState icon={props.icon ?? <AlertTriangle className="h-6 w-6" />} {...props} />;
}
