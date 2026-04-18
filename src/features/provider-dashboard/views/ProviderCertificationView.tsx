import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Award,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MessageSquareText,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Star,
  Trophy,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  fetchProviderBadges,
  fetchProviderCertificationProgress,
  fetchProviderMetrics,
  fetchProviderReviews,
  fetchProviderScoreBreakdown,
} from "@/features/provider-dashboard/api";
import { DashboardMetricCard } from "@/features/provider-dashboard/components/DashboardMetricCard";
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
  DashboardCertificationRequirement,
  DashboardProviderBadge,
  DashboardProviderReview,
  DashboardScoreBreakdown,
  ProviderCertificationProgressResponse,
  ProviderMetricsResponse,
} from "@/features/provider-dashboard/types";
import { cn } from "@/lib/utils";

type RequirementView = {
  key: keyof ProviderCertificationProgressResponse;
  label: string;
  support: string;
  inverse?: boolean;
  rate?: boolean;
  icon: ReactNode;
};

const requirements: RequirementView[] = [
  {
    key: "total_orders_completed",
    label: "Pedidos completados",
    support: "Volumen minimo para certificacion organica.",
    icon: <Trophy className="h-4 w-4" />,
  },
  {
    key: "total_reviews",
    label: "Reviews recibidas",
    support: "Prueba social suficiente para confiar en el promedio.",
    icon: <MessageSquareText className="h-4 w-4" />,
  },
  {
    key: "avg_rating",
    label: "Rating promedio",
    support: "Promedio requerido con reviews suficientes.",
    icon: <Star className="h-4 w-4" />,
  },
  {
    key: "active_months",
    label: "Meses activo",
    support: "Continuidad operativa en pedidos completados.",
    icon: <CalendarCheck className="h-4 w-4" />,
  },
  {
    key: "on_time_delivery_rate",
    label: "Entregas a tiempo",
    support: "Cumplimiento de plazos en ordenes completadas.",
    rate: true,
    icon: <Clock3 className="h-4 w-4" />,
  },
  {
    key: "cancellation_rate_90d",
    label: "Cancelacion 90 dias",
    support: "Debe mantenerse bajo el umbral de riesgo.",
    inverse: true,
    rate: true,
    icon: <XCircle className="h-4 w-4" />,
  },
  {
    key: "open_disputes",
    label: "Disputas abiertas",
    support: "La certificacion exige no tener reclamos abiertos.",
    inverse: true,
    icon: <ShieldAlert className="h-4 w-4" />,
  },
];

const modeLabels: Record<string, string> = {
  bootstrap: "Bootstrap",
  organic: "Organico",
  production: "Produccion",
  boosted: "Boosted",
  demoted: "Demoted",
};

const trustLevelLabels: Record<string, string> = {
  base: "Base",
  validated: "Validado",
  certified: "Certificado",
};

const badgeLabels: Record<string, string> = {
  seleccion_fundador: "Seleccion fundador",
  certificado_organico: "Certificado organico",
  certified: "Certificado",
  premium_tech: "Tecnologia premium",
  fast_turnaround: "Respuesta rapida",
  custom_colors: "Colores custom",
  eco_friendly: "Eco friendly",
  b2b_expert: "Experto B2B",
};

function safeText(value?: string | number | null, fallback = "Sin dato") {
  if (value == null || value === "") return fallback;
  return String(value);
}

function formatDateTime(value?: string | null) {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin registro";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatNumber(value?: number | null, digits = 0) {
  if (value == null || Number.isNaN(Number(value))) return "Sin dato";
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number(value));
}

function formatPercent(value?: number | null, digits = 0) {
  if (value == null || Number.isNaN(Number(value))) return "Sin dato";
  return `${formatNumber(Number(value) * 100, digits)}%`;
}

