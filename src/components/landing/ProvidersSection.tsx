import AnimateOnScroll from "@/components/AnimateOnScroll";

const providers = [
  { name: "PAL",      logo: "/logos/PAL.png"        },
  { name: "Piscobot", logo: "/logos/Piscobot.png"    },
  { name: "Nost3rD",  logo: "/logos/Nost3rd.jpg"     },
  { name: "Joaco3D",  logo: "/logos/JOACO3D.png"     },
  { name: "MEGA 3D",  logo: "/logos/Mega3D.jpeg"     },
];

const ProvidersSection = () => {
  return (
    <section className="bg-muted/50 py-16 md:py-24">
      <div className="container">
        <AnimateOnScroll variant="fade-up">
          <div className="mb-10 text-center md:mb-12">
            <h2 className="text-[32px] font-bold leading-[1.08] text-foreground md:text-[42px]">
              Red de proveedores evaluados
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-[16px] leading-[1.7] text-muted-foreground md:text-[18px]">
              Trabajamos con proveedores seleccionados por capacidad técnica, materiales, cumplimiento y calidad.
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll variant="fade-up" delay={0.15}>
          <div className="provider-marquee">
            <div className="provider-marquee-track">
              {[providers, providers].map((group, groupIndex) => (
                <div
                  key={`group-${groupIndex}`}
                  className="provider-marquee-group"
                  aria-hidden={groupIndex === 1}
                >
                  {group.map((provider) => (
                    <div
                      key={`${provider.name}-${groupIndex}`}
                      className="flex shrink-0 flex-col items-center gap-3"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card p-2.5 shadow-sm md:h-20 md:w-20 md:p-3">
                        <img
                          src={provider.logo}
                          alt={`Logo ${provider.name}`}
                          className="h-full w-full object-contain"
                          loading="lazy"
                        />
                      </div>
                      <span className="whitespace-nowrap text-center text-xs font-semibold text-foreground md:text-sm">
                        {provider.name}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
};

export default ProvidersSection;
