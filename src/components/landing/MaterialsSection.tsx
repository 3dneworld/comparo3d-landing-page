import { Info, Droplets, Sparkles, ShieldCheck, Layers3, Wrench } from "lucide-react";
import { useAudience, type Audience } from "@/contexts/AudienceContext";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import plaImg from "@/assets/materials/PLA.png";
import petgImg from "@/assets/materials/PETG.png";
import absImg from "@/assets/materials/ABS-s-series.png";
import tpuImg from "@/assets/materials/TPU.png";
import nylonImg from "@/assets/materials/Nylon-new.png";
import pcImg from "@/assets/materials/PC.png";

interface MaterialCard {
  name: string;
  bestFor: string;
  useCases: string;
  strengths: string[];
  caution: string;
  finish: string;
  flexibility: string;
  resistance: string;
  gradientClass: string;
  image?: string;
}

const sectionCopy: Record<Audience, { eyebrow: string; headline: string; support: string; footnote: string }> = {
  particular: {
    eyebrow: "MATERIALES DISPONIBLES",
    headline: "Materiales FDM para elegir con criterio",
    support:
      "Esta guía te ayuda a entender rápido qué material suele convenir según el tipo de pieza y su uso real.",
    footnote:
      "La recomendación final puede ajustarse según geometría, tamaño, exigencia mecánica, terminación buscada y factibilidad de fabricación.",
  },
  empresa: {
    eyebrow: "CAPACIDADES DE MATERIAL",
    headline: "Materiales FDM que solemos coordinar según la necesidad",
    support:
      "Desde prototipado visual hasta piezas funcionales y componentes de mayor exigencia. La selección final depende del uso real, la demanda técnica y el plazo.",
    footnote:
      "Si el proyecto requiere una validación especial de material, tolerancia o desempeño, se revisa caso por caso con la red de proveedores.",
  },
};

