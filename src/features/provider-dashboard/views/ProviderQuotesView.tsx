import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Clock3,
  FileText,
  LoaderCircle,
  ReceiptText,
  RefreshCcw,
  Search,
  Wallet,
  Box,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchProviderQuoteDetail, fetchProviderQuotes } from "@/features/provider-dashboard/api";
import { DashboardPageHeader } from "@/features/provider-dashboard/components/DashboardPageHeader";
import { DashboardPanel } from "@/features/provider-dashboard/components/DashboardPanel";
import { DashboardStatePill } from "@/features/provider-dashboard/components/DashboardStatePill";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
} from "@/features/provider-dashboard/components/DashboardStates";
import { DashboardMetricCard } from "@/features/provider-dashboard/components/DashboardMetricCard";
import { cn } from "@/lib/utils";
import { useProviderDashboardSession } from "@/features/provider-dashboard/context/ProviderDashboardSessionContext";
import type { DashboardQuoteMatch } from "@/features/provider-dashboard/types";

const quoteStatusOptions = [
  { value: "", label: "Todos los estados" },
  { value: "quoted", label: "Cotizadas" },
  { value: "selected_pending_payment", label: "Seleccionadas, pago pendiente" },
  { value: "paid_confirmed", label: "Pago confirmado" },
  { value: "won", label: "Ganadas" },
  { value: "not_selected", label: "No seleccionadas" },
  { value: "payment_rejected", label: "Pago rechazado" },
  { value: "expired", label: "Vencidas" },
];

const statusCopy: Record<string, { label: string; tone: "success" | "warning" | "danger" | "info" | "muted" }> = {
  quoted: { label: "Cotizada", tone: "info" },
  selected_pending_payment: { label: "Pago pendiente", tone: "warning" },
  paid_confirmed: { label: "Pago confirmado", tone: "success" },
  won: { label: "Ganada", tone: "success" },
  not_selected: { label: "No seleccionada", tone: "muted" },
  payment_rejected: { label: "Pago rechazado", tone: "danger" },
  expired: { label: "Vencida", tone: "danger" },
};

function statusMeta(status?: string | null) {
  if (!status) return { label: "Pendiente", tone: "muted" as const };
  return statusCopy[status] ?? { label: status.replaceAll("_", " "), tone: "muted" as const };
}

function formatMoney(value?: number | null) {
  if (value == null) return "Sin precio";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatNumber(value?: number | string | null, fallback = "Sin dato") {
  if (value == null || value === "") return fallback;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(numeric);
}

function formatDateTime(value?: string | null) {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin registro";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatMinutes(value?: number | null) {
  if (value == null) return "Sin tiempo";
  const minutes = Number(value);
  if (!Number.isFinite(minutes)) return "Sin tiempo";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

function quoteDate(quote: DashboardQuoteMatch) {
  return quote.updated_at || quote.created_at || quote.selected_at || null;
}

function quoteDisplayId(quote: DashboardQuoteMatch) {
  return quote.quote_uid || `#${quote.cotizacion_id || quote.id}`;
}

function DetailRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="rounded-[1rem] border border-border/70 bg-background/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium leading-relaxed text-foreground">{value || "Sin dato"}</div>
    </div>
  );
}

