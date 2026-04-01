/**
 * api.ts — Helpers para llamadas al backend Comparo3D (FASE 9)
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.3dneworld.com";

export interface ApiError {
  success: false;
  error: string;
  details?: string;
  field?: string;
  needs_reupload?: boolean;
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
  price_ars: number;
  delivery_days: number;
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
  quotes: QuoteOption[];
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
  uso_pieza?: string;
  urgencia?: string;
  tolerancia?: string;
  observaciones?: string;
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
  const res = await fetch(`${API_BASE_URL}/api/quotes/${sessionId}/options`);
  const data = await res.json();

  if (res.status === 202) {
    return {
      success: false,
      status: "processing",
      slicing_status: data.slicing_status || "processing",
      message: data.message || "Procesando...",
      eta_seconds: data.eta_seconds || 5,
    };
  }

  if (!res.ok || !data.success) {
    return { success: false, error: data.error || "Error obteniendo cotizaciones" };
  }

  return data as QuoteOptionsResponse;
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

export function isApiError(r: unknown): r is ApiError {
  return typeof r === "object" && r !== null && (r as ApiError).success === false;
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

export interface CheckoutAddress {
  street: string;
  number: string;
  floor?: string;
  city: string;
  postal_code: string;
  province: string;
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
