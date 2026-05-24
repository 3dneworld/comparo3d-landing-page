import { Check, X } from "lucide-react";

export interface StockSwitchProps {
  value: boolean;
  onChange: (next: boolean) => void;
  size?: "sm" | "md";
  ariaLabel?: string;
}

export function StockSwitch({ value, onChange, size = "md", ariaLabel }: StockSwitchProps) {
  const w = size === "sm" ? 42 : 50;
  const h = size === "sm" ? 23 : 26;
  const dot = h - 7;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!value);
      }}
      style={{
        width: w,
        height: h,
        borderRadius: 99,
        border: "none",
        cursor: "pointer",
        flexShrink: 0,
        background: value ? "hsl(152,68%,40%)" : "rgba(255,255,255,.10)",
        boxShadow: value
          ? "0 0 0 1px hsl(152,70%,55%,.4), 0 4px 14px hsl(152,68%,40%,.35)"
          : "inset 0 0 0 1px rgba(255,255,255,.18)",
        position: "relative",
        transition: "all .2s",
      }}
    >
      <span
        style={{
          width: dot,
          height: dot,
          borderRadius: 99,
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,.35)",
          position: "absolute",
          top: 3,
          left: value ? w - dot - 3 : 3,
          transition: "left .2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {value ? (
          <Check size={dot - 7} color="hsl(152,68%,40%)" strokeWidth={3} />
        ) : (
          <X size={dot - 7} color="rgba(0,0,0,.45)" strokeWidth={3} />
        )}
      </span>
    </button>
  );
}
