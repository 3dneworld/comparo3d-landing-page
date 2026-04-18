import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  LoaderCircle,
  LocateFixed,
  MapPinned,
  PackageCheck,
  RefreshCcw,
  Save,
  Store,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import {
  captureProviderGeoLocation,
  fetchProviderLogistics,
  updateProviderLogistics,
  validateProviderPostalAddress,
} from "@/features/provider-dashboard/api";
import { DashboardField } from "@/features/provider-dashboard/components/DashboardField";
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
  DashboardLogisticsFormPayload,
  ProviderGeoLocationPayload,
  ProviderLogisticsResponse,
} from "@/features/provider-dashboard/types";
import { cn } from "@/lib/utils";

type LogisticsFormState = {
  retiro_taller: boolean;
  envio_local: boolean;
  correo_argentino: boolean;
  cobertura_radio_km: string;
  cobertura_zonas_text: string;
  dispatch_days: string;
  instrucciones_retiro: string;
  notas: string;
};

type SaveFeedback = {
  tone: "success" | "danger";
  title: string;
  description: string;
};

function safeString(value: unknown) {
  return value == null ? "" : String(value);
}

function formatNumberInput(value: unknown) {
  return value == null || value === "" ? "" : String(value);
}

function logisticsToFormState(payload: ProviderLogisticsResponse): LogisticsFormState {
  const logistica = payload.logistica || {};
  return {
    retiro_taller: Boolean(logistica.retiro_taller),
    envio_local: Boolean(logistica.envio_local),
    correo_argentino: Boolean(logistica.correo_argentino),
    cobertura_radio_km: formatNumberInput(logistica.cobertura_radio_km),
    cobertura_zonas_text: Array.isArray(logistica.cobertura_zonas) ? logistica.cobertura_zonas.join("\n") : "",
    dispatch_days: formatNumberInput(logistica.dispatch_days),
    instrucciones_retiro: safeString(logistica.instrucciones_retiro),
    notas: safeString(logistica.notas),
  };
}

function parseNullableNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function buildLogisticsPayload(formState: LogisticsFormState): DashboardLogisticsFormPayload {
  const cobertura_radio_km = parseNullableNumber(formState.cobertura_radio_km);
  const dispatch_days = parseNullableNumber(formState.dispatch_days);

  if (Number.isNaN(cobertura_radio_km) || Number.isNaN(dispatch_days)) {
    throw new Error("Revisa los campos numericos de logistica.");
  }

  return {
    retiro_taller: formState.retiro_taller,
    envio_local: formState.envio_local,
    correo_argentino: formState.correo_argentino,
    cobertura_radio_km,
    cobertura_zonas: formState.cobertura_zonas_text
      .split("\n")
      .map((zone) => zone.trim())
      .filter(Boolean),
    dispatch_days,
    instrucciones_retiro: formState.instrucciones_retiro,
    notas: formState.notas,
  };
}

function formatDateTime(value?: string | null) {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin registro";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function coverageModeLabel(formState: LogisticsFormState) {
  if (formState.retiro_taller && (formState.envio_local || formState.correo_argentino)) return "Cobertura mixta";
  if (formState.retiro_taller) return "Solo retiro";
  if (formState.envio_local || formState.correo_argentino) return "Solo envios";
  return "Sin cobertura operativa";
}

function humanizeReason(reason: string) {
  return reason.replaceAll("_", " ").toLowerCase();
}

function postalTone(status?: string | null) {
  if (status === "validated") return "success";
  if (status === "rejected" || status === "error") return "danger";
  return "warning";
}

function FeedbackBanner({ feedback }: { feedback: SaveFeedback }) {
  return (
    <div
      className={cn(
        "rounded-[1.15rem] border px-4 py-3",
        feedback.tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      )}
    >
      <p className="text-sm font-semibold">{feedback.title}</p>
      <p className="mt-1 text-sm leading-relaxed">{feedback.description}</p>
    </div>
  );
}

