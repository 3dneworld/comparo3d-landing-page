import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  LoaderCircle,
  LocateFixed,
  MapPinned,
  RefreshCcw,
  Save,
  ShieldCheck,
  Store,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import {
  captureProviderGeoLocation,
  fetchProviderProfile,
  updateProviderProfile,
  validateProviderPostalAddress,
} from "@/features/provider-dashboard/api";
import { DashboardField } from "@/features/provider-dashboard/components/DashboardField";
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
  DashboardProviderProfile,
  ProviderGeoLocationPayload,
  ProviderProfileFormPayload,
  ProviderProfileResponse,
} from "@/features/provider-dashboard/types";
import { cn } from "@/lib/utils";

type ProfileFormState = {
  nombre: string;
  email_operativo: string;
  telefono_operativo: string;
  whatsapp: string;
  sitio_web: string;
  nombre_legal: string;
  cuit: string;
  direccion_linea1: string;
  direccion_linea2: string;
  localidad: string;
  provincia: string;
  codigo_postal: string;
  tiempo_entrega_dias: string;
  min_trabajo: string;
  tier: string;
  logo_url: string;
  public_description: string;
  horario_operativo_json: string;
  lat: string;
  lng: string;
  geo_source: string;
  geo_accuracy_m: string;
  geo_captured_at: string;
};

type SaveFeedback = {
  tone: "success" | "danger";
  title: string;
  description: string;
};

const reasonCopy: Record<string, string> = {
  EMAIL_OPERATIVO_FALTANTE: "Agregar email operativo",
  TELEFONO_O_WHATSAPP_FALTANTE: "Agregar telefono o WhatsApp",
  DIRECCION_OPERATIVA_FALTANTE: "Completar direccion operativa",
  COORDENADAS_FALTANTES: "Capturar coordenadas",
  VALIDACION_POSTAL_PENDIENTE: "Validar direccion postal",
  VALIDACION_POSTAL_RECHAZADA: "Corregir direccion postal rechazada",
  VALIDACION_POSTAL_ERROR: "Reintentar validacion postal",
  LOGO_URL_FALTANTE: "Agregar logo",
  DESCRIPCION_PUBLICA_FALTANTE: "Sumar descripcion publica",
  HORARIO_OPERATIVO_FALTANTE: "Definir horario operativo",
};

const addressFieldKeys: (keyof ProfileFormState)[] = [
  "direccion_linea1",
  "direccion_linea2",
  "localidad",
  "provincia",
  "codigo_postal",
];

function safeString(value: unknown) {
  return value == null ? "" : String(value);
}

function formatNumberInput(value: unknown) {
  return value == null || value === "" ? "" : String(value);
}

function parseScheduleValue(value: unknown) {
  if (!value) return {};
  if (typeof value === "object") return value;

  let current: unknown = value;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (typeof current !== "string") break;
    const trimmed = current.trim();
    if (!trimmed) return {};
    try {
      current = JSON.parse(trimmed);
    } catch {
      break;
    }
  }

  return typeof current === "object" && current !== null ? current : {};
}

function providerToFormState(provider: DashboardProviderProfile): ProfileFormState {
  return {
    nombre: safeString(provider.nombre),
    email_operativo: safeString(provider.email_operativo),
    telefono_operativo: safeString(provider.telefono_operativo),
    whatsapp: safeString(provider.whatsapp),
    sitio_web: safeString(provider.sitio_web),
    nombre_legal: safeString(provider.nombre_legal),
    cuit: safeString(provider.cuit),
    direccion_linea1: safeString(provider.direccion_linea1),
    direccion_linea2: safeString(provider.direccion_linea2),
    localidad: safeString(provider.localidad),
    provincia: safeString(provider.provincia),
    codigo_postal: safeString(provider.codigo_postal),
    tiempo_entrega_dias: formatNumberInput(provider.tiempo_entrega_dias),
    min_trabajo: formatNumberInput(provider.min_trabajo),
    tier: safeString(provider.tier),
    logo_url: safeString(provider.logo_url),
    public_description: safeString(provider.public_description),
    horario_operativo_json: JSON.stringify(parseScheduleValue(provider.horario_operativo_json), null, 2).replace(
      "{}",
      ""
    ),
    lat: formatNumberInput(provider.lat),
    lng: formatNumberInput(provider.lng),
    geo_source: safeString(provider.geo_source),
    geo_accuracy_m: formatNumberInput(provider.geo_accuracy_m),
    geo_captured_at: safeString(provider.geo_captured_at),
  };
}

function parseNullableNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function buildProfilePayload(formState: ProfileFormState): ProviderProfileFormPayload {
  let horario_operativo: Record<string, string> = {};

  if (formState.horario_operativo_json.trim()) {
    try {
      const parsed = JSON.parse(formState.horario_operativo_json);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error();
      }
      horario_operativo = parsed as Record<string, string>;
    } catch {
      throw new Error("El horario operativo no tiene JSON valido.");
    }
  }

  const tiempo_entrega_dias = parseNullableNumber(formState.tiempo_entrega_dias);
  const min_trabajo = parseNullableNumber(formState.min_trabajo);
  const lat = parseNullableNumber(formState.lat);
  const lng = parseNullableNumber(formState.lng);
  const geo_accuracy_m = parseNullableNumber(formState.geo_accuracy_m);

  if (
    Number.isNaN(tiempo_entrega_dias) ||
    Number.isNaN(min_trabajo) ||
    Number.isNaN(lat) ||
    Number.isNaN(lng) ||
    Number.isNaN(geo_accuracy_m)
  ) {
    throw new Error("Revisá los campos numericos: hay al menos un valor invalido.");
  }

  return {
    nombre: formState.nombre,
    email_operativo: formState.email_operativo,
    telefono_operativo: formState.telefono_operativo,
    whatsapp: formState.whatsapp,
    sitio_web: formState.sitio_web,
    nombre_legal: formState.nombre_legal,
    cuit: formState.cuit,
    direccion_linea1: formState.direccion_linea1,
    direccion_linea2: formState.direccion_linea2,
    localidad: formState.localidad,
    provincia: formState.provincia,
    codigo_postal: formState.codigo_postal,
    tiempo_entrega_dias,
    min_trabajo,
    tier: formState.tier,
    logo_url: formState.logo_url,
    public_description: formState.public_description,
    horario_operativo,
    lat,
    lng,
    geo_source: formState.geo_source,
    geo_accuracy_m,
    geo_captured_at: formState.geo_captured_at || null,
  };
}

