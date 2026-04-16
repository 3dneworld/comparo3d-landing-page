import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  Gauge,
  Layers3,
  LineChart,
  LoaderCircle,
  RefreshCcw,
  Scale,
  Search,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchProviderCompetitiveness } from "@/features/provider-dashboard/api";
import { DashboardPageHeader } from "@/features/provider-dashboard/components/DashboardPageHeader";
import { DashboardPanel } from "@/features/provider-dashboard/components/DashboardPanel";
import { DashboardStatePill } from "@/features/provider-dashboard/components/DashboardStatePill";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
} from "@/features/provider-dashboard/components/DashboardStates";
import { useProviderDashboardSession } from "@/features/provider-dashboard/context/ProviderDashboardSessionContext";
import type {
  DashboardCompetitivenessBenchmark,
  ProviderCompetitivenessResponse,
} from "@/features/provider-dashboard/types";
import { cn } from "@/lib/utils";

const materialOptions = ["PLA", "PETG", "ABS", "NYLON", "TPU"];

const positionCopy: Record<string, { label: string; tone: "success" | "warning" | "danger" | "info"; icon: ReactNode }> = {
  POR_DEBAJO_DEL_MERCADO: {
    label: "Por debajo del mercado",
    tone: "warning",
    icon: <TrendingDown className="h-4 w-4" />,
  },
  EN_LINEA_CON_EL_MERCADO: {
    label: "En linea con el mercado",
    tone: "success",
    icon: <Scale className="h-4 w-4" />,
  },
  POR_ENCIMA_DEL_MERCADO: {
    label: "Por encima del mercado",
    tone: "danger",
    icon: <TrendingUp className="h-4 w-4" />,
  },
};

const errorCopy: Record<string, string> = {
  OWN_PRICE_INVALID: "El proveedor no tiene precio propio valido para este material.",
  INSUFFICIENT_SAMPLE: "No hay muestra comparable suficiente para publicar benchmark.",
};

function formatMoney(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "Sin dato";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatNumber(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "Sin dato";
  return new Intl.NumberFormat("es-AR").format(Number(value));
}

function formatPercentile(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "Sin dato";
  return `P${Math.max(0, Math.min(100, Math.round(Number(value))))}`;
}

function cohortLabel(value?: string | null) {
  if (!value) return "Sin cohorte";
  const map: Record<string, string> = {
    same_province_same_tier_legacy: "Misma provincia y tier",
    same_province_legacy: "Misma provincia",
    same_tier_legacy: "Mismo tier",
    material_all_active_legacy: "Todos los activos del material",
  };
  return map[value] ?? value.replaceAll("_", " ");
}

function positionMeta(label?: string | null) {
  if (!label) {
    return {
      label: "Sin diagnostico",
      tone: "muted" as const,
      icon: <Gauge className="h-4 w-4" />,
    };
  }
  return positionCopy[label] ?? {
    label: label.replaceAll("_", " "),
    tone: "info" as const,
    icon: <Gauge className="h-4 w-4" />,
  };
}

function sampleTone(sampleSize?: number | null) {
  const sample = Number(sampleSize) || 0;
  if (sample >= 10) return "success";
  if (sample >= 5) return "info";
  if (sample > 0) return "warning";
  return "muted";
}

function benchmarkSpread(benchmark?: DashboardCompetitivenessBenchmark) {
  const p25 = Number(benchmark?.p25);
  const p75 = Number(benchmark?.p75);
  if (!Number.isFinite(p25) || !Number.isFinite(p75) || p25 <= 0) return null;
  return Math.round(((p75 - p25) / p25) * 100);
}

function SnapshotCard({
  title,
  value,
  support,
  icon,
}: {
  title: string;
  value: string;
  support: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
          <p className="font-[Montserrat] text-xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{support}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}

function RangeBar({ ownPrice, benchmark }: { ownPrice?: number | null; benchmark?: DashboardCompetitivenessBenchmark }) {
  const p25 = Number(benchmark?.p25);
  const p75 = Number(benchmark?.p75);
  const median = Number(benchmark?.median);
  const own = Number(ownPrice);
  const maxValue = Math.max(p75, median, own, 1);
  const ownPct = Number.isFinite(own) ? Math.max(0, Math.min(100, (own / maxValue) * 100)) : 0;
  const p25Pct = Number.isFinite(p25) ? Math.max(0, Math.min(100, (p25 / maxValue) * 100)) : 0;
  const p75Pct = Number.isFinite(p75) ? Math.max(0, Math.min(100, (p75 / maxValue) * 100)) : 0;
  const medianPct = Number.isFinite(median) ? Math.max(0, Math.min(100, (median / maxValue) * 100)) : 0;

  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Rango competitivo P25-P75</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Propio {formatMoney(ownPrice)} | Mediana {formatMoney(benchmark?.median)}
          </p>
        </div>
        <DashboardStatePill tone="info">{formatPercentile(benchmark?.percentile)}</DashboardStatePill>
      </div>
      <div className="relative mt-6 h-4 rounded-full bg-muted">
        <div
          className="absolute top-0 h-4 rounded-full bg-primary/20"
          style={{
            left: `${Math.min(p25Pct, p75Pct)}%`,
            width: `${Math.max(4, Math.abs(p75Pct - p25Pct))}%`,
          }}
        />
        <div className="absolute top-[-6px] h-7 w-1 rounded-full bg-primary" style={{ left: `${medianPct}%` }} title="Mediana" />
        <div
          className="absolute top-[-8px] h-8 w-8 -translate-x-1/2 rounded-full border-4 border-white bg-foreground shadow-card"
          style={{ left: `${ownPct}%` }}
          title="Precio propio"
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>P25 {formatMoney(benchmark?.p25)}</span>
        <span>Mediana {formatMoney(benchmark?.median)}</span>
        <span>P75 {formatMoney(benchmark?.p75)}</span>
      </div>
    </div>
  );
}

function DebugCounts({ counts }: { counts?: Record<string, number> }) {
  const entries = Object.entries(counts || {});

  if (!entries.length) {
    return (
      <div className="rounded-[1.15rem] border border-dashed border-border/80 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
        Sin debug counts para este benchmark.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-[1rem] border border-border/70 bg-background/70 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{cohortLabel(key)}</p>
          <p className="mt-2 font-[Montserrat] text-lg font-bold tracking-tight text-foreground">{formatNumber(value)}</p>
        </div>
      ))}
    </div>
  );
}

