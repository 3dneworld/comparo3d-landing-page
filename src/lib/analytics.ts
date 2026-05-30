/**
 * Google Analytics 4 (GA4) — Comparo3D
 *
 * Sistema centralizado de tracking. El snippet de gtag.js se carga desde
 * index.html con el Measurement ID definido en VITE_GA_MEASUREMENT_ID.
 *
 * Uso:
 *   - trackPageView se dispara automáticamente en cada cambio de ruta
 *     vía el hook useAnalytics() montado en App.tsx.
 *   - trackEvent('nombre_evento', { ...params }) para eventos custom
 *     (uploads, cotizaciones aceptadas, clicks en CTAs, etc.).
 *
 * Convención de eventos GA4: snake_case, en español o inglés consistente.
 *
 * Si VITE_GA_MEASUREMENT_ID no está definida (dev local sin tracking),
 * las funciones son no-op silenciosas.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

export const isAnalyticsEnabled = (): boolean => {
  return Boolean(GA_MEASUREMENT_ID && typeof window !== "undefined" && typeof window.gtag === "function");
};

/**
 * Dispara un page_view. Llamar manualmente solo si necesitás overridear el path/title;
 * normalmente lo dispara useAnalytics() en cada cambio de ruta.
 */
export const trackPageView = (path: string, title?: string): void => {
  if (!isAnalyticsEnabled() || !GA_MEASUREMENT_ID) return;
  window.gtag?.("event", "page_view", {
    page_path: path,
    page_title: title ?? document.title,
    page_location: window.location.href,
    send_to: GA_MEASUREMENT_ID,
  });
};

/**
 * Dispara un evento custom de GA4.
 * Ejemplo: trackEvent('cotizacion_solicitada', { material: 'PLA', infill: 20 })
 */
export const trackEvent = (
  eventName: string,
  params: Record<string, unknown> = {}
): void => {
  if (!isAnalyticsEnabled()) return;
  window.gtag?.("event", eventName, params);
};

export const GA_ID = GA_MEASUREMENT_ID;
