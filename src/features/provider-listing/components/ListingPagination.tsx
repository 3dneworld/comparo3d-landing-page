// ListingPagination.tsx — Paginación con URL sync y scroll-to-top
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  page: number;
  total: number;
  limit: number;
  hasMore: boolean;
  onPage: (p: number) => void;
}

export function ListingPagination({ page, total, limit, hasMore, onPage }: Props) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  function go(p: number) {
    onPage(p);
    // Scroll to top of grid
    const grid = document.getElementById("listing-grid-top");
    if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <nav
      aria-label="Paginación del directorio"
      className="mt-10 flex items-center justify-center gap-4"
    >
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
        aria-label="Página anterior"
        className="gap-1"
      >
        <ChevronLeft size={14} aria-hidden="true" />
        Anterior
      </Button>

      <span className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        disabled={!hasMore}
        onClick={() => go(page + 1)}
        aria-label="Página siguiente"
        className="gap-1"
      >
        Siguiente
        <ChevronRight size={14} aria-hidden="true" />
      </Button>
    </nav>
  );
}
