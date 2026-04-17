// ProfileRankingCard.tsx — Explicación visual de por qué aparece destacado
import { useState } from "react";
import { RankingExplainer } from "@/components/shared/RankingExplainer";
import type { ProviderRanking, PublicProviderBadge } from "../types";

interface Props {
  ranking: ProviderRanking;
  badges: PublicProviderBadge[];
}

const MODE_LABEL: Record<string, string> = {
  bootstrap: "Bootstrap",
  production: "Producción",
};

export function ProfileRankingCard({ ranking, badges }: Props) {
  const hasTrust = badges.some(
    (b) => b.type === "seleccion_fundador" || b.type === "certificado_organico"
  );
  const [explainerOpen, setExplainerOpen] = useState(false);

  if (!hasTrust) return null;

  const modeLabel = ranking.mode ? (MODE_LABEL[ranking.mode] ?? ranking.mode) : null;
  const modeDesc =
    ranking.mode === "bootstrap"
      ? "proveedor en etapa inicial de reputación en la plataforma"
      : "proveedor con historial consolidado en Comparo3D";

  return (
    <section
      className="rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm"
      aria-label="Información de ranking del proveedor"
    >
      <h2 className="mb-3 font-[Montserrat] text-base font-bold text-foreground">
        ¿Por qué aparece destacado?
      </h2>
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        {badges.some((b) => b.type === "seleccion_fundador") && (
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0">·</span>
            <span>
              Su trayectoria fue verificada por el equipo fundador de 3D NeWorld.
            </span>
          </li>
        )}
        {badges.some((b) => b.type === "certificado_organico") && (
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0">·</span>
            <span>
              Alcanzó la certificación orgánica por historial de calidad y volumen.
            </span>
          </li>
        )}
        {ranking.sr_score != null && (
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0">·</span>
            <span>
              Puntaje de ranking actual:{" "}
              <span className="font-semibold text-foreground">
                {ranking.sr_score}/100
              </span>
              {modeLabel && (
                <span className="text-muted-foreground">
                  {" "}— modo {modeLabel}
                  {modeDesc ? ` (${modeDesc})` : ""}
                </span>
              )}
            </span>
          </li>
        )}
        <li className="flex gap-2">
          <span className="mt-0.5 shrink-0">·</span>
          <span>
            El ranking combina trayectoria, precio, capacidad técnica, calidad y
            volumen de pedidos. Ningún proveedor puede comprar su posición.
          </span>
        </li>
      </ul>
      <button
        type="button"
        onClick={() => setExplainerOpen(true)}
        className="mt-4 text-[13px] font-medium text-primary transition-colors hover:text-primary/80"
      >
        Cómo funciona el ranking →
      </button>

      {/* Reutilizamos RankingExplainer; renderizamos como dialog controlado */}
      {explainerOpen && (
        <RankingExplainer
          onMediationClick={() => setExplainerOpen(false)}
        />
      )}
    </section>
  );
}
