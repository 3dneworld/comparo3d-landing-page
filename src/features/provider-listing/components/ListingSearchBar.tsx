// ListingSearchBar.tsx — Buscador + Sort inline
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  q: string;
  sort: string;
  onQ: (v: string) => void;
  onSort: (v: string) => void;
}

export function ListingSearchBar({ q, sort, onQ, onSort }: Props) {
  const [inputValue, setInputValue] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external q changes (e.g. URL clear)
  useEffect(() => {
    setInputValue(q);
  }, [q]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onQ(val);
    }, 300);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Buscar por nombre..."
          value={inputValue}
          onChange={handleChange}
          className="h-9 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Sort */}
      <Select value={sort} onValueChange={onSort}>
        <SelectTrigger className="h-9 w-full text-sm sm:w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ranking">Ranking recomendado</SelectItem>
          <SelectItem value="rating">Mejor calificación</SelectItem>
          <SelectItem value="deliver">Entrega más rápida</SelectItem>
          <SelectItem value="alpha">Alfabético</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
