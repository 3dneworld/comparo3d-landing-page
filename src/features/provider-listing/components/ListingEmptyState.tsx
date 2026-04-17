// ListingEmptyState.tsx — Estado vacío cuando no hay resultados
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onClear: () => void;
}

export function ListingEmptyState({ onClear }: Props) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <SearchX size={40} className="text-muted-foreground" aria-hidden="true" />
      <p className="text-base font-semibold text-foreground">
        No encontramos proveedores con esos filtros.
      </p>
      <p className="text-sm text-muted-foreground">
        Probá cambiando los criterios o limpiando los filtros.
      </p>
      <Button variant="outline" onClick={onClear}>
        Limpiar filtros
      </Button>
    </div>
  );
}
