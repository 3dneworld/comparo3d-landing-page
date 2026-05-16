import AnimateOnScroll from "@/components/AnimateOnScroll";
import { StaggerChildren, StaggerItem } from "@/components/StaggerChildren";
import { useAudience, type Audience } from "@/contexts/AudienceContext";
import hogarImg from "@/assets/projects/hogar.png";
import hobbyImg from "@/assets/projects/hobby.png";
import prototypeImg from "@/assets/projects/prototype.png";
import customerPresentImg from "@/assets/projects/customer-present.png";
import makersImg from "@/assets/projects/makers.png";
import arreglosImg from "@/assets/projects/arreglos.png";

interface CaseRow {
  id: string;
  category: string;
  title: string;
  blurb: string;
  material: string;
  chips: string[];
  image: string;
  // Per-image fit tuning (the source PNGs have varying internal whitespace).
  fit: { maxWidth: string; maxHeight: number; padding: number };
}

const sectionCopy: Record<Audience, { headline: string; support: string }> = {
  particular: {
    headline: "Casos reales, no listas genéricas",
    support: "Seis usos típicos que vemos pasar por la red. Buscá el que se parezca a tu pieza.",
  },
  empresa: {
    headline: "Qué tipo de proyectos coordinamos",
    support: "Seis casos representativos: desde piezas funcionales y validación de producto hasta series cortas y necesidades operativas.",
  },
};

const cases: Record<Audience, CaseRow[]> = {
  particular: [
    {
      id: "repuestos",
      category: "Repuestos",
      title: "Repuestos para arreglos del día a día",
      blurb: "Piezas para reemplazar trabas, tapas, soportes o componentes difíciles de conseguir en el mercado.",
      material: "PETG",
      chips: ["uso cotidiano", "resolución rápida"],
      image: arreglosImg,
      fit: { maxWidth: "100%", maxHeight: 437, padding: 14 },
    },
    {
      id: "hogar",
      category: "Hogar",
      title: "Accesorios útiles para casa y organización",
      blurb: "Soportes, clips, bases y adaptadores pensados para ordenar, acomodar o mejorar espacios reales.",
      material: "PLA",
      chips: ["orden", "adaptación"],
      image: hogarImg,
      fit: { maxWidth: "100%", maxHeight: 418, padding: 14 },
    },
    {
      id: "makers",
      category: "Makers",
      title: "Carcasas y piezas para proyectos makers",
      blurb: "Cajas, tapas, montajes y piezas funcionales para electrónica, domótica o desarrollos propios.",
      material: "PETG / ABS",
      chips: ["electrónica", "funcional"],
      image: makersImg,
      fit: { maxWidth: "100%", maxHeight: 514, padding: 8 },
    },
    {
      id: "hobby",
      category: "Hobby",
      title: "Modelismo, hobby y proyectos personales",
      blurb: "Componentes personalizados, detalles, adaptadores y piezas hechas para hobbies o ideas propias.",
      material: "PLA / PETG",
      chips: ["detalle", "personalización"],
      image: hobbyImg,
      fit: { maxWidth: "96%", maxHeight: 414, padding: 18 },
    },
    {
      id: "regalos",
      category: "Personalizados",
      title: "Objetos personalizados y regalos",
      blurb: "Piezas a medida para regalos, identidad simple de marca o ideas que no existen en catálogo.",
      material: "PLA",
      chips: ["único", "a medida"],
      image: customerPresentImg,
      fit: { maxWidth: "88%", maxHeight: 550, padding: 12 },
    },
    {
      id: "prototipos",
      category: "Prototipos",
      title: "Primeras versiones para validar una idea",
      blurb: "Iteraciones para probar forma, encastre o tamaño antes de pasar a una versión más cerrada.",
      material: "PLA / PETG",
      chips: ["validación", "iteración"],
      image: prototypeImg,
      fit: { maxWidth: "96%", maxHeight: 360, padding: 16 },
    },
  ],
  empresa: [
    {
      id: "ingenieria",
      category: "Ingeniería",
      title: "Carcasas, soportes y piezas funcionales",
      blurb: "Componentes para uso real, integración de equipos o mejora de procesos internos.",
      material: "PETG / ABS",
      chips: ["funcional", "uso técnico"],
      image: makersImg,
      fit: { maxWidth: "100%", maxHeight: 514, padding: 8 },
    },
    {
      id: "mantenimiento",
      category: "Mantenimiento",
      title: "Repuestos de baja rotación",
      blurb: "Piezas difíciles de conseguir o discontinuadas para sostener operación sin esperar importación.",
      material: "Nylon / PETG",
      chips: ["continuidad", "reposición"],
      image: arreglosImg,
      fit: { maxWidth: "100%", maxHeight: 437, padding: 14 },
    },
    {
      id: "desarrollo",
      category: "Desarrollo",
      title: "Validación de producto y prototipos",
      blurb: "Iteraciones para validar forma, ensamble o presentación antes de entrar en fabricación.",
      material: "PLA / PETG",
      chips: ["I+D", "validación"],
      image: prototypeImg,
      fit: { maxWidth: "96%", maxHeight: 360, padding: 16 },
    },
    {
      id: "operaciones",
      category: "Operaciones",
      title: "Utillajes y accesorios internos",
      blurb: "Guías, fijaciones, soportes y soluciones puntuales para mejorar tareas de planta o taller.",
      material: "PETG / ABS",
      chips: ["eficiencia", "mejora interna"],
      image: hogarImg,
      fit: { maxWidth: "100%", maxHeight: 418, padding: 14 },
    },
    {
      id: "produccion",
      category: "Producción",
      title: "Series cortas coordinadas",
      blurb: "Producción distribuida cuando el proyecto exige plazo, volumen o respaldo operativo.",
      material: "Según aplicación",
      chips: ["plazo", "capacidad"],
      image: hobbyImg,
      fit: { maxWidth: "96%", maxHeight: 414, padding: 18 },
    },
    {
      id: "comercial",
      category: "Comercial",
      title: "Packaging, exhibición y activaciones",
      blurb: "Piezas para exhibidores, soportes de producto o necesidades comerciales específicas.",
      material: "PLA / PETG",
      chips: ["marca", "presentación"],
      image: customerPresentImg,
      fit: { maxWidth: "88%", maxHeight: 550, padding: 12 },
    },
  ],
};

