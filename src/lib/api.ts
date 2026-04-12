/**
 * api.ts — Helpers para llamadas al backend Comparo3D (FASE 9)
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.3dneworld.com";

// Log de diagnóstico — visible en Console al cargar la app
console.log(
  `[API] Base URL: ${API_BASE_URL}`,
  API_BASE_URL.includes("localhost") ? "✓ LOCAL" : "⚠ PRODUCCION"
);

export interface LandingProvider {
  name: string;
  logo: string;
  provider_id?: number | null;
  source?: string;
}

export async function getLandingProviders(): Promise<LandingProvider[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/public/landing-providers`);
    const data = await res.json();
    if (!res.ok || !data.success || !Array.isArray(data.items)) {
      return [];
    }
    return data.items as LandingProvider[];
  } catch {
    return [];
  }
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
  field?: string;
  needs_reupload?: boolean;
  status?: string;
  message?: string;
  slicing_status?: string;
  http_status?: number;
}

export interface UploadResponse {
  success: true;
  temp_name: string;
  session_id: string;
  stl_sha256: string;
  stl_dimensions: { x: number; y: number; z: number } | null;
  dimensions: { x: number; y: number; z: number } | null;
  thumbnail_base64: string | null;
  manifold_status: "ok" | "repaired" | "failed";
  slicing: {
    slicing_available: boolean;
    print_time_minutes: number;
    filament_grams: number;
    piece_too_large?: boolean;
  };
  from_upload_cache?: boolean;
}

export interface InitDraftResponse {
  success: true;
  quote_uid: string;
  quote_id: number;
  session_id: string;
  status: string;
  slicing_status: string;
  message: string;
}

export interface QuoteOption {
  quote_option_uid: string;
  provider_id: number;
  provider_name: string;
  provider_score: number;
  provider_tier: string;
  provider_location: string;
  provider_lat?: number | null;
  provider_lng?: number | null;
  price_ars: number;
  delivery_days: number;
  logo_url: string;
  is_certified: boolean;
  trust_metrics: {
    score: number;
    reviews_count: number;
    on_time_pct: number;
  };
}

export interface QuoteOptionsResponse {
  success: true;
  session_id: string;
  quote_uid: string;
  slicing_status: "completed";
  total_time_minutes: number;
  material: string;
  cantidad: number;
  stl_dimensions: { x: number; y: number; z: number } | null;
  infill: string;
  layer_height: string;
  quotes: QuoteOption[];
}

export interface UpdateQuantityResponse {
  success: true;
  session_id: string;
  cantidad: number;
  slicing_status: string;
  message: string;
}

export interface QuoteOptionsProcessing {
  success: false;
  status: "processing";
  slicing_status: string;
  message: string;
  eta_seconds: number;
}

export interface AcceptQuoteResponse {
  success: true;
  order_id: string;
  session_id: string;
  quote_option_uid: string;
  provider_name: string;
  total_amount: number;
  currency: string;
  delivery_days: number;
  status: string;
  message: string;
  checkout_url: string;
}

/** Upload STL al backend. */
export async function uploadStl(file: File, sessionId?: string): Promise<UploadResponse | ApiError> {
  const formData = new FormData();
  formData.append("stl_file", file);
  if (sessionId) formData.append("session_id", sessionId);

  const res = await fetch(`${API_BASE_URL}/api/upload-and-orient`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    return { success: false, error: data.error || "Error al procesar el archivo" };
  }
  return data as UploadResponse;
}

/** Guardar draft de cotización con datos del cliente. Dispara slicing en background. */
export async function initDraft(payload: {
  session_id: string;
  temp_name: string;
  stl_sha256?: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_location?: string;
  material: string;
  cantidad: string;
  project_details?: string;
  color_acabado?: string;
  urgencia?: string;
  observaciones?: string;
  infill?: string;
  layer_height?: string;
}): Promise<InitDraftResponse | ApiError> {
  const res = await fetch(`${API_BASE_URL}/api/quotes/init-draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    return { success: false, error: data.error || "Error guardando cotización" };
  }
  if (!data.success) {
    return { success: false, error: data.error || "Error guardando cotización" };
  }
  return data as InitDraftResponse;
}

/** Obtener opciones de cotización. Devuelve 202 si sigue procesando. */
export async function getQuoteOptions(
  sessionId: string
): Promise<QuoteOptionsResponse | QuoteOptionsProcessing | ApiError> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/quotes/${sessionId}/options`);
    const data = await res.json();

    if (res.status === 202 || (data?.success === false && data?.status === "processing")) {
      return {
        success: false,
        status: "processing",
        slicing_status: data.slicing_status || "processing",
        message: data.message || "Procesando...",
        eta_seconds: data.eta_seconds || 5,
      };
    }

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || data.message || "Error obteniendo cotizaciones",
        status: data.status,
        message: data.message,
        slicing_status: data.slicing_status,
        http_status: res.status,
      };
    }

    return data as QuoteOptionsResponse;
  } catch {
    return { success: false, error: "No se pudo conectar con el servidor. Verificá tu conexión." };
  }
}

