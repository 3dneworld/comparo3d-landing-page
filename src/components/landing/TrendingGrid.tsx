import { useEffect, useRef, useState } from "react";
import { ArrowRight, Layers } from "lucide-react";
import { API_BASE_URL, type CatalogItem } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

interface TrendingGridProps {
  items: CatalogItem[];
  onSelect: (slug: string) => void;
  loadingSlug?: string | null;
}

export default function TrendingGrid({ items, onSelect, loadingSlug }: TrendingGridProps) {
  if (items.length === 0) return null;

  // Velocidad proporcional a la cantidad de cards (≈5s por card) para un scroll parejo.
  const durationSeconds = Math.max(items.length, 4) * 5;

  return (
    <>
      {/* Mobile: scroll manual con swipe */}
      <div className="trending-marquee-mobile scrollbar-hide">
        <div className="trending-marquee-mobile-track">
          {items.map((item) => (
            <div key={item.slug} className="flex-shrink-0 pr-5">
              <TrendingCard
                item={item}
                onSelect={onSelect}
                loading={loadingSlug === item.slug}
                trackImpression
              />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: marquee auto-scroll continuo (pausa en hover) */}
      <div className="trending-marquee-desktop">
        <div
          className="trending-marquee-track"
          style={{ animationDuration: `${durationSeconds}s` }}
        >
          {[0, 1].map((dup) =>
            items.map((item) => (
              <div key={`${item.slug}-${dup}`} className="flex-shrink-0 pr-5" aria-hidden={dup === 1}>
                <TrendingCard
                  item={item}
                  onSelect={onSelect}
                  loading={loadingSlug === item.slug}
                  trackImpression={dup === 0}
                />
              </div>
            )),
          )}
        </div>
      </div>
    </>
  );
}

function TrendingCard({
  item,
  onSelect,
  loading,
  trackImpression,
}: {
  item: CatalogItem;
  onSelect: (slug: string) => void;
  loading: boolean;
  trackImpression: boolean;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const impressionFired = useRef(false);

  // GA4: impresión una sola vez por card cuando entra en viewport (solo set real, no el duplicado)
  useEffect(() => {
    if (!trackImpression) return;
    const node = cardRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      if (!impressionFired.current) {
        impressionFired.current = true;
        trackEvent("trending_card_impression", { slug: item.slug });
      }
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !impressionFired.current) {
            impressionFired.current = true;
            trackEvent("trending_card_impression", { slug: item.slug });
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [item.slug, trackImpression]);

  return (
    <div
      ref={cardRef}
      className="flex w-[260px] flex-col rounded-2xl border border-border bg-card p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <Figure src={`${API_BASE_URL}${item.image_url}`} alt={item.title} />
      <h3 className="mt-3 break-words px-1 text-center text-base font-semibold md:text-lg">
        {item.title}
      </h3>
      <button
        type="button"
        onClick={() => {
          trackEvent("trending_card_click", { slug: item.slug });
          onSelect(item.slug);
        }}
        disabled={loading}
        className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Cargando…" : "Cotizar gratis"}
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

function Figure({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  return (
    <div className="flex aspect-[1.22/1] items-center justify-center overflow-hidden rounded-lg bg-white p-2">
      {errored ? (
        <Layers size={40} className="text-muted-foreground/40" />
      ) : (
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full object-contain"
          loading="lazy"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}
