// ProfileCapacity.tsx — Métricas de capacidad: cama, impresoras, materiales
import { Box, Layers, Printer } from "lucide-react";
import type { ProviderCapacity } from "../types";

interface Props {
  capacity: ProviderCapacity;
}

const MATERIAL_LABELS: Record<string, string> = {
  pla: "PLA",
  petg: "PETG",
  abs: "ABS",
  nylon: "Nylon",
  tpu: "TPU",
  asa: "ASA",
  resin: "Resina",
  resin_standard: "Resina Estándar",
  resin_tough: "Resina Rígida",
  carbon_fiber: "Fibra de Carbono",
  flexible: "Flexible",
};

function matLabel(code: string): string {
  return MATERIAL_LABELS[code.toLowerCase()] ?? code.toUpperCase();
}

export function ProfileCapacity({ capacity }: Props) {
  const { cama_max_mm, impresoras_declaradas, materiales_activos } = capacity;
  const hasCama =
    cama_max_mm.x > 0 || cama_max_mm.y > 0 || cama_max_mm.z > 0;
  const hasMateriales = materiales_activos && materiales_activos.length > 0;
  const hasImpresoras =
    impresoras_declaradas != null && impresoras_declaradas > 0;

  if (!hasCama && !hasMateriales && !hasImpresoras) return null;

  return (
    <section
      aria-labelledby="capacity-heading"
      className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
    >
      <h2
        id="capacity-heading"
        className="mb-4 font-[Montserrat] text-lg font-bold text-foreground"
      >
        Capacidad técnica
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {hasCama && (
          <div className="flex gap-3">
            <Box
              size={20}
              className="mt-0.5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Cama máxima
              </p>
              <p className="mt-0.5 font-[Montserrat] text-base font-bold text-foreground">
                {cama_max_mm.x}×{cama_max_mm.y}×{cama_max_mm.z}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  mm
                </span>
              </p>
            </div>
          </div>
        )}
        {hasImpresoras && (
          <div className="flex gap-3">
            <Printer
              size={20}
              className="mt-0.5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Impresoras
              </p>
              <p className="mt-0.5 font-[Montserrat] text-base font-bold text-foreground">
                {impresoras_declaradas}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  declaradas
                </span>
              </p>
            </div>
          </div>
        )}
        {hasMateriales && (
          <div className="flex gap-3">
            <Layers
              size={20}
              className="mt-0.5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Materiales
              </p>
              <p className="mt-1 text-sm font-medium text-foreground leading-relaxed">
                {materiales_activos!.map(matLabel).join(" · ")}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
