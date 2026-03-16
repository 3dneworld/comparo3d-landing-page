import { Upload, Users, BarChart3, PackageCheck } from "lucide-react";

const steps = [
  {
    icon: Upload,
    number: "01",
    title: "Subí tu archivo",
    desc: "Cargá tu modelo 3D y definí lo básico para cotizar.",
  },
  {
    icon: Users,
    number: "02",
    title: "Recibí opciones",
    desc: "Compará propuestas según precio, material y plazo.",
  },
  {
    icon: BarChart3,
    number: "03",
    title: "Elegí la mejor",
    desc: "Seleccioná la opción que mejor se ajuste a tu necesidad.",
  },
  {
    icon: PackageCheck,
    number: "04",
    title: "Recibí tu pieza",
    desc: "Coordinamos producción y entrega para que no tengas que resolverlo por tu cuenta.",
  },
];

const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-background">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Proceso simple</p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">Cómo funciona</h2>
          <p className="mt-3 text-muted-foreground">Cuatro pasos para cotizar y recibir tu pieza impresa en 3D.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className="relative bg-card rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow border border-border group"
            >
              <span className="text-5xl font-display font-bold text-muted/40 absolute top-4 right-5 select-none">
                {step.number}
              </span>
              <div className="w-11 h-11 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                <step.icon size={20} className="text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-[2px] bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
