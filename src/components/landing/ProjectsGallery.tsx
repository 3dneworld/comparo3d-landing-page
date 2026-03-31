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
      "Desde repuestos y accesorios útiles hasta hobby, makers y prototipos personales. La idea es que el usuario vea rápido que esta plataforma le sirve para casos reales.",
  },
  empresa: {
    eyebrow: "TIPOS DE TRABAJO",
    headline: "Qué tipo de proyectos coordinamos",
    support:
      "Desde piezas funcionales y validación de producto hasta series cortas y necesidades operativas con proveedores evaluados.",
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
      material: "Resina / PLA",
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
      material: "PLA / Resina",
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
    <section className="py-20 md:py-28 bg-background">
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
          {cards.map((project) => (
            <article
              key={project.title}
              className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-card-hover transition-shadow"
            >
              <div
                className={`relative h-44 border-b border-border overflow-hidden ${
                  project.emphasis
                    ? "bg-gradient-to-br from-primary/[0.08] via-background to-primary/[0.03]"
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
                        : "bg-background/85 text-muted-foreground border border-border"
                    }`}
                  >
                    {project.visualLabel}
                  </span>

                  <div
                    className={`w-14 h-14 rounded-2xl border flex items-center justify-center backdrop-blur-sm ${
                      project.emphasis
                        ? "bg-primary/10 border-primary/15 text-primary"
                        : "bg-background/80 border-border text-foreground/70"
                    }`}
                  >
                    <project.icon size={28} strokeWidth={2.1} />
                  </div>
                </div>

                <div className="absolute left-5 right-5 bottom-5 flex flex-wrap gap-2">
                  {project.cues.map((cue) => (
                    <span
                      key={cue}
                      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] text-muted-foreground bg-background/85 border border-border"
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

                <h3 className="mt-4 font-display text-xl font-semibold text-foreground leading-snug">
                  {project.title}
                </h3>

                <p className="mt-3 text-sm text-muted-foreground leading-relaxed min-h-[72px]">
                  {project.desc}
                </p>

                <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{project.material}</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
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
