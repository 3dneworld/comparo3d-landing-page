import { ShieldCheck, Clock, Lock, Truck, Layers, Users } from "lucide-react";
import { useAudience, type Audience } from "@/contexts/AudienceContext";
import type { LucideIcon } from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { StaggerChildren, StaggerItem } from "@/components/StaggerChildren";
import ComparisonIcon from "./ComparisonIcon";

interface TrustCard {
  icon?: LucideIcon;
  customIcon?: "comparison";
  label: string;
  desc: string;
}

const headerContent: Record<Audience, { headline: string; support: string }> = {
  particular: {
    headline: "Menos vueltas, más claridad",
    support: "Todo lo que necesitás para cotizar con confianza, sin dar vueltas.",
  },
  empresa: {
    headline: "Menos dispersión, más control operativo",
    support: "Centralizá la gestión de impresión 3D con una red coordinada.",
  },
};

const cards: Record<Audience, TrustCard[]> = {
  particular: [
    {
      customIcon: "comparison",
      label: "Comparación clara",
      desc: "Compará opciones reales según precio, plazo y condiciones sin salir a buscar proveedor por proveedor.",
    },
    {
      icon: ShieldCheck,
      label: "Proveedores verificados",
      desc: "La red se evalúa por capacidad, calidad y cumplimiento antes de formar parte del proceso.",
    },
    {
      icon: Clock,
      label: "Tiempos claros",
      desc: "Te damos la fecha de entrega estimada para que puedas manejar tus tiempos o planificar tu proyecto personal",
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
    },
    {
      icon: Layers,
      label: "Producción paralela coordinada",
      desc: "Cuando el proyecto lo permite, se coordinan varios proveedores para reducir plazos y sostener capacidad.",
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
    <section className="bg-background py-16 md:py-24">
      <div className="container max-w-6xl">
        <AnimateOnScroll variant="fade-up">
          <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
            <h2 className="text-[32px] font-bold leading-[1.08] text-foreground md:text-[42px]">
              {header.headline}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[16px] leading-[1.7] text-muted-foreground md:text-[18px]">
              {header.support}
            </p>
          </div>
        </AnimateOnScroll>

        <StaggerChildren className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-5">
          {items.map((item) => (
            <StaggerItem key={item.label}>
              <article className="flex h-full flex-col items-center rounded-2xl border border-border bg-card p-5 text-center transition-all duration-200 hover:border-primary/20 hover:shadow-md md:p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/[0.12]">
                  {item.customIcon === "comparison" ? (
                    <ComparisonIcon label="Icono Comparacion clara" className="h-9 w-9 bg-primary" />
                  ) : item.icon ? (
                    <item.icon
                      size={24}
                      strokeWidth={2}
                      className="text-primary"
                    />
                  ) : null}
                </div>

                <h3 className="mt-3 text-[16px] font-semibold leading-[1.2] text-foreground md:text-[17px]">
                  {item.label}
                </h3>

                <p className="mt-2 text-[13px] leading-[1.65] text-muted-foreground md:text-[14px]">
                  {item.desc}
                </p>
              </article>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
};

export default TrustStrip;
