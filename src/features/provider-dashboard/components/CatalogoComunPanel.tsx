import { Plus } from "lucide-react";
import { CATALOG_PRESETS, type CatalogPreset } from "../data/catalogPresets";
import { DashboardPanel } from "./DashboardPanel";

export interface CatalogoComunPanelProps {
  existingNames: string[];
  marketAverages: Record<string, number | undefined>;
  onPick: (preset: CatalogPreset, avgPrice: number) => void;
}

export function CatalogoComunPanel({ existingNames, marketAverages, onPick }: CatalogoComunPanelProps) {
  const missing = CATALOG_PRESETS.filter((p) => !existingNames.includes(p.name));
  if (missing.length === 0) return null;

  return (
    <DashboardPanel
      eyebrow="CATÁLOGO COMÚN"
      title="Sumá materiales con un clic"
      description="Pre-cargado con tipo, color común y precio promedio de la red. Ajustás stock y listo."
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 9 }}>
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
                padding: "13px 8px",
                borderRadius: 12,
                cursor: "pointer",
                background: "var(--c3d-card-bg-alt, hsl(220,20%,98%))",
                border: "1px dashed var(--c3d-card-border, hsl(220,15%,84%))",
                transition: "all .15s",
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: p.color_hex, border: "1.5px solid rgba(0,0,0,.12)", boxShadow: "0 1px 4px rgba(0,0,0,.15)" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ font: "700 12px/1 Montserrat,sans-serif", color: "var(--c3d-text-strong, hsl(220,30%,12%))" }}>{p.name}</div>
                <div style={{ font: "600 10px/1.2 Montserrat,sans-serif", color: "var(--c3d-text-muted, hsl(220,10%,56%))", marginTop: 3 }}>≈ ${avg.toLocaleString("es-AR")}/kg</div>
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
