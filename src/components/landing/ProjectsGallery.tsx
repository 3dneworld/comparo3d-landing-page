import type { LucideIcon } from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { StaggerChildren, StaggerItem } from "@/components/StaggerChildren";
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
import hogarImg from "@/assets/projects/hogar.png";
import hobbyImg from "@/assets/projects/hobby.png";

interface ProjectCard {
  category: string;
  categoryTone: string;
  title: string;
  desc: string;
  material: string;
  visualLabel: string;
  cues: string[];
  icon: LucideIcon;
  emphasis?: boolean;
  image?: string;
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
      visualLabel: "Caso frecuente",
      cues: ["uso cotidiano", "resolución rápida"],
      icon: Wrench,
      emphasis: true,
      image: hogarImg,
    },
    {
      category: "Hogar",
      categoryTone: "bg-primary/10 text-primary",
      title: "Accesorios útiles para casa y organización",
      desc: "Soportes, clips, bases y adaptadores pensados para ordenar, acomodar o mejorar espacios reales.",
      material: "PLA",
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
      visualLabel: "Muy pedido",
      cues: ["electrónica", "funcional"],
      icon: Cpu,
      emphasis: true,
    },
    {
      category: "Hobby",
      categoryTone: "bg-primary/10 text-primary",
      title: "Modelismo, hobby y proyectos personales",
      desc: "Componentes personalizados, detalles, adaptadores y piezas hechas para hobbies o ideas propias.",
      material: "PLA / PETG",
      visualLabel: "Proyecto personal",
      cues: ["detalle", "personalización"],
      icon: Puzzle,
      image: hobbyImg,
    },
    {
      category: "Personalizados",
      categoryTone: "bg-primary/10 text-primary",
      title: "Objetos personalizados y regalos",
      desc: "Piezas a medida para regalos, identidad simple de marca o ideas que no existen en catálogo.",
      material: "PLA",
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
      visualLabel: "Uso operativo",
      cues: ["funcional", "uso técnico"],
      icon: Settings2,
      emphasis: true,
    },
    {
      category: "Mantenimiento",
      categoryTone: "bg-primary/10 text-primary",
      title: "Repuestos de baja rotación",
      desc: "Piezas difíciles de conseguir o discontinuadas para sostener operación sin esperar importación.",
      material: "Nylon / PETG",
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
      visualLabel: "Desarrollo",
      cues: ["I+D", "validación"],
      icon: PencilRuler,
      emphasis: true,
    },
    {
      category: "Operaciones",
      categoryTone: "bg-primary/10 text-primary",
      title: "Utillajes y accesorios internos",
      desc: "Guías, fijaciones, soportes y soluciones puntuales para mejorar tareas de planta o taller.",
      material: "PETG / ABS",
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
      visualLabel: "Escalado",
      cues: ["plazo", "capacidad"],
      icon: Layers3,
    },
    {
      category: "Comercial",
      categoryTone: "bg-primary/10 text-primary",
      title: "Packaging, exhibición y activaciones",
      desc: "Piezas para exhibidores, soportes de producto o necesidades comerciales específicas.",
      material: "PLA / PETG",
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
    <section className="bg-background py-16 md:py-24">
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

        <StaggerChildren staggerDelay={0.1} className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((project) => (
            <StaggerItem key={project.title}>
            <article
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

                </div>

                {project.image && (
                  <img
                    src={project.image}
                    alt={project.title}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-[100px] w-auto shrink-0 object-contain drop-shadow-md"
                  />
                )}

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

                <div className="mt-5 flex items-center text-[12px] text-muted-foreground md:text-[13px]">
                  <span>{project.material}</span>
                </div>
              </div>
            </article>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
};

export default ProjectsGallery;
