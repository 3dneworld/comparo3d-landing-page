import { CheckCircle, Lightbulb } from "lucide-react";

export function AntiBypassBanner() {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: "16px 18px",
        overflow: "hidden",
        position: "relative",
        background: "linear-gradient(135deg,hsl(220,70%,45%,.10),hsl(200,80%,50%,.04))",
        border: "1px solid hsl(220,70%,45%,.28)",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 18, alignItems: "center" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "hsl(220,70%,45%,.18)", color: "hsl(220,80%,65%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Lightbulb size={20} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle size={14} color="#10b981" />
            <span style={{ font: "700 11px/1 Montserrat,sans-serif", textTransform: "uppercase", letterSpacing: ".14em", color: "#10b981" }}>
              Stock declarado acá
            </span>
          </div>
          <div style={{ font: "600 13px/1.45 Montserrat,sans-serif", color: "var(--c3d-text-strong, hsl(220,30%,18%))" }}>
            Te permite aparecer en las cotizaciones de los clientes que seleccionaron los materiales que marcaste como disponibles
          </div>
        </div>
      </div>
    </div>
  );
}
