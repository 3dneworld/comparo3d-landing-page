// ProviderListing.tsx — Directorio público de proveedores (/proveedores)
import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, AlertTriangle, RotateCcw } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { fetchProviderListing } from "@/features/provider-listing/api";
import { RankingExplainer } from "@/components/shared/RankingExplainer";
import { ListingHero } from "@/features/provider-listing/components/ListingHero";
import { ListingFilters } from "@/features/provider-listing/components/ListingFilters";
import { ListingSearchBar } from "@/features/provider-listing/components/ListingSearchBar";
import { ListingGrid } from "@/features/provider-listing/components/ListingGrid";
import { ListingPagination } from "@/features/provider-listing/components/ListingPagination";
import { ListingEmptyState } from "@/features/provider-listing/components/ListingEmptyState";
import { ListingSkeleton } from "@/features/provider-listing/components/ListingSkeleton";

const LIMIT = 24;

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <AlertTriangle size={40} className="text-muted-foreground" aria-hidden="true" />
      <p className="text-base font-semibold text-foreground">
        No pudimos cargar el directorio.
      </p>
      <p className="text-sm text-muted-foreground">
        Revisá tu conexión e intentá de nuevo.
      </p>
      <Button variant="outline" onClick={onRetry} className="gap-2">
        <RotateCcw size={14} aria-hidden="true" />
        Reintentar
      </Button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProviderListing() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filters from URL
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const sort = searchParams.get("sort") || "ranking";
  const provincia = searchParams.get("provincia") || "";
  const material = searchParams.get("material") || "";
  const badge = searchParams.get("badge") || "";
  const industry = searchParams.get("industry") || "";
  const q = searchParams.get("q") || "";

  // Update a single filter in URL, reset page to 1
  const setFilter = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        next.delete("page"); // reset to page 1 on filter change
        return next;
      });
    },
    [setSearchParams]
  );

  const clearAllFilters = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams();
      const sortVal = prev.get("sort");
      if (sortVal && sortVal !== "ranking") next.set("sort", sortVal);
      return next;
    });
  }, [setSearchParams]);

  const setPage = useCallback(
    (p: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (p <= 1) {
          next.delete("page");
        } else {
          next.set("page", String(p));
        }
        return next;
      });
    },
    [setSearchParams]
  );

  // Fetch listing — keyed on all filter params
  const filters = { provincia, material, badge, industry, q, sort, page, limit: LIMIT };
  const queryKey = ["provider-listing", filters];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchProviderListing(filters),
    staleTime: 2 * 60 * 1000, // 2 min
    retry: 2,
  });

  // SEO title update
  useEffect(() => {
    const provinciaLabel = provincia ? ` en ${provincia}` : "";
    document.title = `Proveedores certificados${provinciaLabel} · Comparo3D`;
    return () => {
      document.title = "Comparo3D — Cotizá impresión 3D al instante";
    };
  }, [provincia]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const filtersPanel = (
    <ListingFilters
      providers={items}
      provincia={provincia}
      material={material}
      badge={badge}
      industry={industry}
      onProvincia={(v) => setFilter("provincia", v)}
      onMaterial={(v) => setFilter("material", v)}
      onBadge={(v) => setFilter("badge", v)}
      onIndustry={(v) => setFilter("industry", v)}
      onClear={clearAllFilters}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <ListingHero total={isLoading ? 0 : total} />

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Sidebar filtros — desktop */}
          <aside
            className="hidden shrink-0 lg:block"
            style={{ width: 280 }}
            aria-label="Filtros de búsqueda"
          >
            <div className="sticky" style={{ top: 100 }}>
              {filtersPanel}
            </div>
          </aside>

          {/* Main column */}
          <div className="min-w-0 flex-1">
            {/* Toolbar: search + sort + mobile filters button */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Mobile: botón Filtros */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex w-full items-center gap-2 lg:hidden"
                  >
                    <SlidersHorizontal size={14} aria-hidden="true" />
                    Filtros
                    {(provincia || material || badge || industry) && (
                      <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                        {[provincia, material, badge, industry].filter(Boolean).length}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl p-6">
                  <SheetHeader className="mb-4">
                    <SheetTitle>Filtros</SheetTitle>
                  </SheetHeader>
                  {filtersPanel}
                </SheetContent>
              </Sheet>

              {/* Search + sort */}
              <div className="flex-1">
                <ListingSearchBar
                  q={q}
                  sort={sort}
                  onQ={(v) => setFilter("q", v)}
                  onSort={(v) => setFilter("sort", v === "ranking" ? "" : v)}
                />
              </div>
            </div>

            {/* Anchor para scroll de paginación */}
            <div id="listing-grid-top" />

            {/* Results count */}
            {!isLoading && !isError && (
              <p className="mb-4 text-sm text-muted-foreground">
                {total === 0
                  ? "Sin resultados"
                  : `${total} ${total === 1 ? "proveedor" : "proveedores"}`}
              </p>
            )}

            {/* States */}
            {isLoading && <ListingSkeleton />}
            {isError && <ErrorState onRetry={refetch} />}
            {!isLoading && !isError && items.length === 0 && (
              <ListingEmptyState onClear={clearAllFilters} />
            )}
            {!isLoading && !isError && items.length > 0 && (
              <>
                <ListingGrid items={items} />
                <ListingPagination
                  page={page}
                  total={total}
                  limit={LIMIT}
                  hasMore={data?.has_more ?? false}
                  onPage={setPage}
                />
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <RankingExplainer />
    </div>
  );
}
