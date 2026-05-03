import { useState, type MouseEvent } from "react";
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
  variant?: "fixed" | "bounded";
}

export function RankingExplainer({
  mediationLinkTarget = "#politica-mediacion",
  onMediationClick,
  variant = "fixed",
}: RankingExplainerProps) {
  const [open, setOpen] = useState(false);
  const triggerClassName =
    variant === "bounded"
      ? "inline-flex max-w-[210px] items-center gap-2 rounded-full border border-primary/20 bg-card px-3 py-2 text-left text-[12px] font-semibold leading-tight text-primary shadow-card-hover transition-transform hover:scale-105"
      : "fixed bottom-5 left-4 z-40 inline-flex max-w-[210px] items-center gap-2 rounded-full border border-primary/20 bg-card px-3 py-2 text-left text-[12px] font-semibold leading-tight text-primary shadow-card-hover transition-transform hover:scale-105 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2";

  const handleMediationClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (onMediationClick) {
      event.preventDefault();
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
          className={triggerClassName}
        >
          <BadgeCheck size={16} className="shrink-0 text-emerald-500" />
          <span>¿Cómo funciona el ranking?</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
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
                        Sello que Comparo3D otorga a proveedores con trayectoria
                        operativa sostenida: entregas a tiempo, rating consistente
                        y volumen real de órdenes completadas.
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
                  prioridad sin ocultar el resto de las cotizaciones.
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
            Política de Mediación Transparente
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
