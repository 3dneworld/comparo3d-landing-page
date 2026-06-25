/**
 * catalogTracking.ts — Tracking server-side del funnel STL Trending (Comparo3D, Fase 7).
 *
 * Espeja en nuestra DB (catalog_events vía POST /api/catalog/track) los mismos hitos que ya
 * mandamos a GA4 con trackEvent(), más `provider_selected` que GA4 no tenía. Es complementario
 * a GA4, no lo reemplaza.
 *
 * Diseño (honra el contrato documentado en modules/catalog_tracking_db.track_events_batch):
 *   - impression: alto volumen → se bufferea y se manda en batch (flush por tamaño o debounce),
 *     con dedupe por (slug) en la sesión de página (el server es append-only, no deduplica).
 *   - click / quote_viewed / provider_selected: bajo volumen / alto valor → por-evento, sin batch.
 *
 * Best-effort puro: NUNCA tira una excepción ni rompe la UI. Usa sendBeacon (sobrevive al
 * cierre/navegación de la pestaña) con fallback a fetch keepalive. Errores de red se tragan.
 */
import { API_BASE_URL } from "@/lib/api";

type CatalogEventType = "impression" | "click" | "quote_viewed" | "provider_selected";

interface CatalogEventPayload {
  event_type: CatalogEventType;
  slug: string;
  session_id?: string;
  provider_id?: number;
  meta?: Record<string, unknown>;
}

const TRACK_URL = `${API_BASE_URL}/api/catalog/track`;

// Dedupe de impresiones en la sesión de página (clave: slug).
const sentImpressions = new Set<string>();

// Buffer de impresiones + debounce de flush.
let impressionBuffer: CatalogEventPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_DEBOUNCE_MS = 2000;
const FLUSH_MAX_BATCH = 10;

function post(body: unknown): void {
  try {
    const payload = JSON.stringify(body);
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const ok = navigator.sendBeacon(TRACK_URL, new Blob([payload], { type: "application/json" }));
      if (ok) return;
    }
    if (typeof fetch === "function") {
      void fetch(TRACK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {
        /* best-effort: el tracking jamás rompe la UI */
      });
    }
  } catch {
    /* best-effort */
  }
}

function flushImpressions(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (impressionBuffer.length === 0) return;
  const events = impressionBuffer;
  impressionBuffer = [];
  post({ events });
}

/** Registra una impresión de card del carrousel (batcheada + dedup por slug en la sesión). */
export function trackCatalogImpression(slug: string): void {
  if (!slug) return;
  if (sentImpressions.has(slug)) return;
  sentImpressions.add(slug);
  impressionBuffer.push({ event_type: "impression", slug });
  if (impressionBuffer.length >= FLUSH_MAX_BATCH) {
    flushImpressions();
    return;
  }
  if (!flushTimer) {
    flushTimer = setTimeout(flushImpressions, FLUSH_DEBOUNCE_MS);
  }
}

/** Registra un evento por-evento (click / quote_viewed / provider_selected). */
export function trackCatalogEvent(
  eventType: Exclude<CatalogEventType, "impression">,
  slug: string,
  opts: { sessionId?: string; providerId?: number; meta?: Record<string, unknown> } = {},
): void {
  if (!slug) return;
  const payload: CatalogEventPayload = { event_type: eventType, slug };
  if (opts.sessionId) payload.session_id = opts.sessionId;
  if (typeof opts.providerId === "number") payload.provider_id = opts.providerId;
  if (opts.meta) payload.meta = opts.meta;
  post(payload);
}

// Flush de impresiones bufferadas si el usuario oculta/cierra la pestaña.
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushImpressions);
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushImpressions();
    });
  }
}
