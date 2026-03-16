import { Building2, Users, Boxes, ClipboardMinus, ShieldCheck, MapPin } from "lucide-react";

const benefits = [
  {
    icon: Building2,
    title: "Un solo interlocutor comercial",
    desc: "Centralizá la comunicación en un único punto de contacto. Sin ida y vuelta con múltiples proveedores.",
  },
  {
    icon: Boxes,
    title: "Comparación centralizada",
    desc: "Recibí propuestas consolidadas sin negociar proveedor por proveedor.",
  },
  {
    icon: ClipboardMinus,
    title: "Facturación simplificada",
    desc: "Una sola factura por operación. Menos órdenes de compra, menos gestión manual.",
  },
  {
    icon: Users,
    title: "Menos carga administrativa",
    desc: "Reducí el tiempo que tu equipo dedica a cotizar, comparar y hacer seguimiento.",
  },
  {
    icon: MapPin,
    title: "Seguimiento centralizado",
    desc: "Estado claro de cada pedido desde un único canal, sin dispersión.",
  },
  {
    icon: ShieldCheck,
    title: "Red de proveedores verificados",
    desc: "Proveedores evaluados en capacidad técnica, calidad y cumplimiento de entrega.",
  },
];

const CompaniesSection = () => {
  return (
    <section id="empresas" className="py-20 md:py-28 bg-gradient-dark">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">Para empresas</p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-hero-foreground">
            Impresión 3D para empresas, sin dispersión operativa
          </h2>
          <p className="mt-4 text-hero-muted max-w-2xl mx-auto">
            Simplificá compras, coordinación y administración. Menos gestión manual, menos ida y vuelta, un solo interlocutor.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {benefits.map((b) => (
            <div key={b.title} className="bg-hero-muted/5 border border-hero-muted/10 rounded-xl p-6 hover:border-hero-muted/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-gradient-accent flex items-center justify-center mb-4">
                <b.icon size={20} className="text-accent-foreground" />
              </div>
              <h3 className="font-display font-semibold text-hero-foreground mb-2">{b.title}</h3>
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
        </div>
      </div>
    </section>
  );
};

export default CompaniesSection;
