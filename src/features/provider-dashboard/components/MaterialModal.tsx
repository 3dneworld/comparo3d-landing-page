import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { updateProviderMaterials } from "@/features/provider-dashboard/api";
import {
  MATERIAL_TYPES,
  QUOTE_COLOR_OPTIONS,
  colorOptionByName,
} from "@/features/provider-dashboard/data/catalogPresets";
import { MaterialColorPicker } from "./MaterialColorPicker";
import type {
  DashboardMaterial,
  DashboardMaterialColorFormPayload,
  DashboardMaterialFormPayload,
  DashboardMaterialMetadata,
  MarketplacePriceAverage,
} from "@/features/provider-dashboard/types";

/** Catálogo cerrado de atributos de material (alineado con los chips del perfil público). */
const MATERIAL_ATTRIBUTE_OPTIONS = [
  "Apto exterior",
  "Técnico",
  "Flexible",
  "Alta resistencia",
] as const;

export type ModalMode =
  | { kind: "new" }
  | {
      kind: "preset";
      data: {
        name: string;
        avg_price: number;
      };
    }
  | { kind: "edit"; id: number };

export interface MaterialModalProps {
  mode: ModalMode;
  providerId: number;
  materials: DashboardMaterial[];
  marketAverages?: Record<string, MarketplacePriceAverage>;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  material_code: string;
  selectedColors: string[];
  precio_hora: string;
  colorCount: string;
  attributes: string[];
}

function normalizeMaterialCode(value: string): string {
  const upper = value.trim().toUpperCase();
  if (upper.startsWith("TPU")) return "TPU";
  return upper;
}

function isAllowedMaterial(value: string): boolean {
  const normalized = normalizeMaterialCode(value);
  return MATERIAL_TYPES.some((type) => type.toUpperCase() === normalized);
}

function displayMaterialCode(value: string): string {
  const normalized = normalizeMaterialCode(value);
  return MATERIAL_TYPES.find((type) => type.toUpperCase() === normalized) ?? normalized;
}

function buildColorPayload(selectedColors: string[]): DashboardMaterialColorFormPayload[] {
  const selected = new Set(selectedColors.map((name) => name.toLowerCase()));
  return QUOTE_COLOR_OPTIONS.map((color) => ({
    color_name: color.value,
    color_hex: color.hex,
    activo: true,
    in_stock: selected.has(color.value.toLowerCase()),
  }));
}

function materialToPayload(m: DashboardMaterial): DashboardMaterialFormPayload | null {
  if (!isAllowedMaterial(m.material_code)) return null;
  return {
    material_code: displayMaterialCode(m.material_code),
    activo: Boolean(m.activo),
    precio_hora: Number(m.precio_hora) || 0,
    in_stock: Boolean(m.in_stock),
    allow_custom_color: false,
    trabajo_minimo_override: m.trabajo_minimo_override ?? null,
    // ⚠️ Preservar metadata (color_count/attributes) de materiales NO editados: el PUT
    // reemplaza TODOS los materiales, así que sin este passthrough se perderían.
    ...(m.metadata ? { metadata: m.metadata } : {}),
    colores: QUOTE_COLOR_OPTIONS.map((color) => {
      const existing = (m.colores || []).find((c) => c.color_name?.toLowerCase() === color.value.toLowerCase());
      return {
        color_name: color.value,
        color_hex: color.hex,
        activo: true,
        in_stock: Boolean(m.in_stock) && Boolean(existing?.activo) && Boolean(existing?.in_stock),
      };
    }),
  };
}

