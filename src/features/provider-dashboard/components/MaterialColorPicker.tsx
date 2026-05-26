import { Check } from "lucide-react";

import { QUOTE_COLOR_OPTIONS } from "../data/catalogPresets";

export interface MaterialColorPickerProps {
  selected: string[];
  onToggle: (colorName: string) => void;
  label?: string;
}

export function MaterialColorPicker({
  selected,
  onToggle,
  label = "Colores disponibles",
}: MaterialColorPickerProps) {
  const selectedSet = new Set(selected.map((name) => name.toLowerCase()));

  return (
    <div>
      <div
        style={{
          font: "700 11px/1 Montserrat,sans-serif",
          textTransform: "uppercase",
          letterSpacing: ".14em",
          color: "var(--c3d-text-faint, hsl(220,10%,46%))",
          marginBottom: 9,
        }}
      >
        {label}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(58px,1fr))", gap: "24px 8px" }}>
        {QUOTE_COLOR_OPTIONS.map((c) => {
          const sel = selectedSet.has(c.value.toLowerCase());
          const isLight = c.value === "Blanco" || c.value === "Amarillo";
          return (
            <button
              key={c.value}
              type="button"
              aria-pressed={sel}
              aria-label={`${c.value} ${sel ? "seleccionado" : "no seleccionado"}`}
              title={c.value}
              onClick={() => onToggle(c.value)}
              style={{
                width: "100%",
                aspectRatio: "1",
                borderRadius: 10,
                background: c.hex,
                cursor: "pointer",
                border: sel ? "2px solid hsl(220,70%,55%)" : `1.5px solid ${c.border}`,
                boxShadow: sel ? "0 0 0 3px hsl(220,70%,55%,.25)" : "0 1px 5px rgba(0,0,0,.18)",
                position: "relative",
                transition: "transform .1s",
                transform: sel ? "translateY(-1px)" : "none",
              }}
            >
              {sel && (
                <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={20} color={isLight ? "#111827" : "#fff"} strokeWidth={3} />
                </span>
              )}
              <span
                style={{
                  position: "absolute",
                  left: 3,
                  right: 3,
                  bottom: -17,
                  font: "700 8.5px/1 Montserrat,sans-serif",
                  color: "var(--c3d-text-muted, hsl(220,10%,56%))",
                  textTransform: "uppercase",
                  textAlign: "center",
                }}
              >
                {c.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