function QuoteDetailPanel({
  quote,
  isLoading,
  error,
}: {
  quote?: DashboardQuoteMatch | null;
  isLoading: boolean;
  error: unknown;
}) {
  if (isLoading) {
    return (
      <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-5">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
          Cargando detalle comercial...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
        No pudimos cargar el detalle de esta cotizacion.
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-border/80 bg-background/70 p-5 text-sm leading-relaxed text-muted-foreground">
        Elegi una cotizacion para ver el detalle permitido para proveedor. Cliente, STL y archivos siguen ocultos hasta pedido confirmado.
      </div>
    );
  }

  const meta = statusMeta(quote.estado);

  return (
    <div className="space-y-4">
      <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-[Montserrat] text-lg font-bold tracking-tight text-foreground">
              {quoteDisplayId(quote)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Match #{quote.id}</p>
          </div>
          <DashboardStatePill tone={meta.tone}>{meta.label}</DashboardStatePill>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailRow label="Material" value={quote.material || "Sin material"} />
        <DetailRow label="Cantidad" value={formatNumber(quote.cantidad)} />
        <DetailRow label="Precio final" value={formatMoney(quote.precio_final)} />
        <DetailRow label="Tiempo de impresion" value={formatMinutes(quote.print_time_min)} />
        <DetailRow label="Entrega estimada" value={quote.delivery_days_est != null ? `${quote.delivery_days_est} dias` : "Sin estimacion"} />
        <DetailRow label="Ranking score" value={formatNumber(quote.ranking_score_snapshot)} />
        <DetailRow label="Infill" value={quote.infill || "Sin dato"} />
        <DetailRow label="Layer height" value={quote.layer_height || "Sin dato"} />
        <DetailRow label="Color" value={quote.color || "Sin color"} />
        <DetailRow label="Filamento" value={quote.filament_grams != null ? `${formatNumber(quote.filament_grams)} g` : "Sin dato"} />
        <DetailRow label="Seleccionada" value={formatDateTime(quote.selected_at)} />
        <DetailRow label="Actualizada" value={formatDateTime(quote.updated_at || quote.created_at)} />
      </div>

      {quote.detalles ? (
        <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Notas del pedido</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">{quote.detalles}</p>
        </div>
      ) : null}
    </div>
  );
}

const QUOTES_TABLE_COLS =
  "grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.5fr)_minmax(0,0.8fr)_minmax(0,0.9fr)]";

function QuoteRow({
  quote,
  selected,
  onSelect,
  isLast,
}: {
  quote: DashboardQuoteMatch;
  selected: boolean;
  onSelect: () => void;
  isLast: boolean;
}) {
  const meta = statusMeta(quote.estado);
  const material = quote.material || "Sin material";
  const color = quote.color || "Sin color";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group w-full text-left transition-colors",
        !isLast && "border-b border-border/60",
        selected ? "bg-primary/[0.05]" : "hover:bg-muted/40"
      )}
    >
      <div className={cn("grid items-center gap-4 px-4 py-3.5 md:px-5", QUOTES_TABLE_COLS)}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Box className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{quoteDisplayId(quote)}</p>
            <p className="truncate text-xs text-muted-foreground">Match #{quote.id}</p>
          </div>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{material}</p>
          <p className="truncate text-xs text-muted-foreground">{color}</p>
        </div>
        <div className="text-sm text-muted-foreground">×{formatNumber(quote.cantidad, "1")}</div>
        <div className="text-sm font-semibold text-foreground">{formatMoney(quote.precio_final)}</div>
        <div className="flex justify-start">
          <DashboardStatePill tone={meta.tone}>{meta.label}</DashboardStatePill>
        </div>
      </div>
    </button>
  );
}

function QuotesTableHeader() {
  return (
    <div
      className={cn(
        "hidden border-b border-border/60 bg-muted/30 px-4 py-2.5 md:px-5 lg:grid",
        QUOTES_TABLE_COLS,
        "gap-4"
      )}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Archivo</span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Material</span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Cant.</span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Sugerido</span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Estado</span>
    </div>
  );
}

