import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "¿Qué formatos de archivo aceptan?",
    a: "Aceptamos archivos en formato STL. Si tu modelo está en otro formato, contactanos y te ayudamos a convertirlo.",
  },
  {
    q: "¿Cuánto tarda una cotización para particulares?",
    a: "Las cotizaciones para particulares se generan en minutos. Subís tu archivo, completás los datos básicos y recibís propuestas rápidamente.",
  },
  {
    q: "¿Cuánto tarda una propuesta para empresas?",
    a: "Las propuestas corporativas se entregan en hasta 72 horas hábiles. Incluyen opciones consolidadas de múltiples proveedores verificados.",
  },
  {
    q: "¿Puedo pedir varias copias de la misma pieza?",
    a: "Sí. Cada cotización es por un solo archivo/pieza, pero podés indicar la cantidad de copias que necesitás.",
  },
  {
    q: "¿Puedo subir varias piezas diferentes en una sola cotización?",
    a: "No. Cada cotización corresponde a una sola pieza o archivo. Si necesitás cotizar piezas distintas, podés crear una cotización separada para cada una.",
  },
  {
    q: "¿Cómo validan a los proveedores?",
    a: "Cada proveedor pasa por un proceso de evaluación que contempla capacidad técnica, materiales disponibles, cumplimiento de plazos de entrega, calidad de comunicación y confiabilidad operativa. La evaluación es continua.",
  },
  {
    q: "¿Mi archivo se mantiene confidencial?",
    a: "Sí. Tu modelo 3D no se comparte públicamente ni se utiliza fuera del contexto de tu cotización. Tratamos la confidencialidad como prioridad.",
  },
  {
    q: "¿Emiten factura?",
    a: "Sí. Emitimos factura A o B según tu condición fiscal. Para empresas, ofrecemos cuenta corriente.",
  },
  {
    q: "¿Hacen envíos a todo el país?",
    a: "Sí, coordinamos entregas en todo el territorio argentino. Los costos de envío se incluyen en la cotización.",
  },
];

const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 md:py-28 bg-background">
      <div className="container max-w-3xl">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Preguntas frecuentes</p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">FAQ</h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-medium text-foreground pr-4">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-muted-foreground shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
