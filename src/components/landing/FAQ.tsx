import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "¿Qué archivos puedo subir?",
    a: "Aceptamos archivos STL, OBJ, 3MF y STEP. Si tenés otro formato, contactanos y te ayudamos a convertirlo.",
  },
  {
    q: "¿Cuánto tarda recibir una cotización?",
    a: "En general, recibís las primeras cotizaciones dentro de las 24 horas hábiles. Depende del tipo de proyecto y la complejidad.",
  },
  {
    q: "¿Cómo verifican a los proveedores?",
    a: "Cada proveedor pasa por un proceso de validación que incluye muestras de calidad, documentación fiscal y evaluación de capacidad productiva.",
  },
  {
    q: "¿Puedo pedir varias piezas diferentes en un solo pedido?",
    a: "Sí. Podés subir múltiples archivos y especificar cantidades distintas para cada uno. El sistema genera cotizaciones consolidadas.",
  },
  {
    q: "¿Hacen envíos a todo el país?",
    a: "Sí, coordinamos entregas en todo el territorio argentino. Los costos de envío se incluyen en la cotización.",
  },
  {
    q: "¿Emiten factura?",
    a: "Sí. Emitimos factura A o B según tu condición fiscal. Para empresas, ofrecemos cuenta corriente.",
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
