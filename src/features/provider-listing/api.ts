// api.ts — Fetch del listado público de proveedores
import type { ProviderListingResponse, ProviderListingFilters } from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.3dneworld.com";

export async function fetchProviderListing(
  filters: Partial<ProviderListingFilters>
): Promise<ProviderListingResponse> {
  const params = new URLSearchParams();

  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.sort && filters.sort !== "ranking") params.set("sort", filters.sort);
  if (filters.provincia) params.set("provincia", filters.provincia);
  if (filters.material) params.set("material", filters.material);
  if (filters.badge) params.set("badge", filters.badge);
  if (filters.industry) params.set("industry", filters.industry);
  if (filters.q) params.set("q", filters.q);

  // Always send at least limit so we get the new paginated format
  if (!params.has("limit")) params.set("limit", "24");

  const url = `${API_BASE_URL}/api/proveedores?${params.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`HTTP_${res.status}`);
  }

  const data = await res.json();

  // Normalize: backend returns paginated object when params present
  if (data && typeof data === "object" && "items" in data) {
    return data as ProviderListingResponse;
  }

  // Fallback: legacy flat array
  const arr = Array.isArray(data) ? data : [];
  return {
    items: arr,
    total: arr.length,
    page: 1,
    limit: arr.length || 24,
    has_more: false,
  };
}
