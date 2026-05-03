import { type CSSProperties } from "react";
import { Link } from "react-router-dom";

import AnimateOnScroll from "@/components/AnimateOnScroll";

const providers = [
  { name: "JOACO3D", logo: "/logos/JOACO3D.png", href: "/proveedores/9001-joaco3d" },
  { name: "NOST3R", logo: "/logos/Nost3rd.jpg", href: "/proveedores/9002-nost3r" },
  { name: "PRINTALOT", logo: "/logos/PAL.png", href: "/proveedores/9003-printalot" },
  { name: "M3GA3D", logo: "/logos/Mega3D.jpeg", href: "/proveedores/9004-m3ga3d" },
  { name: "PISCOBOT", logo: "/logos/Piscobot.png", href: "/proveedores/9005-piscobot" },
];

const ProvidersSection = () => {

  return (
    <section className="bg-muted/50 py-16 md:py-24">
      <div className="container max-w-6xl">
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
          <div className="provider-marquee-mobile scrollbar-hide">
            <div className="provider-marquee-mobile-track">
              {providers.map((provider) => (
                <Link
                  to={provider.href}
                  key={provider.name}
                  className="provider-marquee-item text-current no-underline"
                  aria-label={`Ver pagina de ${provider.name}`}
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
                </Link>
              ))}
            </div>
          </div>

          <div
            className="provider-marquee-desktop"
            style={{ ["--provider-count" as string]: providers.length } as CSSProperties}
          >
            {[0, 1].map((laneIndex) => (
              <div
                key={`lane-${laneIndex}`}
                className={`provider-marquee-lane ${laneIndex === 0 ? "provider-marquee-lane-a" : "provider-marquee-lane-b"}`}
                aria-hidden={laneIndex === 1}
              >
                {providers.map((provider) => (
                  <Link
                    to={provider.href}
                    key={`${provider.name}-${laneIndex}`}
                    className="provider-marquee-item text-current no-underline"
                    aria-label={`Ver pagina de ${provider.name}`}
                    tabIndex={laneIndex === 1 ? -1 : undefined}
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
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
};

export default ProvidersSection;
