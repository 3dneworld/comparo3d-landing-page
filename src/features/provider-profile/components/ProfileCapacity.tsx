// ProfileCapacity.tsx — Capacidad técnica: cubo 3D CSS + stats laterales
import { Factory, Printer } from "lucide-react";
import type { ProviderCapacity } from "../types";

interface Props {
  capacity: ProviderCapacity;
}

export function ProfileCapacity({ capacity }: Props) {
  const { cama_max_mm, impresoras_declaradas, marcas } = capacity;
  const hasCama =
    cama_max_mm.x > 0 || cama_max_mm.y > 0 || cama_max_mm.z > 0;
  const hasMarcas = marcas && marcas.length > 0;
  const hasImpresoras =
    impresoras_declaradas != null && impresoras_declaradas > 0;

  if (!hasCama && !hasImpresoras && !hasMarcas) return null;

  // Estilos inline para el cubo 3D CSS — Tailwind no puede expresar
  // transform-style: preserve-3d ni los rotateX/Y/translateZ por cara.
  const cubeStyle: React.CSSProperties = {
    width: 140,
    height: 140,
    transformStyle: "preserve-3d",
    transform: "rotateX(-22deg) rotateY(-32deg)",
    margin: "14px auto 0",
    position: "relative",
  };

  const faceBase: React.CSSProperties = {
    position: "absolute",
    width: 140,
    height: 140,
    border: "1px solid hsl(var(--primary) / 0.4)",
    background: "hsl(var(--primary) / 0.06)",
  };

  const faces: { name: string; style: React.CSSProperties }[] = [
    { name: "fnt", style: { ...faceBase, transform: "translateZ(70px)", background: "hsl(var(--primary) / 0.10)" } },
    { name: "bck", style: { ...faceBase, transform: "rotateY(180deg) translateZ(70px)", background: "hsl(var(--primary) / 0.04)" } },
    { name: "lft", style: { ...faceBase, transform: "rotateY(-90deg) translateZ(70px)", background: "hsl(var(--primary) / 0.08)" } },
    { name: "rgt", style: { ...faceBase, transform: "rotateY(90deg) translateZ(70px)", background: "hsl(var(--primary) / 0.12)" } },
    { name: "top", style: { ...faceBase, transform: "rotateX(90deg) translateZ(70px)", background: "hsl(var(--primary) / 0.10)" } },
    { name: "bot", style: { ...faceBase, transform: "rotateX(-90deg) translateZ(70px)", background: "hsl(var(--primary) / 0.04)" } },
  ];

  return (
    <section
      aria-labelledby="capacity-heading"
      className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
    >
      <h2
        id="capacity-heading"
        className="mb-5 font-[Montserrat] text-lg font-bold text-foreground"
      >
        Capacidad técnica
      </h2>

      {/* cap-grid: cubo card (izq) + stats (der) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1.1fr_1fr] items-start">

        {/* Cube card */}
        {hasCama && (
          <div className="flex flex-col items-center gap-3 rounded-[18px] border border-border bg-muted/40 px-6 py-5">
            {/* Perspectiva del cubo */}
            <div
              style={{ perspective: 800, width: 180, height: 160 }}
              aria-hidden="true"
            >
              <div style={cubeStyle}>
                {faces.map((f) => (
                  <div key={f.name} style={f.style} />
                ))}
              </div>
            </div>

            {/* Dimensión */}
            <p className="font-[Montserrat] text-2xl font-bold tracking-tight text-foreground">
              {cama_max_mm.x} × {cama_max_mm.y} × {cama_max_mm.z}
              <small className="ml-1 text-[13px] font-medium text-muted-foreground">
                mm
              </small>
            </p>

            {/* Caption */}
            <p className="max-w-[240px] text-center text-xs font-medium leading-relaxed text-muted-foreground">
              Cama máxima del taller. Tu pieza tiene que entrar dentro de este
              cubo. Si es más grande, se imprime en partes y se ensambla.
            </p>
          </div>
        )}

        {/* Side stats */}
        {(hasImpresoras || hasMarcas) && (
          <div className="flex flex-col gap-4">
            {hasImpresoras && (
              <div className="flex items-center gap-3.5 rounded-[14px] border border-border p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Printer size={20} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
                    Impresoras declaradas
                  </p>
                  <p className="mt-0.5 font-[Montserrat] text-base font-bold text-foreground">
                    {impresoras_declaradas} unidades activas
                  </p>
                </div>
              </div>
            )}

            {hasMarcas && (
              <div className="flex items-center gap-3.5 rounded-[14px] border border-border p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Factory size={20} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
                    Marcas
                  </p>
                  <p className="mt-0.5 text-sm font-medium leading-relaxed text-foreground">
                    {marcas!.join(" · ")}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
