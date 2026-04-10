import AnimateOnScroll from "@/components/AnimateOnScroll";
import { StaggerChildren, StaggerItem } from "@/components/StaggerChildren";

const providers = [
  { name: "PAL",      logo: "/logos/PAL.png"        },
  { name: "Piscobot", logo: "/logos/Piscobot.png"    },
  { name: "Nost3rD",  logo: "/logos/Nost3rd.jpg"     },
  { name: "Joaco3D",  logo: "/logos/JOACO3D.png"     },
  { name: "MEGA 3D",  logo: "/logos/Mega3D.jpeg"     },
];

const ProvidersSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container">
        <AnimateOnScroll variant="fade-up">
          <div className="text-center mb-8">
            <h2 className="text-[32px] font-bold leading-[1.08] text-foreground md:text-[42px]">
              Red de proveedores evaluados
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-[16px] leading-[1.7] text-muted-foreground md:text-[18px]">
              Trabajamos con proveedores seleccionados por capacidad técnica, materiales, cumplimiento y calidad.
            </p>
          </div>
        </AnimateOnScroll>

        <StaggerChildren staggerDelay={0.08} className="flex flex-wrap justify-center gap-4 md:gap-5 max-w-4xl mx-auto">
          {providers.map((p) => (
            <StaggerItem key={p.name}>
            <div
              key={p.name}
              className="flex flex-col items-center rounded-xl border border-border bg-card p-4 md:p-5 w-[calc(50%-8px)] sm:w-[calc(33.333%-14px)] md:w-[calc(20%-16px)] min-w-[130px] max-w-[180px]"
            >
              <div className="w-full aspect-[5/3] rounded-lg bg-white border border-border/40 mb-3 flex items-center justify-center overflow-hidden">
                <img
                  src={p.logo}
                  alt={`Logo ${p.name}`}
                  className="w-full h-full object-contain p-2"
                  loading="lazy"
                />
              </div>
              <span className="text-sm font-semibold text-foreground text-center">{p.name}</span>
            </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
};

export default ProvidersSection;
