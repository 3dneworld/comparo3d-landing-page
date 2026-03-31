import { Building2, Boxes, ClipboardCheck, Layers, MapPin, ShieldCheck } from "lucide-react";
import { useAudience } from "@/contexts/AudienceContext";

const benefits = [
  {
    icon: Building2,
    title: "Un solo interlocutor comercial",
    desc: "Un punto de contacto para coordinar todo el proceso.",
    priority: true,
  },
  {
    icon: Boxes,
    title: "Comparación centralizada",
    desc: "Recibí propuestas consolidadas sin negociar proveedor por proveedor.",
    priority: false,
  },
  {
    icon: ClipboardCheck,
    title: "Factura A",
    desc: "Operación orientada a empresas con emisión de factura A.",
    priority: false,
  },
  {
    icon: Layers,
    title: "Producción paralela coordinada",
    desc: "Cuando el proyecto lo permite, coordinamos varios proveedores para reducir plazos.",
    priority: true,
  },
  {
    icon: MapPin,
    title: "Seguimiento consolidado",
    desc: "Estado claro del pedido en cada etapa.",
    priority: false,
  },
  {
    icon: ShieldCheck,
    title: "Red de proveedores verificados",
    desc: "Capacidad, calidad y cumplimiento evaluados.",
    priority: false,
  },
];

const CompaniesSection = () => {
  const { audience } = useAudience();

  if (audience !== "empresa") {
    return null;
  }

  return (
    <section id="empresas" className="py-20 md:py-28 bg-gradient-dark">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">Para empresas</p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-hero-foreground">
            Impresión 3D para empresas, sin dispersión operativa
          </h2>
          <p className="mt-4 text-hero-muted max-w-2xl mx-auto">
            Centralizá compras, coordinación, seguimiento y administración con un único frente operativo.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {benefits.map((b) => (
            <div
              key={b.title}
              className={`rounded-xl p-6 transition-colors ${
                b.priority
                  ? "bg-hero-muted/[0.08] border border-hero-muted/20"
                  : "bg-hero-muted/5 border border-hero-muted/10 hover:border-hero-muted/15"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-lg flex items-center justify-center mb-4 ${
                  b.priority ? "bg-gradient-accent" : "bg-hero-muted/10"
                }`}
              >
                <b.icon size={20} className={b.priority ? "text-accent-foreground" : "text-hero-muted"} />
              </div>
              <h3
                className={`font-display font-semibold mb-2 ${
                  b.priority ? "text-hero-foreground" : "text-hero-foreground/90"
                }`}
              >
                {b.title}
              </h3>
              <p className="text-sm text-hero-muted leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="#cotizar"
            className="inline-flex items-center gap-2 bg-gradient-accent text-accent-foreground px-8 py-3.5 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Solicitar propuesta para empresa
          </a>
          <p className="mt-3 text-xs text-hero-muted/60">Propuesta inicial hasta 72 hs hábiles.</p>
        </div>
      </div>
    </section>
  );
};

export default CompaniesSection;
