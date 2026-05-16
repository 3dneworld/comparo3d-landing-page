/**
 * api.ts — Helpers para llamadas al backend Comparo3D (FASE 9)
 */

import { reportClientError } from "./clientErrorReporter";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "";

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
  thumbnail_quality?: "preview" | "full";
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

export interface QuoteOptionBadge {
  badge_type: "seleccion_fundador" | "certificado_organico";
  badge_tier?: string | null;
  granted_at: string;
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
  sr_score?: number;
  ranking_position?: number;
  ranking_mode?: "bootstrap" | "production";
  badges?: QuoteOptionBadge[];
  score_breakdown?: {
    seleccion_fundador: number;
    certificado: number;
    portfolio: number;
    tier_capability: number;
    precio: number;
    rating: number;
    ventas: number;
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

// Cloudflare Free Plan limita uploads a 100MB por POST. Cuando se supera,
// el edge devuelve HTML (sin headers CORS) y el cliente ve errores raros.
// Para evitarlo, archivos >= 95MB usan el flujo "large upload" que sube
// directo a Cloudflare R2 (bypass del tunel) y luego avisa al backend.
const UPLOAD_HARD_LIMIT_BYTES = 100 * 1024 * 1024;
const UPLOAD_SAFE_LIMIT_BYTES = 95 * 1024 * 1024;
// Limite duro del flujo large upload (R2). Por encima se rechaza igual.
const LARGE_UPLOAD_MAX_BYTES = 1024 * 1024 * 1024; // 1 GB

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Decide si el archivo necesita el flujo de large upload. */
export function needsLargeUploadFlow(file: File): boolean {
  return file.size >= UPLOAD_SAFE_LIMIT_BYTES;
}

function buildLargeFileFallbackMessage(file: File): string {
  return (
    `Tu archivo "${file.name}" pesa ${formatBytes(file.size)} y supera el limite ` +
    `de upload directo. No pudimos iniciar el canal alternativo. Por favor ` +
    `escribinos a info@comparo3d.com.ar y te lo cargamos manualmente.`
  );
}

function buildOversizeMessage(file: File): string {
  const limitMB = (LARGE_UPLOAD_MAX_BYTES / 1024 / 1024).toFixed(0);
  return (
    `Tu archivo "${file.name}" pesa ${formatBytes(file.size)} y supera el ` +
    `maximo absoluto de ${limitMB} MB. Para piezas mas grandes, escribinos ` +
    `a info@comparo3d.com.ar.`
  );
}

interface LargeUploadInitResponse {
  success: true;
  url: string;
  r2_key: string;
  expires_in_seconds: number;
  method: "PUT";
  headers: Record<string, string>;
}

/** PUT del archivo directo a R2 con XHR para tener progress events reales. */
function putToR2WithProgress(
  url: string,
  file: File,
  headers: Record<string, string>,
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(event.loaded, event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`R2 PUT fallo HTTP ${xhr.status}: ${xhr.responseText.slice(0, 200)}`));
    };
    xhr.onerror = () => reject(new Error("R2 PUT network error"));
    xhr.onabort = () => reject(new Error("R2 PUT aborted"));
    xhr.send(file);
  });
}

/** Callback opcional para recibir mensajes de step server-side durante el
 *  procesamiento async (download R2 -> manifold -> tweaker -> slicer -> thumbnail).
 *  Se invoca con `(message, pct)` cada vez que el backend reporta progreso.
 *  pct es null cuando el step no tiene metrica numerica.
 */
export type StepProgressCallback = (message: string, pct: number | null) => void;

interface JobStatusResponse {
  job_id: string;
  status: "pending" | "running" | "done" | "error";
  step: string;
  message: string;
  pct: number | null;
  result: UploadResponse | null;
  error: string | null;
  created_at: number;
  updated_at: number;
}

