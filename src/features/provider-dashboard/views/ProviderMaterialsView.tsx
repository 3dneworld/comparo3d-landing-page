import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  LoaderCircle,
  PackageCheck,
  Palette,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { fetchProviderMaterials, updateProviderMaterials } from "@/features/provider-dashboard/api";
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
  DashboardMaterialFormPayload,
  DashboardStockStatus,
  ProviderMaterialsResponse,
} from "@/features/provider-dashboard/types";
import { cn } from "@/lib/utils";

type MaterialColorFormState = {
  color_name: string;
  color_hex: string;
  activo: boolean;
  stock_status: DashboardStockStatus;
  stock_qty_grams: string;
};

type MaterialFormState = {
  material_code: string;
  activo: boolean;
  precio_hora: string;
  stock_status: DashboardStockStatus;
  stock_qty_grams: string;
  allow_custom_color: boolean;
  trabajo_minimo_override: string;
  colores: MaterialColorFormState[];
};

type MaterialField =
  | "material_code"
  | "precio_hora"
  | "stock_status"
  | "stock_qty_grams"
  | "trabajo_minimo_override";
type ColorField = "color_name" | "color_hex" | "stock_status" | "stock_qty_grams";
type SaveFeedback = { tone: "success" | "danger"; title: string; description: string };

const stockOptions: { value: DashboardStockStatus; label: string; support: string }[] = [
  { value: "available", label: "Disponible", support: "Cotiza y puede mostrarse visible." },
  { value: "low", label: "Bajo", support: "Cotiza, pero conviene reponer pronto." },
  { value: "on_request", label: "A pedido", support: "Cotiza, sin prometer stock inmediato." },
  { value: "out", label: "Sin stock", support: "No entra a nuevas cotizaciones." },
  { value: "unknown", label: "Sin definir", support: "Bloquea el flujo confiable hasta aclarar stock." },
];

const reasonCopy: Record<string, string> = {
  SIN_MATERIAL_ACTIVO_CON_STOCK: "Activar al menos un material con precio y stock util",
  SIN_MATERIALES_ACTIVOS: "Activar al menos un material",
  STOCK_MATERIALES_DESCONOCIDO: "Completar estado de stock",
};

function safeString(value: unknown) {
  return value == null ? "" : String(value);
}

function numberInput(value: unknown) {
  return value == null || value === "" ? "" : String(value);
}

function normalizeStockStatus(value?: string | null): DashboardStockStatus {
  return stockOptions.some((option) => option.value === value)
    ? (value as DashboardStockStatus)
    : "unknown";
}

function defaultMaterial(index: number): MaterialFormState {
  return {
    material_code: index === 0 ? "PLA" : "",
    activo: true,
    precio_hora: "",
    stock_status: "unknown",
    stock_qty_grams: "",
    allow_custom_color: false,
    trabajo_minimo_override: "",
    colores: [],
  };
}

function defaultColor(): MaterialColorFormState {
  return {
    color_name: "",
    color_hex: "#111111",
    activo: true,
    stock_status: "unknown",
    stock_qty_grams: "",
  };
}

function materialsToFormState(payload: ProviderMaterialsResponse): MaterialFormState[] {
  return (payload.materials || []).map((material) => ({
    material_code: safeString(material.material_code),
    activo: Boolean(material.activo),
    precio_hora: numberInput(material.precio_hora),
    stock_status: normalizeStockStatus(material.stock_status),
    stock_qty_grams: numberInput(material.stock_qty_grams),
    allow_custom_color: Boolean(material.allow_custom_color),
    trabajo_minimo_override: numberInput(material.trabajo_minimo_override),
    colores: (material.colores || []).map((color) => ({
      color_name: safeString(color.color_name),
      color_hex: safeString(color.color_hex || "#111111"),
      activo: Boolean(color.activo),
      stock_status: normalizeStockStatus(color.stock_status),
      stock_qty_grams: numberInput(color.stock_qty_grams),
    })),
  }));
}

function parseNullableNonNegative(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} debe ser un numero positivo o cero.`);
  }
  return parsed;
}

function normalizeColorHex(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error(`${label} debe tener formato HEX, por ejemplo #111111.`);
  }
  return hex;
}

