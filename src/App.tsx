import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProviderSummaryView } from "@/features/provider-dashboard/views/ProviderSummaryView";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ProviderDashboardV2 from "./pages/ProviderDashboardV2.tsx";
import ProveedoresLogin from "./pages/ProveedoresLogin.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/proveedores/login" element={<ProveedoresLogin />} />
          <Route path="/proveedores-v2" element={<ProviderDashboardV2 />}>
            <Route path="resumen" element={<ProviderSummaryView />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
