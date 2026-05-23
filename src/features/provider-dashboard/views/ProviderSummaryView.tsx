import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  PackageOpen,
  Sparkles,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchProviderSummary } from "@/features/provider-dashboard/api";
import { DashboardMetricCard } from "@/features/provider-dashboard/components/DashboardMetricCard";
import { DashboardPageHeader } from "@/features/provider-dashboard/components/DashboardPageHeader";
import { DashboardPanel } from "@/features/provider-dashboard/components/DashboardPanel";
import {
  DashboardErrorState,
  DashboardLoadingState,
} from "@/features/provider-dashboard/components/DashboardStates";
import { DashboardStatePill } from "@/features/provider-dashboard/components/DashboardStatePill";
import { useProviderDashboardSession } from "@/features/provider-dashboard/context/ProviderDashboardSessionContext";
import type {
  DashboardOnboardingStage,
  ProviderSummaryResponse,
} from "@/features/provider-dashboard/types";
import { cn } from "@/lib/utils";

const onboardingCopy: Record<string, string> = {
  SIN_IMPRESORAS_ACTIVAS: "Definir impresoras activas",
  SIN_MATERIAL_ACTIVO_CON_STOCK: "Cargar materiales con precio y stock",
  NOMBRE_COMERCIAL_FALTANTE: "Completar nombre comercial",
  EMAIL_OPERATIVO_FALTANTE: "Agregar email operativo",
  TELEFONO_O_WHATSAPP_FALTANTE: "Agregar telefono o WhatsApp",
  DIAS_ESPERA_INVALIDO: "Revisar tiempo de entrega",
  MIN_TRABAJO_FALTANTE: "Definir trabajo minimo",
  SIN_LOGISTICA_OPERATIVA: "Configurar al menos un metodo logistico",
  DIRECCION_OPERATIVA_FALTANTE: "Completar direccion operativa",
  LOCALIDAD_FALTANTE: "Completar localidad",
  PROVINCIA_FALTANTE: "Completar provincia",
  COORDENADAS_FALTANTES: "Capturar coordenadas",
  GEO_SOURCE_FALTANTE: "Registrar fuente geolocalizada",
  VALIDACION_POSTAL_PENDIENTE: "Validar direccion postal",
  VALIDACION_POSTAL_RECHAZADA: "Corregir direccion postal rechazada",
  VALIDACION_POSTAL_ERROR: "Reintentar validacion postal",
  DATOS_LEGALES_FALTANTES: "Completar datos legales",
  CUIT_FALTANTE: "Agregar CUIT",
  MP_OAUTH_FALTANTE: "Vincular Mercado Pago",
  LOGO_URL_FALTANTE: "Agregar logo",
  DESCRIPCION_PUBLICA_FALTANTE: "Sumar descripcion publica",
  HORARIO_OPERATIVO_FALTANTE: "Definir horario operativo",
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatCount(value: number) {
  return new Intl.NumberFormat("es-AR").format(value || 0);
}

function humanizeReason(reason: string) {
  return onboardingCopy[reason] ?? reason.replaceAll("_", " ").toLowerCase();
}

function greetByHour(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos dias";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function ReadyRow({ label, ok, pending }: { label: string; ok: boolean; pending: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[var(--c3d-card-border)] bg-[var(--c3d-card-bg-alt)] px-4 py-3">
      <div className="flex items-center gap-3">
        {ok ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : (
          <CircleDashed className="h-4 w-4 text-[var(--c3d-text-faint)]" />
        )}
        <span className="text-sm text-[var(--c3d-text-strong)]">{label}</span>
      </div>
      <DashboardStatePill tone={ok ? "success" : "muted"} className="border-white/10 bg-white/5">
        {ok ? "OK" : pending}
      </DashboardStatePill>
    </div>
  );
}

