// ProfileIndustries.tsx — Chips "Ideal para" (industrias + tipos de proyecto combinados)
import type { ProviderDerived } from "../types";

interface Props {
  derived: ProviderDerived;
}

export function ProfileIndustries({ derived }: Props) {
  // Combinar y deduplicar ambas listas
  const chips = Array.from(
    new Set([...derived.industries_served, ...derived.project_types])
  );

  if (chips.length === 0) return null;

  return (
    <section
      aria-labelledby="industries-heading"
      className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
    >
      <h2
        id="industries-heading"
        className="mb-4 font-[Montserrat] text-lg font-bold text-foreground"
      >
        Ideal para
      </h2>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Sectores y tipos de trabajo
      </p>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.08] px-3.5 py-1.5 text-xs font-semibold text-primary"
          >
            {chip}
          </span>
        ))}
      </div>
    </section>
  );
}
