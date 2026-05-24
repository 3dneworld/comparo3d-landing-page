import { Edit, History, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";

import { StockSwitch } from "./StockSwitch";

const STALE_THRESHOLD_DAYS = 14;

export interface MaterialCardProps {
  id: number;
  material_code: string;
  color_hex: string;
  color_name: string;
  in_stock: boolean;
  last_confirmed_at: string | null;
  precio_kg: number;
  activo: boolean;
  market_avg?: number;
  onEdit: () => void;
  onToggleStock: (next: boolean) => void;
}

function daysSince(iso: string | null): number {
  if (!iso) return 999;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return 999;
  return Math.floor((Date.now() - ts) / (24 * 3600 * 1000));
}

function fmtDaysAgo(d: number): string {
  if (d === 0) return "hoy";
  if (d === 1) return "ayer";
  if (d < 7) return `hace ${d} días`;
  if (d < 30) return `hace ${Math.floor(d / 7)} sem.`;
  return `hace ${Math.floor(d / 30)} meses`;
}

function fmtCurrency(v: number): string {
  return `$${v.toLocaleString("es-AR")}`;
}

export function MaterialCard(props: MaterialCardProps) {
  const days = daysSince(props.last_confirmed_at);
  const stale = props.in_stock && days >= STALE_THRESHOLD_DAYS;
  const diff = props.market_avg ? ((props.precio_kg - props.market_avg) / props.market_avg) * 100 : 0;

  const edgeColor = !props.activo
    ? "rgba(255,255,255,.10)"
    : !props.in_stock
    ? "rgba(239,68,68,.55)"
    : stale
    ? "rgba(245,158,11,.65)"
    : "hsl(152,68%,50%)";

  return (
    <div
      style={{
        position: "relative",
        background: "var(--c3d-card-bg, #fff)",
        borderRadius: 16,
        padding: "16px 16px 16px 19px",
        border: `1px solid var(--c3d-card-border, ${props.activo ? "hsl(220,15%,88%)" : "hsl(220,15%,92%)"})`,
        boxShadow: "var(--c3d-card-shadow, 0 1px 4px rgba(0,0,0,.04))",
        opacity: props.activo ? 1 : 0.55,
        display: "flex",
        flexDirection: "column",
        gap: 13,
        overflow: "hidden",
      }}
    >
      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: edgeColor }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 12,
            flexShrink: 0,
            background: props.color_hex,
            border: "1.5px solid rgba(0,0,0,.18)",
            boxShadow: "0 2px 6px rgba(0,0,0,.22)",
            opacity: props.in_stock ? 1 : 0.35,
            filter: props.in_stock ? "none" : "grayscale(.4)",
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: "700 15px/1.2 Montserrat,sans-serif", color: "var(--c3d-text-strong, hsl(220,30%,12%))" }}>
            {props.material_code}
          </div>
          <div style={{ font: "500 12px/1 Montserrat,sans-serif", color: "var(--c3d-text-muted, hsl(220,10%,56%))", marginTop: 3 }}>
            {props.color_name || "—"}
          </div>
          <div style={{ marginTop: 7, display: "flex", gap: 5, flexWrap: "wrap" }}>
            <span style={{ font: "700 10px/1 Montserrat,sans-serif", padding: "4px 8px", borderRadius: 999, background: props.activo ? "rgba(16,185,129,.15)" : "rgba(255,255,255,.05)", color: props.activo ? "#10b981" : "var(--c3d-text-muted, hsl(220,10%,56%))" }}>
              {props.activo ? "Activo" : "Inactivo"}
            </span>
            {stale && (
              <span style={{ font: "700 10px/1 Montserrat,sans-serif", padding: "4px 8px", borderRadius: 999, background: "rgba(245,158,11,.15)", color: "#f59e0b", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={10} /> Desactualizado
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "12px 13px",
          borderRadius: 12,
          background: props.in_stock ? (stale ? "rgba(245,158,11,.08)" : "rgba(16,185,129,.08)") : "rgba(255,255,255,.025)",
          border: `1px solid ${props.in_stock ? (stale ? "rgba(245,158,11,.30)" : "rgba(16,185,129,.25)") : "var(--c3d-card-border-soft, rgba(0,0,0,.08))"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: "700 10px/1 Montserrat,sans-serif", textTransform: "uppercase", letterSpacing: ".14em", color: props.in_stock ? (stale ? "#f59e0b" : "#10b981") : "var(--c3d-text-faint, hsl(220,10%,46%))" }}>
            Stock
          </div>
          <div style={{ font: "800 15px/1.2 Montserrat,sans-serif", marginTop: 4, color: props.in_stock ? "var(--c3d-text-strong, hsl(220,30%,12%))" : "var(--c3d-text-muted, hsl(220,10%,56%))" }}>
            {props.in_stock ? "Disponible" : "Sin stock"}
          </div>
          <div style={{ font: "500 11px/1.3 Montserrat,sans-serif", marginTop: 3, color: stale ? "#f59e0b" : "var(--c3d-text-muted, hsl(220,10%,56%))", display: "flex", alignItems: "center", gap: 4 }}>
            {stale ? <AlertTriangle size={11} /> : <History size={11} />}
            {stale ? `Confirmá — sin actualizar ${fmtDaysAgo(days)}` : `Confirmado ${fmtDaysAgo(days)}`}
          </div>
        </div>
        <StockSwitch value={props.in_stock} onChange={props.onToggleStock} ariaLabel={`Stock de ${props.material_code} ${props.color_name}`} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ font: "700 10px/1 Montserrat,sans-serif", textTransform: "uppercase", letterSpacing: ".14em", color: "var(--c3d-text-faint, hsl(220,10%,46%))" }}>
            Precio/kg
          </div>
          <div style={{ font: "800 16px/1 Montserrat,sans-serif", color: "var(--c3d-text-strong, hsl(220,30%,12%))", marginTop: 3 }}>
            {fmtCurrency(props.precio_kg)}
          </div>
          {props.market_avg && (
            <div style={{ font: "500 10.5px/1.3 Montserrat,sans-serif", color: Math.abs(diff) > 10 ? (diff > 0 ? "#ef4444" : "#10b981") : "var(--c3d-text-muted, hsl(220,10%,56%))", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}>
              {diff > 5 ? <TrendingUp size={11} /> : diff < -5 ? <TrendingDown size={11} /> : <Minus size={11} />}
              {diff > 0 ? "+" : ""}{diff.toFixed(0)}% vs red · {fmtCurrency(props.market_avg)}
            </div>
          )}
        </div>
        <button type="button" onClick={props.onEdit} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 8, border: "1px solid var(--c3d-card-border, hsl(220,15%,88%))", background: "var(--c3d-card-bg, #fff)", font: "600 12px/1 Montserrat,sans-serif", color: "var(--c3d-text-strong, hsl(220,30%,12%))", cursor: "pointer" }}>
          <Edit size={13} /> Editar
        </button>
      </div>
    </div>
  );
}