function formatDateTime(value?: string | null) {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin registro";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatMoney(value?: number | null) {
  if (value == null) return "Pendiente";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function humanizeReason(reason: string) {
  return reasonCopy[reason] ?? reason.replaceAll("_", " ").toLowerCase();
}

function postalTone(status?: string | null) {
  if (status === "validated") return "success";
  if (status === "rejected" || status === "error") return "danger";
  return "warning";
}

function validationTone(status?: string | null) {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
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

function ProfileContent({
  profile,
  formState,
  initialFormState,
  onFieldChange,
  onSave,
  onCaptureGeo,
  onValidatePostal,
  isSaving,
  isCapturingGeo,
  isValidatingPostal,
  saveFeedback,
}: {
  profile: ProviderProfileResponse;
  formState: ProfileFormState;
  initialFormState: ProfileFormState;
  onFieldChange: (field: keyof ProfileFormState, value: string) => void;
  onSave: () => void;
  onCaptureGeo: () => void;
  onValidatePostal: () => void;
  isSaving: boolean;
  isCapturingGeo: boolean;
  isValidatingPostal: boolean;
  saveFeedback: SaveFeedback | null;
}) {
  const provider = profile.provider;
  const isDirty = JSON.stringify(formState) !== JSON.stringify(initialFormState);
  const hasAddressChanges = addressFieldKeys.some((field) => formState[field] !== initialFormState[field]);
  const locationLabel =
    [provider.localidad, provider.provincia].filter(Boolean).join(", ") || "Cobertura en configuracion";
  const normalizedAddress =
    profile.postal_validation.postal_normalized_address ||
    profile.postal_validation.postal_normalized_locality ||
    "Todavia sin direccion normalizada";
  const helperMessages = [
    !provider.email_operativo ? "Completá un email operativo para que el equipo responda sin depender del login." : null,
    !provider.whatsapp && !provider.telefono_operativo ? "Agregá teléfono o WhatsApp para cerrar el bloque mínimo de contacto." : null,
    !provider.direccion_linea1 ? "Completá la dirección estructurada para destrabar postal y cercanía." : null,
    !provider.geo_source ? "Capturá coordenadas reales del taller para mejorar el ranking por cercanía." : null,
    profile.postal_validation.postal_validation_status !== "validated"
      ? "La dirección todavía no quedó validada con Correo Argentino."
      : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Vista editable"
        title="Perfil operativo"
        description="Migración React de la ficha del proveedor con lectura real, edición segura del perfil base y continuidad visual con la landing principal de COMPARO3D."
        meta={
          <>
            <DashboardStatePill tone={profile.profile_score >= 80 ? "success" : "warning"}>
              Score {profile.profile_score}%
            </DashboardStatePill>
            <DashboardStatePill tone={validationTone(provider.validation_status)}>
              Validacion {provider.validation_status || "pending"}
            </DashboardStatePill>
            <DashboardStatePill tone={postalTone(profile.postal_validation.postal_validation_status)}>
              Postal {profile.postal_validation.postal_validation_status || "pending"}
            </DashboardStatePill>
            <DashboardStatePill tone={provider.marketplace_visible ? "success" : "muted"}>
              {provider.marketplace_visible ? "Visible en marketplace" : "Sin visibilidad comercial"}
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
              disabled={hasAddressChanges || isSaving || isValidatingPostal}
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
              Guardar perfil
            </Button>
          </>
        }
      />

      {saveFeedback ? <FeedbackBanner feedback={saveFeedback} /> : null}
      {hasAddressChanges ? (
        <div className="rounded-[1.15rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Guardá primero los cambios de dirección antes de correr la validación postal, así el chequeo usa la versión correcta.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SnapshotCard title="Nombre visible" value={provider.nombre || "Pendiente"} support={locationLabel} icon={<Store className="h-5 w-5" />} />
        <SnapshotCard
          title="Promesa de entrega"
          value={provider.tiempo_entrega_dias != null ? `${provider.tiempo_entrega_dias} dias` : "Pendiente"}
          support={`Trabajo minimo ${formatMoney(provider.min_trabajo)}`}
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <SnapshotCard
          title="Geo capturada"
          value={provider.geo_source || "Sin fuente"}
          support={provider.geo_captured_at ? formatDateTime(provider.geo_captured_at) : "Todavia sin coordenadas"}
          icon={<LocateFixed className="h-5 w-5" />}
        />
        <SnapshotCard
          title="Direccion postal"
          value={profile.postal_validation.postal_normalized_cpa || "Sin CPA"}
          support={normalizedAddress}
          icon={<BadgeCheck className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <DashboardPanel title="Identidad comercial y contacto" description="Contacto, marca y relato público del proveedor.">
            <div className="grid gap-5 md:grid-cols-2">
              <DashboardField label="Nombre comercial" htmlFor="nombre"><Input id="nombre" value={formState.nombre} onChange={(e) => onFieldChange("nombre", e.target.value)} className="h-11 rounded-xl border-border/80 bg-white" /></DashboardField>
              <DashboardField label="Email operativo" htmlFor="email_operativo"><Input id="email_operativo" type="email" value={formState.email_operativo} onChange={(e) => onFieldChange("email_operativo", e.target.value)} className="h-11 rounded-xl border-border/80 bg-white" /></DashboardField>
              <DashboardField label="Telefono operativo" htmlFor="telefono_operativo"><Input id="telefono_operativo" value={formState.telefono_operativo} onChange={(e) => onFieldChange("telefono_operativo", e.target.value)} className="h-11 rounded-xl border-border/80 bg-white" /></DashboardField>
              <DashboardField label="WhatsApp" htmlFor="whatsapp"><Input id="whatsapp" value={formState.whatsapp} onChange={(e) => onFieldChange("whatsapp", e.target.value)} className="h-11 rounded-xl border-border/80 bg-white" /></DashboardField>
              <DashboardField label="Sitio web" htmlFor="sitio_web"><Input id="sitio_web" value={formState.sitio_web} onChange={(e) => onFieldChange("sitio_web", e.target.value)} className="h-11 rounded-xl border-border/80 bg-white" placeholder="https://..." /></DashboardField>
              <DashboardField label="Logo URL" htmlFor="logo_url"><Input id="logo_url" value={formState.logo_url} onChange={(e) => onFieldChange("logo_url", e.target.value)} className="h-11 rounded-xl border-border/80 bg-white" placeholder="https://..." /></DashboardField>
              <DashboardField label="Nombre legal" htmlFor="nombre_legal"><Input id="nombre_legal" value={formState.nombre_legal} onChange={(e) => onFieldChange("nombre_legal", e.target.value)} className="h-11 rounded-xl border-border/80 bg-white" /></DashboardField>
              <DashboardField label="CUIT" htmlFor="cuit"><Input id="cuit" value={formState.cuit} onChange={(e) => onFieldChange("cuit", e.target.value)} className="h-11 rounded-xl border-border/80 bg-white" /></DashboardField>
              <DashboardField label="Descripcion publica" htmlFor="public_description" className="md:col-span-2" hint="Copi corto y concreto para explicar especialidad, cobertura y propuesta de valor.">
                <Textarea id="public_description" value={formState.public_description} onChange={(e) => onFieldChange("public_description", e.target.value)} className="min-h-[144px] rounded-2xl border-border/80 bg-white" />
              </DashboardField>
            </div>
          </DashboardPanel>

          <DashboardPanel title="Operacion comercial" description="Promesa de entrega, ticket base y orden operativo.">
            <div className="grid gap-5 md:grid-cols-2">
              <DashboardField label="Dias de entrega" htmlFor="tiempo_entrega_dias"><Input id="tiempo_entrega_dias" type="number" min="0" step="1" value={formState.tiempo_entrega_dias} onChange={(e) => onFieldChange("tiempo_entrega_dias", e.target.value)} className="h-11 rounded-xl border-border/80 bg-white" /></DashboardField>
              <DashboardField label="Trabajo minimo" htmlFor="min_trabajo"><Input id="min_trabajo" type="number" min="0" step="100" value={formState.min_trabajo} onChange={(e) => onFieldChange("min_trabajo", e.target.value)} className="h-11 rounded-xl border-border/80 bg-white" /></DashboardField>
              <DashboardField label="Tier" htmlFor="tier"><Input id="tier" value={formState.tier} onChange={(e) => onFieldChange("tier", e.target.value)} className="h-11 rounded-xl border-border/80 bg-white" /></DashboardField>
              <DashboardField label="Horario operativo" htmlFor="horario_operativo_json" className="md:col-span-2" hint='Usa un JSON simple, por ejemplo {"lun-vie":"9-18"}.'>
                <Textarea id="horario_operativo_json" value={formState.horario_operativo_json} onChange={(e) => onFieldChange("horario_operativo_json", e.target.value)} className="min-h-[160px] rounded-2xl border-border/80 bg-white font-mono text-xs" />
              </DashboardField>
            </div>
          </DashboardPanel>

          <DashboardPanel title="Direccion operativa y geolocalizacion" description="Base real para postal, logística y ranking por cercanía.">
            <div className="grid gap-5 md:grid-cols-2">
              <DashboardField label="Direccion linea 1" htmlFor="direccion_linea1" className="md:col-span-2"><Input id="direccion_linea1" value={formState.direccion_linea1} onChange={(e) => onFieldChange("direccion_linea1", e.target.value)} className="h-11 rounded-xl border-border/80 bg-white" /></DashboardField>
              <DashboardField label="Direccion linea 2" htmlFor="direccion_linea2" className="md:col-span-2"><Input id="direccion_linea2" value={formState.direccion_linea2} onChange={(e) => onFieldChange("direccion_linea2", e.target.value)} className="h-11 rounded-xl border-border/80 bg-white" /></DashboardField>
              <DashboardField label="Localidad" htmlFor="localidad"><Input id="localidad" value={formState.localidad} onChange={(e) => onFieldChange("localidad", e.target.value)} className="h-11 rounded-xl border-border/80 bg-white" /></DashboardField>
              <DashboardField label="Provincia" htmlFor="provincia"><Input id="provincia" value={formState.provincia} onChange={(e) => onFieldChange("provincia", e.target.value)} className="h-11 rounded-xl border-border/80 bg-white" /></DashboardField>
              <DashboardField label="Codigo postal" htmlFor="codigo_postal"><Input id="codigo_postal" value={formState.codigo_postal} onChange={(e) => onFieldChange("codigo_postal", e.target.value)} className="h-11 rounded-xl border-border/80 bg-white" /></DashboardField>
              <DashboardField label="Latitud" htmlFor="lat"><Input id="lat" type="number" step="0.000001" value={formState.lat} onChange={(e) => onFieldChange("lat", e.target.value)} className="h-11 rounded-xl border-border/80 bg-white" /></DashboardField>
              <DashboardField label="Longitud" htmlFor="lng"><Input id="lng" type="number" step="0.000001" value={formState.lng} onChange={(e) => onFieldChange("lng", e.target.value)} className="h-11 rounded-xl border-border/80 bg-white" /></DashboardField>
              <DashboardField label="Fuente geo" htmlFor="geo_source"><Input id="geo_source" value={formState.geo_source} onChange={(e) => onFieldChange("geo_source", e.target.value)} className="h-11 rounded-xl border-border/80 bg-white" /></DashboardField>
              <DashboardField label="Precision geo (m)" htmlFor="geo_accuracy_m"><Input id="geo_accuracy_m" type="number" min="0" step="0.1" value={formState.geo_accuracy_m} onChange={(e) => onFieldChange("geo_accuracy_m", e.target.value)} className="h-11 rounded-xl border-border/80 bg-white" /></DashboardField>
            </div>
          </DashboardPanel>
        </div>

        <div className="space-y-6">
          <DashboardPanel title="Estado actual" description="Lectura de apoyo para editar con contexto.">
            <div className="space-y-4">
              <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
                <p className="text-sm font-semibold text-foreground">Ubicacion actual</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{locationLabel}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <DashboardStatePill tone={profile.proximity.proximity_enabled ? "success" : "warning"}>
                    {profile.proximity.proximity_enabled ? "Cercania activa" : "Cercania pendiente"}
                  </DashboardStatePill>
                  <DashboardStatePill tone={provider.geo_source ? "info" : "muted"}>
                    {provider.geo_source || "Sin geo source"}
                  </DashboardStatePill>
                </div>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
                <p className="text-sm font-semibold text-foreground">Validacion postal</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{normalizedAddress}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <DashboardStatePill tone={postalTone(profile.postal_validation.postal_validation_status)}>
                    {profile.postal_validation.postal_validation_status || "pending"}
                  </DashboardStatePill>
                  {profile.postal_validation.postal_normalized_cpa ? (
                    <DashboardStatePill tone="info">CPA {profile.postal_validation.postal_normalized_cpa}</DashboardStatePill>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Ultima actualizacion</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{formatDateTime(provider.last_profile_update_at)}</p>
                </div>
                <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Mercado Pago</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{provider.mp_user_id ? "Vinculado" : "Aun no visible"}</p>
                </div>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel title="Pistas operativas" description="Lo siguiente a resolver según el snapshot real.">
            {helperMessages.length ? (
              <div className="space-y-3">
                {helperMessages.map((item) => (
                  <div key={item} className="rounded-[1.15rem] border border-border/70 bg-background/70 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                    {item}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.15rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                El perfil base ya se ve solido. La siguiente migracion puede apoyarse sobre estos mismos patrones.
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel
            title="Bloqueos visibles"
            description="Tomados del backend para no perder prioridad mientras editás."
            headerAction={
              <Button asChild variant="outline" className="h-10 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted">
                <a href="/proveedores" target="_blank" rel="noreferrer">
                  Ver legacy
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
            }
          >
            {profile.readiness.blocking_reasons.length ? (
              <div className="space-y-3">
                {profile.readiness.blocking_reasons.slice(0, 6).map((reason, index) => (
                  <div key={reason} className="flex items-start gap-3 rounded-[1.15rem] border border-border/70 bg-background/70 px-4 py-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{index + 1}</div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{humanizeReason(reason)}</p>
                      <p className="text-xs text-muted-foreground">{reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.15rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                No vemos bloqueos criticos en este snapshot. Perfil listo para apoyar las proximas migraciones.
              </div>
            )}
          </DashboardPanel>
        </div>
      </section>
    </div>
  );
}

export function ProviderProfileView() {
  const queryClient = useQueryClient();
  const { providerId } = useProviderDashboardSession();
  const [formState, setFormState] = useState<ProfileFormState | null>(null);
  const [initialFormState, setInitialFormState] = useState<ProfileFormState | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback | null>(null);

  const profileQuery = useQuery({
    queryKey: ["provider-dashboard", "profile", providerId],
    queryFn: () => fetchProviderProfile(providerId!),
    enabled: providerId != null,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!profileQuery.data?.provider) return;
    if (formState && initialFormState && JSON.stringify(formState) !== JSON.stringify(initialFormState)) return;
    const nextState = providerToFormState(profileQuery.data.provider);
    setFormState(nextState);
    setInitialFormState(nextState);
  }, [profileQuery.data, formState, initialFormState]);

  const applyServerProfile = (payload: ProviderProfileResponse, fields?: (keyof ProfileFormState)[]) => {
    const nextState = providerToFormState(payload.provider);
    if (!fields) {
      setFormState(nextState);
      setInitialFormState(nextState);
      return;
    }
    setFormState((current) => (current ? { ...current, ...Object.fromEntries(fields.map((field) => [field, nextState[field]])) } : nextState));
    setInitialFormState((current) => (current ? { ...current, ...Object.fromEntries(fields.map((field) => [field, nextState[field]])) } : nextState));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!providerId || !formState) throw new Error("No encontramos un proveedor valido para guardar.");
      return updateProviderProfile(providerId, buildProfilePayload(formState));
    },
    onSuccess: (payload) => {
      queryClient.setQueryData(["provider-dashboard", "profile", providerId], payload);
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "summary", providerId] });
      applyServerProfile(payload);
      setSaveFeedback({ tone: "success", title: "Perfil guardado", description: "Los cambios ya quedaron persistidos en el backend real del dashboard." });
      toast.success("Perfil guardado");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "No pudimos guardar el perfil.";
      setSaveFeedback({ tone: "danger", title: "No pudimos guardar", description: message });
      toast.error(message);
    },
  });

  const geoMutation = useMutation({
    mutationFn: async () => {
      if (!providerId) throw new Error("No encontramos un proveedor valido para capturar coordenadas.");
      if (!navigator.geolocation) throw new Error("Este navegador no soporta geolocalizacion.");
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 });
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
      queryClient.setQueryData(["provider-dashboard", "profile", providerId], payload);
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "summary", providerId] });
      applyServerProfile(payload, ["lat", "lng", "geo_source", "geo_accuracy_m", "geo_captured_at"]);
      setSaveFeedback({ tone: "success", title: "Ubicacion actualizada", description: "Las coordenadas reales del taller ya quedaron guardadas y sincronizadas con el snapshot." });
      toast.success("Ubicacion capturada");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "No pudimos capturar la ubicacion actual.";
      setSaveFeedback({ tone: "danger", title: "No pudimos capturar coordenadas", description: message });
      toast.error(message);
    },
  });

  const postalMutation = useMutation({
    mutationFn: async () => {
      if (!providerId) throw new Error("No encontramos un proveedor valido para validar la direccion.");
      return validateProviderPostalAddress(providerId);
    },
    onSuccess: (payload) => {
      queryClient.setQueryData(["provider-dashboard", "profile", providerId], payload);
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "summary", providerId] });
      setSaveFeedback({ tone: "success", title: "Direccion validada", description: "La validacion postal ya corrio contra el endpoint real y el estado quedo actualizado." });
      toast.success("Direccion validada");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "No pudimos validar la direccion.";
      setSaveFeedback({ tone: "danger", title: "No pudimos validar la direccion", description: message });
      toast.error(message);
    },
  });

  const profile = useMemo(() => profileQuery.data, [profileQuery.data]);

  if (profileQuery.isLoading || (profileQuery.isFetching && !profile) || !formState || !initialFormState) {
    return <DashboardLoadingState title="Armando el perfil del proveedor" description="Estamos conectando la vista editable con el snapshot real del dashboard." />;
  }
  if (profileQuery.error) {
    return <DashboardErrorState title="No pudimos cargar el perfil" description="La base del dashboard esta lista, pero este perfil no se pudo recuperar desde el backend real." />;
  }
  if (!profile?.provider) {
    return <DashboardEmptyState title="No encontramos datos del perfil" description="La sesion esta activa, pero no llego un snapshot valido del proveedor para renderizar esta vista." icon={<AlertTriangle className="h-6 w-6" />} />;
  }

  return (
    <ProfileContent
      profile={profile}
      formState={formState}
      initialFormState={initialFormState}
      onFieldChange={(field, value) => {
        setSaveFeedback(null);
        setFormState((current) => (current ? { ...current, [field]: value } : current));
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