export function MaterialModal({
  mode,
  providerId,
  materials,
  marketAverages,
  onClose,
  onSaved,
}: MaterialModalProps) {
  const qc = useQueryClient();

  const initial = useMemo<FormState>(() => {
    if (mode.kind === "edit") {
      const m = materials.find((x) => x.id === mode.id);
      const meta = m?.metadata ?? {};
      const rawAttributes = Array.isArray(meta.attributes) ? meta.attributes : [];
      return {
        material_code: displayMaterialCode(m?.material_code || "PLA"),
        selectedColors: Boolean(m?.in_stock)
          ? (m?.colores || [])
              .filter((c) => Boolean(c.activo) && Boolean(c.in_stock))
              .map((c) => c.color_name)
              .filter(Boolean)
          : [],
        precio_hora: m ? String(m.precio_hora || "") : "",
        colorCount: meta.color_count != null ? String(meta.color_count) : "",
        attributes: rawAttributes.filter((a): a is string => typeof a === "string"),
      };
    }
    if (mode.kind === "preset") {
      return {
        material_code: displayMaterialCode(mode.data.name),
        selectedColors: [],
        precio_hora: String(mode.data.avg_price || ""),
        colorCount: "",
        attributes: [],
      };
    }
    const firstMissing = MATERIAL_TYPES.find(
      (type) => !materials.some((m) => normalizeMaterialCode(m.material_code) === type.toUpperCase())
    );
    return {
      material_code: firstMissing || "PLA",
      selectedColors: [],
      precio_hora: "",
      colorCount: "",
      attributes: [],
    };
  }, [mode, materials]);

  const [form, setForm] = useState<FormState>(initial);
  useEffect(() => setForm(initial), [initial]);

  const headerLabel = mode.kind === "edit" ? "EDITAR MATERIAL" : "NUEVO MATERIAL";
  const avgEntry = marketAverages?.[displayMaterialCode(form.material_code)];
  const marketAvg = avgEntry?.avg_price_kg;
  const priceNum = Number(form.precio_hora) || 0;
  const diffPct = marketAvg && priceNum > 0 ? ((priceNum - marketAvg) / marketAvg) * 100 : null;
  let priceHint: { text: string; color: string } | null = null;
  if (diffPct != null && marketAvg) {
    if (diffPct < -5) priceHint = { text: `Buen precio: ${diffPct.toFixed(0)}% vs promedio (${marketAvg.toLocaleString("es-AR")}/hora)`, color: "#10b981" };
    else if (diffPct > 15) priceHint = { text: `Alto: +${diffPct.toFixed(0)}% vs promedio (${marketAvg.toLocaleString("es-AR")}/hora)`, color: "#ef4444" };
    else priceHint = { text: `En línea con el promedio (${marketAvg.toLocaleString("es-AR")}/hora)`, color: "#10b981" };
  }

  const toggleColor = (colorName: string) => {
    setForm((current) => {
      const exists = current.selectedColors.some((name) => name.toLowerCase() === colorName.toLowerCase());
      return {
        ...current,
        selectedColors: exists
          ? current.selectedColors.filter((name) => name.toLowerCase() !== colorName.toLowerCase())
          : [...current.selectedColors, colorName],
      };
    });
  };

  const toggleAttribute = (attribute: string) => {
    setForm((current) => {
      const exists = current.attributes.includes(attribute);
      return {
        ...current,
        attributes: exists
          ? current.attributes.filter((a) => a !== attribute)
          : [...current.attributes, attribute],
      };
    });
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.material_code.trim()) throw new Error("Material requerido");
      if (!isAllowedMaterial(form.material_code)) throw new Error("Ese material no está disponible para clientes");
      if (form.selectedColors.length === 0) throw new Error("Seleccioná al menos un color disponible");
      if (priceNum <= 0) throw new Error("Precio / hora debe ser mayor a 0");

      const allPayloads = materials
        .map(materialToPayload)
        .filter((payload): payload is DashboardMaterialFormPayload => payload != null);

      // Metadata del material editado/nuevo: parte del metadata existente (passthrough de
      // claves legacy) y sobreescribe color_count + attributes con lo del form.
      const editedMaterial =
        mode.kind === "edit" ? materials.find((m) => m.id === mode.id) : undefined;
      const parsedColorCount =
        form.colorCount.trim() === ""
          ? form.selectedColors.length
          : Math.max(0, Math.floor(Number(form.colorCount) || 0));
      const selectedMetadata: DashboardMaterialMetadata = {
        ...(editedMaterial?.metadata ?? {}),
        color_count: parsedColorCount,
        attributes: form.attributes,
      };

      const selectedPayload: DashboardMaterialFormPayload = {
        material_code: displayMaterialCode(form.material_code),
        activo: true,
        precio_hora: priceNum,
        in_stock: true,
        allow_custom_color: false,
        trabajo_minimo_override: null,
        metadata: selectedMetadata,
        colores: buildColorPayload(form.selectedColors),
      };

      if (mode.kind === "edit") {
        const idx = materials.findIndex((m) => m.id === mode.id);
        const payloadIdx = allPayloads.findIndex(
          (payload) => normalizeMaterialCode(payload.material_code) === normalizeMaterialCode(materials[idx]?.material_code || "")
        );
        if (payloadIdx >= 0) allPayloads[payloadIdx] = selectedPayload;
      } else {
        const existingIdx = allPayloads.findIndex(
          (payload) => normalizeMaterialCode(payload.material_code) === normalizeMaterialCode(selectedPayload.material_code)
        );
        if (existingIdx >= 0) allPayloads[existingIdx] = selectedPayload;
        else allPayloads.push(selectedPayload);
      }

      return updateProviderMaterials(providerId, { materiales: allPayloads });
    },
    onSuccess: () => {
      toast.success(mode.kind === "edit" ? "Material actualizado" : "Material agregado");
      void qc.invalidateQueries({ queryKey: ["provider-dashboard", "materials", providerId] });
      void qc.invalidateQueries({ queryKey: ["provider-dashboard", "summary", providerId] });
      onSaved();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    },
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.74)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 580,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--c3d-card-bg, #141922)",
          border: "1px solid var(--c3d-card-border, rgba(255,255,255,.12))",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 24px 70px rgba(0,0,0,.55)",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div style={{ font: "700 10px/1 Montserrat,sans-serif", textTransform: "uppercase", letterSpacing: ".18em", color: "hsl(220,80%,65%)" }}>
              {headerLabel}
            </div>
            <h2 style={{ font: "800 20px/1.2 Montserrat,sans-serif", margin: "6px 0 0", color: "var(--c3d-text-strong, #fff)" }}>
              {mode.kind === "edit" ? "Modificar material" : `Agregar ${displayMaterialCode(form.material_code)} al catálogo`}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, color: "var(--c3d-text-muted, rgba(255,255,255,.65))" }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 12, borderRadius: 12, background: "var(--c3d-card-bg-alt, rgba(255,255,255,.035))", border: "1px solid var(--c3d-card-border-soft, rgba(255,255,255,.08))" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: "800 18px/1.2 Montserrat,sans-serif", color: "var(--c3d-text-strong, #fff)" }}>
              {displayMaterialCode(form.material_code)}
            </div>
            <div style={{ font: "500 12px/1.4 Montserrat,sans-serif", color: "var(--c3d-text-muted, rgba(255,255,255,.62))", marginTop: 4 }}>
              {form.selectedColors.length ? `${form.selectedColors.length} colores disponibles` : "Elegí los colores disponibles"}
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: 5, maxWidth: 220 }}>
            {form.selectedColors.slice(0, 8).map((name) => {
              const color = colorOptionByName(name);
              return (
                <span
                  key={name}
                  title={name}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: color?.hex || "#78716c",
                    border: `1px solid ${color?.border || "rgba(255,255,255,.25)"}`,
                  }}
                />
              );
            })}
          </div>
        </div>

        <MaterialColorPicker selected={form.selectedColors} onToggle={toggleColor} />

        <div>
          <label style={{ font: "700 11px/1 Montserrat,sans-serif", textTransform: "uppercase", letterSpacing: ".14em", color: "var(--c3d-text-faint, rgba(255,255,255,.45))", display: "block", marginBottom: 6 }}>
            Precio / hora
          </label>
          <input
            type="number"
            min="0"
            step="100"
            value={form.precio_hora}
            onChange={(e) => setForm((f) => ({ ...f, precio_hora: e.target.value }))}
            placeholder="5000"
            style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid var(--c3d-card-border, rgba(255,255,255,.14))", padding: "0 12px", font: "700 14px Montserrat,sans-serif", background: "rgba(255,255,255,.95)", color: "#111827" }}
          />
          {priceHint ? (
            <div style={{ marginTop: 7, font: "700 11px/1.3 Montserrat,sans-serif", color: priceHint.color }}>
              {priceHint.text}
            </div>
          ) : null}
        </div>

        <div>
          <label style={{ font: "700 11px/1 Montserrat,sans-serif", textTransform: "uppercase", letterSpacing: ".14em", color: "var(--c3d-text-faint, rgba(255,255,255,.45))", display: "block", marginBottom: 6 }}>
            Cantidad de colores
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={form.colorCount}
            onChange={(e) => setForm((f) => ({ ...f, colorCount: e.target.value }))}
            placeholder={String(form.selectedColors.length)}
            style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid var(--c3d-card-border, rgba(255,255,255,.14))", padding: "0 12px", font: "700 14px Montserrat,sans-serif", background: "rgba(255,255,255,.95)", color: "#111827" }}
          />
          <div style={{ marginTop: 7, font: "500 11px/1.3 Montserrat,sans-serif", color: "var(--c3d-text-muted, rgba(255,255,255,.55))" }}>
            Se muestra en tu perfil público. Sugerido: {form.selectedColors.length} (colores seleccionados). Dejalo vacío para usar el sugerido.
          </div>
        </div>

        <div>
          <label style={{ font: "700 11px/1 Montserrat,sans-serif", textTransform: "uppercase", letterSpacing: ".14em", color: "var(--c3d-text-faint, rgba(255,255,255,.45))", display: "block", marginBottom: 8 }}>
            Atributos del material
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {MATERIAL_ATTRIBUTE_OPTIONS.map((attribute) => {
              const active = form.attributes.includes(attribute);
              return (
                <button
                  key={attribute}
                  type="button"
                  onClick={() => toggleAttribute(attribute)}
                  aria-pressed={active}
                  style={{
                    cursor: "pointer",
                    borderRadius: 999,
                    padding: "7px 14px",
                    font: "700 12px/1 Montserrat,sans-serif",
                    border: active
                      ? "1px solid hsl(220,80%,65%)"
                      : "1px solid var(--c3d-card-border, rgba(255,255,255,.16))",
                    background: active ? "hsl(220,80%,65%)" : "transparent",
                    color: active ? "#0b1220" : "var(--c3d-text-muted, rgba(255,255,255,.7))",
                  }}
                >
                  {attribute}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 6, borderTop: "1px solid var(--c3d-card-border-soft, rgba(255,255,255,.08))" }}>
          <Button
            type="button"
            onClick={onClose}
            disabled={saveMut.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Cancelar
          </Button>
          <Button type="button" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
