import { useState } from "react";
import { ShieldCheck, Headphones, Lock, Truck, MapPin, FileText, BarChart3, Users, Info, GitBranch } from "lucide-react";
import { useAudience } from "@/contexts/AudienceContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const particularItems = [
  { icon: ShieldCheck, label: "Proveedores verificados", desc: "Red evaluada en capacidad, calidad y cumplimiento." },
  { icon: Headphones, label: "Soporte humano", desc: "Acompañamiento real durante cotización y compra." },
  { icon: BarChart3, label: "Comparación clara", desc: "Compará precio, plazo y opciones sin vueltas." },
  { icon: MapPin, label: "Seguimiento del pedido", desc: "Estado claro del pedido en cada etapa." },
  { icon: Lock, label: "Archivo confidencial", desc: "Tu archivo no sale del proceso de cotización." },
  { icon: Truck, label: "Entrega coordinada", desc: "Coordinamos la entrega en Argentina." },
];

const empresaItems = [
  { icon: ShieldCheck, label: "Proveedores verificados", desc: "Capacidad, calidad y cumplimiento evaluados." },
  { icon: Lock, label: "Archivo confidencial", desc: "Tu archivo no se comparte fuera del proceso." },
  { icon: GitBranch, label: "Producción paralela coordinada", desc: "Cuando el proyecto lo permite, coordinamos varios proveedores para reducir plazos.", hasInfo: true },
  { icon: FileText, label: "Facturación simplificada", desc: "Factura A o B según corresponda." },
  { icon: MapPin, label: "Seguimiento consolidado", desc: "Estado claro del pedido en cada etapa." },
  { icon: Users, label: "Un solo interlocutor", desc: "Un punto de contacto durante todo el proceso." },
];

const TrustStrip = () => {
  const { audience } = useAudience();
  const [infoOpen, setInfoOpen] = useState(false);
  const items = audience === "empresa" ? empresaItems : particularItems;

  return (
    <section className="py-14 md:py-20 bg-card border-y border-border">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-4 p-5 rounded-xl bg-muted/50 border border-border/60"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <item.icon size={22} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground leading-snug">{item.label}</p>
                <p className="text-[13px] text-muted-foreground mt-1.5 leading-[1.6]">{item.desc}</p>
                {"hasInfo" in item && item.hasInfo && (
                  <button
                    onClick={() => setInfoOpen(true)}
                    className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <Info size={13} />
                    Ver cómo funciona
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Producción paralela coordinada</DialogTitle>
            <DialogDescription className="text-[13.5px] leading-[1.7] pt-2">
              Para proyectos urgentes, COMPARO3D puede coordinar la fabricación entre varios proveedores al mismo tiempo, cuando la pieza, la capacidad disponible y la logística lo permiten. Esto permite reducir plazos frente a una producción concentrada en un solo proveedor. Los tiempos finales dependen del tipo de pieza, cantidad, postprocesado, control de calidad y entrega.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default TrustStrip;
