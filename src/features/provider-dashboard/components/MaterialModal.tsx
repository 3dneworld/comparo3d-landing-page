import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { updateProviderMaterials } from "@/features/provider-dashboard/api";
import { MATERIAL_TYPES } from "@/features/provider-dashboard/data/catalogPresets";
import { MaterialColorPicker } from "./MaterialColorPicker";
import { StockSwitch } from "./StockSwitch";
import type {
  DashboardMaterial,
  DashboardMaterialFormPayload,
  MarketplacePriceAverage,
} from "@/features/provider-dashboard/types";

export type ModalMode =
  | { kind: "new" }
  | {
      kind: "preset";
      data: {
        name: string;
        type: string;
        color_hex: string;
        color_name: string;
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
  color_name: string;
  color_hex: string;
  in_stock: boolean;
  precio_kg: string;
}

function materialToPayload(m: DashboardMaterial): DashboardMaterialFormPayload {
  return {
    material_code: m.material_code,
    activo: Boolean(m.activo),
    precio_hora: Number(m.precio_hora) || 0,
    in_stock: Boolean(m.in_stock),
    allow_custom_color: Boolean(m.allow_custom_color),
    trabajo_minimo_override: m.trabajo_minimo_override ?? null,
    colores: (m.colores || []).map((c) => ({
      color_name: c.color_name || "",
      color_hex: c.color_hex || "#78716c",
      activo: Boolean(c.activo),
      in_stock: Boolean(c.in_stock),
    })),
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
      const c = m?.colores?.[0];
      return {
        material_code: m?.material_code || "PLA",
        color_name: c?.color_name || "",
        color_hex: c?.color_hex || "#78716c",
        in_stock: Boolean(m?.in_stock),
        precio_kg: m ? String(m.precio_hora || "") : "",
      };
    }
    if (mode.kind === "preset") {
      return {
        material_code: mode.data.name,
        color_name: mode.data.color_name,
        color_hex: mode.data.color_hex,
        in_stock: true,
        precio_kg: String(mode.data.avg_price || ""),
      };
    }
    return {
      material_code: "PLA",
      color_name: "",
      color_hex: "#f5f5f4",
      in_stock: true,
      precio_kg: "",
    };
  }, [mode, materials]);

  const [form, setForm] = useState<FormState>(initial);
  useEffect(() => setForm(initial), [initial]);

  const headerLabel = mode.kind === "edit" ? "EDITAR MATERIAL" : "NUEVO MATERIAL";
  const avgEntry = marketAverages?.[form.material_code];
  const marketAvg = avgEntry?.avg_price_kg;
  const priceNum = Number(form.precio_kg) || 0;
  const diffPct = marketAvg && priceNum > 0 ? ((priceNum - marketAvg) / marketAvg) * 100 : null;
  let priceHint: { text: string; color: string } | null = null;
  if (diffPct != null && marketAvg) {
    if (diffPct < -5) priceHint = { text: `Buen precio: ${diffPct.toFixed(0)}% vs red ($${marketAvg.toLocaleString("es-AR")}/kg)`, color: "#10b981" };
    else if (diffPct > 15) priceHint = { text: `Caro: +${diffPct.toFixed(0)}% vs red ($${marketAvg.toLocaleString("es-AR")}/kg)`, color: "#ef4444" };
    else if (diffPct > 5) priceHint = { text: `Algo caro: +${diffPct.toFixed(0)}% vs red ($${marketAvg.toLocaleString("es-AR")}/kg)`, color: "#f59e0b" };
    else priceHint = { text: `En línea con red ($${marketAvg.toLocaleString("es-AR")}/kg)`, color: "#10b981" };
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.material_code.trim()) throw new Error("Material requerido");
      if (priceNum <= 0) throw new Error("Precio/kg debe ser mayor a 0");

      // Reconstruir array completo
      const allPayloads = materials.map(materialToPayload);

      if (mode.kind === "edit") {
        const idx = materials.findIndex((m) => m.id === mode.id);
        if (idx >= 0) {
          const existing = allPayloads[idx];
          // Mantener resto de colores; si había uno, actualizarlo (primero); si no, agregarlo
          const newColor = form.color_name.trim() || form.color_hex
            ? [{
                color_name: form.color_name.trim(),
                color_hex: form.color_hex,
                activo: true,
                in_stock: form.in_stock,
              }]
            : [];
          allPayloads[idx] = {
            ...existing,
            material_code: form.material_code.trim().toUpperCase(),
            precio_hora: priceNum,
            in_stock: form.in_stock,
            colores: newColor.length ? newColor : existing.colores,
          };
        }
      } else {
        allPayloads.push({
          material_code: form.material_code.trim().toUpperCase(),
          activo: true,
          precio_hora: priceNum,
          in_stock: form.in_stock,
          allow_custom_color: false,
          trabajo_minimo_override: null,
          colores: form.color_name.trim() || form.color_hex
            ? [{
                color_name: form.color_name.trim(),
                color_hex: form.color_hex,
                activo: true,
                in_stock: form.in_stock,
              }]
            : [],
        });
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
        background: "rgba(0,0,0,.5)",
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
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--c3d-card-bg, #fff)",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 20px 50px rgba(0,0,0,.30)",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div style={{ font: "700 10px/1 Montserrat,sans-serif", textTransform: "uppercase", letterSpacing: ".18em", color: "hsl(220,80%,55%)" }}>
              {headerLabel}
            </div>
            <h2 style={{ font: "800 20px/1.2 Montserrat,sans-serif", margin: "6px 0 0", color: "var(--c3d-text-strong, hsl(220,30%,12%))" }}>
              {mode.kind === "edit" ? "Modificar material" : "Agregar material al catálogo"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, color: "hsl(220,10%,46%)" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Preview strip */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 12, borderRadius: 12, background: "var(--c3d-card-bg-alt, hsl(220,20%,98%))", border: "1px solid var(--c3d-card-border-soft, hsl(220,15%,90%))" }}>
          <div style={{ width: 60, height: 60, borderRadius: 12, background: form.color_hex, border: "1.5px solid rgba(0,0,0,.18)", boxShadow: "0 2px 6px rgba(0,0,0,.20)", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: "800 16px/1.2 Montserrat,sans-serif", color: "var(--c3d-text-strong, hsl(220,30%,12%))" }}>
              {form.material_code || "—"}
            </div>
            <div style={{ font: "500 13px/1.2 Montserrat,sans-serif", color: "var(--c3d-text-muted, hsl(220,10%,46%))", marginTop: 3 }}>
              {form.color_name || "Sin nombre de color"}
            </div>
            <span style={{ display: "inline-block", marginTop: 6, font: "700 10px/1 Montserrat,sans-serif", padding: "4px 8px", borderRadius: 999, background: form.in_stock ? "rgba(16,185,129,.15)" : "rgba(239,68,68,.15)", color: form.in_stock ? "#10b981" : "#ef4444" }}>
              {form.in_stock ? "Disponible" : "Sin stock"}
            </span>
          </div>
        </div>

        {/* material_code */}
        <div>
          <label style={{ font: "700 11px/1 Montserrat,sans-serif", textTransform: "uppercase", letterSpacing: ".14em", color: "var(--c3d-text-faint, hsl(220,10%,46%))", display: "block", marginBottom: 6 }}>
            Tipo de material
          </label>
          <select
            value={form.material_code}
            onChange={(e) => setForm((f) => ({ ...f, material_code: e.target.value }))}
            style={{ width: "100%", height: 40, borderRadius: 10, border: "1px solid var(--c3d-card-border, hsl(220,15%,84%))", padding: "0 10px", font: "500 14px Montserrat,sans-serif", background: "#fff" }}
          >
            {MATERIAL_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* color_name */}
        <div>
          <label style={{ font: "700 11px/1 Montserrat,sans-serif", textTransform: "uppercase", letterSpacing: ".14em", color: "var(--c3d-text-faint, hsl(220,10%,46%))", display: "block", marginBottom: 6 }}>
            Nombre del color (opcional)
          </label>
          <input
            type="text"
            value={form.color_name}
            onChange={(e) => setForm((f) => ({ ...f, color_name: e.target.value }))}
            placeholder="Negro, Rojo, Natural…"
            style={{ width: "100%", height: 40, borderRadius: 10, border: "1px solid var(--c3d-card-border, hsl(220,15%,84%))", padding: "0 12px", font: "500 14px Montserrat,sans-serif", background: "#fff" }}
          />
        </div>

        {/* Color picker */}
        <MaterialColorPicker
          selected={form.color_hex}
          onSelect={(hex) => setForm((f) => ({ ...f, color_hex: hex }))}
        />

        {/* Stock switch */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, background: "var(--c3d-card-bg-alt, hsl(220,20%,98%))", border: "1px solid var(--c3d-card-border-soft, hsl(220,15%,90%))" }}>
          <div>
            <div style={{ font: "700 13px/1.2 Montserrat,sans-serif", color: "var(--c3d-text-strong, hsl(220,30%,12%))" }}>
              Stock
            </div>
            <div style={{ font: "500 12px/1.3 Montserrat,sans-serif", color: "var(--c3d-text-muted, hsl(220,10%,46%))", marginTop: 2 }}>
              {form.in_stock ? "En stock — entra a cotizaciones" : "Sin stock — pausado"}
            </div>
          </div>
          <StockSwitch value={form.in_stock} onChange={(v) => setForm((f) => ({ ...f, in_stock: v }))} ariaLabel="Stock del material" />
        </div>

        {/* precio_kg */}
        <div>
          <label style={{ font: "700 11px/1 Montserrat,sans-serif", textTransform: "uppercase", letterSpacing: ".14em", color: "var(--c3d-text-faint, hsl(220,10%,46%))", display: "block", marginBottom: 6 }}>
            Precio/kg (ARS)
          </label>
          <input
            type="number"
            min="0"
            step="100"
            value={form.precio_kg}
            onChange={(e) => setForm((f) => ({ ...f, precio_kg: e.target.value }))}
            placeholder="5000"
            style={{ width: "100%", height: 40, borderRadius: 10, border: "1px solid var(--c3d-card-border, hsl(220,15%,84%))", padding: "0 12px", font: "600 14px Montserrat,sans-serif", background: "#fff" }}
          />
          {priceHint && (
            <div style={{ marginTop: 6, font: "600 11px/1.3 Montserrat,sans-serif", color: priceHint.color }}>
              {priceHint.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 6, borderTop: "1px solid var(--c3d-card-border-soft, hsl(220,15%,90%))" }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={saveMut.isPending}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