function colorPickerValue(value: string) {
  const trimmed = value.trim();
  const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#111111";
}

function isMaterialPayload(item: DashboardMaterialFormPayload | null): item is DashboardMaterialFormPayload {
  return item != null;
}

function buildMaterialsPayload(formState: MaterialFormState[]): { materiales: DashboardMaterialFormPayload[] } {
  return {
    materiales: formState
      .map((material) => {
        const code = material.material_code.trim().toUpperCase();
        if (!code) return null;
        const precio_hora = parseNullableNonNegative(material.precio_hora, `Precio hora de ${code}`) ?? 0;
        const colores = material.colores
          .map((color, colorIndex) => {
            const colorName = color.color_name.trim();
            if (!colorName) return null;
            return {
              color_name: colorName,
              color_hex: normalizeColorHex(color.color_hex, `Color ${colorIndex + 1} de ${code}`),
              activo: color.activo,
              stock_status: color.stock_status,
              stock_qty_grams: parseNullableNonNegative(color.stock_qty_grams, `Stock del color ${colorName}`),
            };
          })
          .filter((color): color is NonNullable<typeof color> => color != null);

        return {
          material_code: code,
          activo: material.activo,
          precio_hora,
          stock_status: material.stock_status,
          stock_qty_grams: parseNullableNonNegative(material.stock_qty_grams, `Stock en gramos de ${code}`),
          allow_custom_color: material.allow_custom_color,
          trabajo_minimo_override: parseNullableNonNegative(
            material.trabajo_minimo_override,
            `Trabajo minimo de ${code}`
          ),
          colores,
        };
      })
      .filter(isMaterialPayload),
  };
}