const materialsByAudience: Record<Audience, MaterialCard[]> = {
  particular: [
    {
      name: "PLA",
      bestFor: "Ideal para empezar",
      useCases: "Objetos decorativos, prototipos simples, soportes livianos y piezas de uso moderado.",
      strengths: ["económico", "buen acabado", "rígido"],
      caution: "No es la mejor opción si la pieza va a recibir calor o mucho esfuerzo.",
      finish: "Muy buena",
      flexibility: "Baja",
      resistance: "Media",
      gradientClass: "from-primary/[0.12] via-background to-primary/[0.03]",
      image: plaImg,
    },
    {
      name: "PETG",
      bestFor: "Uso real y cotidiano",
      useCases: "Repuestos, soportes, accesorios de hogar y piezas que necesitan más aguante.",
      strengths: ["más resistente", "uso práctico", "durabilidad"],
      caution: "Suele ser menos rígido y un poco menos prolijo que PLA en algunos acabados.",
      finish: "Buena",
      flexibility: "Media",
      resistance: "Media / Alta",
      gradientClass: "from-accent/[0.10] via-background to-accent/[0.03]",
      image: petgImg,
    },
    {
      name: "ABS",
      bestFor: "Mayor exigencia",
      useCases: "Carcasas, piezas funcionales y componentes que pueden enfrentar calor o golpes.",
      strengths: ["soporta 87°C", "más técnico", "+ posproceso"],
      caution: "Considerar la contracción del material al imprimir.",
      finish: "Buena",
      flexibility: "Baja",
      resistance: "Alta",
      gradientClass: "from-primary/[0.10] via-background to-primary/[0.02]",
      image: absImg,
    },
    {
      name: "TPU",
      bestFor: "Piezas flexibles",
      useCases: "Fundas, topes, juntas, agarres o piezas que necesitan doblarse sin romperse.",
      strengths: ["flexible", "amortiguación", "antideslizante"],
      caution: "No es el material indicado si buscás rigidez o mucha precisión dimensional.",
      finish: "Buena",
      flexibility: "Alta",
      resistance: "Media",
      gradientClass: "from-accent/[0.12] via-background to-accent/[0.04]",
      image: tpuImg,
    },
    {
      name: "Nylon",
      bestFor: "Más técnico",
      useCases: "Engranajes, herramientas, piezas mecánicas y aplicaciones con mayor desgaste.",
      strengths: ["muy resistente", "durable", "flexible"],
      caution: "No siempre es necesario para un proyecto común y suele tener mayor costo.",
      finish: "Media",
      flexibility: "Media",
      resistance: "Alta",
      gradientClass: "from-primary/[0.08] via-background to-primary/[0.02]",
      image: nylonImg,
    },
    {
      name: "Policarbonato",
      bestFor: "Alta exigencia",
      useCases: "Piezas funcionales exigentes, carcasas robustas y alto desempeño.",
      strengths: ["muy resistente", "soporta 111°C", "más robusto"],
      caution: "Sólo para los casos en los que requiera soportar alto impacto y el costo lo justifique.",
      finish: "Buena",
      flexibility: "Baja",
      resistance: "Muy alta",
      gradientClass: "from-accent/[0.09] via-background to-accent/[0.02]",
      image: pcImg,
    },
  ],
  empresa: [
    {
      name: "PLA",
      bestFor: "Prototipado visual",
      useCases: "Maquetas, validación formal, presentación comercial y pruebas de forma de bajo costo.",
      strengths: ["económico", "rápido", "muy buena terminación"],
      caution: "No conviene para piezas con calor, esfuerzo o uso operacional intenso.",
      finish: "Muy buena",
      flexibility: "Baja",
      resistance: "Media",
      gradientClass: "from-primary/[0.12] via-background to-primary/[0.03]",
      image: plaImg,
    },
    {
      name: "PETG",
      bestFor: "Uso funcional general",
      useCases: "Soportes, repuestos, piezas funcionales, accesorios internos y soluciones operativas.",
      strengths: ["versátil", "resistente", "buena relación costo/prestación"],
      caution: "No reemplaza automáticamente materiales industriales específicos en todos los casos.",
      finish: "Buena",
      flexibility: "Media",
      resistance: "Media / Alta",
      gradientClass: "from-accent/[0.10] via-background to-accent/[0.03]",
      image: petgImg,
    },
    {
      name: "ABS",
      bestFor: "Exigencia térmica",
      useCases: "Carcasas técnicas, piezas funcionales y componentes con mayor demanda térmica.",
      strengths: ["más técnico", "resiste calor", "apto para función"],
      caution: "La viabilidad depende del diseño, geometría y requerimientos de fabricación.",
      finish: "Buena",
      flexibility: "Baja",
      resistance: "Alta",
      gradientClass: "from-primary/[0.10] via-background to-primary/[0.02]",
      image: absImg,
    },
    {
      name: "TPU",
      bestFor: "Componentes flexibles",
      useCases: "Juntas, topes, protección, grip, piezas blandas o componentes que absorben impacto.",
      strengths: ["flexible", "amortigua", "resuelve casos específicos"],
      caution: "Su uso depende mucho de tolerancias y del comportamiento esperado en servicio.",
      finish: "Buena",
      flexibility: "Alta",
      resistance: "Media",
      gradientClass: "from-accent/[0.12] via-background to-accent/[0.04]",
      image: tpuImg,
    },
    {
      name: "Nylon",
      bestFor: "Mayor exigencia mecánica",
      useCases: "Engranajes, utillajes, piezas de desgaste y componentes con demanda mecánica superior.",
      strengths: ["muy durable", "alto desempeño", "más técnico"],
      caution: "No todos los proyectos necesitan Nylon; conviene cuando la exigencia lo justifica.",
      finish: "Media",
      flexibility: "Media",
      resistance: "Alta",
      gradientClass: "from-primary/[0.08] via-background to-primary/[0.02]",
      image: nylonImg,
    },
    {
      name: "Policarbonato",
      bestFor: "Desempeño superior",
      useCases: "Piezas funcionales exigentes, componentes robustos y casos donde temperatura y resistencia pesan más que el costo o la simplicidad.",
      strengths: ["muy robusto", "mejor temperatura", "alto desempeño"],
      caution: "Se reserva para casos donde la exigencia lo justifica. No es la opción por defecto para todos los proyectos.",
      finish: "Buena",
      flexibility: "Baja",
      resistance: "Muy alta",
      gradientClass: "from-accent/[0.09] via-background to-accent/[0.02]",
      image: pcImg,
    },
  ],
};