function BenchmarkAvailable({ data }: { data: ProviderCompetitivenessResponse }) {
  const benchmark = data.benchmark || {};
  const meta = positionMeta(benchmark.position_label);
  const spread = benchmarkSpread(benchmark);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SnapshotCard title="Precio propio" value={formatMoney(data.own_price)} support="Fuente legacy viva del proveedor." icon={<WalletCards className="h-5 w-5" />} />
        <SnapshotCard title="Mediana cohorte" value={formatMoney(benchmark.median)} support={cohortLabel(data.cohort)} icon={<BarChart3 className="h-5 w-5" />} />
        <SnapshotCard title="Percentil" value={formatPercentile(benchmark.percentile)} support="Posicion del precio propio contra pares." icon={<Target className="h-5 w-5" />} />
        <SnapshotCard title="Muestra" value={formatNumber(benchmark.sample_size)} support={`Spread P25-P75 ${spread == null ? "sin dato" : `${spread}%`}`} icon={<Layers3 className="h-5 w-5" />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardPanel title="Diagnostico competitivo" description="Lectura no bloqueante del precio propio contra la cohorte elegida.">
          <div className="space-y-4">
            <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                      meta.tone === "success"
                        ? "bg-emerald-50 text-emerald-700"
                        : meta.tone === "danger"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-amber-50 text-amber-700"
                    )}
                  >
                    {meta.icon}
                  </div>
                  <div>
                    <p className="font-[Montserrat] text-lg font-bold tracking-tight text-foreground">{meta.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {benchmark.suggestion || "Sin sugerencia disponible para este material."}
                    </p>
                  </div>
                </div>
                <DashboardStatePill tone={meta.tone}>{meta.label}</DashboardStatePill>
              </div>
            </div>
            <RangeBar ownPrice={data.own_price} benchmark={benchmark} />
          </div>
        </DashboardPanel>

        <DashboardPanel title="Fuente y cohorte" description="Como eligio backend la muestra comparable.">
          <div className="space-y-3">
            <div className="rounded-[1rem] border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Cohorte</p>
              <p className="mt-2 text-sm font-medium text-foreground">{cohortLabel(data.cohort)}</p>
            </div>
            <div className="rounded-[1rem] border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Fuente</p>
              <p className="mt-2 text-sm font-medium text-foreground">{data.data_source || "Sin fuente"}</p>
            </div>
            <DebugCounts counts={data.debug_counts} />
          </div>
        </DashboardPanel>
      </section>
    </div>
  );
}

