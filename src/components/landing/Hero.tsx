import { ArrowRight, BarChart3, ChevronDown, PackageCheck, Upload } from "lucide-react";
import { motion } from "framer-motion";

import { useAudience, type Audience } from "@/contexts/AudienceContext";
import HeroProcessDemo from "./HeroProcessDemo";

const headlines: Record<
  Audience,
  { title: string; sub: string; cta: string; secondaryCta: string; secondaryHref: string }
> = {
  particular: {
    title: "Cotizá tu impresión 3D en minutos",
    sub: "Subí tu archivo, compará opciones reales de impresión 3D en Argentina y elegí la mejor sin perder tiempo buscando proveedor por proveedor.",
    cta: "Cotizar ahora",
    secondaryCta: "Cómo funciona",
    secondaryHref: "#como-funciona",
  },
  empresa: {
    title: "Centralizá compras de impresión 3D con un solo interlocutor",
    sub: "COMPARO3D recibe tu requerimiento, coordina una red evaluada de proveedores y te entrega una propuesta consolidada para simplificar compras, seguimiento y facturación.",
    cta: "Cotizar para empresa",
    secondaryCta: "Ver solución empresa",
    secondaryHref: "#empresas",
  },
};

const Hero = () => {
  const { audience } = useAudience();
  const current = headlines[audience];

  return (
    <section className="relative bg-gradient-dark pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
      {/* Subtle grid pattern with parallax */}
      <motion.div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E\")",
        }}
        animate={{
          backgroundPosition: ["0px 0px", "40px 40px"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <div className="container max-w-6xl relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: copy */}
          <motion.div
            key={audience}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 text-center lg:text-left max-w-xl"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-hero-foreground leading-tight tracking-tight">
              {current.title}
            </h1>
            <p className="mt-5 text-base md:text-lg text-hero-muted leading-relaxed">
              {current.sub}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
              <a
                href="#cotizar"
                className="bg-gradient-primary text-primary-foreground px-8 py-3.5 rounded-lg font-semibold text-base hover:opacity-90 transition-opacity shadow-cta flex items-center gap-2"
              >
                {current.cta}
                <ArrowRight size={18} />
              </a>
              <a
                href={current.secondaryHref}
                className="border border-hero-muted/25 hover:border-hero-muted/40 text-hero-muted hover:text-hero-foreground transition-all px-6 py-3.5 rounded-lg text-sm font-medium flex items-center gap-1.5"
              >
                {current.secondaryCta}
                <ChevronDown size={16} />
              </a>
            </div>

            {/* Mobile-only: mini process indicators */}
            <div className="mt-10 flex justify-center gap-6 sm:gap-8 lg:hidden">
              {[
                { icon: Upload, label: "Subís tu STL" },
                { icon: BarChart3, label: "Comparás opciones" },
                { icon: PackageCheck, label: "Recibís tu pieza" },
              ].map((step) => (
                <div key={step.label} className="flex flex-col items-center gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-hero-muted/15 bg-hero-muted/10">
                    <step.icon size={20} className="text-primary" />
                  </div>
                  <span className="max-w-[90px] text-center text-[11px] leading-tight text-hero-muted">
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: animated process flow illustration */}
          <div className="flex-1 max-w-md w-full hidden lg:block">
            <HeroProcessDemo audience={audience} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
