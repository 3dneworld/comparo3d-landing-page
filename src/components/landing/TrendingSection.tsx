import { useEffect, useState } from "react";
import TrendingGrid from "./TrendingGrid";
import { getTrendingItems, isApiError, type CatalogItem } from "@/lib/api";

interface TrendingSectionProps {
  onSelect: (slug: string) => void;
  loadingSlug?: string | null;
}

export default function TrendingSection({ onSelect, loadingSlug }: TrendingSectionProps) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    getTrendingItems().then((res) => {
      if (!active) return;
      if (!isApiError(res)) setItems(res.items);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // No renderizar nada si todavía no cargó o si no hay items (no romper la landing)
  if (!loaded || items.length === 0) return null;

  return (
    <section id="trending" className="py-16 md:py-24 bg-background">
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
