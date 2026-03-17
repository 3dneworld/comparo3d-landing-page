import { ArrowRight, ChevronDown, Upload, BarChart3, PackageCheck, Eye, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAudience, type Audience } from "@/contexts/AudienceContext";
import modeloPreview from "@/assets/modelo-preview.png";

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
  const isEmpresa = audience === "empresa";

  console.log("[Hero] Audience selected:", audience);

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

          {/* Right: process flow illustration with model preview */}
          <div className="flex-1 max-w-md w-full hidden lg:block">
            <div className="bg-hero-muted/5 border border-hero-muted/10 rounded-2xl p-6 space-y-4">
              {/* Step 1: Upload complete */}
              <div className="flex items-center gap-4 bg-hero-muted/5 rounded-xl p-4 border border-hero-muted/8">
                <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                  <Upload size={18} className="text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-xs text-hero-muted">Archivo cargado</p>
                    <CheckCircle2 size={12} className="text-accent" />
                  </div>
                  <div className="h-2 bg-hero-muted/15 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-primary rounded-full" style={{ width: "100%" }} />
                  </div>
                  <p className="text-[11px] text-hero-muted/60 mt-1">{isEmpresa ? "disco-acople.stl — 3.1 MB" : "pieza-soporte.stl — 2.4 MB"}</p>
                </div>
              </div>

              {/* Step 1.5: Model preview */}
              <div className="bg-hero-muted/5 rounded-xl border border-hero-muted/8 overflow-hidden">
                <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                  <Eye size={13} className="text-primary" />
                  <p className="text-xs text-hero-muted">Vista previa del modelo</p>
                </div>
                <div className="px-4 pb-4">
                  <div className="bg-hero-muted/8 rounded-lg overflow-hidden flex items-center justify-center h-36">
                    <img
                      src={modeloPreview}
                      alt="Vista previa de pieza 3D"
                      className="h-full w-full object-contain p-3"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Quotes comparison */}
              <div className="bg-hero-muted/5 rounded-xl p-4 border border-hero-muted/8">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={14} className="text-primary" />
                  <p className="text-xs text-hero-muted">{isEmpresa ? "Propuesta consolidada" : "Cotizaciones recibidas"}</p>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Proveedor A", price: "$4.500", time: "3 días", highlight: true },
                    { label: "Proveedor B", price: "$5.100", time: "2 días", highlight: false },
                    { label: "Proveedor C", price: "$3.800", time: "5 días", highlight: false },
                  ].map((q) => (
                    <div
                      key={q.label}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                        q.highlight
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-hero-muted/5 border border-hero-muted/5"
                      }`}
                    >
                      <span className="text-hero-muted">{q.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-hero-muted/60">{q.time}</span>
                        <span className={`font-semibold ${q.highlight ? "text-primary" : "text-hero-foreground"}`}>{q.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3: Delivery */}
              <div className="flex items-center gap-4 bg-hero-muted/5 rounded-xl p-4 border border-hero-muted/8">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                  <PackageCheck size={18} className="text-accent" />
                </div>
                <div>
                  <p className="text-xs font-medium text-hero-foreground">Entrega coordinada</p>
                  <p className="text-[11px] text-hero-muted/60">Seguimiento incluido · Envío a todo el país</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