/** Re-cotizar la sesión con una nueva cantidad de piezas. */
export async function updateQuantity(
  sessionId: string,
  cantidad: number
): Promise<UpdateQuantityResponse | ApiError> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/quotes/${sessionId}/update-quantity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cantidad }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || data.message || "Error actualizando la cantidad",
        field: data.field,
        needs_reupload: Boolean(data.needs_reupload),
        http_status: res.status,
      };
    }
    return data as UpdateQuantityResponse;
  } catch {
    return { success: false, error: "No se pudo conectar con el servidor para recalcular la cotización." };
  }
}

/** Aceptar una cotización y obtener order_id. */
export async function acceptQuote(
  sessionId: string,
  quoteOptionUid: string
): Promise<AcceptQuoteResponse | ApiError> {
  const res = await fetch(`${API_BASE_URL}/api/quotes/${sessionId}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quote_option_uid: quoteOptionUid }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    return { success: false, error: data.error || "Error aceptando cotización" };
  }
  return data as AcceptQuoteResponse;
}

export interface ThumbnailResponse {
  success: true;
  thumbnail_base64: string;
  source: "cache" | "regenerated";
  stl_source?: string;
}

/** Obtener thumbnail del STL de una sesión (desde cache o regenerado en backend). */
export async function getThumbnail(
  sessionId: string
): Promise<ThumbnailResponse | ApiError> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/quotes/${sessionId}/thumbnail`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || "Thumbnail no disponible",
        needs_reupload: Boolean(data.needs_reupload),
        http_status: res.status,
      };
    }
    return data as ThumbnailResponse;
  } catch {
    return { success: false, error: "Error de conexión al obtener thumbnail" };
  }
}

export function isApiError(r: unknown): r is ApiError {
  if (typeof r !== "object" || r === null) return false;
  const candidate = r as ApiError | QuoteOptionsProcessing;
  return (
    candidate.success === false &&
    candidate.status !== "processing" &&
    (typeof (candidate as ApiError).error === "string" ||
      typeof (candidate as ApiError).message === "string")
  );
}

// ─── Shipping ────────────────────────────────────────────────────────────────

export interface ShippingMethod {
  id: string;
  name: string;
  eta_days: number;
  description?: string;
}

export interface ShippingMethodsResponse {
  success: true;
  methods: ShippingMethod[];
}

export interface ShippingEstimateRequest {
  method_id: string;
  postal_code: string;
  province?: string;
}

export interface ShippingEstimateResponse {
  success: true;
  method_id: string;
  price: number;
  eta_days: number;
  currency: string;
}

export interface AddressProvince {
  id: string;
  name: string;
  correo_code: string;
}

export interface AddressLocality {
  id: string;
  name: string;
  municipality_id: string;
  municipality_name: string;
  department_id: string;
  department_name: string;
  province_id: string;
  province_name: string;
  display_name: string;
}

export interface GeocodeAddressRequest {
  street: string;
  number: string;
  floor?: string;
  city: string;
  postal_code: string;
  province: string;
}

export interface GeocodeAddressResponse {
  success: true;
  lat: number;
  lng: number;
  display_name?: string;
}

export interface NormalizeAddressRequest {
  street: string;
  number: string;
  floor?: string;
  locality: string;
  locality_id?: string;
  province: string;
  province_id?: string;
  postal_code: string;
}

export interface NormalizeAddressResponse {
  success: true;
  validated: boolean;
  normalized: {
    street_name: string;
    street_number: string;
    locality_name: string;
    locality_id: string;
    municipality_name: string;
    department_name: string;
    province_id: string;
    province_name: string;
    correo_province_code: string;
    postal_code_input: string;
    postal_code: string;
    correo_cpa?: string;
    address_line1: string;
    address_line2: string;
    full_address: string;
    lat?: number | null;
    lng?: number | null;
  };
  validation: {
    georef_status: string;
    correo_status: string;
    correo_configured: boolean;
    source: string;
    message: string;
    correo_summary?: Record<string, unknown>;
  };
}

