import type { LucideIcon } from "lucide-react";
import {
  Cpu,
  Factory,
  Gift,
  Home,
  Layers3,
  Package2,
  PencilRuler,
  Puzzle,
  Settings2,
  Wrench,
} from "lucide-react";
import { useAudience, type Audience } from "@/contexts/AudienceContext";

interface ProjectCard {
  category: string;
  categoryTone: string;
  title: string;
  desc: string;
  material: string;
  piecesLabel: string;
  visualLabel: string;
  cues: string[];
  icon: LucideIcon;
  emphasis?: boolean;
}

const sectionCopy: Record<Audience, { eyebrow: string; headline: string; support: string }> = {
  particular: {
    eyebrow: "CASOS DE USO FRECUENTES",
    headline: "Qué tipo de piezas podés cotizar",
    support:
      "Desde repuestos y accesorios útiles hasta makers, hobby y prototipos personales.",
  },
  empresa: {
    eyebrow: "TIPOS DE TRABAJO",
    headline: "Qué tipo de proyectos coordinamos",
    support:
      "Desde piezas funcionales y validación de producto hasta series cortas y necesidades operativas con una red evaluada.",
  },
};

const projectCards: Record<Audience, ProjectCard[]> = {
  particular: [
    {
      category: "Repuestos",
      categoryTone: "bg-primary/10 text-primary",
      title: "Repuestos para arreglos del día a día",
      desc: "Piezas para reemplazar trabas, tapas, soportes o componentes difíciles de conseguir en el mercado.",
      material: "PETG",
      piecesLabel: "1 a 2 piezas",
      visualLabel: "Caso frecuente",
      cues: ["uso cotidiano", "resolución rápida"],
      icon: Wrench,
      emphasis: true,
    },
    {
      category: "Hogar",
      categoryTone: "bg-accent/10 text-accent",
      title: "Accesorios útiles para casa y organización",
      desc: "Soportes, clips, bases y adaptadores pensados para ordenar, acomodar o mejorar espacios reales.",
      material: "PLA",
      piecesLabel: "1 a 6 piezas",
      visualLabel: "Uso práctico",
      cues: ["orden", "adaptación"],
      icon: Home,
    },
    {
      category: "Makers",
      categoryTone: "bg-primary/10 text-primary",
      title: "Carcasas y piezas para proyectos makers",
      desc: "Cajas, tapas, montajes y piezas funcionales para electrónica, domótica o desarrollos propios.",
      material: "PETG / ABS",
      piecesLabel: "1 a 4 piezas",
      visualLabel: "Muy pedido",
      cues: ["electrónica", "funcional"],
      icon: Cpu,
      emphasis: true,
    },
    {
      category: "Hobby",
      categoryTone: "bg-accent/10 text-accent",
      title: "Modelismo, hobby y proyectos personales",
      desc: "Componentes personalizados, detalles, adaptadores y piezas hechas para hobbies o ideas propias.",
      material: "PLA / PETG",
      piecesLabel: "1 a 12 piezas",
      visualLabel: "Proyecto personal",
      cues: ["detalle", "personalización"],
      icon: Puzzle,
    },
    {
      category: "Personalizados",
      categoryTone: "bg-accent/10 text-accent",
      title: "Objetos personalizados y regalos",
      desc: "Piezas a medida para regalos, identidad simple de marca o ideas que no existen en catálogo.",
      material: "PLA",
      piecesLabel: "1 a 10 piezas",
      visualLabel: "Hecho a pedido",
      cues: ["único", "a medida"],
      icon: Gift,
    },
    {
      category: "Prototipos",
      categoryTone: "bg-primary/10 text-primary",
      title: "Primeras versiones para validar una idea",
      desc: "Iteraciones para probar forma, encastre o tamaño antes de pasar a una versión más cerrada.",
      material: "PLA / PETG",
      piecesLabel: "1 a 3 versiones",
      visualLabel: "Primeras pruebas",
      cues: ["validación", "iteración"],
      icon: PencilRuler,
    },
  ],
  empresa: [
    {
      category: "Ingeniería",
      categoryTone: "bg-primary/10 text-primary",
      title: "Carcasas, soportes y piezas funcionales",
      desc: "Componentes para uso real, integración de equipos o mejora de procesos internos.",
      material: "PETG / ABS",
      piecesLabel: "1 a 50 piezas",
      visualLabel: "Uso operativo",
      cues: ["funcional", "uso técnico"],
      icon: Settings2,
      emphasis: true,
    },
    {
      category: "Mantenimiento",
      categoryTone: "bg-accent/10 text-accent",
      title: "Repuestos de baja rotación",
      desc: "Piezas difíciles de conseguir o discontinuadas para sostener operación sin esperar importación.",
      material: "Nylon / PETG",
      piecesLabel: "1 a 20 piezas",
      visualLabel: "Reposición",
      cues: ["continuidad", "reposición"],
      icon: Wrench,
    },
    {
      category: "Desarrollo",
      categoryTone: "bg-primary/10 text-primary",
      title: "Validación de producto y prototipos",
      desc: "Iteraciones para validar forma, ensamble o presentación antes de entrar en fabricación.",
      material: "PLA / PETG",
      piecesLabel: "1 a 10 piezas",
      visualLabel: "Desarrollo",
      cues: ["I+D", "validación"],
      icon: PencilRuler,
      emphasis: true,
    },
    {
      category: "Operaciones",
      categoryTone: "bg-accent/10 text-accent",
      title: "Utillajes y accesorios internos",
      desc: "Guías, fijaciones, soportes y soluciones puntuales para mejorar tareas de planta o taller.",
      material: "PETG / ABS",
      piecesLabel: "1 a 30 piezas",
      visualLabel: "Proceso interno",
      cues: ["eficiencia", "mejora interna"],
      icon: Factory,
    },
    {
      category: "Producción",
      categoryTone: "bg-primary/10 text-primary",
      title: "Series cortas coordinadas",
      desc: "Producción distribuida cuando el proyecto exige plazo, volumen o respaldo operativo.",
      material: "Según aplicación",
      piecesLabel: "10 a 100+ piezas",
      visualLabel: "Escalado",
      cues: ["plazo", "capacidad"],
      icon: Layers3,
    },
    {
      category: "Comercial",
      categoryTone: "bg-accent/10 text-accent",
      title: "Packaging, exhibición y activaciones",
      desc: "Piezas para exhibidores, soportes de producto o necesidades comerciales específicas.",
      material: "PLA / PETG",
      piecesLabel: "5 a 200 piezas",
      visualLabel: "Frente comercial",
      cues: ["marca", "presentación"],
      icon: Package2,
    },
  ],
};

