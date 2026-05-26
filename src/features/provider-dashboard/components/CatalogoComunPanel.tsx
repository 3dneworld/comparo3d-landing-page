import { Plus } from "lucide-react";

import { CATALOG_PRESETS, type CatalogPreset } from "../data/catalogPresets";
import { DashboardPanel } from "./DashboardPanel";

export interface CatalogoComunPanelProps {
  existingNames: string[];
  marketAverages: Record<string, number | undefined>;
  onPick: (preset: CatalogPreset, avgPrice: number) => void;
}

export function CatalogoComunPanel({ existingNames, marketAverages, onPick }: CatalogoComunPanelProps) {
  const existing = new Set(existingNames.map((name) => name.toUpperCase()));
  const missing = CATALOG_PRESETS.filter((p) => !existing.has(p.name.toUpperCase()));
  if (missing.length === 0) return null;

  return (
    <DashboardPanel
      eyebrow="STOCK FULL"
      title="Sumá materiales con un clic"
      description="Estos son los filamentos que faltan para completar el stock full. Los colores se seleccionan al sumar cada material."
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
        {missing.map((p) => {
          const avg = marketAverages[p.name] ?? p.avg_price_fallback;
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => onPick(p, avg)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                padding: "14px 10px",
                borderRadius: 12,
                cursor: "pointer",
                background: "var(--c3d-card-bg-alt, hsl(220,20%,98%))",
                border: "1px dashed var(--c3d-card-border, hsl(220,15%,84%))",
                transition: "all .15s",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ font: "700 12px/1 Montserrat,sans-serif", color: "var(--c3d-text-strong, hsl(220,30%,12%))" }}>{p.name}</div>
                <div style={{ font: "600 10px/1.2 Montserrat,sans-serif", color: "var(--c3d-text-muted, hsl(220,10%,56%))", marginTop: 3 }}>
                  ≈ ${avg.toLocaleString("es-AR")}/hora
                </div>
              </div>
              <span style={{ font: "700 10px/1 Montserrat,sans-serif", color: "hsl(220,80%,65%)", display: "flex", alignItems: "center", gap: 3 }}>
                <Plus size={11} /> SUMAR
              </span>
            </button>
          );
        })}
      </div>
    </DashboardPanel>
  );
}