function SummaryContent({ summary }: { summary: ProviderSummaryResponse }) {
  const m = summary.metrics;
  const provider = summary.provider;
  const providerName = (provider as Record<string, unknown>).nombre_comercial as string | undefined
    || provider.nombre
    || "Proveedor";

  const scoreDeltaText = useMemo(() => {
    const d = m.score_delta_30d;
    if (d == null) return null;
    if (d > 0) return `+${d} pts este mes`;
    if (d < 0) return `${d} pts este mes`;
    return "Sin cambios";
  }, [m.score_delta_30d]);

  const nextAction = useMemo(() => {
    const missing = [
      ...(summary.onboarding.quote_stage?.missing || []),
      ...(summary.onboarding.visibility_stage?.missing || []),
      ...(summary.onboarding.order_stage?.missing || []),
    ];
    if (missing.length === 0) return null;
    return { reason: missing[0], label: humanizeReason(missing[0]) };
  }, [summary.onboarding]);

  const revenueTrendDirection = useMemo((): "up" | "down" | "flat" => {
    const curr = m.revenue_month ?? 0;
    const prev = m.revenue_prev_month ?? 0;
    if (prev === 0) return curr > 0 ? "up" : "flat";
    return curr > prev ? "up" : curr < prev ? "down" : "flat";
  }, [m.revenue_month, m.revenue_prev_month]);

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        variant="dark"
        eyebrow="PANORAMA OPERATIVO"
        title={`${greetByHour()}, ${providerName}`}
        description={
          summary.readiness.order_ready
            ? "Tu operacion esta activa. Revisa cotizaciones nuevas y el estado de tus pedidos en curso."
            : "Completa los requisitos pendientes para activar tu participacion en cotizaciones y pedidos."
        }
        metaPills={
          <>
            <DashboardStatePill
              tone={provider.estado === "activo" ? "success" : "warning"}
              className="border-white/10 bg-white/5"
            >
              {provider.estado === "activo" ? "Participacion activa" : "En configuracion"}
            </DashboardStatePill>
            <DashboardStatePill
              tone={summary.effective_permissions.visible_in_marketplace ? "info" : "muted"}
              className="border-white/10 bg-white/5"
            >
              {summary.effective_permissions.visible_in_marketplace
                ? "Visible en marketplace"
                : "No visible"}
            </DashboardStatePill>
            {summary.onboarding.quote_stage?.missing?.length ||
            summary.onboarding.visibility_stage?.missing?.length ||
            summary.onboarding.order_stage?.missing?.length ? (
              <DashboardStatePill tone="warning" className="border-white/10 bg-white/5">
                {(summary.onboarding.quote_stage?.missing?.length ?? 0) +
                  (summary.onboarding.visibility_stage?.missing?.length ?? 0) +
                  (summary.onboarding.order_stage?.missing?.length ?? 0)}{" "}
                validaciones pendientes
              </DashboardStatePill>
            ) : null}
          </>
        }
        actions={
          <Button
            asChild
            className="h-10 rounded-xl border border-white/15 bg-gradient-to-r from-primary to-cyan-500 px-5 text-sm font-semibold text-white hover:from-primary/90 hover:to-cyan-500/90"
          >
            <a href="/proveedores-v2/cotizaciones">
              Ver cotizaciones
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </a>
          </Button>
        }
      />

      {/* Metric grid — 4 cards */}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          title="Cotizaciones activas"
          value={formatCount(m.cotizaciones_participadas)}
          support={`${formatCount(m.cotizaciones_mostradas)} oportunidades`}
          icon={<ClipboardList className="h-5 w-5" />}
          trend={{ direction: "up", text: `+${formatCount(m.cotizaciones_participadas)} participadas` }}
          sparkline={m.sparkline_quotes_7d || [0, 0, 0, 0, 0, 0, 0]}
          isHot
        />
        <DashboardMetricCard
          title="Pedidos en produccion"
          value={formatCount(m.pedidos_abiertos)}
          support={`${formatCount(m.pedidos_historicos)} historicos`}
          icon={<PackageOpen className="h-5 w-5" />}
          trend={{ direction: "flat", text: `${formatCount(m.pedidos_historicos)} historicos` }}
          sparkline={m.sparkline_orders_7d || [0, 0, 0, 0, 0, 0, 0]}
        />
        <DashboardMetricCard
          title="Ingresos del mes"
          value={formatMoney(m.revenue_month ?? 0)}
          support={`Mes anterior: ${formatMoney(m.revenue_prev_month ?? 0)}`}
          icon={<Wallet className="h-5 w-5" />}
          trend={{ direction: revenueTrendDirection, text: `vs ${formatMoney(m.revenue_prev_month ?? 0)} anterior` }}
          sparkline={m.sparkline_revenue_7d || [0, 0, 0, 0, 0, 0, 0]}
        />
        <DashboardMetricCard
          title="Score de confianza"
          value={`${summary.profile_score}`}
          valueSuffix="/100"
          support="Nivel de completitud operacional"
          icon={<Sparkles className="h-5 w-5" />}
          trend={
            scoreDeltaText
              ? { direction: (m.score_delta_30d ?? 0) >= 0 ? "up" : "down", text: scoreDeltaText }
              : { direction: "flat", text: "Sin historico aun" }
          }
        />
      </section>

      {/* Row 2: Estado del perfil + Siguiente accion */}
      <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <DashboardPanel
          title="Estado del perfil"
          description="Habilitaciones criticas para participar en cotizaciones, ser visible y aceptar pedidos."
        >
          <div className="space-y-2.5">
            <ReadyRow
              label="Cotizaciones"
              ok={summary.readiness.quote_ready}
              pending="Faltan requisitos"
            />
            <ReadyRow
              label="Marketplace"
              ok={summary.readiness.visibility_ready}
              pending="No visible aun"
            />
            <ReadyRow
              label="Pedidos directos"
              ok={summary.readiness.order_ready}
              pending="Falta vincular MP"
            />
            <ReadyRow
              label="Datos legales"
              ok={
                !!(provider as Record<string, unknown>).cuit &&
                !!(provider as Record<string, unknown>).nombre_legal
              }
              pending="Faltan CUIT/razon social"
            />
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Siguiente accion"
          description={
            nextAction
              ? "La tarea mas importante para avanzar tu operacion."
              : "Tu perfil esta completo. Segui atendiendo cotizaciones."
          }
        >
          {nextAction ? (
            <div className="flex flex-col items-start gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <p className="font-semibold text-[var(--c3d-text-strong)]">
                  {nextAction.label}
                </p>
              </div>
              <p className="text-sm text-[var(--c3d-text-muted)]">
                Resolver esto desbloquea la siguiente capa de readiness para tu proveedor.
              </p>
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-white/15 bg-white/10 px-4 text-sm text-white hover:bg-white/20"
              >
                <a href="/proveedores-v2/perfil">Ir a configurar</a>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <BadgeCheck className="h-5 w-5 text-emerald-400" />
              <p className="text-sm text-emerald-300">
                Perfil completo. Segui atendiendo cotizaciones y pedidos.
              </p>
            </div>
          )}
        </DashboardPanel>
      </section>

      {/* Row 3: Datos comerciales + Onboarding + Bloqueos */}
      <section className="grid gap-5 xl:grid-cols-3">
        <DashboardPanel title="Datos comerciales">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {[
              { label: "Nombre", value: providerName },
              {
                label: "CUIT",
                value: (provider as Record<string, unknown>).cuit as string || "Pendiente",
              },
              {
                label: "Ubicacion",
                value:
                  [provider.localidad, provider.provincia].filter(Boolean).join(", ") ||
                  "Pendiente",
              },
              {
                label: "Tiempo de entrega",
                value:
                  provider.tiempo_entrega_dias != null
                    ? `${provider.tiempo_entrega_dias} dias`
                    : "Pendiente",
              },
              {
                label: "Trabajo minimo",
                value:
                  provider.min_trabajo != null
                    ? formatMoney(provider.min_trabajo)
                    : "Pendiente",
              },
              {
                label: "Calificacion",
                value:
                  (provider as Record<string, unknown>).calificacion != null
                    ? `★ ${Number((provider as Record<string, unknown>).calificacion).toFixed(1)}`
                    : "Sin calificar",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-[var(--c3d-card-border)] bg-[var(--c3d-card-bg-alt)] p-3.5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--c3d-text-faint)]">
                  {item.label}
                </p>
                <p className="mt-1.5 font-[Montserrat] text-sm font-bold text-[var(--c3d-text-strong)]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Checklist de onboarding">
          <div className="space-y-2">
            {(
              [
                { label: "Cotizaciones", stage: summary.onboarding.quote_stage },
                { label: "Marketplace", stage: summary.onboarding.visibility_stage },
                { label: "Pedidos", stage: summary.onboarding.order_stage },
                { label: "Plus de perfil", stage: summary.onboarding.optional_stage },
              ] as { label: string; stage?: DashboardOnboardingStage }[]
            ).map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl border border-[var(--c3d-card-border)] bg-[var(--c3d-card-bg-alt)] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {item.stage?.complete ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <CircleDashed className="h-4 w-4 text-[var(--c3d-text-faint)]" />
                  )}
                  <span className="text-sm text-[var(--c3d-text-strong)]">{item.label}</span>
                </div>
                <DashboardStatePill
                  tone={item.stage?.complete ? "success" : "warning"}
                  className="border-white/10 bg-white/5"
                >
                  {item.stage?.complete ? "Completa" : `${item.stage?.missing?.length ?? 0} pendientes`}
                </DashboardStatePill>
              </div>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Bloqueos prioritarios">
          {summary.readiness.blocking_reasons.length ? (
            <div className="space-y-2">
              {summary.readiness.blocking_reasons.slice(0, 5).map((reason, i) => (
                <div
                  key={reason}
                  className="flex items-start gap-3 rounded-2xl border border-[var(--c3d-card-border)] bg-[var(--c3d-card-bg-alt)] px-4 py-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-sm text-[var(--c3d-text-muted)]">
                    {humanizeReason(reason)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4 text-sm text-emerald-300">
              Sin bloqueos criticos detectados.
            </div>
          )}
        </DashboardPanel>
      </section>
    </div>
  );
}

export function ProviderSummaryView() {
  const { providerId } = useProviderDashboardSession();

  const summaryQuery = useQuery({
    queryKey: ["provider-dashboard", "summary", providerId],
    queryFn: () => fetchProviderSummary(providerId!),
    enabled: providerId != null,
    staleTime: 30_000,
  });

  const summary = useMemo(() => summaryQuery.data, [summaryQuery.data]);

  if (summaryQuery.isLoading || summaryQuery.isFetching) {
    return <DashboardLoadingState />;
  }

  if (summaryQuery.isError || !summary) {
    return (
      <DashboardErrorState
        message="No pudimos cargar el resumen del proveedor."
        onRetry={() => void summaryQuery.refetch()}
      />
    );
  }

  return <SummaryContent summary={summary} />;
}
