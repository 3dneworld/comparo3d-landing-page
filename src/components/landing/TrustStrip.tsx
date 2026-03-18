import { ShieldCheck, Headphones, FileText, Truck, Lock, MapPin } from "lucide-react";

const items = [
  { icon: ShieldCheck, label: "Proveedores verificados", desc: "Red evaluada en capacidad, calidad y cumplimiento" },
  { icon: Headphones, label: "Soporte humano", desc: "Atención real durante la cotización y la compra" },
  { icon: FileText, label: "Facturación", desc: "Factura A o B según corresponda" },
  { icon: MapPin, label: "Seguimiento del pedido", desc: "Estado claro del pedido en cada etapa" },
  { icon: Lock, label: "Archivo confidencial", desc: "Tu archivo no se comparte fuera del proceso" },
  { icon: Truck, label: "Entrega coordinada", desc: "Coordinación de entrega en Argentina" },
];

const TrustStrip = () => {
  return (
    <section className="py-14 md:py-20 bg-card border-y border-border">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-4 p-5 rounded-xl bg-muted/50 border border-border/60"
            >
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <item.icon size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground leading-tight">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
