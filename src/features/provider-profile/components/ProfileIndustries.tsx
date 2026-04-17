// ProfileIndustries.tsx — Chips de industrias atendidas y tipos de proyecto
import { Badge } from "@/components/ui/badge";
import type { ProviderDerived } from "../types";

interface Props {
  derived: ProviderDerived;
}

export function ProfileIndustries({ derived }: Props) {
  const hasIndustries = derived.industries_served.length > 0;
  const hasTypes = derived.project_types.length > 0;

  if (!hasIndustries && !hasTypes) return null;

  return (
    <section
      aria-labelledby="industries-heading"
      className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
    >
      <h2
        id="industries-heading"
        className="mb-4 font-[Montserrat] text-lg font-bold text-foreground"
      >
        Sectores y tipos de trabajo
      </h2>
      <div className="space-y-4">
        {hasIndustries && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Industrias atendidas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {derived.industries_served.map((industry) => (
                <Badge
                  key={industry}
                  variant="secondary"
                  className="rounded-full text-[12px]"
                >
                  {industry}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {hasTypes && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Tipos de trabajo
            </p>
            <div className="flex flex-wrap gap-1.5">
              {derived.project_types.map((pt) => (
                <Badge
                  key={pt}
                  variant="secondary"
                  className="rounded-full text-[12px]"
                >
                  {pt}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
