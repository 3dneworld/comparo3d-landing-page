import { ArrowRight, ChevronDown, Upload, BarChart3, PackageCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useAudience, type Audience } from "@/contexts/AudienceContext";
import hero3dParts from "@/assets/hero-3d-parts.jpg";

const headlines: Record<Audience, { title: string; sub: string; cta: string; secondaryCta: string; secondaryHref: string }> = {
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
  const { audience, setAudience } = useAudience();
  const current = headlines[audience];

  return (
    <section className="relative bg-gradient-dark pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="container relative z-10">
        {/* Audience toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-hero-muted/10 rounded-full p-1 border border-hero-muted/15">
            {(["particular", "empresa"] as Audience[]).map((a) => (
              <button
                key={a}
                onClick={() => setAudience(a)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  audience === a
                    ? "bg-gradient-primary text-primary-foreground shadow-cta"
                    : "text-hero-muted hover:text-hero-foreground"
                }`}
              >
                {a === "particular" ? "Particular" : "Empresa"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: copy */}
          <motion.div
            key={audience}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 text-center lg:text-left max-w-xl"
          >
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-hero-foreground leading-tight tracking-tight">
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
                className="text-hero-muted hover:text-hero-foreground transition-colors text-sm font-medium flex items-center gap-1"
              >
                {current.secondaryCta}
                <ChevronDown size={16} />
              </a>
            </div>
          </motion.div>

          {/* Right: real visual composition */}
          <div className="flex-1 max-w-lg w-full hidden lg:block">
            <div className="relative">
              {/* Main image — real 3D printed parts */}
              <div className="rounded-2xl overflow-hidden border border-hero-muted/10 shadow-2xl">
                <img
                  src={hero3dParts}
                  alt="Piezas impresas en 3D: engranajes, carcasa electrónica, modelo arquitectónico"
                  className="w-full h-auto object-cover"
                  loading="eager"
                />
              </div>

              {/* Floating UI overlay — upload indicator */}
              <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-xl p-3 shadow-card-hover flex items-center gap-3 min-w-[200px]">
                <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                  <Upload size={16} className="text-primary-foreground" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Archivo cargado</p>
                  <p className="text-xs font-semibold text-foreground">pieza-soporte.stl</p>
                </div>
              </div>

              {/* Floating UI overlay — quotes comparison */}
              <div className="absolute -top-3 -right-3 bg-card border border-border rounded-xl p-3 shadow-card-hover min-w-[180px]">
                <div className="flex items-center gap-1.5 mb-2">
                  <BarChart3 size={12} className="text-primary" />
                  <p className="text-[10px] text-muted-foreground font-medium">3 cotizaciones</p>
                </div>
                <div className="space-y-1">
                  {[
                    { label: "Proveedor A", price: "$4.500", best: true },
                    { label: "Proveedor B", price: "$5.100", best: false },
                    { label: "Proveedor C", price: "$3.800", best: false },
                  ].map((q) => (
                    <div
                      key={q.label}
                      className={`flex items-center justify-between px-2 py-1 rounded text-[10px] ${
                        q.best ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                      }`}
                    >
                      <span className="text-muted-foreground">{q.label}</span>
                      <span className={`font-semibold ${q.best ? "text-primary" : "text-foreground"}`}>{q.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating — delivery */}
              <div className="absolute bottom-8 -right-2 bg-card border border-border rounded-lg px-3 py-2 shadow-card flex items-center gap-2">
                <PackageCheck size={14} className="text-accent" />
                <span className="text-[10px] font-medium text-foreground">Entrega coordinada</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