function QuotesContent({
  items,
  selectedQuote,
  selectedId,
  detailLoading,
  detailError,
  statusFilter,
  onStatusChange,
  onRefresh,
  onSelectQuote,
  isFetching,
}: {
  items: DashboardQuoteMatch[];
  selectedQuote?: DashboardQuoteMatch | null;
  selectedId: number | null;
  detailLoading: boolean;
  detailError: unknown;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  onRefresh: () => void;
  onSelectQuote: (id: number) => void;
  isFetching: boolean;
}) {
  const quotedCount = items.filter((item) => item.estado === "quoted").length;
  const selectedCount = items.filter((item) =>
    ["selected_pending_payment", "paid_confirmed", "won"].includes(String(item.estado || ""))
  ).length;
  const totalValue = items.reduce((sum, item) => sum + (Number(item.precio_final) || 0), 0);
  const lastQuote = items[0];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        variant="dark"
        eyebrow="PANEL COMERCIAL"
        title="Cotizaciones participadas"
        description="Oportunidades donde fuiste mostrado o seleccionado. El cliente y los archivos son visibles recién cuando existe un pedido confirmado."
        metaPills={
          <>
            <DashboardStatePill tone={items.length ? "info" : "muted"}>{items.length} resultados</DashboardStatePill>
            <DashboardStatePill tone={selectedCount ? "success" : "muted"}>{selectedCount} seleccionadas</DashboardStatePill>
            {isFetching ? <DashboardStatePill tone="warning">Actualizando</DashboardStatePill> : null}
          </>
        }
        lastSync="en tiempo real"
        actions={
          <>
            <select
              value={statusFilter}
              onChange={(event) => onStatusChange(event.target.value)}
              className="h-10 rounded-xl border border-white/15 bg-white/10 px-3 text-sm text-white outline-none"
            >
              {quoteStatusOptions.map((option) => (
                <option key={option.value || "all"} value={option.value} className="text-foreground bg-white">
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-white/15 bg-white/10 px-4 text-white hover:bg-white/20"
              onClick={onRefresh}
              disabled={isFetching}
            >
              {isFetching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Recargar
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          title="Oportunidades"
          value={String(items.length)}
          support="Matches visibles para el proveedor."
          icon={<ReceiptText className="h-5 w-5" />}
          trend={{ direction: items.length > 0 ? "up" : "flat", text: `${items.length} en esta vista` }}
          sparkline={[30, 55, 40, 70, 50, 80, 100]}
          isHot={items.length > 0}
        />
        <DashboardMetricCard
          title="Cotizadas"
          value={String(quotedCount)}
          support="Aun disponibles o esperando decision."
          icon={<FileText className="h-5 w-5" />}
          trend={{ direction: quotedCount > 0 ? "up" : "flat", text: `${quotedCount} en espera` }}
          sparkline={[40, 50, 45, 60, 55, 65, 70]}
        />
        <DashboardMetricCard
          title="Valor listado"
          value={formatMoney(totalValue)}
          support="Suma de precios de la vista actual."
          icon={<Wallet className="h-5 w-5" />}
          trend={{ direction: totalValue > 0 ? "up" : "flat", text: "Vista actual" }}
          sparkline={[35, 45, 55, 50, 75, 80, 90]}
        />
        <DashboardMetricCard
          title="Ultima actividad"
          value={lastQuote ? formatDateTime(quoteDate(lastQuote)).split(",")[0] : "Sin datos"}
          support="Segun el filtro aplicado."
          icon={<Clock3 className="h-5 w-5" />}
          trend={{ direction: "flat", text: "Filtro actual" }}
          sparkline={[50, 55, 50, 60, 55, 65, 60]}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardPanel
          title="Listado de cotizaciones"
          description="Click en una oportunidad para abrir el detalle permitido. Cliente y archivos se mantienen protegidos hasta pedido confirmado."
          contentClassName="p-0 md:p-0"
        >
          {items.length ? (
            <div className="overflow-hidden rounded-b-[1.25rem]">
              <QuotesTableHeader />
              <div>
                {items.map((quote, index) => (
                  <QuoteRow
                    key={quote.id}
                    quote={quote}
                    selected={selectedId === quote.id}
                    onSelect={() => onSelectQuote(quote.id)}
                    isLast={index === items.length - 1}
                  />
                ))}
              </div>
            </div>
          ) : (
            <DashboardEmptyState
              title="No hay cotizaciones para este filtro"
              description="No es un error visual: el endpoint real no devolvio oportunidades para el estado seleccionado."
              icon={<Search className="h-6 w-6" />}
              className="min-h-[420px]"
            />
          )}
        </DashboardPanel>

        <div className="space-y-6">
          <DashboardPanel
            title="Detalle seguro"
            description="Informacion comercial permitida para proveedor antes de pedido confirmado."
          >
            <QuoteDetailPanel quote={selectedQuote} isLoading={detailLoading} error={detailError} />
          </DashboardPanel>

          <DashboardPanel
            title="Criterio de privacidad"
            description="Cotizaciones mantiene la misma regla del legacy."
          >
            <div className="space-y-3">
              <div className="rounded-[1.15rem] border border-border/70 bg-background/70 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                Cliente y archivos se muestran recien en Pedidos, cuando hay confirmacion operativa.
              </div>
              <div className="rounded-[1.15rem] border border-border/70 bg-background/70 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                Esta vista sirve para entender precio, material, tiempo, seleccion y estado comercial.
              </div>
            </div>
          </DashboardPanel>
        </div>
      </section>
    </div>
  );
}

export function ProviderQuotesView() {
  const { providerId } = useProviderDashboardSession();
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const quotesQuery = useQuery({
    queryKey: ["provider-dashboard", "quotes", providerId, statusFilter],
    queryFn: () => fetchProviderQuotes(providerId!, statusFilter),
    enabled: providerId != null,
    staleTime: 20_000,
  });

  const detailQuery = useQuery({
    queryKey: ["provider-dashboard", "quote-detail", providerId, selectedId],
    queryFn: () => fetchProviderQuoteDetail(providerId!, selectedId!),
    enabled: providerId != null && selectedId != null,
    staleTime: 20_000,
  });

  const items = useMemo(() => quotesQuery.data?.items || [], [quotesQuery.data]);
  const selectedQuote = detailQuery.data?.item || items.find((item) => item.id === selectedId) || null;

  if (quotesQuery.error) {
    return (
      <DashboardErrorState
        title="No pudimos cargar Cotizaciones"
        description="La ruta React esta lista, pero el endpoint real de cotizaciones no respondio correctamente."
      />
    );
  }

  if (quotesQuery.isLoading || (quotesQuery.isFetching && !quotesQuery.data)) {
    return (
      <DashboardLoadingState
        title="Armando cotizaciones"
        description="Estamos conectando el historial comercial con los datos reales del dashboard."
      />
    );
  }

  if (!quotesQuery.data) {
    return (
      <DashboardEmptyState
        title="No encontramos cotizaciones"
        description="La sesion esta activa, pero no recibimos una respuesta valida para esta vista."
        icon={<AlertTriangle className="h-6 w-6" />}
      />
    );
  }

  return (
    <QuotesContent
      items={items}
      selectedQuote={selectedQuote}
      selectedId={selectedId}
      detailLoading={detailQuery.isFetching}
      detailError={detailQuery.error}
      statusFilter={statusFilter}
      onStatusChange={(status) => {
        setStatusFilter(status);
        setSelectedId(null);
      }}
      onRefresh={() => {
        void quotesQuery.refetch();
        if (selectedId != null) void detailQuery.refetch();
      }}
      onSelectQuote={setSelectedId}
      isFetching={quotesQuery.isFetching}
    />
  );
}
