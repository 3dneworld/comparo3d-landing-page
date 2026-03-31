import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAudience, type Audience } from "@/contexts/AudienceContext";

interface FAQItem {
  q: string;
  a: string;
}

const faqCopy: Record<Audience, { eyebrow: string; title: string; support: string }> = {
  particular: {
    eyebrow: "PREGUNTAS FRECUENTES",
    title: "FAQ para particulares",
    support:
      "Respuestas rápidas para entender cómo funciona la cotización, qué podés subir y qué esperar del proceso.",
  },
  empresa: {
    eyebrow: "PREGUNTAS FRECUENTES",
    title: "FAQ para empresas",
    support:
      "Respuestas orientadas a compras, coordinación, confidencialidad, facturación y tiempos de propuesta para operaciones B2B.",
  },
};

const faqsByAudience: Record<Audience, FAQItem[]> = {
  particular: [
    {
      q: "¿Qué formato de archivo aceptan?",
      a: "Hoy aceptamos archivos STL para la cotización automática. Si tenés el modelo en otro formato, primero habría que convertirlo antes de cotizar.",
    },
    {
      q: "¿Cuánto tarda una cotización para particulares?",
      a: "En la experiencia para particulares, la cotización se resuelve en minutos. Subís tu archivo, completás los datos y recibís opciones comparables sin tener que buscar proveedor por proveedor.",
    },
    {
      q: "¿Puedo pedir varias copias de la misma pieza?",
      a: "Sí. Cada cotización corresponde a un solo archivo, pero podés indicar cuántas copias necesitás de esa misma pieza.",
    },
    {
      q: "¿Puedo subir varias piezas diferentes en una sola cotización?",
      a: "No. La lógica actual es una cotización por pieza o archivo. Si necesitás cotizar varias piezas distintas, tenés que generar una cotización separada para cada una.",
    },
    {
      q: "¿Qué pasa si no sé qué material elegir?",
      a: "Podés avanzar igual. La plataforma orienta sobre materiales frecuentes y, si hace falta, la recomendación final se ajusta según el uso real de la pieza, el nivel de exigencia y la terminación que buscás.",
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
      a: "Sí. Para particulares se puede emitir la factura que corresponda según el caso y la condición fiscal de la operación.",
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
      q: "¿Hacen envíos y seguimiento?",
      a: "Sí. La propuesta contempla coordinación de entrega y seguimiento del pedido para evitar dispersión operativa entre múltiples proveedores.",
    },
  ],
};

const FAQ = () => {
  const { audience } = useAudience();
  const copy = faqCopy[audience];
  const faqs = useMemo(() => faqsByAudience[audience], [audience]);
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 md:py-28 bg-background">
      <div className="container max-w-4xl">
        <div className="text-center mb-12 md:mb-14">
          <p className="text-xs font-semibold text-primary uppercase tracking-[0.16em] mb-3">
            {copy.eyebrow}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            {copy.title}
          </h2>
          <p className="mt-4 text-sm md:text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            {copy.support}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;

            return (
              <div
                key={faq.q}
                className={`rounded-2xl border transition-colors ${
                  isOpen
                    ? "border-primary/20 bg-primary/[0.03]"
                    : "border-border bg-card hover:bg-muted/30"
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-start justify-between gap-4 px-5 py-5 md:px-6 md:py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-[15px] md:text-base font-semibold text-foreground leading-snug pr-4">
                    {faq.q}
                  </span>

                  <span
                    className={`mt-0.5 shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <ChevronDown size={18} className="text-muted-foreground" />
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 md:px-6 md:pb-6">
                    <div className="h-px bg-border mb-4" />
                    <p className="text-sm md:text-[15px] text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
