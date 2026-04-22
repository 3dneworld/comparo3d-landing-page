import type { QuoteOptionBadge } from "@/lib/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface BadgeMeta {
  label: string;
  labelShort: string;
  tooltip: string;
  imgSrc: string;
  tone: "trust" | "certified";
}

function getBadgeMeta(badge: QuoteOptionBadge): BadgeMeta {
  if (badge.badge_type === "seleccion_fundador") {
    const is10 = badge.badge_tier === "10+";
    const tier = is10 ? "10+ años" : "5+ años";
    const tierShort = badge.badge_tier ?? "";
    return {
      label: `Trayectoria Verificada · ${tier}`,
      labelShort: `Trayectoria · ${tierShort}`,
      tooltip:
        "Este proveedor presentó documentación (facturación histórica, trabajos previos, referencias comerciales) que Comparo3D validó al momento del alta.",
      imgSrc: is10 ? "/badges/badge-10-anos.png" : "/badges/badge-5-anos.png",
      tone: "trust",
    };
  }
  return {
    label: "Certificado Orgánico",
    labelShort: "Certificado",
    tooltip:
      "Este proveedor alcanzó la certificación orgánica al cumplir: 4+ meses activo, 20+ órdenes completadas, rating promedio ≥ 4.3, al menos 15 reviews, y ≥88% de entregas a tiempo.",
    imgSrc: "/badges/badge-organico.png",
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
  const toneClasses =
    meta.tone === "trust"
      ? "bg-primary/10 text-primary ring-1 ring-primary/20"
      : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${toneClasses}`}
    >
      <img src={meta.imgSrc} alt="" aria-hidden="true" className="h-4 w-4 object-contain" />
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
