import { COLOR_PALETTE, LIGHT_COLORS } from "../data/colorPalette";

export interface MaterialColorPickerProps {
  selected: string;
  onSelect: (hex: string) => void;
  label?: string;
}

export function MaterialColorPicker({
  selected,
  onSelect,
  label = "Color del filamento",
}: MaterialColorPickerProps) {
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(9,1fr)", gap: 5 }}>
        {COLOR_PALETTE.map((c) => {
          const sel = selected === c;
          const isLight = LIGHT_COLORS.has(c);
          return (
            <button
              key={c}
              type="button"
              title={c}
              onClick={() => onSelect(c)}
              style={{
                width: "100%",
                aspectRatio: "1",
                borderRadius: 7,
                background: c,
                cursor: "pointer",
                border: sel ? "2px solid hsl(220,70%,55%)" : "1px solid rgba(0,0,0,.11)",
                boxShadow: sel ? "0 0 0 3px hsl(220,70%,55%,.25)" : "none",
                position: "relative",
                transition: "transform .1s",
                transform: sel ? "scale(1.1)" : "scale(1)",
              }}
            >
              {sel && (
                <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg viewBox="0 0 12 12" style={{ width: 11, height: 11 }}>
                    <path d="M2 6l3 3 5-5" stroke={isLight ? "#292524" : "#fff"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
