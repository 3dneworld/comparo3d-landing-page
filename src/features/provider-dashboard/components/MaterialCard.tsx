import { Check, Edit, Minus, TrendingDown, TrendingUp } from "lucide-react";

import { QUOTE_COLOR_OPTIONS } from "../data/catalogPresets";
import type { DashboardMaterialColor } from "../types";
import { StockSwitch } from "./StockSwitch";

export interface MaterialCardProps {
  id: number;
  material_code: string;
  in_stock: boolean;
  precio_hora: number;
  activo: boolean;
  colores: DashboardMaterialColor[];
  market_avg?: number;
  onEdit: () => void;
  onToggleMaterial: (next: boolean) => void;
  onToggleColor: (colorName: string, next: boolean) => void;
}

function fmtCurrency(v: number): string {
  return `$${v.toLocaleString("es-AR")}`;
}

function colorIsInStock(colores: DashboardMaterialColor[], colorName: string): boolean {
  const match = colores.find((c) => c.color_name?.toLowerCase() === colorName.toLowerCase());
  return Boolean(match?.activo) && Boolean(match?.in_stock);
}

export function MaterialCard(props: MaterialCardProps) {
  const diff = props.market_avg ? ((props.precio_hora - props.market_avg) / props.market_avg) * 100 : 0;
  const edgeColor = !props.activo
    ? "rgba(255,255,255,.10)"
    : props.in_stock
      ? "hsl(152,68%,50%)"
      : "rgba(239,68,68,.55)";

  return (
    <div
      style={{
        position: "relative",
        background: "var(--c3d-card-bg, #fff)",
        borderRadius: 14,
        padding: "18px 18px 18px 22px",
        border: "1px solid var(--c3d-card-border, hsl(220,15%,88%))",
        boxShadow: "var(--c3d-card-shadow, 0 1px 4px rgba(0,0,0,.04))",
        opacity: props.activo ? 1 : 0.55,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
        gap: 18,
        overflow: "hidden",
      }}
    >
      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: edgeColor }} />

      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div style={{ font: "800 20px/1.1 Montserrat,sans-serif", color: "var(--c3d-text-strong, hsl(220,30%,12%))" }}>
            {props.material_code}
          </div>
          <div style={{ font: "600 12px/1.4 Montserrat,sans-serif", color: "var(--c3d-text-muted, hsl(220,10%,56%))", marginTop: 6 }}>
            {props.in_stock ? "Disponible en cotizaciones" : "Pausado para cotizaciones"}
          </div>
        </div>

        <div
          style={{
            padding: "12px 13px",
            borderRadius: 12,
            background: props.in_stock ? "rgba(16,185,129,.08)" : "rgba(255,255,255,.025)",
            border: `1px solid ${props.in_stock ? "rgba(16,185,129,.25)" : "var(--c3d-card-border-soft, rgba(0,0,0,.08))"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ font: "700 10px/1 Montserrat,sans-serif", textTransform: "uppercase", letterSpacing: ".14em", color: props.in_stock ? "#10b981" : "var(--c3d-text-faint, hsl(220,10%,46%))" }}>
              Disponible
            </div>
            <div style={{ font: "800 15px/1.2 Montserrat,sans-serif", marginTop: 4, color: props.in_stock ? "var(--c3d-text-strong, hsl(220,30%,12%))" : "var(--c3d-text-muted, hsl(220,10%,56%))" }}>
              {props.in_stock ? "Con stock" : "Sin stock"}
            </div>
          </div>
          <StockSwitch value={props.in_stock} onChange={props.onToggleMaterial} ariaLabel={`Disponibilidad de ${props.material_code}`} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
          <div>
            <div style={{ font: "700 10px/1 Montserrat,sans-serif", textTransform: "uppercase", letterSpacing: ".14em", color: "var(--c3d-text-faint, hsl(220,10%,46%))" }}>
              Precio / hora
            </div>
            <div style={{ font: "800 18px/1 Montserrat,sans-serif", color: "var(--c3d-text-strong, hsl(220,30%,12%))", marginTop: 4 }}>
              {fmtCurrency(props.precio_hora)}
            </div>
            {props.market_avg ? (
              <div style={{ font: "600 11px/1.35 Montserrat,sans-serif", color: Math.abs(diff) > 10 ? (diff > 0 ? "#ef4444" : "#10b981") : "var(--c3d-text-muted, hsl(220,10%,56%))", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                {diff > 5 ? <TrendingUp size={12} /> : diff < -5 ? <TrendingDown size={12} /> : <Minus size={12} />}
                {diff > 0 ? "+" : ""}{diff.toFixed(0)}% vs promedio · {fmtCurrency(props.market_avg)}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={props.onEdit}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              borderRadius: 8,
              border: "1px solid var(--c3d-card-border, hsl(220,15%,88%))",
              background: "var(--c3d-card-bg-alt, #fff)",
              font: "700 12px/1 Montserrat,sans-serif",
              color: "var(--c3d-text-strong, hsl(220,30%,12%))",
              cursor: "pointer",
            }}
          >
            <Edit size={13} /> Editar
          </button>
        </div>
      </div>

      <div>
        <div style={{ font: "700 10px/1 Montserrat,sans-serif", textTransform: "uppercase", letterSpacing: ".14em", color: "var(--c3d-text-faint, hsl(220,10%,46%))", marginBottom: 10 }}>
          Colores disponibles
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(58px,1fr))", gap: "22px 9px" }}>
          {QUOTE_COLOR_OPTIONS.map((color) => {
            const selected = props.in_stock && colorIsInStock(props.colores, color.value);
            const isLight = color.value === "Blanco" || color.value === "Amarillo";
            return (
              <button
                key={color.value}
                type="button"
                aria-pressed={selected}
                aria-label={`${color.value} disponible`}
                title={color.value}
                onClick={() => props.onToggleColor(color.value, !selected)}
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  minHeight: 48,
                  borderRadius: 10,
                  border: selected ? "2px solid hsl(220,70%,58%)" : `1.5px solid ${color.border}`,
                  background: color.hex,
                  cursor: "pointer",
                  opacity: selected ? 1 : 0.38,
                  boxShadow: selected ? "0 0 0 3px hsl(220,70%,55%,.22)" : "0 1px 5px rgba(0,0,0,.16)",
                  position: "relative",
                }}
              >
                {selected ? (
                  <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={20} color={isLight ? "#111827" : "#fff"} strokeWidth={3} />
                  </span>
                ) : null}
                <span
                  style={{
                    position: "absolute",
                    left: 2,
                    right: 2,
                    bottom: -17,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    font: "700 8.5px/1 Montserrat,sans-serif",
                    color: "var(--c3d-text-muted, hsl(220,10%,56%))",
                    textTransform: "uppercase",
                    textAlign: "center",
                  }}
                >
                  {color.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
