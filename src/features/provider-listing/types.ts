// types.ts — Interfaces para el listado público de proveedores
// Corresponde al shape de GET /api/proveedores con filtros/paginación

export interface ListingProviderLocation {
  localidad: string | null;
  provincia: string | null;
}

export interface ListingProviderPricing {
  min_trabajo_ars: number | null;
  tiempo_entrega_dias: number | null;
}

export interface ListingProviderCamaMm {
  x: number;
  y: number;
  z: number;
}

export interface ListingProviderCapacity {
  cama_max_mm: ListingProviderCamaMm;
  materiales_activos: string[] | null;
}

export interface ListingProviderRating {
  average: number | null;
  count: number;
}

export interface ListingProviderRanking {
  sr_score: number | null;
  mode: string | null;
}

export interface ListingProviderBadge {
  type: string;
  tier: string | null;
  label: string;
}

export interface ListingProvider {
  id: number;
  nombre: string;
  slug_hint: string;
  logo_url: string | null;
  location: ListingProviderLocation;
  rating: ListingProviderRating;
  pricing: ListingProviderPricing;
  capacity: ListingProviderCapacity;
  badges: ListingProviderBadge[];
  industries_served: string[];
  ranking: ListingProviderRanking;
}

export interface ProviderListingResponse {
  items: ListingProvider[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ProviderListingFilters {
  provincia: string;
  material: string;
  badge: string;
  industry: string;
  q: string;
  sort: "ranking" | "rating" | "deliver" | "alpha";
  page: number;
}
