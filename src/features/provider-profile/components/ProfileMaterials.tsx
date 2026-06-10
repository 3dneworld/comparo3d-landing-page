// ProfileMaterials.tsx — Sección dedicada de materiales del proveedor
import { ArrowRight } from "lucide-react";
import type { MaterialDetail, ProviderCapacity } from "../types";

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

// Tarjeta enriquecida — usa MaterialDetail del backend
function DetailCard({ item }: { item: MaterialDetail }) {
  const colorText =
    typeof item.color_count === "number" && item.color_count > 0
      ? item.color_count === 1
        ? "1 color"
        : `${item.color_count} colores`
      : null;

  return (
    <div className="flex flex-col gap-2 rounded-[14px] border border-border p-3 transition-colors hover:border-primary/40">
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-[11px] font-bold text-primary"
          aria-hidden="true"
        >
          {item.label.slice(0, 4)}
        </div>
        <div>
          <p className="font-[Montserrat] text-sm font-bold tracking-tight text-foreground">
            {item.label}
          </p>
          {colorText && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{colorText}</p>
          )}
        </div>
      </div>
      {item.attributes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.attributes.map((attr) => (
            <span
              key={attr}
              className="rounded-full border border-primary/20 bg-primary/[0.08] px-2 py-0.5 text-[11px] text-primary"
            >
              {attr}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Tarjeta simple — fallback cuando no hay detail (solo código)
function SimpleCard({ code }: { code: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-border p-3 transition-colors hover:border-primary/40">
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
      </div>
    </div>
  );
}

export function ProfileMaterials({ capacity }: Props) {
  const { materiales, materiales_activos } = capacity;

  // Prefiero la lista detallada; si está vacía o ausente, caigo al listado plano
  const useDetail = Array.isArray(materiales) && materiales.length > 0;
  const hasFallback = Array.isArray(materiales_activos) && materiales_activos.length > 0;

  if (!useDetail && !hasFallback) return null;

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {useDetail
          ? materiales!.map((item) => <DetailCard key={item.code} item={item} />)
          : materiales_activos!.map((code) => <SimpleCard key={code} code={code} />)}
      </div>
    </section>
  );
}
