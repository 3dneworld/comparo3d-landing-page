// RUM de Core Web Vitals con la librería OFICIAL de Google (`web-vitals`).
// Mide las MISMAS métricas y con las MISMAS APIs del browser que usa Chrome para
// alimentar CrUX — que es el field data con el que Google rankea. Como el sitio
// todavía no está en CrUX (bajo tráfico), recolectamos nosotros desde usuarios
// reales y el backend agrega a p75 (ventana 28d) para el panel SEO → CWV.
//
// Cada métrica se reporta una sola vez, en el momento correcto (LCP/INP/CLS al
// ocultar la página, FCP/TTFB temprano), vía sendBeacon (sobrevive al unload y,
// con text/plain, no dispara preflight CORS).
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";

import { API_BASE_URL } from "@/lib/api";

const ENDPOINT = `${API_BASE_URL}/api/rum/vitals`;

function formFactor(): "mobile" | "desktop" {
  if (typeof window === "undefined") return "mobile";
  const coarse = window.matchMedia?.("(pointer: coarse)").matches;
  return coarse || window.innerWidth < 900 ? "mobile" : "desktop";
}

function send(metric: Metric): void {
  const body = JSON.stringify({
    metric: metric.name, // LCP | INP | CLS | FCP | TTFB
    value: metric.value,
    rating: metric.rating, // good | needs-improvement | poor
    form_factor: formFactor(),
    path: window.location.pathname,
    nav_type: metric.navigationType,
  });
  try {
    if (navigator.sendBeacon) {
      // text/plain → request "simple", sin preflight CORS; fire-and-forget.
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain" }));
      return;
    }
  } catch {
    /* cae al fetch */
  }
  // Fallback: fetch con keepalive (sobrevive al unload).
  fetch(ENDPOINT, {
    method: "POST",
    body,
    keepalive: true,
    headers: { "Content-Type": "text/plain" },
  }).catch(() => {
    /* telemetría: nunca romper la página */
  });
}

export function initWebVitals(): void {
  if (typeof window === "undefined") return;
  onLCP(send);
  onINP(send);
  onCLS(send);
  onFCP(send);
  onTTFB(send);
}
