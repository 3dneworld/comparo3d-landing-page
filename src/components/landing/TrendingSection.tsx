import { useEffect, useRef, useState } from "react";
import TrendingGrid from "./TrendingGrid";
import { getTrendingItems, isApiError, type CatalogItem } from "@/lib/api";

interface TrendingSectionProps {
  onSelect: (slug: string) => void;
  loadingSlug?: string | null;
  /** Callback que recibe los items cuando se cargan. Permite al parent pre-cachear thumbnails y leer defaults. */
  onItemsLoaded?: (items: CatalogItem[]) => void;
}

export default function TrendingSection({ onSelect, loadingSlug, onItemsLoaded }: TrendingSectionProps) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const hashScrolledRef = useRef(false);

  useEffect(() => {
    let active = true;
    getTrendingItems().then((res) => {
      if (!active) return;
      if (!isApiError(res)) {
        setItems(res.items);
        onItemsLoaded?.(res.items);
      }
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si la URL trae #trending y la sección renderiza tarde (lazy items), scrollear acá.
  // Sin esto el browser intenta scrollear cuando el elemento todavía no existe en el DOM.
  useEffect(() => {
    if (!loaded || items.length === 0) return;
    if (hashScrolledRef.current) return;
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#trending") return;
    hashScrolledRef.current = true;
    requestAnimationFrame(() => {
      document.getElementById("trending")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [loaded, items.length]);

  // No renderizar nada si todavía no cargó o si no hay items (no romper la landing)
  if (!loaded || items.length === 0) return null;

  return (
    <section id="trending" className="scroll-mt-24 md:scroll-mt-28 py-16 md:py-24 bg-background">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Modelos en tendencia</h2>
          <p className="mt-3 text-muted-foreground">
            Elegí un modelo y cotizalo gratis al instante.
          </p>
        </div>
        <TrendingGrid items={items} onSelect={onSelect} loadingSlug={loadingSlug} />
      </div>
    </section>
  );
}
