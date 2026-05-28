import { CheckCircle2, ListChecks, Minus } from "lucide-react";

export interface ChecklistItem {
  key: string;
  label: string;
  complete: boolean;
}

export function CompletitudChecklist({
  score,
  items,
}: {
  score: number;
  items: ChecklistItem[];
}) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score || 0)));
  const barColor = safeScore >= 80 ? "bg-emerald-500" : "bg-amber-500";

  return (
    <section className="overflow-hidden rounded-[17px] border border-[var(--c3d-card-border)] bg-[var(--c3d-card-bg)] shadow-[var(--c3d-card-shadow)]" aria-label="Completitud del perfil">
      <header className="flex items-center gap-3 border-b border-[var(--c3d-card-border-soft)] px-5 pb-[11px] pt-4">
        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-primary/10 text-primary">
          <ListChecks className="h-[18px] w-[18px]" />
        </div>
        <div>
          <p className="font-[Montserrat] text-[10px] font-extrabold uppercase leading-none tracking-[0.18em] text-[hsl(220,80%,65%)]">
            COMPLETITUD
          </p>
          <h2 className="mt-1.5 font-[Montserrat] text-[16px] font-bold leading-[1.2] text-[var(--c3d-text-strong)]">
            {safeScore}% completado
          </h2>
        </div>
      </header>
      <div className="px-5 pb-[18px] pt-[14px]">
        <div className="h-2 overflow-hidden rounded-full bg-white/90">
          <span className={`block h-full rounded-full transition-[width] ${barColor}`} style={{ width: `${safeScore}%` }} />
        </div>
        <ul className="mt-4 divide-y divide-[var(--c3d-card-border-soft)]">
          {items.map((item) => (
            <li
              key={item.key}
              data-complete={item.complete ? "true" : "false"}
              className="group flex items-center gap-2.5 py-3 text-[13px] font-semibold text-[var(--c3d-text-muted)] data-[complete=true]:text-[var(--c3d-text-strong)]"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] bg-white/[0.04] text-[var(--c3d-text-faint)] group-data-[complete=true]:bg-emerald-500/20 group-data-[complete=true]:text-emerald-400">
                {item.complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
              </span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
