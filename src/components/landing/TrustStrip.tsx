import { ShieldCheck, Lock, Truck, BarChart3, Layers, Users } from "lucide-react";
import { useAudience, type Audience } from "@/contexts/AudienceContext";
import type { LucideIcon } from "lucide-react";

interface TrustCard {
  icon: LucideIcon;
  label: string;
  desc: string;
  priority?: boolean;
}

const headerContent: Record<Audience, { eyebrow: string; headline: string; support: string }> = {
  particular: {
    eyebrow: "POR QUÉ COTIZAR CON COMPARO3D",
    headline: "Menos vueltas, más claridad",
    support:
      "Los cuatro diferenciales que más pesan para un particular: comparación real, red evaluada, confidencialidad y entrega coordinada.",
  },
  empresa: {
    eyebrow: "POR QUÉ TRABAJAR CON COMPARO3D",
    headline: "Menos dispersión, más control operativo",
    support:
      "Para empresas, la diferencia está en centralizar, coordinar, proteger la información y ejecutar con una red validada.",
  },
};

const cards: Record<Audience, TrustCard[]> = {
  particular: [
    {
      icon: BarChart3,
      label: "Comparación clara",
      desc: "Compará opciones reales según precio, plazo y condiciones sin salir a buscar proveedor por proveedor.",
      priority: true,
    },
    {
      icon: ShieldCheck,
      label: "Proveedores verificados",
      desc: "La red se evalúa por capacidad, calidad y cumplimiento antes de formar parte del proceso.",
      priority: true,
    },
    {
      icon: Lock,
      label: "Archivo confidencial",
      desc: "Tu STL se usa dentro del flujo de cotización y coordinación. No se comparte fuera de ese proceso.",
    },
    {
      icon: Truck,
      label: "Entrega coordinada",
      desc: "Producción y envío quedan dentro de un mismo flujo para que no tengas que resolver todo por tu cuenta.",
    },
  ],
  empresa: [
    {
      icon: Users,
      label: "Un solo interlocutor",
      desc: "Centralizá requerimientos, seguimiento y coordinación desde un único frente operativo.",
      priority: true,
    },
    {
      icon: Layers,
      label: "Producción paralela coordinada",
      desc: "Cuando el proyecto lo permite, se coordinan varios proveedores para reducir plazos y sostener capacidad.",
      priority: true,
    },
    {
      icon: ShieldCheck,
      label: "Red de proveedores verificados",
      desc: "Capacidad técnica, materiales, cumplimiento y confiabilidad operativa evaluados antes de cotizar.",
    },
    {
      icon: Lock,
      label: "Confidencialidad del proyecto",
      desc: "Archivos y requerimientos se tratan dentro del proceso operativo, con criterio de resguardo y control.",
    },
  ],
};

const TrustStrip = () => {
  const { audience } = useAudience();
  const header = headerContent[audience];
  const items = cards[audience];

  return (
    <section className="border-y border-border bg-card py-12 md:py-16">
      <div className="container">
        <div className="mx-auto mb-8 max-w-3xl text-center md:mb-10">
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-primary md:text-[13px]">
            {header.eyebrow}
          </p>

          <h2 className="text-[32px] font-bold leading-[1.08] text-foreground md:text-[42px]">
            {header.headline}
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-[16px] leading-[1.7] text-muted-foreground md:text-[18px]">
            {header.support}
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          {items.map((item) => (
            <article
              key={item.label}
              className={[
                "flex items-start gap-4 rounded-2xl p-5 md:p-6 transition-all duration-200",
                item.priority
                  ? "border border-primary/18 bg-primary/[0.045] shadow-[0_12px_28px_-22px_hsl(var(--primary)/0.28)]"
                  : "border border-border bg-background hover:border-primary/10",
              ].join(" ")}
            >
              <div
                className={[
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                  item.priority ? "bg-primary/14" : "bg-primary/8",
                ].join(" ")}
              >
                <item.icon
                  size={26}
                  strokeWidth={item.priority ? 2.2 : 2.05}
                  className={item.priority ? "text-primary" : "text-primary/80"}
                />
              </div>

              <div className="min-w-0 pt-0.5">
                <h3
                  className={[
                    "text-[18px] font-semibold leading-[1.2] md:text-[20px]",
                    item.priority ? "text-foreground" : "text-foreground/92",
                  ].join(" ")}
                >
                  {item.label}
                </h3>

                <p className="mt-2 text-[14px] leading-[1.7] text-muted-foreground md:text-[15px]">
                  {item.desc}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
