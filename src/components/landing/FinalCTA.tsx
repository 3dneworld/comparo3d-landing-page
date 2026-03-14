import { ArrowRight } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="py-20 md:py-28 bg-gradient-dark">
      <div className="container text-center">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-hero-foreground max-w-2xl mx-auto">
          Empezá a comparar cotizaciones hoy
        </h2>
        <p className="mt-4 text-hero-muted max-w-lg mx-auto">
          Es gratis, rápido y sin compromiso. Subí tu archivo y recibí presupuestos de proveedores verificados.
        </p>
        <a
          href="#cotizar"
          className="mt-8 inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground px-10 py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity shadow-cta"
        >
          Cotizar ahora
          <ArrowRight size={20} />
        </a>
      </div>
    </section>
  );
};

export default FinalCTA;
