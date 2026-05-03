import { useEffect, useState } from "react";
import { ArrowRight, Layers } from "lucide-react";

interface CaseItem {
  slug: string;
  orig: string;
  stl: string;
  alt: string;
}

const CASES: CaseItem[] = [
  { slug: "brick",  orig: "/no-stl/brick-orig.webp", stl: "/no-stl/brick-stl.png", alt: "Ladrillo hueco cerámico" },
  { slug: "dragon", orig: "/no-stl/dragon-orig.jpg", stl: "/no-stl/dragon-stl.png", alt: "Portalápices con forma de dragón" },
  { slug: "joch",   orig: "/no-stl/joch-orig.png",   stl: "/no-stl/joch-stl.png",   alt: "Pieza Joch" },
];

const INTERVAL_MS = 5000;

export default function NoSTLCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % CASES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, reducedMotion]);

  return (
    <div
      role="region"
      aria-label="Ejemplos de modelos generados desde fotos"
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
          {CASES.map((c) => (
            <Slide key={c.slug} item={c} />
          ))}
        </div>
        <span className="sr-only" aria-live="polite">
          Ejemplo {index + 1} de {CASES.length}
        </span>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {CASES.map((c, i) => (
          <button
            key={c.slug}
            onClick={() => setIndex(i)}
            aria-label={`Ver ejemplo ${i + 1}`}
            aria-current={i === index ? "true" : undefined}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index
                ? "bg-primary w-6"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function Slide({ item }: { item: CaseItem }) {
  return (
    <div className="min-w-full flex-shrink-0 px-1">
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 sm:gap-6">
        <Figure src={item.orig} alt={`Foto original: ${item.alt}`} />
        <div className="flex items-center justify-center text-primary" aria-hidden="true">
          <ArrowRight size={40} strokeWidth={2.4} className="hidden sm:block" />
          <ArrowRight size={40} strokeWidth={2.4} className="sm:hidden rotate-90" />
        </div>
        <Figure src={item.stl} alt={`STL generado: ${item.alt}`} />
      </div>
    </div>
  );
}

function Figure({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  return (
    <div className="aspect-[4/3] rounded-lg bg-white overflow-hidden flex items-center justify-center">
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
