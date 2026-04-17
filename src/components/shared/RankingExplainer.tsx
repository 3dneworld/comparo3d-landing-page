import { useState } from "react";
import { BadgeCheck, ShieldCheck, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface RankingExplainerProps {
  mediationLinkTarget?: string;
  onMediationClick?: () => void;
}

export function RankingExplainer({
  mediationLinkTarget = "#politica-mediacion",
  onMediationClick,
}: RankingExplainerProps) {
  const [open, setOpen] = useState(false);

  const handleMediationClick = () => {
    if (onMediationClick) {
      onMediationClick();
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Abrir explicación del ranking"
          className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-white shadow-card-hover transition-transform hover:scale-105"
        >
          <span className="text-lg font-bold">?</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={12}
        className="w-[360px] max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto rounded-xl border bg-card p-0 shadow-card-hover"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-[Montserrat] text-[16px] font-bold text-foreground">
            ¿Cómo funciona el ranking?
          </h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-3">
          <Accordion type="multiple" defaultValue={["badges"]}>
            <AccordionItem value="badges" className="border-b border-border/70">
              <AccordionTrigger className="py-2.5 text-[13px] font-semibold text-foreground hover:no-underline">
                Badges de confianza
              </AccordionTrigger>
              <AccordionContent className="text-[12px] leading-relaxed text-muted-foreground">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <ShieldCheck size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        Trayectoria Verificada
                      </p>
                      <p className="mt-0.5">
                        Este proveedor presentó documentación (facturación
                        histórica, trabajos previos, referencias comerciales)
                        que Comparo3D validó al momento del alta.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                      <BadgeCheck size={14} className="text-emerald-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        Certificado Orgánico
                      </p>
                      <p className="mt-0.5">
                        Este proveedor alcanzó la certificación orgánica al
                        cumplir: 4+ meses activo, 20+ órdenes completadas,
                        rating promedio ≥ 4.3, al menos 15 reviews, y ≥88% de
                        entregas a tiempo.
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sorting" className="border-none">
              <AccordionTrigger className="py-2.5 text-[13px] font-semibold text-foreground hover:no-underline">
                Cómo ordenamos los resultados
              </AccordionTrigger>
              <AccordionContent className="text-[12px] leading-relaxed text-muted-foreground">
                <p>
                  Ordenamos por una combinación de precio, rating y cercanía.
                  Los proveedores con badges de confianza aparecen con
                  prioridad, pero nunca escondemos el mejor precio.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="border-t px-4 py-3">
          <a
            href={mediationLinkTarget}
            onClick={handleMediationClick}
            className="text-[12px] font-medium text-primary transition-colors hover:text-primary/80"
          >
            Leer la Política de Mediación Transparente
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
