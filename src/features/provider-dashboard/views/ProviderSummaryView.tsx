import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Eye,
  FileText,
  PackageOpen,
  RefreshCcw,
  Shield,
  Sparkles,
  UserCircle,
  Wallet,
  Boxes,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  fetchProviderSummary,
  fetchProviderQuotes,
  fetchProviderProfile,
} from "@/features/provider-dashboard/api";
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
  DashboardMaterial,
  DashboardQuoteMatch,
  ProviderSummaryResponse,
} from "@/features/provider-dashboard/types";
import { cn } from "@/lib/utils";

/* ---------- helpers ---------- */

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

const quoteStatusCopy: Record<string, { label: string; tone: "success" | "warning" | "danger" | "info" | "muted" }> = {
  quoted: { label: "Pendiente", tone: "warning" },
  selected_pending_payment: { label: "En revision", tone: "info" },
  paid_confirmed: { label: "Aceptada", tone: "success" },
  won: { label: "Aceptada", tone: "success" },
  not_selected: { label: "Vencida", tone: "danger" },
  payment_rejected: { label: "Rechazada", tone: "danger" },
  expired: { label: "Vencida", tone: "danger" },
};

function quoteStatusMeta(status?: string | null) {
  if (!status) return { label: "Pendiente", tone: "warning" as const };
  return quoteStatusCopy[status] ?? { label: status.replaceAll("_", " "), tone: "muted" as const };
}

/* ---------- ReadyRow matching mockup ---------- */

function ReadyRow({
  status,
  title,
  sub,
  pillLabel,
  pillTone,
}: {
  status: "ok" | "pend" | "idle" | "bad";
  title: string;
  sub: string;
  pillLabel: string;
  pillTone: "success" | "warning" | "muted" | "danger";
}) {
  const iconColors: Record<string, string> = {
    ok: "bg-emerald-500/15 text-emerald-400",
    pend: "bg-amber-500/15 text-amber-400",
    bad: "bg-rose-500/15 text-rose-400",
    idle: "bg-white/5 text-[var(--c3d-text-faint)]",
  };

  return (
    <div className="flex items-center justify-between rounded-[11px] border border-[var(--c3d-card-border)] bg-[var(--c3d-card-bg-alt)] px-[13px] py-[11px]">
      <div className="flex items-center gap-[11px]">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            iconColors[status]
          )}
        >
          {status === "ok" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : status === "pend" ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CircleDashed className="h-4 w-4" />
          )}
        </div>
        <div>
          <p className="font-[Montserrat] text-[13px] font-bold leading-[1.3] text-[var(--c3d-text-strong)]">
            {title}
          </p>
          <p className="mt-0.5 font-[Montserrat] text-[11px] font-medium leading-[1.4] text-[var(--c3d-text-muted)]">
            {sub}
          </p>
        </div>
      </div>
      <DashboardStatePill tone={pillTone}>{pillLabel}</DashboardStatePill>
    </div>
  );
}

/* ---------- DataRow matching mockup ---------- */

function DataRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-[18px] gap-y-2 border-t border-[var(--c3d-card-border-soft)] px-0 py-[10px] first:border-t-0 first:pt-0.5">
      <span className="font-[Montserrat] text-xs font-semibold leading-[1.3] text-[var(--c3d-text-muted)]">
        {label}
      </span>
      <span
        className={cn(
          "font-[Montserrat] text-[13px] font-bold leading-[1.3] text-[var(--c3d-text-strong)] text-right",
          valueClassName
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* ---------- MatItem matching mockup ---------- */

function MatItem({
  name,
  sub,
  stockValue,
  stockUnit,
  colorHex,
  isLow,
}: {
  name: string;
  sub: string;
  stockValue: string;
  stockUnit: string;
  colorHex?: string;
  isLow?: boolean;
}) {
  return (
    <div className="flex items-center gap-[11px] rounded-[11px] border border-[var(--c3d-card-border)] p-[9px]">
      <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--c3d-card-bg-alt)]">
        {colorHex ? (
          <div
            className="h-7 w-7 rounded-md border border-white/10"
            style={{ background: colorHex }}
          />
        ) : (
          <Boxes className="h-4 w-4 text-[var(--c3d-text-faint)]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-[Montserrat] text-[13px] font-bold leading-[1.2] text-[var(--c3d-text-strong)]">
          {name}
        </p>
        <p className="mt-0.5 font-[Montserrat] text-[11px] font-medium leading-[1.3] text-[var(--c3d-text-muted)]">
          {sub}
        </p>
      </div>
      <div className="ml-auto text-right">
        <p
          className={cn(
            "font-[Montserrat] text-sm font-extrabold tabular-nums text-[var(--c3d-text-strong)]",
            isLow && "text-amber-400"
          )}
        >
          {stockValue}
        </p>
        <p className="mt-0.5 font-[Montserrat] text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--c3d-text-muted)]">
          {stockUnit}
        </p>
      </div>
    </div>
  );
}

/* ---------- QuotesTable matching mockup ---------- */

function QuotesTable({ quotes }: { quotes: DashboardQuoteMatch[] }) {
  if (!quotes.length) {
    return (
      <div className="px-6 py-8 text-center font-[Montserrat] text-sm text-[var(--c3d-text-muted)]">
        No hay cotizaciones abiertas en este momento.
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 4 }}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="px-[11px] py-2 text-left font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--c3d-text-faint)] border-b border-[var(--c3d-card-border-soft)]" style={{ paddingLeft: 24 }}>
              Cotizacion
            </th>
            <th className="px-[11px] py-2 text-left font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--c3d-text-faint)] border-b border-[var(--c3d-card-border-soft)]">
              Material
            </th>
            <th className="px-[11px] py-2 text-left font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--c3d-text-faint)] border-b border-[var(--c3d-card-border-soft)]">
              Cant.
            </th>
            <th className="px-[11px] py-2 text-left font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--c3d-text-faint)] border-b border-[var(--c3d-card-border-soft)]">
              Sugerido
            </th>
            <th className="px-[11px] py-2 text-left font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--c3d-text-faint)] border-b border-[var(--c3d-card-border-soft)]" style={{ paddingRight: 24 }}>
              Estado
            </th>
          </tr>
        </thead>
        <tbody>
          {quotes.slice(0, 5).map((q) => {
            const sm = quoteStatusMeta(q.estado);
            return (
              <tr key={q.id} className="transition-colors hover:bg-primary/[0.025]">
                <td className="border-b border-[var(--c3d-card-border-soft)] px-[11px] py-[11px] align-middle" style={{ paddingLeft: 24 }}>
                  <div className="flex items-center gap-[9px]">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
                      <FileText className="h-[17px] w-[17px]" />
                    </div>
                    <div>
                      <p className="font-[Montserrat] text-[13px] font-bold leading-none text-[var(--c3d-text-strong)]">
                        {q.quote_uid || `#${q.id}`}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="border-b border-[var(--c3d-card-border-soft)] px-[11px] py-[11px] align-middle font-[Montserrat] text-[13px] font-medium text-[var(--c3d-text-strong)]">
                  {q.material ?? "Sin mat."}
                  {q.color ? ` ${q.color}` : ""}
                </td>
                <td className="border-b border-[var(--c3d-card-border-soft)] px-[11px] py-[11px] align-middle font-[Montserrat] text-[13px] font-medium text-[var(--c3d-text-strong)]">
                  x{Number(q.cantidad) || 1}
                </td>
                <td className="border-b border-[var(--c3d-card-border-soft)] px-[11px] py-[11px] align-middle font-[Montserrat] text-[13px] font-extrabold tabular-nums text-[var(--c3d-text-strong)]">
                  {q.precio_final != null ? formatMoney(q.precio_final) : "-"}
                </td>
                <td className="border-b border-[var(--c3d-card-border-soft)] px-[11px] py-[11px] align-middle" style={{ paddingRight: 24 }}>
                  <DashboardStatePill tone={sm.tone}>{sm.label}</DashboardStatePill>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- SummaryContent ---------- */

function SummaryContent({
  summary,
  quotes,
  materials,
}: {
  summary: ProviderSummaryResponse;
  quotes: DashboardQuoteMatch[];
  materials: DashboardMaterial[];
}) {
  const m = summary.metrics;
  const provider = summary.provider;
  const providerName =
    (provider as Record<string, unknown>).nombre_comercial as string | undefined ||
    provider.nombre ||
    "Proveedor";

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

  const pendingCount =
    (summary.onboarding.quote_stage?.missing?.length ?? 0) +
    (summary.onboarding.visibility_stage?.missing?.length ?? 0) +
    (summary.onboarding.order_stage?.missing?.length ?? 0);

  const hasLegalData =
    !!(provider as Record<string, unknown>).cuit &&
    !!(provider as Record<string, unknown>).nombre_legal;

  const hasMpLinked = summary.readiness.order_ready;

  const activeMaterials = materials.filter((mat) => mat.activo);

  // CTA: first missing onboarding action
  const ctaAction = useMemo(() => {
    if (!hasMpLinked) {
      return {
        icon: <Wallet className="h-[22px] w-[22px]" />,
        eyebrow: "Siguiente accion",
        title: "Vincula MercadoPago",
        description:
          "Es el ultimo paso para aceptar pedidos directos. Toma menos de 3 minutos con tu cuenta operativa.",
        href: "/proveedores-v2/perfil",
        buttonLabel: "Vincular ahora",
      };
    }
    if (nextAction) {
      return {
        icon: <AlertCircle className="h-[22px] w-[22px]" />,
        eyebrow: "Siguiente accion",
        title: nextAction.label,
        description:
          "Resolver esto desbloquea la siguiente capa de readiness para tu proveedor.",
        href: "/proveedores-v2/perfil",
        buttonLabel: "Ir a configurar",
      };
    }
    return null;
  }, [hasMpLinked, nextAction]);

  return (
    <div className="flex flex-col gap-4">
      {/* --- PageHeader --- */}
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
              tone={provider.estado === "activo" || provider.estado === "active" ? "success" : "warning"}
            >
              {provider.estado === "activo" || provider.estado === "active"
                ? "Participacion activa"
                : "En configuracion"}
            </DashboardStatePill>
            <DashboardStatePill
              tone={summary.effective_permissions.visible_in_marketplace ? "info" : "muted"}
            >
              {summary.effective_permissions.visible_in_marketplace
                ? "Visible en marketplace"
                : "No visible"}
            </DashboardStatePill>
            {pendingCount > 0 ? (
              <DashboardStatePill tone="warning">
                {pendingCount} validaciones pendientes
              </DashboardStatePill>
            ) : null}
          </>
        }
        actions={
          <>
            <Button
              asChild
              variant="outline"
              className="h-[38px] rounded-[10px] border-white/15 bg-white/10 px-[15px] font-[Montserrat] text-[13px] font-semibold text-white hover:bg-white/20"
            >
              <a href="/proveedores-v2/cotizaciones">
                <RefreshCcw className="mr-1.5 h-[15px] w-[15px]" />
                Actualizar
              </a>
            </Button>
            <Button
              asChild
              className="h-[38px] rounded-[10px] bg-gradient-to-r from-primary to-cyan-500 px-[17px] font-[Montserrat] text-[13px] font-bold text-white shadow-[0_4px_20px_hsl(220_70%_45%/0.35)] hover:from-primary/90 hover:to-cyan-500/90"
            >
              <a href="/proveedores-v2/cotizaciones">
                Ver cotizaciones
                <ArrowRight className="ml-1.5 h-[15px] w-[15px]" />
              </a>
            </Button>
          </>
        }
      />

      {/* --- Metric grid (4 cols) --- */}
      <section className="grid grid-cols-4 gap-[11px]">
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
          trend={{
            direction: revenueTrendDirection,
            text: `vs ${formatMoney(m.revenue_prev_month ?? 0)} anterior`,
          }}
          sparkline={m.sparkline_revenue_7d || [0, 0, 0, 0, 0, 0, 0]}
        />
        <DashboardMetricCard
          title="Score de confianza"
          value={`${summary.profile_score}`}
          valueSuffix="/100"
          support="Nivel de completitud operacional"
          icon={<Shield className="h-5 w-5" />}
          trend={
            scoreDeltaText
              ? {
                  direction: (m.score_delta_30d ?? 0) >= 0 ? "up" : "down",
                  text: scoreDeltaText,
                }
              : { direction: "flat", text: "Sin historico aun" }
          }
        />
      </section>

      {/* --- Row 2: Cotizaciones abiertas (1.4fr) + Estado del perfil (1fr) --- */}
      <section className="grid grid-cols-[1.4fr_1fr] gap-[14px]">
        <DashboardPanel
          eyebrow="Accion requerida"
          icon={<ClipboardList className="h-[17px] w-[17px]" />}
          title="Cotizaciones abiertas"
          description="Ordenadas por cierre de ventana."
          headerAction={
            <Button
              asChild
              variant="outline"
              className="h-[34px] rounded-[10px] border-[var(--c3d-card-border)] bg-[var(--c3d-card-bg-alt)] px-3 font-[Montserrat] text-[12px] font-semibold text-[var(--c3d-text-muted)] hover:bg-white/10"
            >
              <a href="/proveedores-v2/cotizaciones">
                Ver todas
                <ArrowRight className="ml-1 h-[13px] w-[13px]" />
              </a>
            </Button>
          }
          contentClassName="p-0"
        >
          <QuotesTable quotes={quotes} />
        </DashboardPanel>

        <DashboardPanel
          eyebrow="Habilitaciones"
          icon={<CheckCircle2 className="h-[17px] w-[17px]" />}
          title="Estado del perfil"
          description="Que se puede hacer hoy en la plataforma."
        >
          <div className="flex flex-col gap-[7px]">
            <ReadyRow
              status={summary.readiness.quote_ready ? "ok" : "pend"}
              title="Cotizaciones"
              sub={
                summary.readiness.quote_ready
                  ? "Impresoras y stock activos."
                  : "Faltan requisitos."
              }
              pillLabel={summary.readiness.quote_ready ? "Operativa" : "Pendiente"}
              pillTone={summary.readiness.quote_ready ? "success" : "warning"}
            />
            <ReadyRow
              status={summary.readiness.visibility_ready ? "ok" : "pend"}
              title="Marketplace"
              sub={
                summary.readiness.visibility_ready
                  ? "Coordenadas validadas."
                  : "No visible aun."
              }
              pillLabel={summary.readiness.visibility_ready ? "Visible" : "Pendiente"}
              pillTone={summary.readiness.visibility_ready ? "success" : "warning"}
            />
            <ReadyRow
              status={summary.readiness.order_ready ? "ok" : "pend"}
              title="Pedidos directos"
              sub={
                summary.readiness.order_ready
                  ? "MercadoPago vinculado."
                  : "Falta vincular MercadoPago."
              }
              pillLabel={summary.readiness.order_ready ? "Activo" : "1 paso"}
              pillTone={summary.readiness.order_ready ? "success" : "warning"}
            />
            <ReadyRow
              status={hasLegalData ? "ok" : "idle"}
              title="Datos legales"
              sub={
                hasLegalData
                  ? "CUIT y razon social completos."
                  : "CUIT y razon social pendientes."
              }
              pillLabel={hasLegalData ? "Completo" : "Pendiente"}
              pillTone={hasLegalData ? "success" : "muted"}
            />
          </div>
        </DashboardPanel>
      </section>

      {/* --- Row 3: Datos comerciales (1.1fr) + Materiales activos (1fr) + CTA (1fr) --- */}
      <section className="grid grid-cols-[1.1fr_1fr_1fr] gap-[14px]">
        <DashboardPanel
          eyebrow="Perfil"
          icon={<UserCircle className="h-[17px] w-[17px]" />}
          title="Datos comerciales"
        >
          <div>
            <DataRow label="Nombre comercial" value={providerName} />
            <DataRow
              label="CUIT"
              value={
                ((provider as Record<string, unknown>).cuit as string) || "Pendiente"
              }
            />
            <DataRow
              label="Ubicacion"
              value={
                [provider.localidad, provider.provincia].filter(Boolean).join(" - ") ||
                "Pendiente"
              }
            />
            <DataRow
              label="Tiempo de entrega"
              value={
                provider.tiempo_entrega_dias != null
                  ? `${provider.tiempo_entrega_dias} dias`
                  : "Pendiente"
              }
            />
            <DataRow
              label="Trabajo minimo"
              value={
                provider.min_trabajo != null
                  ? formatMoney(provider.min_trabajo)
                  : "Pendiente"
              }
            />
          </div>
        </DashboardPanel>

        <DashboardPanel
          eyebrow="Inventario"
          icon={<Boxes className="h-[17px] w-[17px]" />}
          title="Materiales activos"
        >
          <div className="flex flex-col gap-[7px]">
            {activeMaterials.length ? (
              activeMaterials.slice(0, 4).map((mat) => {
                const mainColor = mat.colores?.find((c) => c.activo)?.color_hex ?? undefined;
                const stockKg =
                  mat.stock_qty_grams != null
                    ? (mat.stock_qty_grams / 1000).toFixed(1)
                    : "?";
                const isLow = mat.stock_status === "low" || mat.stock_status === "out";
                return (
                  <MatItem
                    key={mat.id}
                    name={mat.material_code}
                    sub={`${formatMoney(mat.precio_hora)}/hr`}
                    stockValue={stockKg}
                    stockUnit="kg stock"
                    colorHex={mainColor}
                    isLow={isLow}
                  />
                );
              })
            ) : (
              <p className="py-4 text-center font-[Montserrat] text-sm text-[var(--c3d-text-muted)]">
                Sin materiales cargados.
              </p>
            )}
          </div>
        </DashboardPanel>

        {/* CTA Panel — dark gradient matching mockup */}
        {ctaAction ? (
          <div className="relative overflow-hidden rounded-[17px] border border-white/8 bg-gradient-to-b from-[hsl(220,30%,8%)] to-[hsl(220,25%,14%)] p-5">
            {/* Glow effect */}
            <div className="pointer-events-none absolute -bottom-[60px] -right-[60px] h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle,hsl(220_70%_45%/0.5)_0%,transparent_70%)]" />
            <div className="relative">
              <div className="mb-[11px] flex h-[44px] w-[44px] items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan-500 text-white">
                {ctaAction.icon}
              </div>
              <p className="mb-1.5 font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                {ctaAction.eyebrow}
              </p>
              <h4 className="mb-[7px] font-[Montserrat] text-[17px] font-extrabold leading-[1.25] tracking-[-0.005em] text-white">
                {ctaAction.title}
              </h4>
              <p className="mb-[15px] font-[Montserrat] text-xs font-medium leading-[1.6] text-[hsl(220,15%,65%)]">
                {ctaAction.description}
              </p>
              <Button
                asChild
                className="h-[38px] rounded-[10px] bg-gradient-to-r from-primary to-cyan-500 px-[17px] font-[Montserrat] text-[13px] font-bold text-white shadow-[0_4px_20px_hsl(220_70%_45%/0.35)] hover:from-primary/90 hover:to-cyan-500/90"
              >
                <a href={ctaAction.href}>
                  {ctaAction.buttonLabel}
                  <ArrowRight className="ml-1.5 h-[15px] w-[15px]" />
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-[17px] border border-white/8 bg-gradient-to-b from-[hsl(220,30%,8%)] to-[hsl(220,25%,14%)] p-5">
            <div className="pointer-events-none absolute -bottom-[60px] -right-[60px] h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle,hsl(220_70%_45%/0.5)_0%,transparent_70%)]" />
            <div className="relative flex flex-col items-center justify-center py-6 text-center">
              <CheckCircle2 className="mb-3 h-8 w-8 text-emerald-400" />
              <h4 className="font-[Montserrat] text-[15px] font-bold text-white">
                Perfil completo
              </h4>
              <p className="mt-2 font-[Montserrat] text-xs font-medium leading-[1.6] text-[hsl(220,15%,65%)]">
                Segui atendiendo cotizaciones y pedidos.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------- Main export ---------- */

export function ProviderSummaryView() {
  const { providerId } = useProviderDashboardSession();

  const summaryQuery = useQuery({
    queryKey: ["provider-dashboard", "summary", providerId],
    queryFn: () => fetchProviderSummary(providerId!),
    enabled: providerId != null,
    staleTime: 30_000,
  });

  const quotesQuery = useQuery({
    queryKey: ["provider-dashboard", "quotes", providerId],
    queryFn: () => fetchProviderQuotes(providerId!),
    enabled: providerId != null,
    staleTime: 30_000,
  });

  const profileQuery = useQuery({
    queryKey: ["provider-dashboard", "profile", providerId],
    queryFn: () => fetchProviderProfile(providerId!),
    enabled: providerId != null,
    staleTime: 60_000,
  });

  const summary = useMemo(() => summaryQuery.data, [summaryQuery.data]);
  const quotes = useMemo(() => quotesQuery.data?.items || [], [quotesQuery.data]);
  const materials = useMemo(
    () => profileQuery.data?.materials || [],
    [profileQuery.data]
  );

  if (summaryQuery.isLoading || summaryQuery.isFetching) {
    return <DashboardLoadingState />;
  }

  if (summaryQuery.isError || !summary) {
    return (
      <DashboardErrorState
        title="Error al cargar"
        description="No pudimos cargar el resumen del proveedor."
        actionLabel="Reintentar"
        onAction={() => void summaryQuery.refetch()}
      />
    );
  }

  return (
    <SummaryContent summary={summary} quotes={quotes} materials={materials} />
  );
}