function ToggleCard({
  active,
  label,
  description,
  onChange,
}: {
  active: boolean;
  label: string;
  description: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "rounded-[1.25rem] border p-4 text-left transition-colors",
        active
          ? "border-primary/25 bg-primary/10 shadow-card"
          : "border-border/70 bg-background/70 hover:border-primary/20 hover:bg-white"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <DashboardStatePill tone={active ? "success" : "muted"}>{active ? "Activo" : "Apagado"}</DashboardStatePill>
      </div>
    </button>
  );
}

function LogisticsContent({
  data,
  formState,
  initialFormState,
  onFieldChange,
  onToggle,
  onSave,
  onCaptureGeo,
  onValidatePostal,
  isSaving,
  isCapturingGeo,
  isValidatingPostal,
  saveFeedback,
}: {
  data: ProviderLogisticsResponse;
  formState: LogisticsFormState;
  initialFormState: LogisticsFormState;
  onFieldChange: (field: keyof LogisticsFormState, value: string) => void;
  onToggle: (field: "retiro_taller" | "envio_local" | "correo_argentino") => void;
  onSave: () => void;
  onCaptureGeo: () => void;
  onValidatePostal: () => void;
  isSaving: boolean;
  isCapturingGeo: boolean;
  isValidatingPostal: boolean;
  saveFeedback: SaveFeedback | null;
}) {
  const provider = data.provider;
  const postalStatus = data.postal_validation.postal_validation_status || "pending";
  const isDirty = JSON.stringify(formState) !== JSON.stringify(initialFormState);
  const locationLabel =
    [provider.localidad, provider.provincia].filter(Boolean).join(", ") || "Ubicacion todavia incompleta";
  const normalizedAddress =
    data.postal_validation.postal_normalized_address ||
    data.postal_validation.postal_normalized_locality ||
    "Todavia sin direccion normalizada";
  const nextSteps = [
    !formState.retiro_taller && !formState.envio_local && !formState.correo_argentino
      ? "Activar al menos una modalidad de entrega o retiro."
      : null,
    (formState.envio_local || formState.correo_argentino) && postalStatus !== "validated"
      ? "Validar direccion postal para que la cobertura sea confiable."
      : null,
    (formState.envio_local || formState.correo_argentino) &&
    !formState.cobertura_radio_km.trim() &&
    !formState.cobertura_zonas_text.trim()
      ? "Definir radio o zonas de cobertura para envios."
      : null,
    !provider.geo_source ? "Capturar ubicacion real del taller para mejorar logistica y cercania." : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Vista editable"
        title="Logistica y cobertura"
        description="Migracion React de la operativa logistica del proveedor para configurar retiro, envios y criterios de cobertura sobre datos reales."
        meta={
          <>
            <DashboardStatePill tone={formState.retiro_taller || formState.envio_local || formState.correo_argentino ? "success" : "warning"}>
              {coverageModeLabel(formState)}
            </DashboardStatePill>
            <DashboardStatePill tone={postalTone(postalStatus)}>
              Postal {postalStatus}
            </DashboardStatePill>
            <DashboardStatePill tone={provider.geo_source ? "info" : "muted"}>
              {provider.geo_source || "Sin geo source"}
            </DashboardStatePill>
            {isDirty ? <DashboardStatePill tone="info">Cambios sin guardar</DashboardStatePill> : null}
          </>
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
              onClick={onCaptureGeo}
              disabled={isCapturingGeo || isSaving}
            >
              {isCapturingGeo ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
              Usar ubicacion actual
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
              onClick={onValidatePostal}
              disabled={isValidatingPostal || isSaving}
            >
              {isValidatingPostal ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Validar direccion
            </Button>
            <Button
              type="button"
              className="h-11 rounded-xl bg-gradient-primary px-5 text-primary-foreground shadow-cta hover:opacity-95"
              onClick={onSave}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar logistica
            </Button>
          </>
        }
      />

      {saveFeedback ? <FeedbackBanner feedback={saveFeedback} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          title="Modo de cobertura"
          value={coverageModeLabel(formState)}
          support={provider.coverage_mode || "Sin modo persistido"}
          icon={<Truck className="h-5 w-5" />}
        />
        <DashboardMetricCard
          title="Despacho"
          value={formState.dispatch_days.trim() ? `${formState.dispatch_days} dias` : "Pendiente"}
          support={formState.envio_local || formState.correo_argentino ? "Tiempo de salida declarado" : "Aun sin envios activos"}
          icon={<PackageCheck className="h-5 w-5" />}
        />
        <DashboardMetricCard
          title="Direccion"
          value={postalStatus}
          support={normalizedAddress}
          icon={<BadgeCheck className="h-5 w-5" />}
        />
        <DashboardMetricCard
          title="Base operativa"
          value={locationLabel}
          support={provider.geo_captured_at ? `Geo ${formatDateTime(provider.geo_captured_at)}` : "Todavia sin geocaptura"}
          icon={<Store className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <DashboardPanel title="Modalidades activas" description="Encende solo lo que realmente podes cumplir hoy.">
            <div className="grid gap-4 md:grid-cols-3">
              <ToggleCard
                active={formState.retiro_taller}
                label="Retiro en taller"
                description="Entrega presencial desde tu punto operativo."
                onChange={() => onToggle("retiro_taller")}
              />
              <ToggleCard
                active={formState.envio_local}
                label="Envio local"
                description="Cobertura cercana definida por radio o zonas."
                onChange={() => onToggle("envio_local")}
              />
              <ToggleCard
                active={formState.correo_argentino}
                label="Correo Argentino"
                description="Canal nacional para entregas fuera de tu zona corta."
                onChange={() => onToggle("correo_argentino")}
              />
            </div>
          </DashboardPanel>

          <DashboardPanel title="Cobertura y despacho" description="Defini alcance operativo, tiempos y aclaraciones para retiro.">
            <div className="grid gap-5 md:grid-cols-2">
              <DashboardField
                label="Radio de cobertura (km)"
                htmlFor="cobertura_radio_km"
                hint="Opcional. Sirve para envios locales cuando queres cubrir por distancia."
              >
                <Input
                  id="cobertura_radio_km"
                  type="number"
                  min="0"
                  step="1"
                  value={formState.cobertura_radio_km}
                  onChange={(event) => onFieldChange("cobertura_radio_km", event.target.value)}
                  className="h-11 rounded-xl border-border/80 bg-white"
                />
              </DashboardField>

              <DashboardField
                label="Dispatch days"
                htmlFor="dispatch_days"
                hint="Cuantos dias tardas en despachar una vez confirmado el pedido."
              >
                <Input
                  id="dispatch_days"
                  type="number"
                  min="0"
                  step="1"
                  value={formState.dispatch_days}
                  onChange={(event) => onFieldChange("dispatch_days", event.target.value)}
                  className="h-11 rounded-xl border-border/80 bg-white"
                />
              </DashboardField>

              <DashboardField
                label="Zonas de cobertura"
                htmlFor="cobertura_zonas_text"
                className="md:col-span-2"
                hint="Una zona por linea. Ejemplo: CABA, Zona Norte, La Plata."
              >
                <Textarea
                  id="cobertura_zonas_text"
                  value={formState.cobertura_zonas_text}
                  onChange={(event) => onFieldChange("cobertura_zonas_text", event.target.value)}
                  className="min-h-[150px] rounded-2xl border-border/80 bg-white"
                />
              </DashboardField>

              <DashboardField
                label="Instrucciones de retiro"
                htmlFor="instrucciones_retiro"
                className="md:col-span-2"
              >
                <Textarea
                  id="instrucciones_retiro"
                  value={formState.instrucciones_retiro}
                  onChange={(event) => onFieldChange("instrucciones_retiro", event.target.value)}
                  className="min-h-[120px] rounded-2xl border-border/80 bg-white"
                />
              </DashboardField>

              <DashboardField label="Notas internas" htmlFor="notas" className="md:col-span-2">
                <Textarea
                  id="notas"
                  value={formState.notas}
                  onChange={(event) => onFieldChange("notas", event.target.value)}
                  className="min-h-[120px] rounded-2xl border-border/80 bg-white"
                />
              </DashboardField>
            </div>
          </DashboardPanel>
        </div>

        <div className="space-y-6">
          <DashboardPanel title="Diagnostico operativo" description="Lectura compacta para decidir si la cobertura ya esta lista.">
            <div className="space-y-4">
              <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
                <p className="text-sm font-semibold text-foreground">Direccion y postal</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{normalizedAddress}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <DashboardStatePill tone={postalTone(postalStatus)}>{postalStatus}</DashboardStatePill>
                  {data.postal_validation.postal_normalized_cpa ? (
                    <DashboardStatePill tone="info">CPA {data.postal_validation.postal_normalized_cpa}</DashboardStatePill>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
                <p className="text-sm font-semibold text-foreground">Ubicacion actual</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{locationLabel}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <DashboardStatePill tone={provider.geo_source ? "info" : "muted"}>
                    {provider.geo_source || "Sin geo source"}
                  </DashboardStatePill>
                  <DashboardStatePill tone={data.proximity.proximity_enabled ? "success" : "warning"}>
                    {data.proximity.proximity_enabled ? "Cercania activa" : "Cercania pendiente"}
                  </DashboardStatePill>
                </div>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel
            title="Proximos pasos"
            description="Lo que hoy conviene cerrar para que la logistica quede defendible."
            headerAction={
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
              >
                <a href="/proveedores-v2/perfil" rel="noreferrer">
                  Ir a Perfil
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
            }
          >
            {nextSteps.length ? (
              <div className="space-y-3">
                {nextSteps.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.15rem] border border-border/70 bg-background/70 px-4 py-3 text-sm leading-relaxed text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.15rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                La cobertura ya se ve coherente. El siguiente paso natural queda listo para Produccion.
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel title="Bloqueos visibles" description="Tomados del backend para no perder prioridad mientras editas.">
            {data.readiness.blocking_reasons.length ? (
              <div className="space-y-3">
                {data.readiness.blocking_reasons.slice(0, 5).map((reason, index) => (
                  <div
                    key={reason}
                    className="flex items-start gap-3 rounded-[1.15rem] border border-border/70 bg-background/70 px-4 py-3"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{humanizeReason(reason)}</p>
                      <p className="text-xs text-muted-foreground">{reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.15rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                No vemos bloqueos criticos en este snapshot logistico.
              </div>
            )}
          </DashboardPanel>
        </div>
      </section>
    </div>
  );
}

export function ProviderLogisticsView() {
  const queryClient = useQueryClient();
  const { providerId } = useProviderDashboardSession();
  const [formState, setFormState] = useState<LogisticsFormState | null>(null);
  const [initialFormState, setInitialFormState] = useState<LogisticsFormState | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback | null>(null);

  const logisticsQuery = useQuery({
    queryKey: ["provider-dashboard", "logistics", providerId],
    queryFn: () => fetchProviderLogistics(providerId!),
    enabled: providerId != null,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!logisticsQuery.data) return;
    const currentState = formState ? JSON.stringify(formState) : "";
    const initialState = initialFormState ? JSON.stringify(initialFormState) : "";
    if (formState && initialFormState && currentState !== initialState) return;
    const nextState = logisticsToFormState(logisticsQuery.data);
    const nextStateSnapshot = JSON.stringify(nextState);
    if (currentState === nextStateSnapshot && initialState === nextStateSnapshot) return;
    setFormState(nextState);
    setInitialFormState(nextState);
  }, [formState, initialFormState, logisticsQuery.data]);

  const applySnapshot = (payload: ProviderLogisticsResponse) => {
    queryClient.setQueryData(["provider-dashboard", "logistics", providerId], payload);
    queryClient.setQueryData(["provider-dashboard", "profile", providerId], payload);
    void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "summary", providerId] });
    const nextState = logisticsToFormState(payload);
    setFormState(nextState);
    setInitialFormState(nextState);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!providerId || !formState) throw new Error("No encontramos un proveedor valido para guardar.");
      return updateProviderLogistics(providerId, buildLogisticsPayload(formState));
    },
    onSuccess: (payload) => {
      applySnapshot(payload);
      setSaveFeedback({
        tone: "success",
        title: "Logistica guardada",
        description: "Los cambios ya quedaron persistidos en el backend real del dashboard.",
      });
      toast.success("Logistica guardada");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "No pudimos guardar la logistica.";
      setSaveFeedback({
        tone: "danger",
        title: "No pudimos guardar",
        description: message,
      });
      toast.error(message);
    },
  });

  const geoMutation = useMutation({
    mutationFn: async () => {
      if (!providerId) throw new Error("No encontramos un proveedor valido para capturar coordenadas.");
      if (!navigator.geolocation) throw new Error("Este navegador no soporta geolocalizacion.");
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10_000,
          maximumAge: 60_000,
        });
      });
      const payload: ProviderGeoLocationPayload = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        geo_accuracy_m: position.coords.accuracy,
        geo_source: "browser_geolocation",
        geo_captured_at: new Date(position.timestamp).toISOString(),
      };
      return captureProviderGeoLocation(providerId, payload);
    },
    onSuccess: (payload) => {
      applySnapshot(payload);
      setSaveFeedback({
        tone: "success",
        title: "Ubicacion actualizada",
        description: "La base geografica de la logistica ya quedo sincronizada con el dashboard.",
      });
      toast.success("Ubicacion capturada");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "No pudimos capturar la ubicacion actual.";
      setSaveFeedback({
        tone: "danger",
        title: "No pudimos capturar coordenadas",
        description: message,
      });
      toast.error(message);
    },
  });

  const postalMutation = useMutation({
    mutationFn: async () => {
      if (!providerId) throw new Error("No encontramos un proveedor valido para validar la direccion.");
      return validateProviderPostalAddress(providerId);
    },
    onSuccess: (payload) => {
      applySnapshot(payload);
      setSaveFeedback({
        tone: "success",
        title: "Direccion validada",
        description: "La validacion postal ya corrio y el estado logistico quedo actualizado.",
      });
      toast.success("Direccion validada");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "No pudimos validar la direccion.";
      setSaveFeedback({
        tone: "danger",
        title: "No pudimos validar la direccion",
        description: message,
      });
      toast.error(message);
    },
  });

  const data = useMemo(() => logisticsQuery.data, [logisticsQuery.data]);

  if (logisticsQuery.isLoading || (logisticsQuery.isFetching && !data) || !formState || !initialFormState) {
    return (
      <DashboardLoadingState
        title="Armando la logistica del proveedor"
        description="Estamos conectando la vista de cobertura con los datos reales del dashboard."
      />
    );
  }

  if (logisticsQuery.error) {
    return (
      <DashboardErrorState
        title="No pudimos cargar la logistica"
        description="La base del dashboard esta lista, pero la lectura real de logistica no se pudo recuperar."
      />
    );
  }

  if (!data?.provider) {
    return (
      <DashboardEmptyState
        title="No encontramos datos logisticos"
        description="La sesion esta activa, pero no recibimos un snapshot valido para esta vista."
        icon={<AlertTriangle className="h-6 w-6" />}
      />
    );
  }

  return (
    <LogisticsContent
      data={data}
      formState={formState}
      initialFormState={initialFormState}
      onFieldChange={(field, value) => {
        setSaveFeedback(null);
        setFormState((current) => (current ? { ...current, [field]: value } : current));
      }}
      onToggle={(field) => {
        setSaveFeedback(null);
        setFormState((current) => (current ? { ...current, [field]: !current[field] } : current));
      }}
      onSave={() => {
        setSaveFeedback(null);
        void saveMutation.mutateAsync();
      }}
      onCaptureGeo={() => {
        setSaveFeedback(null);
        void geoMutation.mutateAsync();
      }}
      onValidatePostal={() => {
        setSaveFeedback(null);
        void postalMutation.mutateAsync();
      }}
      isSaving={saveMutation.isPending}
      isCapturingGeo={geoMutation.isPending}
      isValidatingPostal={postalMutation.isPending}
      saveFeedback={saveFeedback}
    />
  );
}
