/**
 * useAttribution — Captura la atribución de marketing (UTM) en cada cambio de ruta.
 *
 * Debe montarse UNA SOLA VEZ dentro del <BrowserRouter> en App.tsx, junto a
 * useAnalytics. Corre en cada navegación porque el ShortLinkRedirect (/r/<red>)
 * recién agrega los utm_* DESPUÉS del redirect client-side: si solo capturáramos
 * en el load inicial, perderíamos los aterrizajes vía link corto.
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { captureAttributionFromUrl } from "@/lib/attribution";

export const useAttribution = (): void => {
  const location = useLocation();

  useEffect(() => {
    captureAttributionFromUrl(location.search);
  }, [location.pathname, location.search]);
};
