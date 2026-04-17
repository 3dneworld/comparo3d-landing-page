import { BadgeCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { QuoteOptionBadge } from "@/lib/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TrayectoriaVerificada10Icon } from "@/components/icons/TrayectoriaVerificada10Icon";
import { TrayectoriaVerificada5Icon } from "@/components/icons/TrayectoriaVerificada5Icon";

// Tipo unificado que cubre Lucide icons y nuestros SVG propios
type IconComponent =
  | LucideIcon
  | ((props: { size?: number; className?: string }) => React.ReactNode);

interface BadgeMeta {
  label: string;
  labelShort: string;
  tooltip: string;
  icon: IconComponent;
  tone: "trust" | "certified";
}

const BADGE_ICON_MAP: Record<string, IconComponent> = {
  trayectoria_tier_10: TrayectoriaVerificada10Icon,
  trayectoria_tier_5: TrayectoriaVerificada5Icon,
  certificado_organico: BadgeCheck,
};

function getBadgeMeta(badge: QuoteOptionBadge): BadgeMeta {
  if (badge.badge_type === "seleccion_fundador") {
    const is10 = badge.badge_tier === "10+";
    const tier = is10 ? "10+ años" : "5+ años";
    const tierShort = badge.badge_tier ?? "";
    const iconKey = is10 ? "trayectoria_tier_10" : "trayectoria_tier_5";
    return {
      label: `Trayectoria Verificada · ${tier}`,
      labelShort: `Trayectoria · ${tierShort}`,
      tooltip:
        "Este proveedor presentó documentación (facturación histórica, trabajos previos, referencias comerciales) que Comparo3D validó al momento del alta.",
      icon: BADGE_ICON_MAP[iconKey],
      tone: "trust",
    };
  }
  return {
    label: "Certificado Orgánico",
    labelShort: "Certificado",
    tooltip:
      "Este proveedor alcanzó la certificación orgánica al cumplir: 4+ meses activo, 20+ órdenes completadas, rating promedio ≥ 4.3, al menos 15 reviews, y ≥88% de entregas a tiempo.",
    icon: BADGE_ICON_MAP["certificado_organico"],
    tone: "certified",
  };
}

const BADGE_ORDER: Record<string, number> = {
  seleccion_fundador: 0,
  certificado_organico: 1,
};

export function sortBadges(badges: QuoteOptionBadge[]): QuoteOptionBadge[] {
  return [...badges].sort(
    (a, b) => (BADGE_ORDER[a.badge_type] ?? 99) - (BADGE_ORDER[b.badge_type] ?? 99),
  );
}

export function BadgeChip({ badge }: { badge: QuoteOptionBadge }) {
  const meta = getBadgeMeta(badge);
  const Icon = meta.icon;
  const toneClasses =
    meta.tone === "trust"
      ? "bg-primary/10 text-primary ring-1 ring-primary/20"
      : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${toneClasses}`}
    >
      <Icon size={12} />
      <span className="hidden sm:inline">{meta.label}</span>
      <span className="sm:hidden">{meta.labelShort}</span>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Más información sobre ${meta.label}`}
            className="ml-0.5 grid h-4 w-4 place-items-center rounded-full border border-current text-[10px] font-bold opacity-70 hover:opacity-100"
          >
            ?
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 text-[12px] leading-relaxed text-foreground">
          <p className="mb-1 font-semibold">{meta.label}</p>
          <p>{meta.tooltip}</p>
        </PopoverContent>
      </Popover>
    </span>
  );
}