const propertyItems = [
  { label: "Terminación", key: "finish", icon: Sparkles },
  { label: "Flexibilidad", key: "flexibility", icon: Droplets },
  { label: "Resistencia", key: "resistance", icon: ShieldCheck },
] as const;

const MaterialsSection = () => {
  const { audience } = useAudience();
  const copy = sectionCopy[audience];
  const materials = materialsByAudience[audience];

  return (
    <section id="materiales" className="scroll-mt-24 bg-muted/50 py-16 md:scroll-mt-28 md:py-24">
      <div className="container">
        <AnimateOnScroll variant="fade-up">
          <div className="mx-auto mb-10 max-w-3xl text-center md:mb-12">
            <h2 className="text-[32px] font-bold leading-[1.08] text-foreground md:text-[42px]">
              {copy.headline}
            </h2>

            <p className="mx-auto mt-5 max-w-3xl text-[16px] leading-[1.7] text-muted-foreground md:text-[18px]">
              {copy.support}
            </p>
          </div>
        </AnimateOnScroll>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => (
            <div key={material.name} className="h-full">
            <article
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/14 hover:shadow-[0_14px_32px_-22px_rgba(37,99,235,0.18)]"
            >
              <div className={`relative h-[160px] border-b border-border bg-gradient-to-br ${material.gradientClass}`}>
                <div
                  className="absolute inset-0 opacity-[0.05]"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg width='22' height='22' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h22v22H0z' fill='none' stroke='%23000000' stroke-width='0.35'/%3E%3C/svg%3E\")",
                  }}
                />

                <div className="relative flex h-full items-center justify-between gap-3 px-6 py-5">
                   <div className="min-w-0 flex-1 translate-y-[22px]">
                     <span className="inline-flex items-center rounded-full border border-border bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                       {material.bestFor}
                     </span>
                     <h3 className="mt-3 text-[28px] font-bold tracking-tight text-foreground md:text-[32px]">
                       {material.name}
                     </h3>
                   </div>
                    {material.image && (
                      <img
                        src={material.image}
                        alt={material.name}
                        className={`shrink-0 object-contain drop-shadow-md ${
                          material.name === "Nylon"
                            ? "max-h-[156px]"
                            : material.name === "Policarbonato"
                            ? "max-h-[96px]"
                            : "max-h-[120px]"
                        } ${
                          material.name === "PLA" ? "translate-y-[10px]" : ""
                        } ${
                          material.name === "PETG" ? "translate-y-[10px]" : ""
                        } ${
                          material.name === "ABS" ? "translate-y-[10px]" : ""
                        } ${
                          material.name === "TPU" ? "translate-y-[10px]" : ""
                        } ${
                          material.name === "Nylon" ? "translate-y-[15px]" : ""
                        } ${
                          material.name === "Policarbonato" ? "translate-x-6 translate-y-[22px]" : ""
                        }`}
                      />
                    )}
                 </div>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <p className="min-h-[76px] text-[14px] leading-[1.7] text-muted-foreground md:text-[15px]">
                  {material.useCases}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {material.strengths.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center justify-center rounded-full border border-primary/10 bg-primary/8 px-2.5 py-1 text-[11px] font-medium text-primary"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {propertyItems.map((property) => {
                    const Icon = property.icon;
                    const value = material[property.key];

                    return (
                      <div
                        key={property.label}
                        className="flex flex-col items-center gap-1 rounded-xl border border-border bg-muted/40 px-2 py-2.5 text-center"
                      >
                        <Icon size={20} strokeWidth={2.1} className="shrink-0 text-primary/80" />
                        <p className="text-[10px] leading-none text-muted-foreground">{property.label}</p>
                        <p className="text-[12px] font-semibold leading-tight text-foreground">{value}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-xl border border-border bg-background px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    <Info size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                    <p className="text-[12px] leading-relaxed text-muted-foreground">{material.caution}</p>
                  </div>
                </div>
              </div>
            </article>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default MaterialsSection;
