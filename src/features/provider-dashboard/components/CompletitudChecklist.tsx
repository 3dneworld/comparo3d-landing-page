import { CheckCircle2, Circle } from "lucide-react";

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

  return (
    <section className="rounded-[1.25rem] border border-border/70 bg-white p-5 shadow-card" aria-label="Completitud del perfil">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">COMPLETITUD</p>
        <h2 className="mt-1 font-[Montserrat] text-lg font-extrabold tracking-tight text-foreground">
          {safeScore}% completo
        </h2>
      </header>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <span className="block h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${safeScore}%` }} />
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li
            key={item.key}
            data-complete={item.complete ? "true" : "false"}
            className="flex items-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-sm font-semibold data-[complete=true]:border-emerald-200 data-[complete=true]:bg-emerald-50 data-[complete=true]:text-emerald-800"
          >
            {item.complete ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