const ProjectsGallery = () => {
  const { audience } = useAudience();
  const copy = sectionCopy[audience];
  const cards = projectCards[audience];

  return (
    <section className="bg-background py-14 md:py-18">
      <div className="container">
        <div className="mx-auto mb-10 max-w-3xl text-center md:mb-12">
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-primary md:text-[13px]">
            {copy.eyebrow}
          </p>

          <h2 className="text-[32px] font-bold leading-[1.08] text-foreground md:text-[42px]">
            {copy.headline}
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-[16px] leading-[1.7] text-muted-foreground md:text-[18px]">
            {copy.support}
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((project) => (
            <article
              key={project.title}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/14 hover:shadow-[0_14px_32px_-22px_rgba(37,99,235,0.18)]"
            >
              <div
                className={`relative h-40 overflow-hidden border-b border-border ${
                  project.emphasis
                    ? "bg-gradient-to-br from-primary/[0.08] via-background to-primary/[0.025]"
                    : "bg-gradient-to-br from-muted/70 via-background to-muted/35"
                }`}
              >
                <div
                  className="absolute inset-0 opacity-[0.05]"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg width='22' height='22' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h22v22H0z' fill='none' stroke='%23000000' stroke-width='0.35'/%3E%3C/svg%3E\")",
                  }}
                />

                <div className="absolute inset-x-5 top-5 flex items-start justify-between gap-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] ${
                      project.emphasis
                        ? "bg-primary/10 text-primary"
                        : "border border-border bg-background/85 text-muted-foreground"
                    }`}
                  >
                    {project.visualLabel}
                  </span>

                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-sm ${
                      project.emphasis
                        ? "border-primary/15 bg-primary/10 text-primary"
                        : "border-border bg-background/80 text-foreground/70"
                    }`}
                  >
                    <project.icon size={28} strokeWidth={2.1} />
                  </div>
                </div>

                <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-2">
                  {project.cues.map((cue) => (
                    <span
                      key={cue}
                      className="inline-flex items-center rounded-full border border-border bg-background/85 px-2.5 py-1 text-[11px] text-muted-foreground"
                    >
                      {cue}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-6">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.03em] ${project.categoryTone}`}
                >
                  {project.category}
                </span>

                <h3 className="mt-4 text-[22px] font-semibold leading-[1.18] text-foreground md:text-[24px]">
                  {project.title}
                </h3>

                <p className="mt-3 min-h-[72px] text-[14px] leading-[1.7] text-muted-foreground md:text-[15px]">
                  {project.desc}
                </p>

                <div className="mt-5 flex items-center gap-3 text-[12px] text-muted-foreground md:text-[13px]">
                  <span>{project.material}</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span>{project.piecesLabel}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectsGallery;