function formatRequirementValue(data?: DashboardCertificationRequirement, rate = false) {
  const value = data?.value;
  if (value == null) return "Sin dato";
  return rate ? formatPercent(Number(value)) : formatNumber(Number(value), Number(value) % 1 ? 1 : 0);
}

function formatRequirementTarget(data?: DashboardCertificationRequirement, rate = false, inverse = false) {
  const target = data?.target ?? data?.target_lt;
  if (target == null) return "Sin meta";
  const prefix = inverse && data?.target_lt != null ? "< " : "";
  const formatted = rate ? formatPercent(Number(target)) : formatNumber(Number(target), Number(target) % 1 ? 1 : 0);
  return `${prefix}${formatted}`;
}

function requirementProgress(data?: DashboardCertificationRequirement, inverse = false) {
  if (!data) return 0;
  if (data.ok) return 100;
  const value = Math.max(0, Number(data.value) || 0);
  const target = Number(data.target ?? data.target_lt) || 0;
  if (target <= 0) return data.ok ? 100 : 0;
  if (inverse) {
    if (value <= 0) return 100;
    return Math.max(0, Math.min(100, Math.round((1 - value / target) * 100)));
  }
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
}

function badgeLabel(value?: string | null) {
  if (!value) return "Badge";
  return badgeLabels[value] ?? value.replaceAll("_", " ");
}

function modeLabel(value?: string | null) {
  if (!value) return "Sin modo";
  return modeLabels[value] ?? value.replaceAll("_", " ");
}

function trustLevelLabel(value?: string | null) {
  if (!value) return "Sin nivel";
  return trustLevelLabels[value] ?? value.replaceAll("_", " ");
}

function scoreComponentEntries(score?: DashboardScoreBreakdown | null) {
  const raw = score?.score_breakdown;
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw)
    .filter(([, value]) => typeof value === "number" || typeof value === "string")
    .slice(0, 8);
}

function ProgressRing({ progress, mode }: { progress: number; mode?: string | null }) {
  const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeProgress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-40 w-40">
        <svg className="h-40 w-40 -rotate-90" viewBox="0 0 140 140" aria-hidden="true">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(safeProgress >= 100 ? "text-emerald-500" : safeProgress >= 50 ? "text-primary" : "text-amber-500")}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-[Montserrat] text-4xl font-bold tracking-tight text-foreground">{safeProgress}%</p>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">certificacion</p>
        </div>
      </div>
      <DashboardStatePill tone={safeProgress >= 100 ? "success" : safeProgress >= 50 ? "info" : "warning"}>
        {modeLabel(mode)}
      </DashboardStatePill>
    </div>
  );
}

function RequirementCard({
  requirement,
  data,
}: {
  requirement: RequirementView;
  data?: DashboardCertificationRequirement;
}) {
  const ok = Boolean(data?.ok);
  const progress = requirementProgress(data, requirement.inverse);

  return (
    <div className="rounded-[1.15rem] border border-border/70 bg-white p-4 shadow-card">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          )}
        >
          {ok ? <CheckCircle2 className="h-4 w-4" /> : requirement.icon}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{requirement.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{requirement.support}</p>
            </div>
            <DashboardStatePill tone={ok ? "success" : "warning"}>{ok ? "OK" : "Pendiente"}</DashboardStatePill>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{formatRequirementValue(data, requirement.rate)}</span>
            <span>Meta {formatRequirementTarget(data, requirement.rate, requirement.inverse)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", ok ? "bg-emerald-500" : "bg-primary")}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricItem({ label, value, support }: { label: string; value: string; support: string }) {
  return (
    <div className="rounded-[1rem] border border-border/70 bg-white px-4 py-3 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-[Montserrat] text-lg font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{support}</p>
    </div>
  );
}

function BadgeCard({ badge }: { badge: DashboardProviderBadge }) {
  const tier = badge.badge_tier || "basic";

  return (
    <div className="rounded-[1.15rem] border border-border/70 bg-white p-4 shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Award className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold capitalize text-foreground">{badgeLabel(badge.badge_type)}</p>
            <DashboardStatePill tone="info">{tier}</DashboardStatePill>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{safeText(badge.notes, "Sin notas")}</p>
          <p className="mt-2 text-xs text-muted-foreground">Otorgado {formatDateTime(badge.granted_at)}</p>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: DashboardProviderReview }) {
  const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));

  return (
    <div className="rounded-[1.15rem] border border-border/70 bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <DashboardStatePill tone="warning">{rating}/5</DashboardStatePill>
            {review.is_b2b_order ? <DashboardStatePill tone="info">B2B</DashboardStatePill> : null}
            {review.reported ? <DashboardStatePill tone="danger">Reportada</DashboardStatePill> : null}
          </div>
          <p className="text-sm leading-relaxed text-foreground">{safeText(review.comment, "Sin comentario")}</p>
        </div>
        <p className="text-xs text-muted-foreground">{formatDateTime(review.created_at)}</p>
      </div>
    </div>
  );
}

