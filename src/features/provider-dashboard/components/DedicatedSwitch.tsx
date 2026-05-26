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
        "relative inline-flex h-10 w-[72px] shrink-0 items-center rounded-full border p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
        value
          ? "border-emerald-300 bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]"
          : "border-border/80 bg-muted",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full bg-white text-muted-foreground shadow-sm transition-transform",
          value && "translate-x-8 text-emerald-600"
        )}
      >
        <Power className="h-4 w-4" />
      </span>
    </button>
  );
}
