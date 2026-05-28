import { Search } from "lucide-react";

import type { ProviderMarketplacePreviewResponse } from "@/features/provider-dashboard/types";

export function MarketplacePreviewPanel({
  preview,
  isLoading,
}: {
  preview?: ProviderMarketplacePreviewResponse;
  isLoading?: boolean;
}) {
  return (
    <section className="rounded-[1.25rem] border border-border/70 bg-white p-5 shadow-card" aria-label="Preview marketplace">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">BUSQUEDA MARKETPLACE</p>
          <h2 className="mt-1 font-[Montserrat] text-lg font-extrabold tracking-tight text-foreground">
            Como apareces hoy
          </h2>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Search className="h-4 w-4" />
        </div>
      </header>

      {isLoading ? <p className="mt-4 text-sm text-muted-foreground">Calculando posicion...</p> : null}

      {!isLoading && preview ? (
        <>
          <p className="mt-4 rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-xs font-bold text-muted-foreground">
            {preview.query.material} - {preview.query.zona} - {preview.query.total_results} resultados
          </p>
          <ol className="mt-3 space-y-2">
            {preview.results.map((item) => (
              <li
                key={item.provider_id}
                data-you={item.is_you ? "true" : "false"}
                className="grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-xl border border-border/70 bg-white px-3 py-3 text-sm data-[you=true]:border-blue-300 data-[you=true]:bg-blue-50"
              >
                <span className="font-[Montserrat] text-sm font-extrabold text-foreground">#{item.position}</span>
                <div className="min-w-0">
                  <strong className="block truncate text-sm font-bold text-foreground">{item.name}</strong>
                  <em className="not-italic text-xs font-semibold text-muted-foreground">
                    {item.rating ? item.rating.toFixed(1) : "Nuevo"} - {item.reviews_count} reviews
                  </em>
                </div>
                <small className="text-xs font-bold text-foreground">Desde ${item.price_from}</small>
              </li>
            ))}
          </ol>
          {preview.suggestions.length > 0 ? (
            <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">
              {preview.suggestions[0]}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
