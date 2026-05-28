import { Search } from "lucide-react";

import type { ProviderMarketplacePreviewResponse } from "@/features/provider-dashboard/types";
import { cn } from "@/lib/utils";

export function MarketplacePreviewPanel({
  preview,
  isLoading,
}: {
  preview?: ProviderMarketplacePreviewResponse;
  isLoading?: boolean;
}) {
  const queryLabel = preview
    ? `${preview.query.material} ${preview.query.zona} - ${preview.query.total_results} proveedores`
    : '"PLA CABA" - 4 proveedores';
  const results = preview?.results?.length ? preview.results : [];

  return (
    <section className="overflow-hidden rounded-[17px] border border-[var(--c3d-card-border)] bg-[var(--c3d-card-bg)] shadow-[var(--c3d-card-shadow)]" aria-label="Preview marketplace">
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
              Como apareces en busquedas
            </h2>
            <p className="mt-0.5 text-[12px] leading-[1.5] text-[var(--c3d-text-muted)]">
              Vista que ven los clientes cuando comparan proveedores.
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
              <li
                key={item.provider_id}
                data-you={item.is_you ? "true" : "false"}
                className={cn(
                  "relative grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-[10px] border px-3 py-3 text-sm",
                  item.is_you
                    ? "border-blue-400 bg-white text-slate-900 shadow-[0_0_0_1px_rgba(37,99,235,0.35)]"
                    : "border-white/10 bg-white/[0.28] text-slate-800 opacity-55"
                )}
              >
                {item.is_you ? (
                  <span className="absolute -right-1 -top-2 rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-extrabold text-white">
                    VOS
                  </span>
                ) : null}
                <span className="font-[Montserrat] text-sm font-extrabold">#{item.position}</span>
                <div className="min-w-0">
                  <strong className="block truncate text-sm font-bold">{item.name}</strong>
                  <em className="not-italic text-xs font-semibold text-slate-500">
                    {item.rating ? item.rating.toFixed(1) : "Nuevo"} - {item.reviews_count} reviews
                  </em>
                </div>
                <small className="text-right text-xs font-bold">desde ${Math.round(item.price_from)}</small>
              </li>
            ))
          ) : (
            <>
              <GhostRow label="Otro proveedor" price="$5.100" />
              <li className="relative grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-[10px] border border-blue-400 bg-white px-3 py-3 text-sm text-slate-900 shadow-[0_0_0_1px_rgba(37,99,235,0.35)]">
                <span className="absolute -right-1 -top-2 rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-extrabold text-white">
                  VOS
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-slate-800 font-[Montserrat] text-[12px] font-extrabold text-white">
                  M3
                </span>
                <div className="min-w-0">
                  <strong className="block truncate text-sm font-bold">Mega 3D</strong>
                  <em className="not-italic text-xs font-semibold text-slate-500">Flores, CABA - PLA - PETG - ABS</em>
                </div>
                <small className="text-right text-xs font-bold">desde $4.800</small>
              </li>
              <GhostRow label="Otro proveedor" price="$5.300" />
            </>
          )}
        </ol>

        <div className="mt-3 rounded-[10px] border border-blue-400/20 bg-blue-500/[0.08] px-3 py-2 text-[12px] font-semibold leading-relaxed text-blue-100">
          {preview?.suggestions?.[0] ?? "Apareces #2 de 4 - completa CUIT + MercadoPago para subir al #1."}
        </div>
      </div>
    </section>
  );
}

function GhostRow({ label, price }: { label: string; price: string }) {
  return (
    <li className="grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-[10px] border border-white/10 bg-white/[0.28] px-3 py-3 text-sm text-slate-800 opacity-55">
      <span className="h-8 w-8 rounded-[8px] bg-slate-500/45" />
      <strong className="truncate text-sm font-bold">{label} - 4.6</strong>
      <small className="text-right text-xs font-bold">desde {price}</small>
    </li>
  );
}
