import { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

type Audience = "particular" | "empresa";

const Hero = () => {
  const [audience, setAudience] = useState<Audience>("particular");

  console.log("[Hero] Audience selected:", audience);

  const headlines: Record<Audience, { title: string; sub: string }> = {
    particular: {
      title: "Compará cotizaciones de impresión 3D en un solo lugar",
      sub: "Subí tu archivo, recibí presupuestos de proveedores verificados y elegí la mejor opción. Sin vueltas.",
    },
    empresa: {
      title: "Un canal único para todas tus necesidades de impresión 3D",
      sub: "Simplificá compras, centralizá proveedores y reducí fricción administrativa. Todo desde una plataforma.",
    },
  };

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

        <motion.div
          key={audience}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-hero-foreground leading-tight tracking-tight">
            {current.title}
          </h1>
          <p className="mt-5 text-base md:text-lg text-hero-muted max-w-2xl mx-auto leading-relaxed">
            {current.sub}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#cotizar"
              className="bg-gradient-primary text-primary-foreground px-8 py-3.5 rounded-lg font-semibold text-base hover:opacity-90 transition-opacity shadow-cta flex items-center gap-2"
            >
              Cotizar ahora
              <ArrowRight size={18} />
            </a>
            <a
              href="#como-funciona"
              className="text-hero-muted hover:text-hero-foreground transition-colors text-sm font-medium flex items-center gap-1"
            >
              Cómo funciona
              <ChevronDown size={16} />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
