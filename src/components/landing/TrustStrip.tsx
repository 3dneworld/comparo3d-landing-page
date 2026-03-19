import { ShieldCheck, Headphones, Lock, MapPin, Truck, BarChart3, Users, FileText, Layers } from "lucide-react";
import { useAudience, type Audience } from "@/contexts/AudienceContext";
import type { LucideIcon } from "lucide-react";

interface TrustCard {
  icon: LucideIcon;
  label: string;
  desc: string;
  priority?: boolean;
}

const headerContent: Record<Audience, { eyebrow: string; headline: string; support: string }> = {
  particular: {
    eyebrow: "POR QUÉ COTIZAR CON COMPARO3D",
    headline: "Menos vueltas, más claridad",
    support: "Compará opciones con una red evaluada, seguimiento claro y ayuda real durante el proceso.",
  },
  empresa: {
    eyebrow: "POR QUÉ TRABAJAR CON COMPARO3D",
    headline: "Menos dispersión, más control operativo",
    support: "Centralizá compras de impresión 3D con red evaluada, confidencialidad y seguimiento claro.",
  },
};

const cards: Record<Audience, TrustCard[]> = {
  particular: [
    { icon: ShieldCheck, label: "Proveedores verificados", desc: "Red evaluada en capacidad, calidad y cumplimiento.", priority: true },
    { icon: Headphones, label: "Soporte humano", desc: "Acompañamiento real durante cotización y compra." },
    { icon: BarChart3, label: "Comparación clara", desc: "Compará precio, plazo y opciones sin vueltas.", priority: true },
    { icon: MapPin, label: "Seguimiento del pedido", desc: "Estado claro del pedido en cada etapa." },
    { icon: Lock, label: "Archivo confidencial", desc: "Tu archivo no sale del proceso de cotización." },
    { icon: Truck, label: "Entrega coordinada", desc: "Coordinamos la entrega en Argentina." },
  ],
  empresa: [
    { icon: ShieldCheck, label: "Proveedores verificados", desc: "Capacidad, calidad y cumplimiento evaluados.", priority: true },
    { icon: Lock, label: "Archivo confidencial", desc: "Tu archivo no se comparte fuera del proceso." },
    { icon: Layers, label: "Producción paralela coordinada", desc: "Cuando el proyecto lo permite, coordinamos varios proveedores para reducir plazos.", priority: true },
    { icon: MapPin, label: "Seguimiento consolidado", desc: "Estado claro del pedido en cada etapa." },
    { icon: Users, label: "Un solo interlocutor", desc: "Un punto de contacto durante todo el proceso." },
    { icon: FileText, label: "Facturación simplificada", desc: "Factura A o B según corresponda." },
  ],
};

const TrustStrip = () => {
  const { audience } = useAudience();
  const header = headerContent[audience];
  const items = cards[audience];

  return (
    <section className="py-14 md:py-18 bg-card border-y border-border">
      <div className="container">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-primary mb-3">
            {header.eyebrow}
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight">
            {header.headline}
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
            {header.support}
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto">
          {items.map((item) => (
            <div
              key={item.label}
              className={`flex items-start gap-4 p-5 md:p-6 rounded-xl transition-none ${
                item.priority
                  ? "bg-primary/[0.04] border-2 border-primary/15 shadow-sm"
                  : "bg-muted/40 border border-border/60"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  item.priority
                    ? "bg-primary/15"
                    : "bg-primary/8"
                }`}
              >
                <item.icon
                  size={20}
                  className={item.priority ? "text-primary" : "text-primary/80"}
                />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-bold leading-snug ${
                  item.priority ? "text-foreground" : "text-foreground/90"
                }`}>
                  {item.label}
                </p>
                <p className="text-[13px] text-muted-foreground mt-1 leading-[1.55]">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
