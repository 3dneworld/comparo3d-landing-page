// ProfilePortfolio.tsx — Grid Webflow-style con lightbox para portfolio
import { useState } from "react";
import { PortfolioLightbox } from "./PortfolioLightbox";
import type { PortfolioItem } from "../types";

interface Props {
  items: PortfolioItem[];
}

export function ProfilePortfolio({ items }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="portfolio-heading" className="mt-10">
      <h2
        id="portfolio-heading"
        className="mb-4 font-[Montserrat] text-xl font-bold text-foreground"
      >
        Trabajos destacados
        <span className="ml-2 text-base font-normal text-muted-foreground">
          · {items.length} {items.length === 1 ? "proyecto" : "proyectos"}
        </span>
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLightboxIndex(index)}
            aria-label={item.description ?? `Trabajo del proveedor ${index + 1}`}
            className="group relative aspect-square overflow-hidden rounded-2xl bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {item.photo_url ? (
              <img
                src={item.photo_url}
                alt={item.description ?? "Trabajo del proveedor"}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                Sin imagen
              </div>
            )}

            {/* Overlay con tag + label en hover — gradiente al mockup */}
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[rgba(14,18,25,0.85)] via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div className="p-4">
                {(item.technology ?? item.project_type) && (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
                    {item.technology ?? item.project_type}
                  </p>
                )}
                {item.description && (
                  <p className="mt-1 line-clamp-2 text-[14px] font-bold text-white">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <PortfolioLightbox
          items={items}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </section>
  );
}
