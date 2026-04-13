import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LockKeyhole, SearchCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProviderDashboardShell } from "@/features/provider-dashboard/components/ProviderDashboardShell";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
} from "@/features/provider-dashboard/components/DashboardStates";
import {
  ProviderDashboardSessionProvider,
  useProviderDashboardSession,
} from "@/features/provider-dashboard/context/ProviderDashboardSessionContext";

function ProviderDashboardRouteContent() {
  const location = useLocation();
  const session = useProviderDashboardSession();

  if (session.isLoading) {
    return <DashboardLoadingState />;
  }

  if (session.isUnauthorized) {
    return (
      <DashboardErrorState
        title="Sesion requerida"
        description="Esta version React del dashboard usa la misma sesion actual de proveedores. Inicia sesion para continuar."
        actionLabel="Ir al login de proveedores"
        actionHref="/proveedores/login"
        icon={<LockKeyhole className="h-6 w-6" />}
      />
    );
  }

  if (session.error) {
    return (
      <DashboardErrorState
        title="No pudimos validar la sesion"
        description="La base del dashboard quedo montada, pero el chequeo de sesion devolvio un error no controlado."
      />
    );
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
              Abrir dashboard legacy
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

  return (
    <ProviderDashboardSessionProvider>
      {location.pathname === "/proveedores-v2" ? (
        <Navigate to={`/proveedores-v2/resumen${location.search}`} replace />
      ) : (
        <ProviderDashboardRouteContent />
      )}
    </ProviderDashboardSessionProvider>
  );
}
