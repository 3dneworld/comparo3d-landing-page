import { useMemo } from "react";
import { Upload, ClipboardList, BarChart3, PackageCheck, FileStack, ShieldCheck } from "lucide-react";
import { useAudience, type Audience } from "@/contexts/AudienceContext";

interface StepItem {
  step: string;
  title: string;
  desc: string;
  icon: typeof Upload;
}

const sectionCopy: Record<Audience, { eyebrow: string; title: string; support: string }> = {
  particular: {
    eyebrow: "PROCESO SIMPLE",
    title: "Cómo funciona",
    support: "Una secuencia clara: subís tu archivo, comparás opciones reales y elegís la propuesta que más te conviene.",
  },
  empresa: {
    eyebrow: "FLUJO OPERATIVO",
    title: "Cómo coordinamos un pedido empresa",
    support: "Un proceso más ordenado para centralizar requerimientos, propuesta, validación y ejecución sin dispersión operativa.",
  },
};

const stepsByAudience: Record<Audience, StepItem[]> = {
  particular: [
    {
      step: "Paso 1",
      title: "Subí tu archivo STL",
      desc: "Cargás la pieza, completás lo básico y dejás listo el pedido para cotizar.",
      icon: Upload,
    },
    {
      step: "Paso 2",
      title: "Compará opciones",
      desc: "Analiza propuestas de diferentes proveedores según precio, plazo y condiciones de entrega.",
      icon: BarChart3,
    },
    {
      step: "Paso 3",
      title: "Elegí la mejor",
      desc: "Seleccionás la opción para vos sin perder tiempo buscando por tu cuenta en cada proveedor.",
      icon: ClipboardList,
    },
    {
      step: "Paso 4",
      title: "Recibí tu pieza",
      desc: "Se coordina producción y entrega para cerrar el pedido con seguimiento claro.",
      icon: PackageCheck,
    },
  ],
  empresa: [
    {
      step: "Paso 1",
      title: "Compartí requerimiento y archivos",
      desc: "Recibimos el pedido, alcance técnico, cantidades y contexto de uso para ordenar la cotización.",
      icon: FileStack,
    },
    {
      step: "Paso 2",
      title: "Recibí propuesta consolidada",
      desc: "Centralizamos opciones y armamos una propuesta para evitar negociar proveedor por proveedor.",
      icon: BarChart3,
    },
    {
      step: "Paso 3",
      title: "Validá alcance y tiempos",
      desc: "Se define la mejor combinación entre factibilidad, plazo, materiales y condiciones operativas.",
      icon: ShieldCheck,
    },
    {
      step: "Paso 4",
      title: "Coordinamos producción y entrega",
      desc: "Ejecutamos el pedido con seguimiento consolidado y, si aplica, producción paralela coordinada.",
      icon: PackageCheck,
    },
  ],
};

const HowItWorks = () => {
  const { audience } = useAudience();
  const copy = sectionCopy[audience];
  const steps = useMemo(() => stepsByAudience[audience], [audience]);

  return (
    <section id="como-funciona" className="bg-background py-14 md:py-18">
      <div className="container max-w-7xl">
        <div className="mx-auto mb-10 max-w-3xl text-center md:mb-12">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary md:text-xs">
            {copy.eyebrow}
          </p>
          <h2 className="text-3xl font-bold leading-tight text-foreground md:text-4xl">
            {copy.title}
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-[15px] leading-relaxed text-muted-foreground md:text-[17px]">
            {copy.support}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
          {steps.map((step) => (
            <article
              key={step.title}
              className="group relative flex min-h-[250px] flex-col rounded-2xl border border-border bg-card px-5 py-5 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/18 hover:shadow-[0_14px_32px_-22px_rgba(37,99,235,0.22)] md:px-6 md:py-6"
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <span className="inline-flex items-center rounded-full border border-primary/14 bg-primary/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  {step.step}
                </span>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-[0_10px_24px_-16px_hsl(var(--primary)/0.6)]">
                  <step.icon size={22} className="text-primary-foreground" />
                </div>
              </div>

              <h3 className="text-[22px] font-semibold leading-[1.15] text-foreground md:text-[24px]">
                {step.title}
              </h3>

              <p className="mt-4 text-[14px] leading-[1.65] text-muted-foreground md:text-[15px]">
                {step.desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
