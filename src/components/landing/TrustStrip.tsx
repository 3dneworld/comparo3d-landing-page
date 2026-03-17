import { ShieldCheck, Headphones, FileText, Truck, Lock, MapPin } from "lucide-react";

const items = [
  { icon: ShieldCheck, label: "Proveedores verificados", desc: "Red evaluada y monitoreada" },
  { icon: Headphones, label: "Soporte humano", desc: "Atención real, no bots" },
  { icon: FileText, label: "Facturación", desc: "Factura A o B según tu caso" },
  { icon: MapPin, label: "Seguimiento del pedido", desc: "Sabés en qué estado está" },
  { icon: Lock, label: "Archivo confidencial", desc: "Tu modelo no se comparte" },
  { icon: Truck, label: "Entrega coordinada", desc: "Envíos a todo el país" },
];

const TrustStrip = () => {
  return (
    <section className="py-12 md:py-16 bg-card border-y border-border">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/60"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <item.icon size={17} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