function BenchmarkUnavailable({ data }: { data: ProviderCompetitivenessResponse }) {
  const benchmark = data.benchmark || {};
  const readableError = errorCopy[String(benchmark.error || "")] || benchmark.error || "Benchmark no disponible todavia.";

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <DashboardPanel title="Benchmark no disponible todavia" description="La vista queda en beta y no bloquea operacion ni onboarding.">
        <DashboardEmptyState
          title={readableError}
          description={`Material ${data.material_code || "sin material"} | Cohorte ${cohortLabel(data.cohort)} | Muestra comparable ${formatNumber(benchmark.sample_size)}`}
          icon={<Search className="h-6 w-6" />}
          className="min-h-[320px]"
        />
      </DashboardPanel>
      <DashboardPanel title="Diagnostico de muestra" description="Conteos por cohorte probada por backend.">
        <DebugCounts counts={data.debug_counts} />
      </DashboardPanel>
    </section>
  );
}

function CompetitivenessContent({
  data,
  material,
  onMaterialChange,
  onRefresh,
  isFetching,
}: {
  data: ProviderCompetitivenessResponse;
  material: string;
  onMaterialChange: (material: string) => void;
  onRefresh: () => void;
  isFetching: boolean;
}) {
  const benchmark = data.benchmark || {};
  const available = Boolean(benchmark.success);
  const meta = positionMeta(benchmark.position_label);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Vista beta"
        title="Competitividad"
        description="Benchmark no bloqueante de precio por material. Usa columnas legacy como fuente viva durante la transicion de datos."
        meta={
          <>
            <DashboardStatePill tone={available ? meta.tone : "warning"}>
              {available ? meta.label : "Beta sin muestra suficiente"}
            </DashboardStatePill>
            <DashboardStatePill tone={sampleTone(benchmark.sample_size)}>
              {formatNumber(benchmark.sample_size)} pares
            </DashboardStatePill>
            <DashboardStatePill tone="muted">{data.data_source || "sin fuente"}</DashboardStatePill>
            {isFetching ? <DashboardStatePill tone="warning">Actualizando</DashboardStatePill> : null}
          </>
        }
        actions={
          <>
            <select
              value={material}
              onChange={(event) => onMaterialChange(event.target.value)}
              className="h-11 rounded-xl border border-border/80 bg-white px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {materialOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
              onClick={onRefresh}
              disabled={isFetching}
            >
              {isFetching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Actualizar
            </Button>
          </>
        }
      />

      <div className="rounded-[1.15rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-relaxed text-sky-800">
        BETA: esta vista no frena el negocio. Si no hay muestra comparable suficiente, se muestra empty state util y se sigue operando.
      </div>

      {available ? <BenchmarkAvailable data={data} /> : <BenchmarkUnavailable data={data} />}

      <DashboardPanel title="Como leer esta vista" description="Reglas simples para interpretar el benchmark.">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[1rem] border border-border/70 bg-background/70 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            Bajo P25 puede indicar margen para subir precio sin salir de rango competitivo.
          </div>
          <div className="rounded-[1rem] border border-border/70 bg-background/70 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            Entre P25 y P75 se considera alineado con pares comparables.
          </div>
          <div className="rounded-[1rem] border border-border/70 bg-background/70 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            Sobre P75 puede aumentar riesgo de perder seleccion en cotizaciones sensibles a precio.
          </div>
        </div>
      </DashboardPanel>
    </div>
  );
}

export function ProviderCompetitivenessView() {
  const { providerId } = useProviderDashboardSession();
  const [material, setMaterial] = useState("PLA");

  const competitivenessQuery = useQuery({
    queryKey: ["provider-dashboard", "competitiveness", providerId, material],
    queryFn: () => fetchProviderCompetitiveness(providerId!, material),
    enabled: providerId != null,
    staleTime: 20_000,
  });

  const data = useMemo(() => competitivenessQuery.data, [competitivenessQuery.data]);

  if (competitivenessQuery.error) {
    return (
      <DashboardErrorState
        title="No pudimos cargar Competitividad"
        description="La ruta React esta lista, pero el endpoint real de benchmark no respondio correctamente."
      />
    );
  }

  if (competitivenessQuery.isLoading || (competitivenessQuery.isFetching && !data)) {
    return (
      <DashboardLoadingState
        title="Armando competitividad"
        description="Estamos comparando el precio del proveedor contra la cohorte real disponible."
      />
    );
  }

  if (!data) {
    return (
      <DashboardEmptyState
        title="No encontramos benchmark"
        description="La sesion esta activa, pero no recibimos una respuesta valida para esta vista."
        icon={<AlertTriangle className="h-6 w-6" />}
      />
    );
  }

  return (
    <CompetitivenessContent
      data={data}
      material={material}
      onMaterialChange={setMaterial}
      onRefresh={() => void competitivenessQuery.refetch()}
      isFetching={competitivenessQuery.isFetching}
    />
  );
}
