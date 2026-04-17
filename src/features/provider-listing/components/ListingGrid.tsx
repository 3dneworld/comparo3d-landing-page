// ListingGrid.tsx — Grid responsive de tarjetas
import type { ListingProvider } from "../types";
import { ListingCard } from "./ListingCard";

interface Props {
  items: ListingProvider[];
}

export function ListingGrid({ items }: Props) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <ListingCard key={p.id} provider={p} />
      ))}
    </div>
  );
}