/** Obtener métodos de envío disponibles. */
export async function getShippingMethods(): Promise<ShippingMethodsResponse | ApiError> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/shipping/methods`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Error al obtener métodos de envío" };
    }
    return data as ShippingMethodsResponse;
  } catch {
    return { success: false, error: "Error de conexión al obtener métodos de envío" };
  }
}

/** Estimar precio de envío dado método + CP. */
export async function getShippingEstimate(
  request: ShippingEstimateRequest
): Promise<ShippingEstimateResponse | ApiError> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/shipping/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Error al calcular envío" };
    }
    return data as ShippingEstimateResponse;
  } catch {
    return { success: false, error: "Error de conexión al calcular envío" };
  }
}

// ─── Checkout (MercadoPago) ──────────────────────────────────────────────────

export async function geocodeAddress(
  request: GeocodeAddressRequest
): Promise<GeocodeAddressResponse | ApiError> {
  try {
    const q = [
      `${request.street} ${request.number}`.trim(),
      request.floor?.trim(),
      request.city.trim(),
      request.postal_code.trim(),
      request.province.trim(),
      "Argentina",
    ]
      .filter(Boolean)
      .join(", ");

    const params = new URLSearchParams({
      format: "jsonv2",
      limit: "1",
      countrycodes: "ar",
      q,
    });

    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    const data = await res.json();

    if (!res.ok || !Array.isArray(data) || data.length === 0) {
      return { success: false, error: "No pudimos ubicar ese domicilio. Revisa los datos e intenta de nuevo." };
    }

    const first = data[0] as { lat?: string; lon?: string; display_name?: string };
    const lat = Number(first.lat);
    const lng = Number(first.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { success: false, error: "No pudimos convertir ese domicilio en una ubicacion valida." };
    }

    return { success: true, lat, lng, display_name: first.display_name };
  } catch {
    return { success: false, error: "No se pudo validar tu domicilio en este momento." };
  }
}

export async function getAddressProvinces(): Promise<{ success: true; items: AddressProvince[] } | ApiError> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/address/provinces`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || "No pudimos validar la dirección",
        details: data.details,
      };
      return { success: false, error: data.error || "Error al obtener provincias" };
    }
    return data as { success: true; items: AddressProvince[] };
  } catch {
    return { success: false, error: "Error de conexión al obtener provincias" };
  }
}

export async function searchAddressLocalities(params: {
  province_id?: string;
  province?: string;
  q?: string;
  max?: number;
}): Promise<{ success: true; items: AddressLocality[] } | ApiError> {
  try {
    const query = new URLSearchParams();
    if (params.province_id) query.set("province_id", params.province_id);
    if (params.province) query.set("province", params.province);
    if (params.q) query.set("q", params.q);
    if (typeof params.max === "number") query.set("max", String(params.max));

    const res = await fetch(`${API_BASE_URL}/api/address/localities?${query.toString()}`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Error al buscar localidades" };
    }
    return data as { success: true; items: AddressLocality[] };
  } catch {
    return { success: false, error: "Error de conexión al buscar localidades" };
  }
}

export async function getPostalLocalityCandidates(params: {
  province_id?: string;
  province?: string;
  postal_code: string;
}): Promise<{ success: true; items: AddressLocality[] } | ApiError> {
  try {
    const query = new URLSearchParams();
    if (params.province_id) query.set("province_id", params.province_id);
    if (params.province) query.set("province", params.province);
    query.set("postal_code", params.postal_code);

    const res = await fetch(`${API_BASE_URL}/api/address/postal-candidates?${query.toString()}`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Error al sugerir localidades por codigo postal" };
    }
    return data as { success: true; items: AddressLocality[] };
  } catch {
    return { success: false, error: "Error de conexión al sugerir localidades por codigo postal" };
  }
}

export async function normalizeAddress(
  request: NormalizeAddressRequest
): Promise<NormalizeAddressResponse | ApiError> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/address/normalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "No pudimos validar la dirección" };
    }
    return data as NormalizeAddressResponse;
  } catch {
    return { success: false, error: "Error de conexión al validar la dirección" };
  }
}

export interface CheckoutAddress {
  street: string;
  number: string;
  floor?: string;
  city: string;
  postal_code: string;
  province: string;
  locality_id?: string;
  province_id?: string;
}

export interface CreateCheckoutRequest {
  order_id: string;
  shipping: {
    method_id: string;
    price: number;
    eta_days: number;
    address?: CheckoutAddress;
  };
}

export interface CreateCheckoutResponse {
  success: true;
  init_point: string;
  preference_id: string;
  order_id: string;
}

/** Crear preferencia de pago en MercadoPago y obtener init_point. */
export async function createCheckout(
  sessionId: string,
  request: CreateCheckoutRequest
): Promise<CreateCheckoutResponse | ApiError> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/quotes/${sessionId}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Error al iniciar el pago" };
    }
    return data as CreateCheckoutResponse;
  } catch {
    return { success: false, error: "Error de conexión al iniciar el pago" };
  }
}
