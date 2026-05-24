import { AlertTriangle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface WarningInlineBannerProps {
  tone?: "warning" | "danger" | "info";
  icon?: LucideIcon;
  children: ReactNode;
}

const TONES = {
  warning: { bg: "rgba(245,158,11,.10)", bd: "rgba(245,158,11,.30)", fg: "#d97706" },
  danger:  { bg: "rgba(239,68,68,.10)",  bd: "rgba(239,68,68,.30)",  fg: "#dc2626" },
  info:    { bg: "rgba(59,130,246,.10)", bd: "rgba(59,130,246,.30)", fg: "#2563eb" },
};

export function WarningInlineBanner({ tone = "warning", icon: Icon = AlertTriangle, children }: WarningInlineBannerProps) {
  const t = TONES[tone];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "9px 11px", borderRadius: 9, background: t.bg, border: `1px solid ${t.bd}`, color: t.fg }}>
      <Icon size={14} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ font: "500 12px/1.45 Montserrat,sans-serif" }}>{children}</span>
    </div>
  );
}
