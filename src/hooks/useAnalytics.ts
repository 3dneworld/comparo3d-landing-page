/**
 * useAnalytics — Hook para disparar page_view en cada cambio de ruta (SPA).
 *
 * Debe estar montado UNA SOLA VEZ dentro del <BrowserRouter> en App.tsx.
 * Como es SPA, el page_view automático del snippet de GA solo se dispara
 * en la primera carga. Este hook compensa eso.
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

export const useAnalytics = (): void => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname + location.search;
    trackPageView(path);
  }, [location.pathname, location.search]);
};
