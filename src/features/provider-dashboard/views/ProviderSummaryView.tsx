import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BadgeCheck,
  CircleAlert,
  CircleDashed,
  ClipboardList,
  Eye,
  MapPinned,
  PackageOpen,
  Sparkles,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchProviderSummary } from "@/features/provider-dashboard/api";
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

const readinessCopy = {
  quote_ready: {
    label: "Participacion en cotizaciones",
    success: "Operativa",
    pending: "Faltan requisitos",
  },
  visibility_ready: {
    label: "Visibilidad en marketplace",
    success: "Visible",
    pending: "Todavia no visible",
  },
  order_ready: {
    label: "Recepcion de pedidos",
    success: "Lista para aceptar pedidos",
    pending: "Aun no habilitada",
  },
} as const;

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
  PROXIMITY_PROVIDER_NOT_ACTIVE: "El proveedor no esta activo",
  PROXIMITY_MARKETPLACE_HIDDEN: "La visibilidad esta desactivada",
  PROXIMITY_VISIBILITY_NOT_READY: "Falta readiness de visibilidad",
  PROXIMITY_COORDS_MISSING: "Faltan coordenadas",
  PROXIMITY_GEO_SOURCE_MISSING: "Falta fuente geo",
  PROXIMITY_POSTAL_NOT_VALIDATED: "Falta validacion postal",
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

function formatBooleanLabel(value: boolean, positive: string, negative: string) {
  return value ? positive : negative;
}

function humanizeReason(reason: string) {
  return onboardingCopy[reason] ?? reason.replaceAll("_", " ").toLowerCase();
}

function getStageTone(stage?: DashboardOnboardingStage) {
  if (!stage) return "muted";
  return stage.complete ? "success" : "warning";
}

function PermissionRow({
  label,
  enabled,
}: {
  label: string;
  enabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
      <span className="text-sm text-foreground">{label}</span>
      <DashboardStatePill tone={enabled ? "success" : "muted"}>
        {enabled ? "Activo" : "Pendiente"}
      </DashboardStatePill>
    </div>
  );
}

