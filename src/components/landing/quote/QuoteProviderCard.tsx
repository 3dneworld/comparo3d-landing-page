import { useState } from "react";
import { MapPin, Star, Truck } from "lucide-react";

import type { QuoteOption } from "@/lib/api";
import { cn } from "@/lib/utils";
import { BadgeChip, sortBadges } from "./BadgeChip";

export interface QuoteProviderCardOption extends QuoteOption {
  distanceKm?: number | null;
}

function formatRoundedArs(value: number) {
  return Math.round(value).toLocaleString("es-AR");
}

function StarRating({ score }: { score: number }) {
  const normalizedScore = Math.max(0, Math.min(score || 0, 5));

  return (
    <span className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, index) => {
        const fill = normalizedScore - index;
        if (fill >= 1) {
          return <Star key={index} size={14} fill="currentColor" className="text-amber-500" />;
        }

        if (fill >= 0.5) {
          return (
            <span key={index} className="relative h-[14px] w-[14px]">
              <Star size={14} className="absolute inset-0 text-amber-200" />
              <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: "50%" }}>
                <Star size={14} fill="currentColor" className="text-amber-500" />
              </span>
            </span>
          );
        }

        return <Star key={index} size={14} className="text-amber-200" />;
      })}
    </span>
  );
}

function ProviderAvatar({ option }: { option: QuoteProviderCardOption }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (option.logo_url && !imageFailed) {
    return (
      <img
        src={option.logo_url}
        alt={`Logo de ${option.provider_name}`}
        className="h-12 w-12 rounded-full border border-border object-cover"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[18px] font-bold text-primary">
      {option.provider_name.charAt(0).toUpperCase()}
    </div>
  );
}

export function QuoteProviderCard({
  option,
  isRecommended = false,
  onSelect,
  className,
  highlightLabel,
  disabled = false,
}: {
  option: QuoteProviderCardOption;
  isRecommended?: boolean;
  onSelect?: () => void;
  className?: string;
  highlightLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 shadow-sm transition-all",
        onSelect && !disabled ? "hover:-translate-y-0.5 hover:shadow-card-hover" : "",
        isRecommended
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
          : "border-border bg-card",
        className
      )}
    >
      {isRecommended ? (
        <span className="absolute -top-2.5 left-4 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-0.5 text-[11px] font-bold text-white">
          Oferta Recomendada
        </span>
      ) : null}

      {highlightLabel ? (
        <span className="absolute -right-1 -top-2 rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-extrabold text-white">
          {highlightLabel}
        </span>
      ) : null}

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <ProviderAvatar option={option} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <p className="truncate text-[16px] font-bold text-foreground">{option.provider_name}</p>

              {option.trust_metrics.score > 0 ? (
                <span className="flex items-center gap-1 text-[13px] text-foreground">
                  <StarRating score={option.trust_metrics.score} />
                  <span className="font-semibold text-amber-600">
                    {option.trust_metrics.score.toFixed(1)}
                  </span>
                  {option.trust_metrics.reviews_count > 0 ? (
                    <span className="text-muted-foreground">({option.trust_metrics.reviews_count})</span>
                  ) : null}
                </span>
              ) : null}

              {sortBadges(option.badges ?? []).map((badge) => (
                <BadgeChip key={`${badge.badge_type}-${badge.badge_tier ?? ""}`} badge={badge} />
              ))}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-muted-foreground">
              {option.provider_location ? (
                <span className="flex min-w-0 items-center gap-1">
                  <MapPin size={12} className="shrink-0 text-red-500" />
                  <span className="truncate">
                    {option.provider_location}
                    {option.distanceKm != null ? ` - ${Math.round(option.distanceKm)} km` : ""}
                  </span>
                </span>
              ) : null}

              <span className="flex items-center gap-1">
                <Truck size={12} />
                {option.delivery_days} {option.delivery_days === 1 ? "día" : "días"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-end justify-between gap-4 md:flex-col md:items-end">
          <p className="text-[20px] font-extrabold leading-tight text-foreground">
            ${formatRoundedArs(option.price_ars)}
          </p>
          <button
            type="button"
            onClick={onSelect}
            disabled={disabled || !onSelect}
            className="rounded-lg bg-[#667eea] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[#5b6fd6] disabled:cursor-default disabled:opacity-90"
          >
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}
