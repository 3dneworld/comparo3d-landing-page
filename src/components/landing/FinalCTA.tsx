import { ArrowRight } from "lucide-react";
import { useAudience } from "@/contexts/AudienceContext";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const FinalCTA = () => {
  const { audience } = useAudience();

  const copy = audience === "particular"
    ? {
        headline: "Empezá a cotizar tu pieza hoy",
        sub: "Es rápido, simple y sin vueltas. Subí tu archivo y compará opciones.",
        cta: "Cotizar ahora",
      }
    : {
        headline: "Solicitá una propuesta corporativa",
        sub: "Centralizá compras de impresión 3D con seguimiento y facturación simplificados.",
        cta: "Solicitar propuesta",
      };

  return (
    <section className="py-20 md:py-28 bg-gradient-dark">
      <div className="container max-w-6xl text-center">
        <AnimateOnScroll variant="fade-up">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-hero-foreground max-w-2xl mx-auto">
            {copy.headline}
          </h2>
          <p className="mt-4 text-hero-muted max-w-lg mx-auto">
            {copy.sub}
          </p>
          <a
            href="#cotizar"
            className="mt-8 inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground px-10 py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity shadow-cta"
          >
            {copy.cta}
            <ArrowRight size={20} />
          </a>
        </AnimateOnScroll>
      </div>
    </section>
  );
};

export default FinalCTA;
