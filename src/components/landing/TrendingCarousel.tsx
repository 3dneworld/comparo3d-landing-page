import { useEffect, useState } from "react";
import { ArrowRight, Layers } from "lucide-react";
import { API_BASE_URL, type CatalogItem } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

const INTERVAL_MS = 6000;

interface TrendingCarouselProps {
  items: CatalogItem[];
  onSelect: (slug: string) => void;
  loadingSlug?: string | null;
}

export default function TrendingCarousel({ items, onSelect, loadingSlug }: TrendingCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (paused || reducedMotion || items.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, reducedMotion, items.length]);

  // Si cambia la cantidad de items, evitar índice fuera de rango
  useEffect(() => {
    setIndex((i) => (i >= items.length ? 0 : i));
  }, [items.length]);

  // GA4: impresión por card visible (señal de conversión por STL)
  useEffect(() => {
    const current = items[index];
    if (current) trackEvent("trending_card_impression", { slug: current.slug });
  }, [index, items]);

  if (items.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Modelos 3D en tendencia"
      className="rounded-2xl border border-border bg-card p-5 md:p-8 shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative overflow-hidden">
        <div
          className="flex"
          style={{
            transform: `translateX(-${index * 100}%)`,
            transition: reducedMotion ? "none" : "transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)",
          }}
        >
          {items.map((item) => (
            <TrendingSlide
              key={item.slug}
              item={item}
              onSelect={onSelect}
              loading={loadingSlug === item.slug}
            />
          ))}
        </div>
        <span className="sr-only" aria-live="polite">
          Modelo {index + 1} de {items.length}
        </span>
      </div>

      {items.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {items.map((item, i) => (
            <button
              key={item.slug}
              onClick={() => setIndex(i)}
              aria-label={`Ver modelo ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index
                  ? "bg-primary w-6"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TrendingSlide({
  item,
  onSelect,
  loading,
}: {
  item: CatalogItem;
  onSelect: (slug: string) => void;
  loading: boolean;
}) {
  return (
    <div className="min-w-full flex-shrink-0 px-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-5 sm:gap-8">
        <Figure src={`${API_BASE_URL}${item.image_url}`} alt={item.title} />
        <div className="flex min-w-0 flex-col items-start gap-4 text-left">
          <h3 className="text-xl md:text-2xl font-semibold break-words">{item.title}</h3>
          <button
            type="button"
            onClick={() => {
              trackEvent("trending_card_click", { slug: item.slug });
              onSelect(item.slug);
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Cargando…" : "Cotizar gratis"}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Figure({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  return (
    <div className="h-52 sm:h-60 md:h-64 rounded-lg bg-white overflow-hidden flex items-center justify-center">
      {errored ? (
        <Layers size={48} className="text-muted-foreground/40" />
      ) : (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-contain"
          loading="lazy"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}
