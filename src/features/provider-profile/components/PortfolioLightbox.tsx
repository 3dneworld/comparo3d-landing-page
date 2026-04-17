// PortfolioLightbox.tsx — Dialog lightbox para portfolio con navegación ← →
import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { PortfolioItem } from "../types";

interface Props {
  items: PortfolioItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function PortfolioLightbox({
  items,
  currentIndex,
  onClose,
  onNavigate,
}: Props) {
  const item = items[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && hasPrev) onNavigate(currentIndex - 1);
      if (e.key === "ArrowRight" && hasNext) onNavigate(currentIndex + 1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, hasPrev, hasNext, onNavigate]);

  if (!item) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl overflow-hidden p-0">
        <DialogTitle className="sr-only">
          {item.description ?? "Imagen del portfolio"}
        </DialogTitle>

        <div className="relative">
          {/* Imagen */}
          {item.photo_url ? (
            <img
              src={item.photo_url}
              alt={item.description ?? "Trabajo del proveedor"}
              className="max-h-[70vh] w-full object-contain bg-black/90"
              loading="lazy"
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center bg-muted text-muted-foreground text-sm">
              Sin imagen disponible
            </div>
          )}

          {/* Botón cerrar */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar lightbox"
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Navegación */}
          {hasPrev && (
            <button
              type="button"
              onClick={() => onNavigate(currentIndex - 1)}
              aria-label="Imagen anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {hasNext && (
            <button
              type="button"
              onClick={() => onNavigate(currentIndex + 1)}
              aria-label="Siguiente imagen"
              className="absolute right-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* Metadata */}
        <div className="p-5">
          {item.description && (
            <p className="mb-3 text-sm leading-relaxed text-foreground">
              {item.description}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {item.technology && (
              <Badge variant="secondary" className="rounded-full text-[11px]">
                {item.technology}
              </Badge>
            )}
            {item.project_type && (
              <Badge variant="secondary" className="rounded-full text-[11px]">
                {item.project_type}
              </Badge>
            )}
            {item.client_industry && (
              <Badge variant="secondary" className="rounded-full text-[11px]">
                {item.client_industry}
              </Badge>
            )}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            {currentIndex + 1} / {items.length}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
