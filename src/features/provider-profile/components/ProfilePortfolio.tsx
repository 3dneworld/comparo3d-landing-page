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
            className="group relative aspect-square overflow-hidden rounded-xl bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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

            {/* Overlay con descripción en hover */}
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div className="p-3">
                {item.description && (
                  <p className="line-clamp-2 text-[12px] font-medium text-white">
                    {item.description}
                  </p>
                )}
                {item.technology && (
                  <p className="mt-0.5 text-[10px] text-white/80">
                    {item.technology}
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