function SummaryMetricCard({
  label,
  value,
  support,
  icon,
}: {
  label: string;
  value: string;
  support: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-white/95 p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
          <p className="font-[Montserrat] text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          <p className="text-sm text-muted-foreground">{support}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}

function SummaryContent({ summary }: { summary: ProviderSummaryResponse }) {
  const readinessItems = [
    {
      key: "quote_ready",
      enabled: summary.readiness.quote_ready,
      ...readinessCopy.quote_ready,
    },
    {
      key: "visibility_ready",
      enabled: summary.readiness.visibility_ready,
      ...readinessCopy.visibility_ready,
    },
    {
      key: "order_ready",
      enabled: summary.readiness.order_ready,
      ...readinessCopy.order_ready,
    },
  ] as const;

  const onboardingStages = [
    {
      label: "Cotizaciones",
      stage: summary.onboarding.quote_stage,
    },
    {
      label: "Marketplace",
      stage: summary.onboarding.visibility_stage,
    },
    {
      label: "Pedidos",
      stage: summary.onboarding.order_stage,
    },
    {
      label: "Plus de perfil",
      stage: summary.onboarding.optional_stage,
    },
  ];

  const locationLabel =
    [summary.provider.localidad, summary.provider.provincia].filter(Boolean).join(", ") ||
    summary.provider.ubicacion ||
    "Ubicacion pendiente";

  const postalStatus = summary.postal_validation.postal_validation_status || "pending";
  const normalizedAddress =
    summary.postal_validation.postal_normalized_address ||
    summary.postal_validation.postal_normalized_locality ||
    "Sin normalizacion disponible";

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Vista piloto"
        title="Resumen operativo"
        description="Esta primera migracion valida shell, continuidad visual y lectura ejecutiva del estado del proveedor sin tocar todavia el dashboard legacy productivo."
        meta={
          <>
            <DashboardStatePill tone={summary.readiness.order_ready ? "success" : "warning"}>
              {summary.readiness.order_ready ? "Proveedor operativo" : "Proveedor en configuracion"}
            </DashboardStatePill>
            <DashboardStatePill tone={summary.effective_permissions.visible_in_marketplace ? "success" : "muted"}>
              {summary.effective_permissions.visible_in_marketplace
                ? "Visible en marketplace"
                : "No visible en marketplace"}
            </DashboardStatePill>
            <DashboardStatePill tone={summary.proximity.proximity_enabled ? "info" : "muted"}>
              {summary.proximity.proximity_enabled ? "Ranking por cercania activo" : "Cercania pendiente"}
            </DashboardStatePill>
          </>
        }
        actions={
          <Button
            asChild
            className="h-11 rounded-xl bg-gradient-primary px-5 text-primary-foreground shadow-cta hover:opacity-95"
          >
            <a href="/proveedores" target="_blank" rel="noreferrer">
              Ver dashboard legacy
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryMetricCard
          label="Score de perfil"
          value={`${summary.profile_score}%`}
          support="Nivel de completitud operacional"
          icon={<Sparkles className="h-5 w-5" />}
        />
        <SummaryMetricCard
          label="Cotizaciones"
          value={formatCount(summary.metrics.cotizaciones_participadas)}
          support={`${formatCount(summary.metrics.cotizaciones_mostradas)} oportunidades mostradas`}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <SummaryMetricCard
          label="Pedidos abiertos"
          value={formatCount(summary.metrics.pedidos_abiertos)}
          support={`${formatCount(summary.metrics.pedidos_historicos)} pedidos historicos`}
          icon={<PackageOpen className="h-5 w-5" />}
        />
        <SummaryMetricCard
          label="Ventas"
          value={formatMoney(summary.metrics.ventas)}
          support="Total acumulado reportado"
          icon={<Wallet className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardPanel
          title="Estado comercial y operativo"
          description="Las tres capas criticas para que el proveedor participe, sea visible y pueda aceptar pedidos."
        >
          <div className="space-y-4">
            {readinessItems.map((item) => (
              <div
                key={item.key}
                className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.enabled ? item.success : item.pending}
                    </p>
                  </div>
                  <DashboardStatePill tone={item.enabled ? "success" : "warning"}>
                    {formatBooleanLabel(item.enabled, "OK", "Revisar")}
                  </DashboardStatePill>
                </div>
              </div>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Permisos efectivos"
          description="Lo que hoy ya puede hacer el proveedor segun su estado y readiness real."
        >
          <div className="space-y-3">
            <PermissionRow
              label="Participar en nuevas cotizaciones"
              enabled={summary.effective_permissions.included_in_new_quotes}
            />
            <PermissionRow
              label="Ser visible en marketplace"
              enabled={summary.effective_permissions.visible_in_marketplace}
            />
            <PermissionRow
              label="Gestionar pedidos existentes"
              enabled={summary.effective_permissions.can_manage_existing_orders}
            />
            <PermissionRow
              label="Aceptar pedidos confirmados"
              enabled={summary.effective_permissions.can_accept_confirmed_orders}
            />
          </div>
        </DashboardPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardPanel
          title="Cobertura y validacion"
          description="Estado de ubicacion, postal y proximidad para experiencia de matching."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MapPinned className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Ubicacion operativa</p>
                  <p className="text-sm text-muted-foreground">{locationLabel}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <DashboardStatePill tone={summary.proximity.proximity_enabled ? "success" : "muted"}>
                  {summary.proximity.proximity_enabled ? "Cercania habilitada" : "Cercania pendiente"}
                </DashboardStatePill>
                <DashboardStatePill tone={summary.proximity.geo_source ? "info" : "muted"}>
                  {summary.proximity.geo_source || "Sin geo source"}
                </DashboardStatePill>
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-foreground">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Direccion postal</p>
                  <p className="text-sm text-muted-foreground">{normalizedAddress}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <DashboardStatePill
                  tone={postalStatus === "validated" ? "success" : postalStatus === "rejected" ? "danger" : "warning"}
                >
                  {postalStatus.replaceAll("_", " ")}
                </DashboardStatePill>
                {summary.postal_validation.postal_normalized_cpa ? (
                  <DashboardStatePill tone="info">
                    CPA {summary.postal_validation.postal_normalized_cpa}
                  </DashboardStatePill>
                ) : null}
              </div>
            </div>
          </div>

          {summary.proximity.proximity_block_reasons?.length ? (
            <div className="mt-4 rounded-[1.25rem] border border-border/70 bg-white p-4">
              <p className="text-sm font-medium text-foreground">Bloqueos de cercania</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {summary.proximity.proximity_block_reasons.map((reason) => (
                  <DashboardStatePill key={reason} tone="muted">
                    {humanizeReason(reason)}
                  </DashboardStatePill>
                ))}
              </div>
            </div>
          ) : null}
        </DashboardPanel>

        <DashboardPanel
          title="Checklist de onboarding"
          description="Resumen claro de lo que ya esta resuelto y de lo que todavia bloquea operacion o visibilidad."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {onboardingStages.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <DashboardStatePill tone={getStageTone(item.stage)}>
                    {item.stage?.complete ? "Completa" : "Pendiente"}
                  </DashboardStatePill>
                </div>
                <div className="mt-3 space-y-2">
                  {item.stage?.complete ? (
                    <p className="text-sm text-muted-foreground">
                      Esta etapa ya no bloquea la evolucion del proveedor.
                    </p>
                  ) : item.stage?.missing?.length ? (
                    item.stage.missing.slice(0, 3).map((reason) => (
                      <div key={reason} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{humanizeReason(reason)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Todavia faltan definiciones para cerrar esta etapa.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DashboardPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardPanel
          title="Bloqueos prioritarios"
          description="Lo que mas conviene resolver despues de esta etapa piloto para mejorar readiness real."
        >
          {summary.readiness.blocking_reasons.length ? (
            <div className="space-y-3">
              {summary.readiness.blocking_reasons.slice(0, 8).map((reason, index) => (
                <div
                  key={reason}
                  className="flex items-start gap-4 rounded-[1.25rem] border border-border/70 bg-background/70 px-4 py-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{humanizeReason(reason)}</p>
                    <p className="text-sm text-muted-foreground">{reason}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700">
              No detectamos bloqueos criticos en este snapshot. La base operativa esta sana para seguir migrando.
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Snapshot del proveedor"
          description="Lectura compacta para validar continuidad visual y contexto operativo sin entrar todavia en edicion."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                label: "Estado actual",
                value: summary.provider.estado || "Sin estado",
              },
              {
                label: "Tier",
                value: summary.provider.tier || "No definido",
              },
              {
                label: "Trabajo minimo",
                value:
                  summary.provider.min_trabajo != null
                    ? formatMoney(summary.provider.min_trabajo)
                    : "Pendiente",
              },
              {
                label: "Tiempo de entrega",
                value:
                  summary.provider.tiempo_entrega_dias != null
                    ? `${summary.provider.tiempo_entrega_dias} dias`
                    : "Pendiente",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4"
              >
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {item.label}
                </p>
                <p className={cn("mt-2 font-[Montserrat] text-lg font-bold tracking-tight text-foreground")}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Lectura de visibilidad</p>
                <p className="text-sm text-muted-foreground">
                  {summary.effective_permissions.visible_in_marketplace
                    ? "La ficha del proveedor ya puede aparecer en marketplace."
                    : "Aun falta readiness o activacion comercial para aparecer en marketplace."}
                </p>
              </div>
            </div>
          </div>
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
    return (
      <DashboardLoadingState
        title="Armando el resumen del proveedor"
        description="Estamos conectando la primera vista React con los datos reales del dashboard."
      />
    );
  }

  if (summaryQuery.error) {
    return (
      <DashboardErrorState
        title="No pudimos cargar el resumen"
        description="La base del dashboard ya esta montada, pero este snapshot no se pudo recuperar. Conviene revisar sesion, permisos o disponibilidad del endpoint."
      />
    );
  }

  if (!summary) {
    return (
      <DashboardErrorState
        title="No encontramos datos para este proveedor"
        description="La vista React esta lista, pero no recibimos un resumen valido para renderizar."
        icon={<CircleAlert className="h-6 w-6" />}
      />
    );
  }

  return <SummaryContent summary={summary} />;
}
