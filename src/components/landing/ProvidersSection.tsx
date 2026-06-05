import { useEffect, useState, type CSSProperties } from "react";

import AnimateOnScroll from "@/components/AnimateOnScroll";
import { getLandingProviders, type LandingProvider } from "@/lib/api";

// Fallback hardcodeado por si la API falla. Los onboardings reales van a sobrescribir esto.
const FALLBACK_PROVIDERS = [
  { name: "PROTOTIP", logo: "/logos/Prototip.png", href: "/proveedores/9001-prototip" },
  { name: "NOST3R", logo: "/logos/Nost3rd.jpg", href: "/proveedores/9002-nost3r" },
  { name: "PRINTALOT", logo: "/logos/PAL.png", href: "/proveedores/9003-printalot" },
  { name: "M3GA3D", logo: "/logos/Mega3D.jpeg", href: "/proveedores/9004-m3ga3d" },
  { name: "PISCOBOT", logo: "/logos/Piscobot.png", href: "/proveedores/9005-piscobot" },
];

type DisplayProvider = { name: string; logo: string; href: string };

const ProvidersSection = () => {
  const [providers, setProviders] = useState<DisplayProvider[]>(FALLBACK_PROVIDERS);

  useEffect(() => {
    let cancelled = false;
    getLandingProviders()
      .then((items) => {
        if (cancelled) return;
        if (Array.isArray(items) && items.length > 0) {
          setProviders(items.map((p) => ({ name: p.name, logo: p.logo, href: "" })));
        }
      })
      .catch(() => {
        // Si la API falla mantenemos el FALLBACK que ya está en state.
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
                <div
                  key={provider.name}
                  className="provider-marquee-item text-current"
                  aria-label={provider.name}
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
                  <div
                    key={`${provider.name}-${laneIndex}`}
                    className="provider-marquee-item text-current"
                    aria-label={provider.name}
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
        </AnimateOnScroll>
      </div>
    </section>
  );
};

export default ProvidersSection;
