// types.ts — Interfaces para el perfil público de proveedor
// Corresponde al shape del endpoint GET /api/proveedores/<id>/profile

export interface ProviderLocation {
  localidad: string | null;
  provincia: string | null;
}

export interface ProviderSocial {
  sitio_web: string | null;
  whatsapp: string | null;
}

export interface ProviderPricing {
  min_trabajo_ars: number | null;
  tiempo_entrega_dias: number | null;
}

export interface ProviderCamaMm {
  x: number;
  y: number;
  z: number;
}

export interface ProviderCapacity {
  cama_max_mm: ProviderCamaMm;
  impresoras_declaradas: number | null;
  materiales_activos: string[] | null;
}

export interface ProviderRatingDistribution {
  "5": number;
  "4": number;
  "3": number;
  "2": number;
  "1": number;
}

export interface ProviderRating {
  average: number | null;
  count: number;
  distribution: ProviderRatingDistribution | null;
}

export interface ProviderRanking {
  sr_score: number | null;
  mode: string | null;
}

export interface PublicProvider {
  id: number;
  nombre: string;
  nombre_comercial: string;
  slug_hint: string;
  logo_url: string | null;
  about: string | null;
  location: ProviderLocation;
  social: ProviderSocial;
  pricing: ProviderPricing;
  capacity: ProviderCapacity;
  rating: ProviderRating;
  ranking: ProviderRanking;
}

export interface PublicProviderBadge {
  type: "seleccion_fundador" | "certificado_organico" | string;
  tier: string | null;
  label: string;
  granted_at: string | null;
}

export interface PortfolioItem {
  id: number;
  photo_url: string | null;
  description: string | null;
  technology: string | null;
  project_type: string | null;
  client_industry: string | null;
}

export interface ReviewItem {
  id: number;
  rating: number;
  comment: string | null;
  is_b2b_order: boolean;
  created_at: string;
  author_display: string;
}

export interface ProviderReviews {
  items: ReviewItem[];
  total: number;
  has_more: boolean;
}

export interface ProviderDerived {
  industries_served: string[];
  project_types: string[];
}

export interface ProviderProfileResponse {
  provider: PublicProvider;
  badges: PublicProviderBadge[];
  portfolio: PortfolioItem[];
  reviews: ProviderReviews;
  derived: ProviderDerived;
}