/** Sleep helper para polling. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Hace polling del job hasta que termina o falla. Llama onStep con cada update. */
async function pollLargeUploadJob(
  jobId: string,
  onStep?: StepProgressCallback,
  pollIntervalMs = 1000,
  maxWaitMs = 10 * 60 * 1000,
): Promise<UploadResponse | ApiError> {
  const startedAt = Date.now();
  let lastMessage = "";
  while (Date.now() - startedAt < maxWaitMs) {
    let snapshot: JobStatusResponse;
    try {
      const res = await fetch(`${API_BASE_URL}/api/large-upload/job/${jobId}`);
      if (!res.ok) {
        if (res.status === 404) {
          return { success: false, error: "El procesamiento expiro. Reintenta el upload." };
        }
        await sleep(pollIntervalMs);
        continue;
      }
      snapshot = (await res.json()) as JobStatusResponse;
    } catch {
      await sleep(pollIntervalMs);
      continue;
    }

    if (onStep && snapshot.message && snapshot.message !== lastMessage) {
      onStep(snapshot.message, snapshot.pct);
      lastMessage = snapshot.message;
    } else if (onStep && snapshot.pct !== null && snapshot.message === lastMessage) {
      // Mismo mensaje pero distinto pct → actualizar igual
      onStep(snapshot.message, snapshot.pct);
    }

    if (snapshot.status === "done" && snapshot.result) {
      return snapshot.result;
    }
    if (snapshot.status === "error") {
      return { success: false, error: snapshot.error || "Error procesando el archivo" };
    }
    await sleep(pollIntervalMs);
  }
  return { success: false, error: "El procesamiento tardo mas de lo esperado. Intenta de nuevo." };
}

/** Upload via R2 (bypass Cloudflare 100MB limit). */
export async function uploadStlLarge(
  file: File,
  sessionId?: string,
  onProgress?: (loaded: number, total: number) => void,
  onStep?: StepProgressCallback,
): Promise<UploadResponse | ApiError> {
  const startedAt = Date.now();

  if (file.size > LARGE_UPLOAD_MAX_BYTES) {
    void reportClientError({
      event_type: "large_upload_oversize",
      message: `Cliente intento subir archivo de ${formatBytes(file.size)} (max ${LARGE_UPLOAD_MAX_BYTES})`,
      severity: "warning",
      status: 413,
      error_type: "file_oversize_absolute",
      context: { flow: "quote_upload_large", filename: file.name, file_size: file.size },
    });
    return { success: false, error: buildOversizeMessage(file) };
  }

  // 1. init
  let init: LargeUploadInitResponse;
  try {
    const res = await fetch(`${API_BASE_URL}/api/large-upload/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, size: file.size }),
    });
    if (!res.ok) {
      let errBody: { error?: string } = {};
      try { errBody = await res.json(); } catch { /* ignore */ }
      const errMsg = errBody.error || `Init fallo HTTP ${res.status}`;
      void reportClientError({
        event_type: "large_upload_init_fail",
        message: errMsg,
        severity: "critical",
        status: res.status,
        error_type: "large_upload_init",
        context: { flow: "quote_upload_large", filename: file.name, file_size: file.size },
      });
      // 503 = R2 no configurado en backend → mensaje fallback al cliente
      if (res.status === 503) {
        return { success: false, error: buildLargeFileFallbackMessage(file) };
      }
      return { success: false, error: errMsg };
    }
    init = (await res.json()) as LargeUploadInitResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void reportClientError({
      event_type: "large_upload_init_fail",
      message,
      severity: "critical",
      error_type: "large_upload_init_network",
      context: { flow: "quote_upload_large", filename: file.name, file_size: file.size },
    });
    return { success: false, error: buildLargeFileFallbackMessage(file) };
  }

  // 2. PUT a R2 (bypass de Cloudflare tunnel, con progress real)
  try {
    await putToR2WithProgress(init.url, file, init.headers || {}, onProgress);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void reportClientError({
      event_type: "large_upload_r2_put_fail",
      message,
      severity: "critical",
      error_type: "r2_put",
      context: {
        flow: "quote_upload_large",
        filename: file.name,
        file_size: file.size,
        r2_key: init.r2_key,
        elapsed_ms: Date.now() - startedAt,
      },
    });
    return { success: false, error: "El upload directo se interrumpio. Reintentar puede solucionarlo." };
  }

  // 3. finalize: backend encola job y devuelve job_id. Procesamiento real
  //    corre async en el backend (download R2 -> manifold -> tweaker -> slicer
  //    -> thumbnail). Hacemos polling para mostrar steps al usuario.
  let jobId: string;
  try {
    const res = await fetch(`${API_BASE_URL}/api/large-upload/finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        r2_key: init.r2_key,
        original_filename: file.name,
        session_id: sessionId || "",
      }),
    });
    let data: { success?: boolean; error?: string; job_id?: string } = {};
    try { data = await res.json(); } catch { /* ignore */ }
    if (!res.ok || !data.success || !data.job_id) {
      void reportClientError({
        event_type: "large_upload_finalize_fail",
        message: data.error || `Finalize fallo HTTP ${res.status}`,
        severity: "critical",
        status: res.status,
        error_type: "large_upload_finalize",
        context: {
          flow: "quote_upload_large",
          filename: file.name,
          file_size: file.size,
          r2_key: init.r2_key,
          elapsed_ms: Date.now() - startedAt,
        },
      });
      return { success: false, error: (data.error as string) || "Error al procesar el archivo" };
    }
    jobId = data.job_id;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void reportClientError({
      event_type: "large_upload_finalize_fail",
      message,
      severity: "critical",
      error_type: "large_upload_finalize_network",
      context: { flow: "quote_upload_large", filename: file.name, file_size: file.size },
    });
    return { success: false, error: "No se pudo finalizar el upload. Intenta de nuevo." };
  }

  // 4. polling del job hasta done/error. Llama onStep con cada cambio para
  //    que el UI pueda mostrar "Descargando 42%", "Validando geometria", etc.
  return pollLargeUploadJob(jobId, onStep);
}

