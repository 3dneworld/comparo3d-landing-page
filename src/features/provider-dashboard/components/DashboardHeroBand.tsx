import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DashboardHeroBandProps {
  children: ReactNode;
  className?: string;
}

export function DashboardHeroBand({ children, className }: DashboardHeroBandProps) {
  return (
    <div className={cn("dash-hero-band px-7 py-6", className)}>
      {children}
    </div>
  );
}
