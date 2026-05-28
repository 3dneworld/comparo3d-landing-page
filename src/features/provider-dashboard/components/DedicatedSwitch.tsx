import { Power } from "lucide-react";

import { cn } from "@/lib/utils";

interface DedicatedSwitchProps {
  value: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
}

export function DedicatedSwitch({ value, onChange, ariaLabel, disabled = false }: DedicatedSwitchProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={value}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={cn(
        "relative inline-flex h-[46px] w-[82px] shrink-0 items-center rounded-full border p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
        value
          ? "border-emerald-400 bg-gradient-to-b from-emerald-400 to-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.16)]"
          : "border-slate-300 bg-slate-200/70",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full bg-white text-muted-foreground shadow-sm transition-transform",
          value && "translate-x-9 text-emerald-600"
        )}
      >
        <Power className="h-4 w-4" />
      </span>
    </button>
  );
}
