import { ShieldCheck, Thermometer, Zap, Sparkles } from "lucide-react";
import { useAudience, type Audience } from "@/contexts/AudienceContext";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import plaImg from "@/assets/materials/PLA.png";
import petgImg from "@/assets/materials/PETG.png";
import absImg from "@/assets/materials/ABS-s-series.png";
import tpuImg from "@/assets/materials/TPU.png";
import nylonImg from "@/assets/materials/Nylon-new.png";
import pcImg from "@/assets/materials/PC.png";

type AttrKey = "Resistencia" | "Temperatura" | "Flexibilidad" | "Terminación";

interface MaterialRow {
  id: string;
  name: string;
  badge: string;
  image: string;
  accent: string;
  recommended?: boolean;
  specs: Record<AttrKey, string>;
  scale: Record<AttrKey, number>;
}

const sectionCopy: Record<Audience, { eyebrow: string; headline: string; support: string; footer: string }> = {
  particular: {
    eyebrow: "MATERIALES FDM",
    headline: "Compará materiales con criterio técnico",
    support: "Seis opciones, cuatro atributos. Una sola tabla, lectura horizontal por material.",
    footer: "¿No sabés cuál? Subí tu STL y los proveedores te recomiendan el más adecuado para tu pieza.",
  },
  empresa: {
    eyebrow: "CAPACIDADES DE MATERIAL",
    headline: "Materiales FDM que solemos coordinar",
    support: "Seis materiales, cuatro atributos clave. Selección final según el uso real, demanda técnica y plazo.",
    footer: "Si el proyecto requiere validación especial de material, tolerancia o desempeño, se revisa caso por caso con la red de proveedores.",
  },
};

const materials: MaterialRow[] = [
  {
    id: "PLA",
    name: "PLA",
    badge: "+ económico",
    image: plaImg,
    accent: "#e85a3a",
    specs: {
      Resistencia: "Media",
      Temperatura: "Hasta 50°C",
      Flexibilidad: "Baja",
      Terminación: "Muy buena",
    },
    scale: { Resistencia: 3, Temperatura: 1, Flexibilidad: 1, Terminación: 5 },
  },
  {
    id: "PETG",
    name: "PETG",
    badge: "Uso real y cotidiano",
    image: petgImg,
    accent: "#1f9d55",
    recommended: true,
    specs: {
      Resistencia: "Media / Alta",
      Temperatura: "Hasta 70°C",
      Flexibilidad: "Media",
      Terminación: "Buena",
    },
    scale: { Resistencia: 4, Temperatura: 3, Flexibilidad: 3, Terminación: 4 },
  },
  {
    id: "ABS",
    name: "ABS",
    badge: "Mayor exigencia",
    image: absImg,
    accent: "#1f4f8f",
    specs: {
      Resistencia: "Alta",
      Temperatura: "Hasta 87°C",
      Flexibilidad: "Baja",
      Terminación: "Buena",
    },
    scale: { Resistencia: 4, Temperatura: 4, Flexibilidad: 1, Terminación: 4 },
  },
  {
    id: "TPU",
    name: "TPU",
    badge: "Piezas flexibles",
    image: tpuImg,
    accent: "#a64bb8",
    specs: {
      Resistencia: "Media",
      Temperatura: "Hasta 60°C",
      Flexibilidad: "Alta",
      Terminación: "Media",
    },
    scale: { Resistencia: 3, Temperatura: 2, Flexibilidad: 5, Terminación: 3 },
  },
  {
    id: "Nylon",
    name: "Nylon",
    badge: "Más técnico",
    image: nylonImg,
    accent: "#0e1219",
    specs: {
      Resistencia: "Alta",
      Temperatura: "Hasta 100°C",
      Flexibilidad: "Media",
      Terminación: "Media",
    },
    scale: { Resistencia: 4, Temperatura: 4, Flexibilidad: 3, Terminación: 3 },
  },
  {
    id: "PC",
    name: "Policarbonato",
    badge: "Alta exigencia",
    image: pcImg,
    accent: "#4a5568",
    specs: {
      Resistencia: "Muy alta",
      Temperatura: "Hasta 111°C",
      Flexibilidad: "Baja",
      Terminación: "Buena",
    },
    scale: { Resistencia: 5, Temperatura: 5, Flexibilidad: 1, Terminación: 4 },
  },
];

const attrs: { key: AttrKey; label: string; Icon: typeof ShieldCheck }[] = [
  { key: "Resistencia", label: "Resistencia", Icon: ShieldCheck },
  { key: "Temperatura", label: "Temperatura", Icon: Thermometer },
  { key: "Flexibilidad", label: "Flexibilidad", Icon: Zap },
  { key: "Terminación", label: "Terminación", Icon: Sparkles },
];

