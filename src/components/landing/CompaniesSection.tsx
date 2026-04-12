import { Building2, Boxes, ClipboardCheck, Layers, MapPin, ShieldCheck } from "lucide-react";
import { useAudience } from "@/contexts/AudienceContext";

const benefits = [
  {
    icon: Building2,
    title: "Un solo interlocutor comercial",
    desc: "Un punto de contacto para coordinar cotización, validación, seguimiento y entrega.",
    priority: true,
  },
  {
    icon: Layers,
    title: "Producción paralela coordinada",
    desc: "Cuando el proyecto lo permite, coordinamos varios proveedores para reducir plazos.",
    priority: true,
  },
  {
    icon: Boxes,
    title: "Comparación centralizada",
    desc: "Recibí una propuesta consolidada sin negociar proveedor por proveedor.",
    priority: false,
  },
  {
    icon: ClipboardCheck,
    title: "Factura A",
    desc: "Operación orientada a empresas con emisión de factura A.",
    priority: false,
  },
  {
    icon: MapPin,
    title: "Seguimiento consolidado",
    desc: "Estado claro del pedido en cada etapa desde un solo frente operativo.",
    priority: false,
  },
  {
    icon: ShieldCheck,
    title: "Red de proveedores verificados",
    desc: "Capacidad, calidad y cumplimiento evaluados de forma continua.",
    priority: false,
  },
] as const;

const CompaniesSection = () => {
  const { audience } = useAudience();

  if (audience !== "empresa") {
    return null;
  }

  return (
    <section id="empresas" className="scroll-mt-24 bg-[#0B1730] py-16 md:scroll-mt-28 md:py-20">
      <div className="container max-w-6xl">
        <div className="mx-auto mb-10 max-w-3xl text-center md:mb-12">
          <h2 className="text-[32px] font-bold leading-[1.08] text-hero-foreground md:text-[42px]">
            Impresión 3D para empresas, sin dispersión operativa
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-[16px] leading-[1.7] text-hero-muted md:text-[18px]">
            Centralizá compras, coordinación, seguimiento y administración con un único frente operativo.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
          {benefits.map((benefit) => (
            <article
              key={benefit.title}
              className={[
                "rounded-2xl border p-6 transition-all duration-200",
                benefit.priority
                  ? "border-accent/18 bg-white/[0.06] shadow-[0_14px_30px_-22px_rgba(245,166,35,0.26)]"
                  : "border-white/10 bg-white/[0.035] hover:border-white/16",
              ].join(" ")}
            >
              <div className="flex items-start gap-4">
                <div
                  className={[
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                    benefit.priority ? "bg-accent text-accent-foreground" : "bg-white/8 text-hero-foreground",
                  ].join(" ")}
                >
                  <benefit.icon size={22} strokeWidth={2.1} />
                </div>

                <div className="min-w-0 pt-0.5">
                  <h3 className="text-[20px] font-semibold leading-[1.2] text-hero-foreground md:text-[22px]">
                    {benefit.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-[1.7] text-hero-muted md:text-[15px]">
                    {benefit.desc}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href="#cotizar"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3.5 text-[15px] font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            Solicitar propuesta para empresa
          </a>
          <p className="mt-3 text-[12px] text-hero-muted/75">Propuesta inicial hasta 72 hs hábiles.</p>
        </div>
      </div>
    </section>
  );
};

export default CompaniesSection;
