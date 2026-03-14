import { Building2, Users, Boxes, ClipboardMinus } from "lucide-react";

const benefits = [
  {
    icon: Building2,
    title: "Un interlocutor comercial",
    desc: "Un solo punto de contacto para gestionar todos tus pedidos de impresión 3D.",
  },
  {
    icon: Boxes,
    title: "Compras simplificadas",
    desc: "Presupuestos consolidados, facturación unificada y gestión centralizada.",
  },
  {
    icon: Users,
    title: "Múltiples proveedores",
    desc: "Accedé a una red de proveedores verificados sin negociar con cada uno.",
  },
  {
    icon: ClipboardMinus,
    title: "Menos fricción administrativa",
    desc: "Reducí órdenes de compra, comparaciones manuales y seguimiento disperso.",
  },
];

const CompaniesSection = () => {
  return (
    <section id="empresas" className="py-20 md:py-28 bg-gradient-dark">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">Para empresas</p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-hero-foreground">
            Impresión 3D sin complejidad operativa
          </h2>
          <p className="mt-4 text-hero-muted max-w-2xl mx-auto">
            Diseñamos COMPARO3D para que tu equipo de compras pueda gestionar impresión 3D como cualquier otro insumo.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
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
            Solicitar demo para empresas
          </a>
        </div>
      </div>
    </section>
  );
};

export default CompaniesSection;