function formatMoney(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Sin precio";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(value?: string | null) {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin registro";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function stockTone(status: DashboardStockStatus) {
  if (status === "available") return "success";
  if (status === "low" || status === "on_request") return "warning";
  if (status === "out") return "danger";
  return "muted";
}

function stockLabel(status: DashboardStockStatus) {
  return stockOptions.find((option) => option.value === status)?.label ?? status;
}

function materialCanQuote(material: MaterialFormState) {
  const price = Number(material.precio_hora) || 0;
  return material.activo && price > 0 && ["available", "low", "on_request"].includes(material.stock_status);
}

function materialCanBeVisible(material: MaterialFormState) {
  const price = Number(material.precio_hora) || 0;
  return material.activo && price > 0 && ["available", "low"].includes(material.stock_status);
}

function humanizeReason(reason: string) {
  return reasonCopy[reason] ?? reason.replaceAll("_", " ").toLowerCase();
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

function MaterialEditor({
  material,
  materialIndex,
  isSaving,
  onMaterialFieldChange,
  onColorFieldChange,
  onToggleMaterial,
  onToggleColor,
  onAddColor,
  onRemoveColor,
  onRemoveMaterial,
}: {
  material: MaterialFormState;
  materialIndex: number;
  isSaving: boolean;
  onMaterialFieldChange: (index: number, field: MaterialField, value: string) => void;
  onColorFieldChange: (materialIndex: number, colorIndex: number, field: ColorField, value: string) => void;
  onToggleMaterial: (index: number, field: "activo" | "allow_custom_color") => void;
  onToggleColor: (materialIndex: number, colorIndex: number) => void;
  onAddColor: (materialIndex: number) => void;
  onRemoveColor: (materialIndex: number, colorIndex: number) => void;
  onRemoveMaterial: (index: number) => void;
}) {
  return (
    <article className="rounded-[1.5rem] border border-border/70 bg-white p-5 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-[Montserrat] text-lg font-bold tracking-tight text-foreground">
              {material.material_code.trim().toUpperCase() || `Material ${materialIndex + 1}`}
            </p>
            <DashboardStatePill tone={material.activo ? "success" : "muted"}>
              {material.activo ? "Activo" : "Pausado"}
            </DashboardStatePill>
            <DashboardStatePill tone={stockTone(material.stock_status)}>
              {stockLabel(material.stock_status)}
            </DashboardStatePill>
            {materialCanQuote(material) ? <DashboardStatePill tone="info">Cotizable</DashboardStatePill> : null}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {formatMoney(material.precio_hora)} por hora | {material.stock_qty_grams || "sin"} gramos |{" "}
            {material.colores.length} colores
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
            onClick={() => onToggleMaterial(materialIndex, "activo")}
            disabled={isSaving}
          >
            {material.activo ? "Pausar" : "Activar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-rose-200 bg-white/90 px-4 text-rose-700 hover:bg-rose-50"
            onClick={() => onRemoveMaterial(materialIndex)}
            disabled={isSaving}
          >
            <Trash2 className="h-4 w-4" />
            Quitar
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <DashboardField label="Codigo" htmlFor={`material-${materialIndex}-code`}>
          <Input
            id={`material-${materialIndex}-code`}
            value={material.material_code}
            onChange={(event) => onMaterialFieldChange(materialIndex, "material_code", event.target.value)}
            className="h-11 rounded-xl border-border/80 bg-white"
            placeholder="PLA"
          />
        </DashboardField>
        <DashboardField label="Precio hora" htmlFor={`material-${materialIndex}-price`}>
          <Input
            id={`material-${materialIndex}-price`}
            type="number"
            min="0"
            step="1"
            value={material.precio_hora}
            onChange={(event) => onMaterialFieldChange(materialIndex, "precio_hora", event.target.value)}
            className="h-11 rounded-xl border-border/80 bg-white"
          />
        </DashboardField>
        <DashboardField
          label="Stock"
          htmlFor={`material-${materialIndex}-stock`}
          hint={stockOptions.find((option) => option.value === material.stock_status)?.support}
        >
          <select
            id={`material-${materialIndex}-stock`}
            value={material.stock_status}
            onChange={(event) => onMaterialFieldChange(materialIndex, "stock_status", event.target.value)}
            className="h-11 w-full rounded-xl border border-border/80 bg-white px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {stockOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </DashboardField>
        <DashboardField label="Gramos" htmlFor={`material-${materialIndex}-grams`}>
          <Input
            id={`material-${materialIndex}-grams`}
            type="number"
            min="0"
            step="1"
            value={material.stock_qty_grams}
            onChange={(event) => onMaterialFieldChange(materialIndex, "stock_qty_grams", event.target.value)}
            className="h-11 rounded-xl border-border/80 bg-white"
          />
        </DashboardField>
        <DashboardField
          label="Trabajo minimo"
          htmlFor={`material-${materialIndex}-minimum`}
          hint="Opcional. Pisa el minimo general para este material."
        >
          <Input
            id={`material-${materialIndex}-minimum`}
            type="number"
            min="0"
            step="1"
            value={material.trabajo_minimo_override}
            onChange={(event) => onMaterialFieldChange(materialIndex, "trabajo_minimo_override", event.target.value)}
            className="h-11 rounded-xl border-border/80 bg-white"
          />
        </DashboardField>
        <button
          type="button"
          onClick={() => onToggleMaterial(materialIndex, "allow_custom_color")}
          className={cn(
            "md:col-span-1 xl:col-span-3 rounded-[1.25rem] border p-4 text-left transition-colors",
            material.allow_custom_color
              ? "border-primary/25 bg-primary/10 shadow-card"
              : "border-border/70 bg-white hover:border-primary/20"
          )}
          disabled={isSaving}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-foreground">Permitir color a pedido</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Usalo cuando podes fabricar colores fuera del catalogo fijo.
              </p>
            </div>
            <DashboardStatePill tone={material.allow_custom_color ? "success" : "muted"}>
              {material.allow_custom_color ? "Activo" : "Apagado"}
            </DashboardStatePill>
          </div>
        </button>
      </div>

      <div className="mt-5 rounded-[1.25rem] border border-border/70 bg-white/80 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-foreground">Colores de {material.material_code || "material"}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Cada color puede tener su propio stock y estado.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
            onClick={() => onAddColor(materialIndex)}
            disabled={isSaving}
          >
            <Plus className="h-4 w-4" />
            Agregar color
          </Button>
        </div>
        {material.colores.length ? (
          <div className="mt-4 space-y-3">
            {material.colores.map((color, colorIndex) => (
              <div
                key={`${color.color_name}-${colorIndex}`}
                className="grid gap-3 rounded-[1rem] border border-border/70 bg-white p-3 md:grid-cols-[1fr_0.8fr_0.9fr_0.7fr_auto]"
              >
                <Input
                  aria-label="Nombre del color"
                  value={color.color_name}
                  onChange={(event) =>
                    onColorFieldChange(materialIndex, colorIndex, "color_name", event.target.value)
                  }
                  className="h-10 rounded-xl border-border/80 bg-white"
                  placeholder="Negro"
                />
                <div className="flex gap-2">
                  <input
                    aria-label="Muestra de color"
                    type="color"
                    value={colorPickerValue(color.color_hex)}
                    onChange={(event) =>
                      onColorFieldChange(materialIndex, colorIndex, "color_hex", event.target.value)
                    }
                    className="h-10 w-12 rounded-lg border border-border/80 bg-white p-1"
                  />
                  <Input
                    aria-label="HEX del color"
                    value={color.color_hex}
                    onChange={(event) =>
                      onColorFieldChange(materialIndex, colorIndex, "color_hex", event.target.value)
                    }
                    className="h-10 rounded-xl border-border/80 bg-white"
                    placeholder="#111111"
                  />
                </div>
                <select
                  aria-label="Stock del color"
                  value={color.stock_status}
                  onChange={(event) =>
                    onColorFieldChange(materialIndex, colorIndex, "stock_status", event.target.value)
                  }
                  className="h-10 rounded-xl border border-border/80 bg-white px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {stockOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Input
                  aria-label="Gramos del color"
                  type="number"
                  min="0"
                  step="1"
                  value={color.stock_qty_grams}
                  onChange={(event) =>
                    onColorFieldChange(materialIndex, colorIndex, "stock_qty_grams", event.target.value)
                  }
                  className="h-10 rounded-xl border-border/80 bg-white"
                  placeholder="500"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-xl border-border/80 bg-white/90 px-3 text-foreground hover:bg-muted"
                    onClick={() => onToggleColor(materialIndex, colorIndex)}
                    disabled={isSaving}
                  >
                    {color.activo ? "Activo" : "Pausado"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-xl border-rose-200 bg-white/90 px-3 text-rose-700 hover:bg-rose-50"
                    onClick={() => onRemoveColor(materialIndex, colorIndex)}
                    disabled={isSaving}
                    aria-label="Quitar color"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[1rem] border border-dashed border-border/80 bg-white/80 px-4 py-3 text-sm text-muted-foreground">
            Todavia no hay colores cargados para este material.
          </div>
        )}
      </div>
    </article>
  );
}

function MaterialsContent({
  data,
  formState,
  initialFormState,
  onMaterialFieldChange,
  onColorFieldChange,
  onToggleMaterial,
  onToggleColor,
  onAddMaterial,
  onRemoveMaterial,
  onAddColor,
  onRemoveColor,
  onSave,
  isSaving,
  saveFeedback,
}: {
  data: ProviderMaterialsResponse;
  formState: MaterialFormState[];
  initialFormState: MaterialFormState[];
  onMaterialFieldChange: (index: number, field: MaterialField, value: string) => void;
  onColorFieldChange: (materialIndex: number, colorIndex: number, field: ColorField, value: string) => void;
  onToggleMaterial: (index: number, field: "activo" | "allow_custom_color") => void;
  onToggleColor: (materialIndex: number, colorIndex: number) => void;
  onAddMaterial: () => void;
  onRemoveMaterial: (index: number) => void;
  onAddColor: (materialIndex: number) => void;
  onRemoveColor: (materialIndex: number, colorIndex: number) => void;
  onSave: () => void;
  isSaving: boolean;
  saveFeedback: SaveFeedback | null;
}) {
  const provider = data.provider;
  const isDirty = JSON.stringify(formState) !== JSON.stringify(initialFormState);
  const activeMaterials = formState.filter((material) => material.activo);
  const quoteMaterials = formState.filter(materialCanQuote);
  const visibleMaterials = formState.filter(materialCanBeVisible);
  const unknownActiveCount = activeMaterials.filter((material) => material.stock_status === "unknown").length;
  const totalStockKg = formState.reduce((sum, material) => sum + (Number(material.stock_qty_grams) || 0), 0) / 1000;
  const colorCount = formState.reduce((sum, material) => sum + material.colores.length, 0);
  const nextSteps = [
    !quoteMaterials.length
      ? "Activar al menos un material con precio mayor a cero y stock disponible, bajo o a pedido."
      : null,
    unknownActiveCount ? "Cambiar los materiales activos con stock sin definir para destrabar quote_ready." : null,
    activeMaterials.some((material) => (Number(material.precio_hora) || 0) <= 0)
      ? "Completar precio por hora en todos los materiales activos."
      : null,
    !colorCount ? "Cargar colores frecuentes para vender stock concreto y no solo color custom." : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Vista editable"
        title="Materiales, precios y stock"
        description="Materiales reales del proveedor con precio por hora, estado de stock y catalogo de colores. Este guardado alimenta quote_ready y visibilidad."
        meta={
          <>
            <DashboardStatePill tone={quoteMaterials.length ? "success" : "warning"}>
              {quoteMaterials.length} materiales cotizables
            </DashboardStatePill>
            <DashboardStatePill tone={visibleMaterials.length ? "success" : "muted"}>
              {visibleMaterials.length} visibles
            </DashboardStatePill>
            <DashboardStatePill tone={unknownActiveCount ? "warning" : "success"}>
              {unknownActiveCount ? `${unknownActiveCount} sin stock` : "Stock definido"}
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
              onClick={onAddMaterial}
              disabled={isSaving}
            >
              <Plus className="h-4 w-4" />
              Agregar material
            </Button>
            <Button
              type="button"
              className="h-11 rounded-xl bg-gradient-primary px-5 text-primary-foreground shadow-cta hover:opacity-95"
              onClick={onSave}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar materiales
            </Button>
          </>
        }
      />

      {saveFeedback ? <FeedbackBanner feedback={saveFeedback} /> : null}
      {unknownActiveCount ? (
        <div className="rounded-[1.15rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Hay materiales activos con stock sin definir. El backend los deja fuera del flujo confiable hasta que el stock sea claro.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          title="Catalogo activo"
          value={`${activeMaterials.length}/${formState.length}`}
          support="Materiales habilitados para trabajar desde esta ficha."
          icon={<PackageCheck className="h-5 w-5" />}
        />
        <DashboardMetricCard
          title="Stock declarado"
          value={totalStockKg > 0 ? `${totalStockKg.toFixed(1)} kg` : "Pendiente"}
          support="Suma de gramos cargados a nivel material."
          icon={<Boxes className="h-5 w-5" />}
        />
        <DashboardMetricCard
          title="Colores cargados"
          value={String(colorCount)}
          support="Variantes de color con stock propio por material."
          icon={<Palette className="h-5 w-5" />}
        />
        <DashboardMetricCard
          title="Ultima actualizacion"
          value={formatDateTime(provider.last_stock_update_at)}
          support="Marca de persistencia de stock/precios del backend."
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <DashboardPanel
            title="Materiales del proveedor"
            description="Edita el catalogo operativo. El guardado reemplaza la lista completa en el endpoint real de Materiales."
          >
            {formState.length ? (
              <div className="space-y-4">
                {formState.map((material, materialIndex) => (
                  <MaterialEditor
                    key={`${material.material_code}-${materialIndex}`}
                    material={material}
                    materialIndex={materialIndex}
                    isSaving={isSaving}
                    onMaterialFieldChange={onMaterialFieldChange}
                    onColorFieldChange={onColorFieldChange}
                    onToggleMaterial={onToggleMaterial}
                    onToggleColor={onToggleColor}
                    onAddColor={onAddColor}
                    onRemoveColor={onRemoveColor}
                    onRemoveMaterial={onRemoveMaterial}
                  />
                ))}
              </div>
            ) : (
              <DashboardEmptyState
                title="Todavia no hay materiales"
                description="Agrega el primer material para definir precio, stock y colores reales del proveedor."
                icon={<PackageCheck className="h-6 w-6" />}
                actionLabel="Agregar material"
                onAction={onAddMaterial}
                className="min-h-[420px]"
              />
            )}
          </DashboardPanel>
        </div>

        <div className="space-y-6">
          <DashboardPanel
            title="Diagnostico de materiales"
            description="Lectura compacta del impacto sobre cotizacion y visibilidad."
          >
            <div className="space-y-4">
              <div className="rounded-[1.25rem] border border-border/70 bg-white p-4 shadow-card">
                <p className="text-sm font-semibold text-foreground">Estado para cotizar</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {quoteMaterials.length
                    ? "Hay materiales con precio y stock util para entrar al flujo de cotizacion."
                    : "Aun falta un material activo con precio y stock disponible, bajo o a pedido."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <DashboardStatePill tone={data.readiness.quote_ready ? "success" : "warning"}>
                    {data.readiness.quote_ready ? "Quote ready" : "Pendiente"}
                  </DashboardStatePill>
                  <DashboardStatePill tone={data.effective_permissions.included_in_new_quotes ? "success" : "muted"}>
                    {data.effective_permissions.included_in_new_quotes ? "Incluido en nuevas cotizaciones" : "No incluido aun"}
                  </DashboardStatePill>
                </div>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-white p-4 shadow-card">
                <p className="text-sm font-semibold text-foreground">Visibles por backend</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {(data.readiness.visible_materials || []).join(", ") ||
                    "El snapshot todavia no marca materiales visibles."}
                </p>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel
            title="Proximos pasos"
            description="Lo que conviene cerrar para que Materiales quede defendible."
            headerAction={
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
              >
                <a href="/dashboard/proveedores/produccion" rel="noreferrer">
                  Ir a Produccion
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
                    className="rounded-[1.15rem] border border-border/70 bg-white px-4 py-3 text-sm leading-relaxed text-muted-foreground shadow-card"
                  >
                    {item}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.15rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                El catalogo se ve listo para operar. El siguiente paso natural es Cotizaciones.
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel title="Bloqueos visibles" description="Tomados del backend para no perder prioridad mientras editas.">
            {data.readiness.blocking_reasons.length ? (
              <div className="space-y-3">
                {data.readiness.blocking_reasons.slice(0, 6).map((reason, index) => (
                  <div
                    key={reason}
                    className="flex items-start gap-3 rounded-[1.15rem] border border-border/70 bg-white px-4 py-3 shadow-card"
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
                No vemos bloqueos criticos de materiales en este snapshot.
              </div>
            )}
          </DashboardPanel>
        </div>
      </section>
    </div>
  );
}

export function ProviderMaterialsView() {
  const queryClient = useQueryClient();
  const { providerId } = useProviderDashboardSession();
  const [formState, setFormState] = useState<MaterialFormState[]>([]);
  const [initialFormState, setInitialFormState] = useState<MaterialFormState[]>([]);
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback | null>(null);

  const materialsQuery = useQuery({
    queryKey: ["provider-dashboard", "materials", providerId],
    queryFn: () => fetchProviderMaterials(providerId!),
    enabled: providerId != null,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!materialsQuery.data) return;
    const currentState = JSON.stringify(formState);
    const initialState = JSON.stringify(initialFormState);
    if (currentState !== initialState) return;
    const nextState = materialsToFormState(materialsQuery.data);
    const nextStateSnapshot = JSON.stringify(nextState);
    if (currentState === nextStateSnapshot && initialState === nextStateSnapshot) return;
    setFormState(nextState);
    setInitialFormState(nextState);
  }, [formState, initialFormState, materialsQuery.data]);

  const applySnapshot = (payload: ProviderMaterialsResponse) => {
    queryClient.setQueryData(["provider-dashboard", "materials", providerId], payload);
    queryClient.setQueryData(["provider-dashboard", "profile", providerId], payload);
    void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "summary", providerId] });
    const nextState = materialsToFormState(payload);
    setFormState(nextState);
    setInitialFormState(nextState);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!providerId) throw new Error("No encontramos un proveedor valido para guardar.");
      return updateProviderMaterials(providerId, buildMaterialsPayload(formState));
    },
    onSuccess: (payload) => {
      applySnapshot(payload);
      setSaveFeedback({
        tone: "success",
        title: "Materiales guardados",
        description: "El catalogo, precios, stock y colores ya quedaron persistidos en el backend real.",
      });
      toast.success("Materiales guardados");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "No pudimos guardar materiales.";
      setSaveFeedback({ tone: "danger", title: "No pudimos guardar", description: message });
      toast.error(message);
    },
  });

  const data = useMemo(() => materialsQuery.data, [materialsQuery.data]);

  if (materialsQuery.error) {
    return (
      <DashboardErrorState
        title="No pudimos cargar Materiales"
        description="La base del dashboard esta lista, pero la lectura real de materiales no se pudo recuperar."
      />
    );
  }

  if (materialsQuery.isLoading || (materialsQuery.isFetching && !data)) {
    return (
      <DashboardLoadingState
        title="Armando el catalogo de materiales"
        description="Estamos conectando precios, stock y colores con el snapshot real del dashboard."
      />
    );
  }

  if (!data?.provider) {
    return (
      <DashboardEmptyState
        title="No encontramos datos de materiales"
        description="La sesion esta activa, pero no recibimos un snapshot valido para esta vista."
        icon={<AlertTriangle className="h-6 w-6" />}
      />
    );
  }

  return (
    <MaterialsContent
      data={data}
      formState={formState}
      initialFormState={initialFormState}
      onMaterialFieldChange={(index, field, value) => {
        setSaveFeedback(null);
        const nextValue = field === "stock_status" ? normalizeStockStatus(value) : value;
        setFormState((current) =>
          current.map((material, currentIndex) =>
            currentIndex === index ? { ...material, [field]: nextValue } : material
          )
        );
      }}
      onColorFieldChange={(materialIndex, colorIndex, field, value) => {
        setSaveFeedback(null);
        const nextValue = field === "stock_status" ? normalizeStockStatus(value) : value;
        setFormState((current) =>
          current.map((material, currentMaterialIndex) =>
            currentMaterialIndex === materialIndex
              ? {
                  ...material,
                  colores: material.colores.map((color, currentColorIndex) =>
                    currentColorIndex === colorIndex ? { ...color, [field]: nextValue } : color
                  ),
                }
              : material
          )
        );
      }}
      onToggleMaterial={(index, field) => {
        setSaveFeedback(null);
        setFormState((current) =>
          current.map((material, currentIndex) =>
            currentIndex === index ? { ...material, [field]: !material[field] } : material
          )
        );
      }}
      onToggleColor={(materialIndex, colorIndex) => {
        setSaveFeedback(null);
        setFormState((current) =>
          current.map((material, currentMaterialIndex) =>
            currentMaterialIndex === materialIndex
              ? {
                  ...material,
                  colores: material.colores.map((color, currentColorIndex) =>
                    currentColorIndex === colorIndex ? { ...color, activo: !color.activo } : color
                  ),
                }
              : material
          )
        );
      }}
      onAddMaterial={() => {
        setSaveFeedback(null);
        setFormState((current) => [...current, defaultMaterial(current.length)]);
      }}
      onRemoveMaterial={(index) => {
        setSaveFeedback(null);
        setFormState((current) => current.filter((_, currentIndex) => currentIndex !== index));
      }}
      onAddColor={(materialIndex) => {
        setSaveFeedback(null);
        setFormState((current) =>
          current.map((material, currentIndex) =>
            currentIndex === materialIndex
              ? { ...material, colores: [...material.colores, defaultColor()] }
              : material
          )
        );
      }}
      onRemoveColor={(materialIndex, colorIndex) => {
        setSaveFeedback(null);
        setFormState((current) =>
          current.map((material, currentMaterialIndex) =>
            currentMaterialIndex === materialIndex
              ? {
                  ...material,
                  colores: material.colores.filter((_, currentColorIndex) => currentColorIndex !== colorIndex),
                }
              : material
          )
        );
      }}
      onSave={() => {
        setSaveFeedback(null);
        void saveMutation.mutateAsync();
      }}
      isSaving={saveMutation.isPending}
      saveFeedback={saveFeedback}
    />
  );
}
