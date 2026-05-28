import { Search } from "lucide-react";

import { QuoteProviderCard } from "@/components/landing/quote/QuoteProviderCard";
import type { ProviderMarketplacePreviewResponse } from "@/features/provider-dashboard/types";
import type { QuoteOption, QuoteOptionBadge } from "@/lib/api";
import { cn } from "@/lib/utils";

export function MarketplacePreviewPanel({
  preview,
  isLoading,
  badges = [],
}: {
  preview?: ProviderMarketplacePreviewResponse;
  isLoading?: boolean;
  badges?: QuoteOptionBadge[];
}) {
  const queryLabel = preview
    ? `${preview.query.material} ${preview.query.zona} - ${preview.query.total_results} proveedores`
    : '"PLA CABA" - 4 proveedores';
  const results = preview?.results?.length ? preview.results : [];

  return (
    <section
      className="overflow-hidden rounded-[17px] border border-[var(--c3d-card-border)] bg-[var(--c3d-card-bg)] shadow-[var(--c3d-card-shadow)]"
      aria-label="Preview marketplace"
    >
      <header className="flex items-start justify-between gap-3 border-b border-[var(--c3d-card-border-soft)] px-5 pb-[11px] pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-primary/10 text-primary">
            <Search className="h-[18px] w-[18px]" />
          </div>
          <div>
            <p className="font-[Montserrat] text-[10px] font-extrabold uppercase leading-none tracking-[0.18em] text-[hsl(220,80%,65%)]">
              RESULTADOS DEL MARKETPLACE
            </p>
            <h2 className="mt-1.5 font-[Montserrat] text-[16px] font-bold leading-[1.2] text-[var(--c3d-text-strong)]">
              Cómo aparecés en búsquedas
            </h2>
            <p className="mt-0.5 text-[12px] leading-[1.5] text-[var(--c3d-text-muted)]">
              Misma card que ve el cliente al comparar cotizaciones.
            </p>
          </div>
        </div>
      </header>

      <div className="px-5 pb-[18px] pt-[14px]">
        <p className="rounded-[9px] border border-white/10 bg-white/[0.92] px-3 py-2 text-[12px] font-semibold text-slate-500">
          {isLoading ? "Calculando posicion..." : queryLabel}
        </p>

        <ol className="mt-3 space-y-2">
          {results.length ? (
            results.slice(0, 4).map((item) => (
              <li key={item.provider_id} data-you={item.is_you ? "true" : "false"}>
                <QuoteProviderCard
                  option={toQuoteOption(item, preview?.query.zona ?? "", item.is_you ? badges : [])}
                  highlightLabel={item.is_you ? "VOS" : undefined}
                  disabled
                  className={cn(
                    "p-3 shadow-none",
                    item.is_you
                      ? "border-blue-400 bg-white text-slate-900 shadow-[0_0_0_1px_rgba(37,99,235,0.35)]"
                      : "border-white/10 bg-white text-slate-900 opacity-50"
                  )}
                />
              </li>
            ))
          ) : (
            <>
              <GhostRow label="Otro proveedor" price="$5.100" />
              <li>
                <QuoteProviderCard
                  option={fallbackQuoteOption(preview?.query.zona ?? "CABA", badges)}
                  highlightLabel="VOS"
                  disabled
                  className="border-blue-400 bg-white p-3 text-slate-900 shadow-[0_0_0_1px_rgba(37,99,235,0.35)]"
                />
              </li>
              <GhostRow label="Otro proveedor" price="$5.300" />
            </>
          )}
        </ol>
      </div>
    </section>
  );
}

function toQuoteOption(
  item: ProviderMarketplacePreviewResponse["results"][number],
  location: string,
  badges: QuoteOptionBadge[]
): QuoteOption {
  return {
    quote_option_uid: `dashboard-preview-${item.provider_id}`,
    provider_id: item.provider_id,
    provider_name: item.name,
    provider_score: item.sr_score,
    provider_tier: item.ranking_mode,
    provider_location: location,
    price_ars: item.price_from,
    delivery_days: item.delivery_days,
    logo_url: "",
    is_certified: badges.some((badge) => badge.badge_type === "certificado_organico"),
    trust_metrics: {
      score: item.rating ?? 0,
      reviews_count: item.reviews_count,
      on_time_pct: 0,
    },
    sr_score: item.sr_score,
    ranking_position: item.position,
    ranking_mode: item.ranking_mode === "production" ? "production" : "bootstrap",
    badges,
  };
}

function fallbackQuoteOption(location: string, badges: QuoteOptionBadge[]): QuoteOption {
  return {
    quote_option_uid: "dashboard-preview-fallback",
    provider_id: 0,
    provider_name: "Mega 3D",
    provider_score: 0,
    provider_tier: "bootstrap",
    provider_location: location,
    price_ars: 4800,
    delivery_days: 1,
    logo_url: "",
    is_certified: badges.some((badge) => badge.badge_type === "certificado_organico"),
    trust_metrics: {
      score: 4.8,
      reviews_count: 124,
      on_time_pct: 0,
    },
    badges,
  };
}

function GhostRow({ label, price }: { label: string; price: string }) {
  return (
    <li className="grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-[10px] border border-white/10 bg-white px-3 py-3 text-sm text-slate-900 opacity-50">
      <span className="h-8 w-8 rounded-[8px] bg-slate-500/45" />
      <strong className="truncate text-sm font-bold">{label} - 4.6</strong>
      <small className="text-right text-xs font-bold">desde {price}</small>
    </li>
  );
}
