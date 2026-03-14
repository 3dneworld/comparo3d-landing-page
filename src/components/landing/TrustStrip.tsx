import { ShieldCheck, Headphones, FileText, Truck, Lock, MapPin } from "lucide-react";

const items = [
  { icon: ShieldCheck, label: "Proveedores verificados" },
  { icon: Headphones, label: "Soporte humano" },
  { icon: FileText, label: "Facturación" },
  { icon: MapPin, label: "Seguimiento del pedido" },
  { icon: Lock, label: "Archivo confidencial" },
  { icon: Truck, label: "Entrega coordinada" },
];

const TrustStrip = () => {
  return (
    <section className="bg-card border-y border-border py-6">
      <div className="container">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 justify-center py-2">
              <item.icon size={18} className="text-primary shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