function CertificationContent({
  cert,
  metrics,
  badges,
  reviews,
  score,
  isFetching,
  onRefresh,
}: {
  cert: ProviderCertificationProgressResponse;
  metrics: ProviderMetricsResponse;
  badges: DashboardProviderBadge[];
  reviews: DashboardProviderReview[];
  score?: DashboardScoreBreakdown | null;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  const progress = Number(cert.certification_progress_pct ?? metrics.certification_progress_pct) || 0;
  const completedRequirements = requirements.filter((requirement) => {
    const data = cert[requirement.key] as DashboardCertificationRequirement | undefined;
    return Boolean(data?.ok);
  }).length;
  const raw = metrics.raw_metrics;
  const scoreEntries = scoreComponentEntries(score);
  const visibleReviews = reviews.filter((review) => review.visible !== false && review.visible !== 0);
  const averageRating =
    metrics.rating != null ? formatNumber(metrics.rating, 2) : raw?.avg_rating != null ? formatNumber(raw.avg_rating, 2) : "Sin rating";
  const trustLevel = trustLevelLabel(metrics.trust_level);
  const nextSteps = requirements
    .filter((requirement) => {
      const data = cert[requirement.key] as DashboardCertificationRequirement | undefined;
      return !data?.ok;
    })
    .slice(0, 4)
    .map((requirement) => requirement.label);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Vista de confianza"
        title="Certificacion, metricas y reviews"
        description="Lectura real del modulo de trust/ranking: progreso organico, requisitos, badges activos y reputacion visible."
        meta={
          <>
            <DashboardStatePill tone={progress >= 100 ? "success" : progress >= 50 ? "info" : "warning"}>
              {progress}% certificado
            </DashboardStatePill>
            <DashboardStatePill tone={metrics.trust_level === "certified" ? "success" : "info"}>
              {trustLevel}
            </DashboardStatePill>
            <DashboardStatePill tone={badges.length ? "success" : "muted"}>{badges.length} badges</DashboardStatePill>
            {isFetching ? <DashboardStatePill tone="warning">Actualizando</DashboardStatePill> : null}
          </>
        }
        actions={
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
            onClick={onRefresh}
            disabled={isFetching}
          >
            {isFetching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Recalcular
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard title="Progreso organico" value={`${progress}%`} support={`${completedRequirements}/${requirements.length} requisitos cumplidos`} icon={<ShieldCheck className="h-5 w-5" />} />
        <DashboardMetricCard title="Rating publico" value={averageRating} support={`${metrics.reviews_count || raw?.total_reviews || 0} reviews visibles`} icon={<Star className="h-5 w-5" />} />
        <DashboardMetricCard title="Portfolio" value={String(metrics.portfolio_count || 0)} support="Trabajos publicados que suman confianza visual." icon={<BriefcaseBusiness className="h-5 w-5" />} />
        <DashboardMetricCard title="SR score" value={formatNumber(metrics.current_sr_score ?? score?.sr_score ?? 0, 2)} support={`Modo ${modeLabel(metrics.ranking_mode || score?.ranking_mode)}`} icon={<BarChart3 className="h-5 w-5" />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-6">
          <DashboardPanel title="Progreso de certificacion" description="Recalculado por backend al leer el endpoint.">
            <ProgressRing progress={progress} mode={cert.ranking_mode || metrics.ranking_mode} />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <MetricItem label="Trust level" value={trustLevel} support="Nivel publico derivado de progreso, badges y reviews." />
              <MetricItem label="Ultimo calculo" value={formatDateTime(raw?.last_calculated_at)} support="Marca raw del modulo provider_metrics." />
            </div>
          </DashboardPanel>

          <DashboardPanel title="Proximos desbloqueos" description="Los faltantes mas utiles para llegar a 100%.">
            {nextSteps.length ? (
              <div className="space-y-3">
                {nextSteps.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-[1.15rem] border border-border/70 bg-white px-4 py-3 shadow-card"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.15rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Todos los requisitos de certificacion aparecen cumplidos en este snapshot.
              </div>
            )}
          </DashboardPanel>
        </div>

        <DashboardPanel title="Requisitos organicos" description="Metas usadas por backend para otorgar certificado organico.">
          <div className="grid gap-3">
            {requirements.map((requirement) => (
              <RequirementCard
                key={String(requirement.key)}
                requirement={requirement}
                data={cert[requirement.key] as DashboardCertificationRequirement | undefined}
              />
            ))}
          </div>
        </DashboardPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <DashboardPanel title="Metricas de reputacion" description="Snapshot publico mas raw metrics cuando el endpoint lo devuelve.">
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricItem label="Pedidos completados" value={formatNumber(raw?.total_orders_completed ?? 0)} support="Base de experiencia operativa." />
            <MetricItem label="Cancelados" value={formatNumber(raw?.total_orders_cancelled ?? 0)} support={`90d ${formatPercent(raw?.cancellation_rate_90d ?? 0)}`} />
            <MetricItem label="Entregas a tiempo" value={formatPercent(raw?.on_time_delivery_rate ?? 0)} support="Calculado contra fecha esperada." />
            <MetricItem label="Proyectos B2B" value={formatNumber(metrics.b2b_projects_completed ?? raw?.b2b_projects_completed ?? 0)} support="Ordenes B2B completadas." />
            <MetricItem label="Meses activos" value={formatNumber(raw?.active_months ?? 0)} support="Meses con pedidos completados." />
            <MetricItem label="Disputas abiertas" value={formatNumber(raw?.open_disputes ?? 0)} support="Claims pendientes o aprobados." />
          </div>
        </DashboardPanel>

        <DashboardPanel title="Score breakdown" description="Componentes expuestos por el motor de ranking para este proveedor.">
          {scoreEntries.length ? (
            <div className="space-y-3">
              {scoreEntries.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-4 rounded-[1rem] border border-border/70 bg-white px-4 py-3 shadow-card">
                  <span className="text-sm font-medium capitalize text-foreground">{key.replaceAll("_", " ")}</span>
                  <DashboardStatePill tone="info">{String(value)}</DashboardStatePill>
                </div>
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              title="Sin breakdown disponible"
              description="El endpoint respondio, pero no incluyo componentes simples para mostrar."
              icon={<BarChart3 className="h-6 w-6" />}
            />
          )}
        </DashboardPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <DashboardPanel title="Badges activos" description="Insignias activas ganadas por merito o asignadas por el equipo.">
          {badges.length ? (
            <div className="space-y-3">
              {badges.map((badge, index) => (
                <BadgeCard key={`${badge.badge_type}-${badge.id || index}`} badge={badge} />
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              title="Sin badges activos"
              description="Los badges aparecen al cumplir metricas o por asignacion administrativa."
              icon={<BadgeCheck className="h-6 w-6" />}
            />
          )}
        </DashboardPanel>

        <DashboardPanel title="Reviews visibles" description="Comentarios publicos de clientes sobre pedidos completados.">
          {visibleReviews.length ? (
            <div className="space-y-3">
              {visibleReviews.slice(0, 8).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              title="Sin reviews visibles"
              description="Las reviews aparecen despues de pedidos completados y visibles."
              icon={<MessageSquareText className="h-6 w-6" />}
            />
          )}
        </DashboardPanel>
      </section>
    </div>
  );
}

export function ProviderCertificationView() {
  const { providerId } = useProviderDashboardSession();

  const certificationQuery = useQuery({
    queryKey: ["provider-dashboard", "certification", providerId],
    queryFn: () => fetchProviderCertificationProgress(providerId!),
    enabled: providerId != null,
    staleTime: 20_000,
  });

  const metricsQuery = useQuery({
    queryKey: ["provider-dashboard", "metrics", providerId],
    queryFn: () => fetchProviderMetrics(providerId!, true),
    enabled: providerId != null,
    staleTime: 20_000,
  });

  const badgesQuery = useQuery({
    queryKey: ["provider-dashboard", "badges", providerId],
    queryFn: () => fetchProviderBadges(providerId!),
    enabled: providerId != null,
    staleTime: 20_000,
  });

  const reviewsQuery = useQuery({
    queryKey: ["provider-dashboard", "reviews", providerId],
    queryFn: () => fetchProviderReviews(providerId!),
    enabled: providerId != null,
    staleTime: 20_000,
  });

  const scoreQuery = useQuery({
    queryKey: ["provider-dashboard", "score-breakdown", providerId],
    queryFn: () => fetchProviderScoreBreakdown(providerId!),
    enabled: providerId != null,
    staleTime: 20_000,
  });

  const isLoading =
    certificationQuery.isLoading ||
    metricsQuery.isLoading ||
    badgesQuery.isLoading ||
    reviewsQuery.isLoading ||
    scoreQuery.isLoading;
  const isFetching =
    certificationQuery.isFetching ||
    metricsQuery.isFetching ||
    badgesQuery.isFetching ||
    reviewsQuery.isFetching ||
    scoreQuery.isFetching;
  const error = certificationQuery.error || metricsQuery.error || badgesQuery.error || reviewsQuery.error;
  const cert = certificationQuery.data;
  const metrics = metricsQuery.data;
  const badges = useMemo(() => badgesQuery.data?.items || [], [badgesQuery.data]);
  const reviews = useMemo(() => reviewsQuery.data?.items || [], [reviewsQuery.data]);
  const score = scoreQuery.data?.item || null;

  if (error) {
    return (
      <DashboardErrorState
        title="No pudimos cargar Certificacion"
        description="La ruta React esta lista, pero algun endpoint de confianza no respondio correctamente."
      />
    );
  }

  if (isLoading || !cert || !metrics) {
    return (
      <DashboardLoadingState
        title="Armando certificacion"
        description="Estamos recalculando progreso, metricas, badges y reviews del proveedor."
      />
    );
  }

  if (!cert.success || !metrics.success) {
    return (
      <DashboardEmptyState
        title="No encontramos certificacion"
        description="La sesion esta activa, pero no recibimos un snapshot valido para esta vista."
        icon={<AlertTriangle className="h-6 w-6" />}
      />
    );
  }

  return (
    <CertificationContent
      cert={cert}
      metrics={metrics}
      badges={badges}
      reviews={reviews}
      score={score}
      isFetching={isFetching}
      onRefresh={() => {
        void certificationQuery.refetch();
        void metricsQuery.refetch();
        void badgesQuery.refetch();
        void reviewsQuery.refetch();
        void scoreQuery.refetch();
      }}
    />
  );
}
