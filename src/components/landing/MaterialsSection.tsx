import { Info, Droplets, Sparkles, ShieldCheck, Layers3, Wrench } from "lucide-react";
import { useAudience, type Audience } from "@/contexts/AudienceContext";

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
}

const sectionCopy: Record<Audience, { eyebrow: string; headline: string; support: string; footnote: string }> = {
  particular: {
    eyebrow: "MATERIALES MÁS PEDIDOS",
    headline: "Elegí el material correcto sin volverte técnico",
    support:
      "No necesitás saber de impresión 3D para pedir una cotización. Esta sección te orienta rápido sobre qué material suele servir mejor según el tipo de pieza.",
    footnote:
      "La recomendación final puede ajustarse según uso, tamaño, exigencia mecánica y terminación buscada.",
  },
  empresa: {
    eyebrow: "CAPACIDADES DE MATERIAL",
    headline: "Materiales que solemos coordinar según la necesidad",
    support:
      "Desde prototipado visual hasta piezas funcionales o series cortas. La selección final depende del uso real, la exigencia técnica y el plazo.",
    footnote:
      "Si el proyecto requiere un material o proceso específico, la validación se hace caso por caso con la red de proveedores.",
  },
};

const materialsByAudience: Record<Audience, MaterialCard[]> = {
  particular: [
    {
      name: "PLA",
      bestFor: "Ideal para empezar",
      useCases: "Objetos decorativos, prototipos simples, soportes livianos y piezas de uso moderado.",
      strengths: ["económico", "buena terminación", "rápido para cotizar"],
      caution: "No es la mejor opción si la pieza va a recibir calor o mucho esfuerzo.",
      finish: "Muy buena",
      flexibility: "Baja",
      resistance: "Media",
      gradientClass: "from-primary/[0.12] via-background to-primary/[0.03]",
    },
    {
      name: "PETG",
      bestFor: "Uso real y cotidiano",
      useCases: "Repuestos, soportes, adaptadores, accesorios de hogar y piezas que necesitan más aguante.",
      strengths: ["más resistente", "uso práctico", "buena relación precio"],
      caution: "Suele ser menos rígido y un poco menos prolijo que PLA en algunos acabados.",
      finish: "Buena",
      flexibility: "Media",
      resistance: "Media / Alta",
      gradientClass: "from-accent/[0.10] via-background to-accent/[0.03]",
    },
    {
      name: "ABS",
      bestFor: "Mayor exigencia",
      useCases: "Carcasas, piezas funcionales y componentes que pueden enfrentar calor o golpes.",
      strengths: ["soporta calor", "más técnico", "apto para función"],
      caution: "Su fabricación es más delicada y no siempre es la opción más conveniente para piezas comunes.",
      finish: "Buena",
      flexibility: "Baja",
      resistance: "Alta",
      gradientClass: "from-primary/[0.10] via-background to-primary/[0.02]",
    },
    {
      name: "Resina",
      bestFor: "Detalle fino",
      useCases: "Miniaturas, piezas visuales, joyería, dental o prototipos donde importa mucho el detalle.",
      strengths: ["altísima definición", "superficie lisa", "gran calidad visual"],
      caution: "No suele ser la opción ideal para piezas de uso duro o golpes frecuentes.",
      finish: "Excelente",
      flexibility: "Baja",
      resistance: "Baja / Media",
      gradientClass: "from-accent/[0.12] via-background to-accent/[0.04]",
    },
    {
      name: "TPU",
      bestFor: "Piezas flexibles",
      useCases: "Fundas, topes, juntas, suelas, agarres o piezas que necesitan doblarse sin romperse.",
      strengths: ["flexible", "absorbe impacto", "sirve para piezas blandas"],
      caution: "No es el material indicado si buscás rigidez o mucha precisión dimensional.",
      finish: "Buena",
      flexibility: "Alta",
      resistance: "Media",
      gradientClass: "from-primary/[0.08] via-background to-primary/[0.02]",
    },
    {
      name: "Nylon",
      bestFor: "Más técnico",
      useCases: "Engranajes, herramientas, piezas mecánicas y aplicaciones con mayor desgaste.",
      strengths: ["muy resistente", "durable", "mejor para exigencia"],
      caution: "No siempre es necesario para un proyecto común y suele tener mayor complejidad o costo.",
      finish: "Media",
      flexibility: "Media",
      resistance: "Alta",
      gradientClass: "from-accent/[0.09] via-background to-accent/[0.02]",
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
    },
    {
      name: "Resina",
      bestFor: "Alta definición",
      useCases: "Piezas de detalle, modelos de validación estética, salud, dental y componentes visuales finos.",
      strengths: ["gran precisión", "excelente detalle", "acabado superior"],
      caution: "No siempre es la elección correcta para piezas con trabajo mecánico intenso.",
      finish: "Excelente",
      flexibility: "Baja",
      resistance: "Baja / Media",
      gradientClass: "from-accent/[0.12] via-background to-accent/[0.04]",
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
      gradientClass: "from-primary/[0.08] via-background to-primary/[0.02]",
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
      gradientClass: "from-accent/[0.09] via-background to-accent/[0.02]",
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
    <section id="materiales" className="py-20 md:py-28 bg-muted/50">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-16">
          <p className="text-xs font-semibold text-primary uppercase tracking-[0.16em] mb-3">
            {copy.eyebrow}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            {copy.headline}
          </h2>
          <p className="mt-4 text-sm md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {copy.support}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {materials.map((material) => (
            <article
              key={material.name}
              className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-card-hover transition-shadow"
            >
              <div className={`relative h-32 bg-gradient-to-br ${material.gradientClass} border-b border-border`}>
                <div
                  className="absolute inset-0 opacity-[0.05]"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg width='22' height='22' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h22v22H0z' fill='none' stroke='%23000000' stroke-width='0.35'/%3E%3C/svg%3E\")",
                  }}
                />
                <div className="absolute inset-x-6 top-5 flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-background/90 text-muted-foreground border border-border">
                      {material.bestFor}
                    </span>
                    <h3 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
                      {material.name}
                    </h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-background/85 border border-border flex items-center justify-center text-primary shrink-0">
                    <Layers3 size={24} strokeWidth={2.1} />
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-sm text-muted-foreground leading-relaxed min-h-[72px]">
                  {material.useCases}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {material.strengths.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium bg-primary/8 text-primary border border-primary/10"
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
                        className="rounded-xl border border-border bg-muted/40 px-3 py-3 text-center"
                      >
                        <div className="flex items-center justify-center text-primary/80 mb-2">
                          <Icon size={16} strokeWidth={2.1} />
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-none">{property.label}</p>
                        <p className="mt-2 text-[12px] font-semibold text-foreground leading-tight">{value}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-xl border border-border bg-background px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    <Info size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-[12px] text-muted-foreground leading-relaxed">
                      {material.caution}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="max-w-4xl mx-auto mt-8 md:mt-10 rounded-2xl border border-border bg-card px-5 py-4 md:px-6 md:py-5">
          <div className="flex items-start gap-3">
            <Wrench size={18} className="text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              {copy.footnote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MaterialsSection;
