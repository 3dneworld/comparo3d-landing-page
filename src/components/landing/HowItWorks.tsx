import { Upload, Users, BarChart3, PackageCheck } from "lucide-react";

const steps = [
  {
    icon: Upload,
    number: "01",
    title: "Subí tu archivo",
    desc: "Cargá tu archivo STL o describí lo que necesitás. Aceptamos los formatos más comunes.",
  },
  {
    icon: Users,
    number: "02",
    title: "Recibí cotizaciones",
    desc: "Proveedores verificados compiten para darte el mejor precio, plazo y calidad.",
  },
  {
    icon: BarChart3,
    number: "03",
    title: "Compará y elegí",
    desc: "Revisá cada propuesta: precio, material, tiempo de entrega. Todo en un solo lugar.",
  },
  {
    icon: PackageCheck,
    number: "04",
    title: "Recibí tu pieza",
    desc: "Coordinamos la producción y entrega. Vos solo esperás tu pieza terminada.",
  },
];

const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-background">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Proceso simple</p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">Cómo funciona</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className="relative bg-card rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow border border-border group"
            >
              <span className="text-5xl font-display font-bold text-muted/60 absolute top-4 right-5 select-none">
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
