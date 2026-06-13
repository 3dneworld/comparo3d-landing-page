/**
 * attribution.ts — Captura de atribución de marketing (F0).
 *
 * Objetivo: que el backend sepa de qué red social vino el tráfico que termina
 * cotizando/pagando. GA4 mide sesiones, pero no nos da revenue real por sesión.
 * Acá persistimos los UTM en localStorage al aterrizar y los adjuntamos al
 * payload de `initDraft`, así cada quote queda atado a su red de origen.
 *
 * Modelo de atribución: last non-direct click (coincide con la decisión del plan
 * — sección 2: "last-click sobre utm_source"). Cada aterrizaje CON utm_source
 * pisa los valores anteriores; las navegaciones internas (sin utm) no tocan nada.
 * `first_touch_at` se setea una sola vez para conservar el primer contacto.
 */

const ATTRIBUTION_KEY = "comparo3d_attribution_v1";

export interface Attribution {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  landing_referrer: string;
  first_touch_at: string; // ISO 8601 — primer contacto (no se pisa)
  last_touch_at: string; // ISO 8601 — último aterrizaje con utm
}

function readStored(): Partial<Attribution> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ATTRIBUTION_KEY);
    return raw ? (JSON.parse(raw) as Partial<Attribution>) : {};
  } catch {
    return {};
  }
}

/**
 * Lee los utm_* del query string. Si hay un utm_source, persiste/actualiza la
 * atribución (last-click). Idempotente y barato: se puede llamar en cada cambio
 * de ruta. No hace nada si la URL no trae utm_source.
 */
export function captureAttributionFromUrl(search: string): void {
  if (typeof window === "undefined") return;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search || window.location.search);
  } catch {
    return;
  }

  const source = (params.get("utm_source") || "").trim();
  if (!source) return; // landing directo o navegación interna → no tocar

  const prev = readStored();
  const now = new Date().toISOString();

  const next: Attribution = {
    utm_source: source.slice(0, 120),
    utm_medium: (params.get("utm_medium") || "").trim().slice(0, 120),
    utm_campaign: (params.get("utm_campaign") || "").trim().slice(0, 120),
    // Referrer del documento en el momento del aterrizaje con utm.
    landing_referrer: (document.referrer || "").slice(0, 500),
    first_touch_at: prev.first_touch_at || now,
    last_touch_at: now,
  };

  try {
    localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(next));
  } catch {
    /* localStorage lleno o bloqueado — silencioso, no rompe el flujo */
  }
}

/**
 * Devuelve los campos de atribución listos para mergear en el payload de un
 * quote. Vacío si nunca llegó por una red (tráfico directo).
 */
export function getAttributionPayload(): {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  landing_referrer?: string;
  first_touch_at?: string;
} {
  const a = readStored();
  if (!a.utm_source) return {};
  return {
    utm_source: a.utm_source,
    utm_medium: a.utm_medium,
    utm_campaign: a.utm_campaign,
    landing_referrer: a.landing_referrer,
    first_touch_at: a.first_touch_at,
  };
}
