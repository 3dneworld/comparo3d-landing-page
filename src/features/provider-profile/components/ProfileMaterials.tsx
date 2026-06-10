// ProfileMaterials.tsx — Sección dedicada de materiales del proveedor
import { ArrowRight } from "lucide-react";
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

export function ProfileMaterials({ capacity }: Props) {
  const { materiales_activos } = capacity;

  if (!materiales_activos || materiales_activos.length === 0) return null;

  return (
    <section
      aria-labelledby="materials-heading"
      className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
    >
      {/* Panel head */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2
          id="materials-heading"
          className="font-[Montserrat] text-lg font-bold text-foreground"
        >
          Materiales
        </h2>
        <a
          href="https://comparo3d.com.ar/#materiales"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver guía de materiales
          <ArrowRight size={14} aria-hidden="true" />
        </a>
      </div>

      {/* Materials grid — Fase 0: tarjetas simples por código */}
      {/* Fase 1: enriquecer con color_count/attributes desde capacity.materiales */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {materiales_activos.map((code) => (
          <div
            key={code}
            className="flex items-center gap-3 rounded-[14px] border border-border p-3 transition-colors hover:border-primary/40"
          >
            {/* Placeholder de ícono / imagen — Fase 1 reemplaza esto */}
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-[11px] font-bold text-primary"
              aria-hidden="true"
            >
              {matLabel(code).slice(0, 4)}
            </div>
            <div>
              <p className="font-[Montserrat] text-sm font-bold tracking-tight text-foreground">
                {matLabel(code)}
              </p>
              {/* Fase 1: agregar color_count y attributes acá */}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