const ScoreBars = ({ score, color }: { score: number; color: string }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className="h-2 flex-1 rounded-[3px]"
        style={{ background: i <= score ? color : "#edeef1" }}
      />
    ))}
  </div>
);

const MaterialsSection = () => {
  const { audience } = useAudience();
  const copy = sectionCopy[audience];

  return (
    <section id="materiales" className="scroll-mt-24 bg-muted/40 py-16 md:scroll-mt-28 md:py-24">
      <div className="container max-w-6xl">
        <AnimateOnScroll variant="fade-up">
          <div className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              {copy.eyebrow}
            </div>
            <h2 className="mt-3 text-[32px] font-bold leading-[1.08] tracking-[-0.01em] text-foreground md:text-[42px]">
              {copy.headline}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-[1.6] text-muted-foreground md:text-[17px]">
              {copy.support}
            </p>
          </div>
        </AnimateOnScroll>

        {/* Desktop / tablet: tabla volteada */}
        <AnimateOnScroll variant="fade-up">
          <div className="mx-auto hidden max-w-[1200px] overflow-hidden rounded-[20px] border border-border bg-card shadow-[0_1px_3px_rgba(22,29,43,0.06),0_4px_12px_rgba(22,29,43,0.04)] md:block">
            {/* Header row */}
            <div className="grid bg-[#fafbfc]" style={{ gridTemplateColumns: "320px repeat(4, 1fr)" }}>
              <div className="flex items-center px-6 py-5">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Material
                </span>
              </div>
              {attrs.map(({ key, label, Icon }) => (
                <div
                  key={key}
                  className="flex items-center gap-2 border-l border-[#e7e9ed] px-6 py-5"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon size={14} strokeWidth={2.2} />
                  </div>
                  <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Material rows */}
            {materials.map((m) => (
              <div
                key={m.id}
                className="grid border-t border-[#e7e9ed]"
                style={{
                  gridTemplateColumns: "320px repeat(4, 1fr)",
                  background: m.recommended
                    ? `linear-gradient(90deg, ${m.accent}10, transparent 60%)`
                    : "transparent",
                }}
              >
                {/* Identity column */}
                <div className="flex items-center gap-4 px-6 py-5">
                  <img
                    src={m.image}
                    alt={m.name}
                    className="h-16 w-16 shrink-0 object-contain"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-[22px] font-extrabold leading-none tracking-[-0.01em] text-foreground">
                        {m.name}
                      </div>
                      {m.recommended && (
                        <span
                          className="rounded-full px-1.5 py-[3px] text-[9px] font-bold uppercase tracking-[0.08em] text-white"
                          style={{ background: m.accent }}
                        >
                          El más elegido
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 text-[12px] leading-[1.45] text-muted-foreground">
                      {m.badge}
                    </div>
                  </div>
                </div>

                {/* Attribute cells */}
                {attrs.map(({ key }) => (
                  <div
                    key={key}
                    className="flex flex-col justify-center gap-2.5 border-l border-[#e7e9ed] px-6 py-5"
                  >
                    <ScoreBars score={m.scale[key]} color={m.accent} />
                    <div className="text-[13px] font-medium text-foreground">
                      {m.specs[key]}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </AnimateOnScroll>

        {/* Mobile: cards apilados con misma data */}
        <div className="mx-auto grid max-w-[560px] grid-cols-1 gap-4 md:hidden">
          {materials.map((m) => (
            <article
              key={m.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              style={{
                background: m.recommended
                  ? `linear-gradient(180deg, ${m.accent}0a, var(--card) 40%)`
                  : undefined,
              }}
            >
              <div className="flex items-center gap-4 border-b border-[#e7e9ed] px-5 py-4">
                <img
                  src={m.image}
                  alt={m.name}
                  className="h-14 w-14 shrink-0 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-[20px] font-extrabold leading-none tracking-[-0.01em] text-foreground">
                      {m.name}
                    </div>
                    {m.recommended && (
                      <span
                        className="rounded-full px-1.5 py-[3px] text-[9px] font-bold uppercase tracking-[0.08em] text-white"
                        style={{ background: m.accent }}
                      >
                        El más elegido
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[12px] leading-[1.4] text-muted-foreground">
                    {m.badge}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-4 px-5 py-4">
                {attrs.map(({ key, label, Icon }) => (
                  <div key={key} className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                      <Icon size={12} strokeWidth={2.2} className="text-primary" />
                      {label}
                    </div>
                    <ScoreBars score={m.scale[key]} color={m.accent} />
                    <div className="text-[12px] font-medium text-foreground">
                      {m.specs[key]}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-7 max-w-2xl text-center text-[13px] leading-[1.6] text-muted-foreground">
          {copy.footer}
        </div>
      </div>
    </section>
  );
};

export default MaterialsSection;
