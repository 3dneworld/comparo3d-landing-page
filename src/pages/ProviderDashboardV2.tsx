import { Navigate, Outlet, useLocation } from "react-router-dom";
import { SearchCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProviderDashboardShell } from "@/features/provider-dashboard/components/ProviderDashboardShell";
import {
  DashboardEmptyState,
  DashboardLoadingState,
} from "@/features/provider-dashboard/components/DashboardStates";
import {
  ProviderDashboardSessionProvider,
  useProviderDashboardSession,
} from "@/features/provider-dashboard/context/ProviderDashboardSessionContext";

function ProviderDashboardRouteContent() {
  const location = useLocation();
  const session = useProviderDashboardSession();
  const loginTarget = `/proveedores/login?next=${encodeURIComponent(
    `${location.pathname}${location.search}`
  )}`;

  if (session.isLoading) {
    return <DashboardLoadingState />;
  }

  if (session.isUnauthorized || session.error) {
    return <Navigate to={loginTarget} replace />;
  }

  if (session.requiresProviderSelection) {
    return (
      <DashboardEmptyState
        title="Falta resolver el proveedor actual"
        description="Para cuentas admin, esta etapa piloto requiere indicar el proveedor a inspeccionar con `?providerId=` en la URL."
        icon={<SearchCheck className="h-6 w-6" />}
        secondaryAction={
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-xl border-border/80 bg-white/90 px-5 text-foreground hover:bg-muted"
          >
            <a href="/proveedores" target="_blank" rel="noreferrer">
              Abrir directorio publico
            </a>
          </Button>
        }
      />
    );
  }

  if (!session.user || !session.providerId) {
    return (
      <DashboardEmptyState
        title="No encontramos un proveedor vinculado"
        description="La sesion esta activa, pero no pudimos resolver un `provider_id` valido para cargar el dashboard React."
      />
    );
  }

  return (
    <ProviderDashboardShell user={session.user} onLogout={session.logout}>
      <Outlet />
    </ProviderDashboardShell>
  );
}

export default function ProviderDashboardV2() {
  const location = useLocation();
  const isDashboardRoot =
    location.pathname === "/dashboard/proveedores" || location.pathname === "/dashboard/proveedores/";

  return (
    <ProviderDashboardSessionProvider>
      {isDashboardRoot ? (
        <Navigate to={`/dashboard/proveedores/resumen${location.search}`} replace />
      ) : (
        <ProviderDashboardRouteContent />
      )}
    </ProviderDashboardSessionProvider>
  );
}
