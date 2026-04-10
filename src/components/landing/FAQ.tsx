import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAudience, type Audience } from "@/contexts/AudienceContext";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { StaggerChildren, StaggerItem } from "@/components/StaggerChildren";

interface FAQItem {
  q: string;
  a: string;
}

const sectionCopy: Record<Audience, { eyebrow: string; title: string; support: string }> = {
  particular: {
    eyebrow: "PREGUNTAS FRECUENTES",
    title: "Lo que necesitás saber antes de cotizar",
    support:
      "Respuestas claras para particulares: qué podés subir, cuánto tarda, cómo funciona la comparación y qué esperar del proceso.",
  },
  empresa: {
    eyebrow: "PREGUNTAS FRECUENTES",
    title: "Respuestas para compras y coordinación B2B",
    support:
      "Información puntual para empresas sobre propuesta consolidada, facturación, confidencialidad, seguimiento y coordinación operativa.",
  },
};

const faqsByAudience: Record<Audience, FAQItem[]> = {
  particular: [
    {
      q: "¿Qué formato de archivo aceptan?",
      a: "Hoy la cotización automática trabaja con archivos STL. Si tu modelo está en otro formato, primero habría que convertirlo antes de cotizar.",
    },
    {
      q: "¿Cuánto tarda una cotización para particulares?",
      a: "La experiencia para particulares está pensada para resolverse en minutos. Subís tu archivo, completás los datos y recibís opciones comparables sin tener que buscar proveedor por proveedor.",
    },
    {
      q: "¿Puedo pedir varias copias de la misma pieza?",
      a: "Sí. Cada cotización corresponde a un solo archivo, pero podés indicar cuántas copias necesitás de esa misma pieza.",
    },
    {
      q: "¿Puedo subir varias piezas diferentes en una sola cotización?",
      a: "No. La lógica actual es una cotización por archivo o pieza. Si necesitás cotizar varias piezas distintas, tenés que generar una cotización separada para cada una.",
    },
    {
      q: "¿Qué pasa si no sé qué material elegir?",
      a: "Podés avanzar igual. La plataforma muestra materiales frecuentes y, si hace falta, la recomendación final se ajusta según el uso real de la pieza, el nivel de exigencia y la terminación que buscás.",
    },
    {
      q: "¿Mi archivo se mantiene confidencial?",
      a: "Sí. El archivo se usa dentro del proceso de cotización y coordinación. No se publica ni se comparte fuera de ese flujo operativo.",
    },
    {
      q: "¿Hacen envíos a todo el país?",
      a: "Sí. La coordinación contempla entregas en Argentina. El plazo y el costo de envío dependen del tipo de pieza, ubicación y propuesta elegida.",
    },
    {
      q: "¿Emiten factura?",
      a: "Sí. En operaciones para particulares se emite la factura que corresponda según el caso y la condición fiscal aplicable.",
    },
  ],
  empresa: [
    {
      q: "¿Cómo funciona la propuesta para empresas?",
      a: "COMPARO3D recibe el requerimiento, coordina una red evaluada de proveedores y devuelve una propuesta consolidada para simplificar compras, seguimiento y ejecución.",
    },
    {
      q: "¿Cuánto tarda una propuesta para empresas?",
      a: "La referencia actual para una propuesta inicial es hasta 72 horas hábiles. El tiempo real depende del nivel de detalle del requerimiento, cantidad de piezas, material y urgencia.",
    },
    {
      q: "¿Pueden coordinar producción paralela con varios proveedores?",
      a: "Sí, cuando el proyecto lo permite. En pedidos donde el plazo es crítico, se puede coordinar producción paralela entre varios proveedores para reducir tiempos de entrega.",
    },
    {
      q: "¿Trabajan con pedidos recurrentes o múltiples piezas?",
      a: "Sí. La lógica empresa está pensada para requerimientos más amplios que una sola pieza aislada, incluyendo series cortas, múltiples componentes y necesidades recurrentes.",
    },
    {
      q: "¿Cómo manejan la confidencialidad de archivos y proyectos?",
      a: "Los archivos y requerimientos se tratan dentro del flujo operativo de cotización y coordinación. La confidencialidad forma parte del criterio de trabajo con la red evaluada.",
    },
    {
      q: "¿Qué tipo de factura emiten para empresas?",
      a: "Para empresas se trabaja con factura A.",
    },
    {
      q: "¿Cómo validan a los proveedores?",
      a: "La red se evalúa por capacidad técnica, materiales disponibles, cumplimiento, calidad de respuesta y confiabilidad operativa. No se trata solo de precio.",
    },
    {
      q: "¿Cómo se coordina el seguimiento y la entrega?",
      a: "La propuesta contempla coordinación de entrega y seguimiento del pedido para evitar dispersión operativa entre múltiples proveedores.",
    },
  ],
};

const FAQ = () => {
  const { audience } = useAudience();
  const copy = sectionCopy[audience];
  const faqs = useMemo(() => faqsByAudience[audience], [audience]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-background py-12 md:py-16">
      <div className="container max-w-5xl">
        <AnimateOnScroll variant="fade-up">
          <div className="mx-auto mb-8 max-w-3xl text-center md:mb-10">
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-primary md:text-[13px]">
              {copy.eyebrow}
            </p>

            <h2 className="text-[32px] font-bold leading-[1.08] text-foreground md:text-[42px]">
              {copy.title}
            </h2>

            <p className="mx-auto mt-5 max-w-3xl text-[16px] leading-[1.7] text-muted-foreground md:text-[18px]">
              {copy.support}
            </p>
          </div>
        </AnimateOnScroll>

        <StaggerChildren staggerDelay={0.08} className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <StaggerItem key={faq.q}>
              <div
                key={faq.q}
                className={[
                  "overflow-hidden rounded-2xl border bg-card transition-all duration-200",
                  isOpen
                    ? "border-primary/22 bg-primary/[0.035] shadow-[0_12px_32px_-20px_hsl(var(--primary)/0.26)]"
                    : "border-border hover:border-primary/12 hover:bg-muted/20",
                ].join(" ")}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left md:px-7 md:py-6"
                >
                  <span className="pr-4 text-[16px] font-semibold leading-[1.45] text-foreground md:text-[17px]">
                    {faq.q}
                  </span>

                  <span
                    className={[
                      "mt-0.5 shrink-0 rounded-full border p-1.5 transition-all duration-200",
                      isOpen
                        ? "rotate-180 border-primary/15 bg-primary/10"
                        : "border-border bg-background",
                    ].join(" ")}
                  >
                    <ChevronDown size={16} className="text-muted-foreground" />
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 md:px-7 md:pb-6">
                    <div className="mb-4 h-px bg-border" />
                    <p className="text-[15px] leading-[1.75] text-muted-foreground md:text-[16px]">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
              </div>
              </StaggerItem>
            );
          })}
        </StaggerChildren>
      </div>
    </section>
  );
};

export default FAQ;