/** Upload STL al backend.
 *
 *  - Si file.size < 95 MB: flujo tradicional (multipart POST a /api/upload-and-orient).
 *  - Si file.size >= 95 MB: delega a uploadStlLarge (R2 directo, bypass del
 *    limite 100 MB de Cloudflare Free Plan). Ver needsLargeUploadFlow().
 *
 *  El opcional onProgress solo se invoca en la rama large (upload tradicional
 *  no tiene progress events utiles porque el browser bufferea el multipart).
 */
export async function uploadStl(
  file: File,
  sessionId?: string,
  onProgress?: (loaded: number, total: number) => void,
  onStep?: StepProgressCallback,
): Promise<UploadResponse | ApiError> {
  if (needsLargeUploadFlow(file)) {
    void reportClientError({
      event_type: "upload_routed_to_large",
      message: `Archivo de ${formatBytes(file.size)} routeado a flujo R2 (>=95MB)`,
      severity: "warning",
      error_type: "routing",
      context: {
        flow: "quote_upload",
        filename: file.name,
        file_size: file.size,
        session_id: sessionId || "",
        threshold_bytes: UPLOAD_SAFE_LIMIT_BYTES,
      },
    });
    return uploadStlLarge(file, sessionId, onProgress, onStep);
  }

  const formData = new FormData();
  formData.append("stl_file", file);
  if (sessionId) formData.append("session_id", sessionId);

  const controller = new AbortController();
  const startedAt = Date.now();
  let slowReported = false;
  const slowTimer = window.setTimeout(() => {
    slowReported = true;
    void reportClientError({
      event_type: "upload_slow",
      message: "El upload STL sigue pendiente despues de 45 segundos",
      context: {
        flow: "quote_upload",
        filename: file.name,
        file_size: file.size,
        session_id: sessionId || "",
      },
    });
  }, 45_000);
  const timeoutTimer = window.setTimeout(() => controller.abort(), 180_000);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/upload-and-orient`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
  } catch (error) {
    window.clearTimeout(slowTimer);
    window.clearTimeout(timeoutTimer);
    const isAbort = error instanceof DOMException && error.name === "AbortError";
    const message = error instanceof Error ? error.message : "No se pudo conectar con el servidor";
    void reportClientError({
      event_type: isAbort ? "upload_timeout" : "upload_fetch_error",
      message: isAbort ? "Upload STL supero el timeout del navegador" : message,
      error_type: error instanceof Error ? error.name : "FetchError",
      context: {
        flow: "quote_upload",
        filename: file.name,
        file_size: file.size,
        session_id: sessionId || "",
        elapsed_ms: Date.now() - startedAt,
        slow_reported: slowReported,
      },
    });
    return {
      success: false,
      error: isAbort
        ? "El servidor tardo demasiado en procesar el STL. Ya avisamos al equipo para revisarlo."
        : "No se pudo conectar con el servidor. Ya avisamos al equipo para revisarlo.",
    };
  } finally {
    window.clearTimeout(slowTimer);
    window.clearTimeout(timeoutTimer);
  }

  // Caso defense-in-depth: si el pre-check fallo (ej. tamano declarado < real)
  // y Cloudflare devuelve 413 con HTML, mostramos el mismo mensaje de archivo
  // grande sin intentar parsear JSON (fallaria).
  if (res.status === 413) {
    void reportClientError({
      event_type: "upload_too_large_413",
      message: `Cloudflare rechazo upload con 413 (archivo ${formatBytes(file.size)})`,
      severity: "warning",
      status: 413,
      error_type: "file_too_large",
      context: {
        flow: "quote_upload",
        filename: file.name,
        file_size: file.size,
        session_id: sessionId || "",
        elapsed_ms: Date.now() - startedAt,
      },
    });
    // Edge case: el cliente declaro un size < 95MB pero el archivo real es
    // mayor. Lo derivamos al flujo R2 directamente (en vez de mostrar el
    // mensaje "contactanos por email").
    return uploadStlLarge(file, sessionId);
  }

  // Cloudflare puede devolver HTML para errores 4xx/5xx (524, 502, etc).
  // Si res.json() falla porque no es JSON, no crasheamos al caller.
  let data: { success?: boolean; error?: string } = {};
  try {
    data = await res.json();
  } catch {
    data = { success: false, error: `Respuesta no JSON del servidor (HTTP ${res.status})` };
  }

  if (!res.ok || !data.success) {
    if (res.status >= 500 || res.status === 0) {
      void reportClientError({
        event_type: "upload_failed_response",
        message: data.error || `Upload STL fallo con HTTP ${res.status}`,
        status: res.status,
        context: {
          flow: "quote_upload",
          filename: file.name,
          file_size: file.size,
          session_id: sessionId || "",
          elapsed_ms: Date.now() - startedAt,
        },
      });
    }
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
  thumbnail_quality?: "preview" | "full";
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
  discount?: {
    code: string;
  };
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
  total_amount: number;
  discount?: {
    code: string;
    discount_pct: number;
    discount_amount: number;
    discounted_print_amount: number;
    shipping_amount: number;
  };
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

export interface ValidateDiscountCodeResponse {
  success: true;
  code: string;
  status: "issued" | "reserved";
  expires_at: string;
  issued_at: string;
  discount_pct: number;
  print_amount: number;
  shipping_amount: number;
  discount_amount: number;
  discounted_print_amount: number;
  customer_total: number;
  marketplace_fee_base: number;
  marketplace_fee_final: number;
  provider_payout: number;
}

export async function validateCheckoutDiscountCode(
  sessionId: string,
  request: {
    order_id: string;
    code: string;
    shipping: { price: number };
  }
): Promise<ValidateDiscountCodeResponse | ApiError> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/quotes/${sessionId}/discount-code/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "No pudimos validar el código", status: data.status };
    }
    return data as ValidateDiscountCodeResponse;
  } catch {
    return { success: false, error: "Error de conexión al validar el código" };
  }
}

export interface ClientReviewMetaResponse {
  success: true;
  implemented: true;
  state: "open" | "already_submitted";
  token_payload: {
    order_id: number;
    provider_id: number;
    client_email: string;
  };
  item: {
    id: number;
    public_order_id?: string;
    client_name: string;
    client_email: string;
    order_status: string;
    created_at?: string;
    completed_at?: string | null;
    provider_id: number;
    provider_name: string;
    material?: string;
    cantidad?: string | number;
    color?: string;
    has_review: boolean;
    review?: {
      id: number;
      rating: number;
      comment: string;
      created_at: string;
    } | null;
    discount?: {
      code: string;
      discount_pct: number;
      issued_at: string;
      expires_at: string;
      status: string;
      used_at?: string | null;
    } | null;
  };
}

export interface ClientReviewSubmitResponse {
  success: true;
  state: "submitted";
  review: {
    id: number;
    order_id: number;
    provider_id: number;
    rating: number;
    comment: string;
    created_at: string;
  };
  discount: {
    code: string;
    discount_pct: number;
    issued_at: string;
    expires_at: string;
  };
}

export async function getClientReviewMeta(
  token: string
): Promise<ClientReviewMetaResponse | ApiError> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/client-review/${token}/meta`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "No pudimos cargar la review", status: data.state };
    }
    return data as ClientReviewMetaResponse;
  } catch {
    return { success: false, error: "Error de conexión al cargar la review" };
  }
}