const ProjectsGallery = () => {
  const { audience } = useAudience();
  const copy = sectionCopy[audience];
  const rows = cases[audience];

  return (
    <section className="bg-muted/40 py-16 md:py-24">
      <div className="container max-w-6xl">
        <AnimateOnScroll variant="fade-up">
          <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
            <h2 className="text-[36px] font-bold leading-[1.05] tracking-[-0.015em] text-foreground md:text-[52px]">
              {copy.headline}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-[1.55] text-muted-foreground md:text-[18px]">
              {copy.support}
            </p>
          </div>
        </AnimateOnScroll>

        <StaggerChildren staggerDelay={0.08} className="mx-auto flex max-w-[1200px] flex-col gap-6">
          {rows.map((c, i) => {
            const reverse = i % 2 === 1;
            return (
              <StaggerItem key={c.id}>
                <article
                  className={`flex flex-col overflow-hidden rounded-[20px] border border-border bg-card shadow-[0_1px_3px_rgba(22,29,43,0.04)] md:grid md:grid-cols-2 ${
                    reverse ? "md:[&>:first-child]:order-2" : ""
                  }`}
                >
                  {/* Image cell */}
                  <div
                    className="flex items-center justify-center bg-[#f7f8fa]"
                    style={{
                      minHeight: 280,
                      padding: c.fit.padding,
                    }}
                  >
                    <img
                      src={c.image}
                      alt={c.title}
                      className="object-contain md:!max-h-[var(--fit-h)] md:!max-w-[var(--fit-w)]"
                      style={{
                        maxWidth: "92%",
                        maxHeight: 260,
                        // CSS vars consumed only at md+ via the className above
                        ["--fit-w" as never]: c.fit.maxWidth,
                        ["--fit-h" as never]: `${c.fit.maxHeight}px`,
                      }}
                    />
                  </div>

                  {/* Copy cell */}
                  <div
                    className="flex min-h-[280px] flex-col justify-center gap-4 p-8 md:min-h-[420px] md:p-12"
                  >
                    <h3 className="text-[28px] font-bold leading-[1.1] tracking-[-0.015em] text-foreground md:text-[36px]">
                      {c.title}
                    </h3>

                    <p className="text-[15px] leading-[1.6] text-muted-foreground md:text-[16px]">
                      {c.blurb}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {c.chips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full bg-[#edeef1] px-3 py-[5px] text-[12px] font-medium text-muted-foreground"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center gap-4 border-t border-[#e7e9ed] pt-4 text-[12px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-muted-foreground">Categoría</span>
                        <span className="font-semibold text-foreground">{c.category}</span>
                      </div>
                      <span className="h-3 w-px bg-[#e7e9ed]" />
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-muted-foreground">Material</span>
                        <span className="font-semibold text-foreground">{c.material}</span>
                      </div>
                    </div>
                  </div>
                </article>
              </StaggerItem>
            );
          })}
        </StaggerChildren>
      </div>
    </section>
  );
};

export default ProjectsGallery;
