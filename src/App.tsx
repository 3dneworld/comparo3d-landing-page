import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProviderCertificationView } from "@/features/provider-dashboard/views/ProviderCertificationView";
import { ProviderCompetitivenessView } from "@/features/provider-dashboard/views/ProviderCompetitivenessView";
import { ProviderLogisticsView } from "@/features/provider-dashboard/views/ProviderLogisticsView";
import { ProviderMaterialsView } from "@/features/provider-dashboard/views/ProviderMaterialsView";
import { ProviderOrdersView } from "@/features/provider-dashboard/views/ProviderOrdersView";
import { ProviderPortfolioView } from "@/features/provider-dashboard/views/ProviderPortfolioView";
import { ProviderProductionView } from "@/features/provider-dashboard/views/ProviderProductionView";
import { ProviderProfileView } from "@/features/provider-dashboard/views/ProviderProfileView";
import { ProviderQuotesView } from "@/features/provider-dashboard/views/ProviderQuotesView";
import { ProviderShipmentsView } from "@/features/provider-dashboard/views/ProviderShipmentsView";
import { ProviderSummaryView } from "@/features/provider-dashboard/views/ProviderSummaryView";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ProviderDashboardV2 from "./pages/ProviderDashboardV2.tsx";
import ProveedoresLogin from "./pages/ProveedoresLogin.tsx";
import ProviderListing from "./pages/ProviderListing.tsx";
import ProviderProfile from "./pages/ProviderProfile.tsx";

const queryClient = new QueryClient();
const DASHBOARD_BASE_PATH = "/dashboard/proveedores";

function LegacyProviderDashboardRedirect() {
  const location = useLocation();
  const suffix = location.pathname.replace(/^\/proveedores-v2/, "");
  return <Navigate to={`${DASHBOARD_BASE_PATH}${suffix || ""}${location.search}`} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/materiales" element={<Navigate to={`${DASHBOARD_BASE_PATH}/materiales`} replace />} />
          <Route path="/cotizaciones" element={<Navigate to={`${DASHBOARD_BASE_PATH}/cotizaciones`} replace />} />
          <Route path="/pedidos" element={<Navigate to={`${DASHBOARD_BASE_PATH}/pedidos`} replace />} />
          <Route path="/envios" element={<Navigate to={`${DASHBOARD_BASE_PATH}/envios`} replace />} />
          <Route path="/portfolio" element={<Navigate to={`${DASHBOARD_BASE_PATH}/portfolio`} replace />} />
          <Route path="/certificacion" element={<Navigate to={`${DASHBOARD_BASE_PATH}/certificacion`} replace />} />
          <Route path="/competitividad" element={<Navigate to={`${DASHBOARD_BASE_PATH}/competitividad`} replace />} />
          {/* Directorio público de proveedores */}
          <Route path="/proveedores" element={<ProviderListing />} />
          <Route path="/proveedores/login" element={<ProveedoresLogin />} />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