export async function submitClientReview(
  token: string,
  request: { rating: number; comment: string }
): Promise<ClientReviewSubmitResponse | ApiError> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/client-review/${token}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "No pudimos enviar la review", status: data.state };
    }
    return data as ClientReviewSubmitResponse;
  } catch {
    return { success: false, error: "Error de conexión al enviar la review" };
  }
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export interface CatalogItem {
  slug: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  material: string;
  print_time_min: number | null;
  filament_grams: number | null;
  tags: string[];
  trending: boolean;
}

export interface CatalogItemsResponse {
  success: true;
  items: CatalogItem[];
}

export interface QuickQuoteResponse {
  success: true;
  session_id: string;
  temp_name: string;
  stl_sha256: string;
  stl_dimensions: { x: number; y: number; z: number } | null;
  thumbnail_base64: string | null;
  manifold_status: string;
  slicing: {
    slicing_available: boolean;
    print_time_minutes: number;
    filament_grams: number;
    material: string;
    layer_height: string;
    infill: string;
  };
  catalog_item: { slug: string; title: string; material: string };
  from_catalog: boolean;
}

/** Obtener items del catálogo para la galería. */
export async function getCatalogItems(): Promise<CatalogItemsResponse | ApiError> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/catalog/items`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Error al obtener catálogo" };
    }
    return data as CatalogItemsResponse;
  } catch {
    return { success: false, error: "Error de conexión al obtener catálogo" };
  }
}

/** Iniciar cotización rápida desde un item del catálogo. */
export async function quickQuoteFromCatalog(slug: string): Promise<QuickQuoteResponse | ApiError> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/catalog/items/${slug}/quick-quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Error al cargar pieza del catálogo" };
    }
    return data as QuickQuoteResponse;
  } catch {
    return { success: false, error: "Error de conexión al cargar pieza del catálogo" };
  }
}

// ─── Contact ──────────────────────────────────────────────────────────────────

/** Enviar mensaje de contacto desde el chat bubble. */
export async function sendContactMessage(data: {
  name: string;
  email: string;
  message: string;
}): Promise<{ success: true; message: string } | ApiError> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/contact/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      return { success: false, error: result.error || "Error al enviar mensaje" };
    }
    return result as { success: true; message: string };
  } catch {
    return { success: false, error: "Error de conexión" };
  }
}

// ─── Waitlist ─────────────────────────────────────────────────────────────────

/** Suscribirse a la waitlist de una tecnología (resina, SLS, etc.). */
export async function subscribeWaitlist(data: {
  email: string;
  technology: string;
}): Promise<{ success: true; message: string; already_subscribed: boolean } | ApiError> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/waitlist/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      return { success: false, error: result.error || "Error al suscribirse" };
    }
    return result as { success: true; message: string; already_subscribed: boolean };
  } catch {
    return { success: false, error: "Error de conexión" };
  }
}
