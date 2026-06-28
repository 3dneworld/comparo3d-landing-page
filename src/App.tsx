import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import { useAnalytics } from "./hooks/useAnalytics";
import { useAttribution } from "./hooks/useAttribution";
import { TEST_MODE_STORAGE_KEY } from "./lib/api";

// ── Lazy routes (Fase A LCP mobile) ──────────────────────────────────────────
// La home `/` (<Index/>) queda EAGER — es la ruta crítica del LCP. Todo lo demás
// (dashboard de proveedor con recharts/@dnd-kit, logins, perfil público, etc.) se
// carga bajo demanda para no embarcarlo en el bundle inicial de la home.
const ProviderDashboardV2 = lazy(() => import("./pages/ProviderDashboardV2.tsx"));
const ProveedoresLogin = lazy(() => import("./pages/ProveedoresLogin.tsx"));
const ProveedoresOnboardingLogin = lazy(() => import("./pages/ProveedoresOnboardingLogin.tsx"));
const ProviderProfile = lazy(() => import("./pages/ProviderProfile.tsx"));
const ClientReviewPage = lazy(() => import("./pages/ClientReviewPage.tsx"));
const TestModePage = lazy(() => import("./pages/TestModePage.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Vistas anidadas del dashboard — exports nombrados, hay que mapearlos a `default`.
const ProviderCertificationView = lazy(() =>
  import("@/features/provider-dashboard/views/ProviderCertificationView").then((m) => ({ default: m.ProviderCertificationView })),
);
const ProviderCompetitivenessView = lazy(() =>
  import("@/features/provider-dashboard/views/ProviderCompetitivenessView").then((m) => ({ default: m.ProviderCompetitivenessView })),
);
const ProviderLogisticsView = lazy(() =>
  import("@/features/provider-dashboard/views/ProviderLogisticsView").then((m) => ({ default: m.ProviderLogisticsView })),
);
const ProviderMaterialsView = lazy(() =>
  import("@/features/provider-dashboard/views/ProviderMaterialsView").then((m) => ({ default: m.ProviderMaterialsView })),
);
const ProviderOrdersView = lazy(() =>
  import("@/features/provider-dashboard/views/ProviderOrdersView").then((m) => ({ default: m.ProviderOrdersView })),
);
const ProviderPortfolioView = lazy(() =>
  import("@/features/provider-dashboard/views/ProviderPortfolioView").then((m) => ({ default: m.ProviderPortfolioView })),
);
const ProviderProductionView = lazy(() =>
  import("@/features/provider-dashboard/views/ProviderProductionView").then((m) => ({ default: m.ProviderProductionView })),
);
const ProviderProfileView = lazy(() =>
  import("@/features/provider-dashboard/views/ProviderProfileView").then((m) => ({ default: m.ProviderProfileView })),
);
const ProviderQuotesView = lazy(() =>
  import("@/features/provider-dashboard/views/ProviderQuotesView").then((m) => ({ default: m.ProviderQuotesView })),
);
const ProviderReviewsView = lazy(() =>
  import("@/features/provider-dashboard/views/ProviderReviewsView").then((m) => ({ default: m.ProviderReviewsView })),
);
const ProviderShipmentsView = lazy(() =>
  import("@/features/provider-dashboard/views/ProviderShipmentsView").then((m) => ({ default: m.ProviderShipmentsView })),
);
const ProviderSummaryView = lazy(() =>
  import("@/features/provider-dashboard/views/ProviderSummaryView").then((m) => ({ default: m.ProviderSummaryView })),
);

// Si llegamos con query param `?w3dn_set_test_mode=on|off` (redirect del backend
// desde /api/dev/test-mode/<action>), aplicar el flag en localStorage y limpiar
// la URL antes de que React Router resuelva la ruta. Asi /test-mode no es
// necesario para activar — funciona desde cualquier URL del dominio.
function applyTestModeFromQuery() {
  if (typeof window === "undefined") return;
  const sp = new URLSearchParams(window.location.search);
  const action = sp.get("w3dn_set_test_mode");
  if (!action) return;
  if (action === "on") localStorage.setItem(TEST_MODE_STORAGE_KEY, "1");
  if (action === "off") localStorage.removeItem(TEST_MODE_STORAGE_KEY);
  // Limpiar query param para no contaminar URLs compartidas
  sp.delete("w3dn_set_test_mode");
  const newUrl = window.location.pathname + (sp.toString() ? `?${sp.toString()}` : "") + window.location.hash;
  window.history.replaceState({}, "", newUrl);
}
applyTestModeFromQuery();

const queryClient = new QueryClient();
const DASHBOARD_BASE_PATH = "/dashboard/proveedores";

function LegacyProviderDashboardRedirect() {
  const location = useLocation();
  const suffix = location.pathname.replace(/^\/proveedores-v2/, "");
  return <Navigate to={`${DASHBOARD_BASE_PATH}${suffix || ""}${location.search}`} replace />;
}

/**
 * Short-link redirects para campanas de marketing.
 * Cada ruta corta /r/<red> redirige a / con utm_source de esa red + utm_campaign + #trending.
 * Mantiene tracking por red en GA4 con URLs faciles de tipear en bio o video.
 *
 * Si la URL trae ?campaign=X, sobreescribe el default. Asi podemos reusar /r/ig en futuras
 * campanas sin tocar codigo: comparo3d.com.ar/r/ig?campaign=fase2 -> utm_campaign=fase2.
 */
const SHORT_LINK_SOURCES: Record<string, string> = {
  ig: "instagram",
  fb: "facebook",
  fbg: "facebook_grupo",
  tt: "tiktok",
  tw: "twitter",
};
const DEFAULT_SHORT_LINK_CAMPAIGN = "mundial2026";

function ShortLinkRedirect() {
  const location = useLocation();
  const sourceKey = location.pathname.replace(/^\/r\//, "").toLowerCase();
  const utmSource = SHORT_LINK_SOURCES[sourceKey];
  if (!utmSource) {
    // Slug desconocido: tirar al home sin UTMs y dejar que el hash decida (si vino con uno).
    return <Navigate to={`/${location.search}${location.hash || "#trending"}`} replace />;
  }
  const incoming = new URLSearchParams(location.search);
  const campaign = incoming.get("campaign") || DEFAULT_SHORT_LINK_CAMPAIGN;
  const out = new URLSearchParams();
  out.set("utm_source", utmSource);
  out.set("utm_medium", "organic");
  out.set("utm_campaign", campaign);
  // Preservar otros params que el user haya pasado (ej tracking experimental).
  incoming.forEach((value, key) => {
    if (key !== "campaign" && !out.has(key)) out.set(key, value);
  });
  return <Navigate to={`/?${out.toString()}#trending`} replace />;
}

/**
 * Envuelve <Routes /> y dispara page_view de Google Analytics en cada cambio de ruta.
 * Debe estar dentro del <BrowserRouter> para que useLocation() funcione.
 */
function AppRoutes({ children }: { children: React.ReactNode }) {
  useAnalytics();
  useAttribution();
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes>
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* Short links de marketing — redirigen a / con utm_source de la red. */}
          <Route path="/r/:source" element={<ShortLinkRedirect />} />
          {/* Campaña email "Adorni" — fallback SPA (el Worker la intercepta en prod). Cae en paso 1 (#cotizar). */}
          <Route path="/adorni" element={<Navigate to="/?utm_source=email&utm_medium=email&utm_campaign=adorni#cotizar" replace />} />
          <Route path="/materiales" element={<Navigate to={`${DASHBOARD_BASE_PATH}/materiales`} replace />} />
          <Route path="/cotizaciones" element={<Navigate to={`${DASHBOARD_BASE_PATH}/cotizaciones`} replace />} />
          <Route path="/pedidos" element={<Navigate to={`${DASHBOARD_BASE_PATH}/pedidos`} replace />} />
          <Route path="/envios" element={<Navigate to={`${DASHBOARD_BASE_PATH}/envios`} replace />} />
          <Route path="/portfolio" element={<Navigate to={`${DASHBOARD_BASE_PATH}/portfolio`} replace />} />
          <Route path="/resenas" element={<Navigate to={`${DASHBOARD_BASE_PATH}/resenas`} replace />} />
          <Route path="/certificacion" element={<Navigate to={`${DASHBOARD_BASE_PATH}/certificacion`} replace />} />
          <Route path="/competitividad" element={<Navigate to={`${DASHBOARD_BASE_PATH}/competitividad`} replace />} />
          {/* Directorio público de proveedores — redirige a landing hasta versión final */}
          <Route path="/proveedores" element={<Navigate to="/" replace />} />
          <Route path="/proveedores/login" element={<ProveedoresLogin />} />
          <Route path="/proveedores/onboarding/login" element={<ProveedoresOnboardingLogin />} />
          <Route path="/client-review/:token" element={<ClientReviewPage />} />
          <Route path="/test-mode" element={<TestModePage />} />
          <Route path={DASHBOARD_BASE_PATH} element={<ProviderDashboardV2 />}>
            <Route path="resumen" element={<ProviderSummaryView />} />
            <Route path="perfil" element={<ProviderProfileView />} />
            <Route path="produccion" element={<ProviderProductionView />} />
            <Route path="materiales" element={<ProviderMaterialsView />} />
            <Route path="logistica" element={<ProviderLogisticsView />} />
            <Route path="cotizaciones" element={<ProviderQuotesView />} />
            <Route path="pedidos" element={<ProviderOrdersView />} />
            <Route path="envios" element={<ProviderShipmentsView />} />
            <Route path="portfolio" element={<ProviderPortfolioView />} />
            <Route path="resenas" element={<ProviderReviewsView />} />
            <Route path="certificacion" element={<ProviderCertificationView />} />
            <Route path="competitividad" element={<ProviderCompetitivenessView />} />
          </Route>
          <Route path="/proveedores-v2" element={<LegacyProviderDashboardRedirect />} />
          <Route path="/proveedores-v2/*" element={<LegacyProviderDashboardRedirect />} />
          {/* Perfil público de proveedor — /proveedores/42-proveedor-nombre */}
          <Route path="/proveedores/:idslug" element={<ProviderProfile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </AppRoutes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
