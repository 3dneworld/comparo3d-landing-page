/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { fetchDashboardSession, logoutDashboardSession } from "@/features/provider-dashboard/api";
import type { DashboardUser } from "@/features/provider-dashboard/types";

interface ProviderDashboardSessionValue {
  user: DashboardUser | null;
  providerId: number | null;
  requestedProviderId: number | null;
  isLoading: boolean;
  isUnauthorized: boolean;
  requiresProviderSelection: boolean;
  error: Error | null;
  loginPath: string;
  logout: () => Promise<void>;
  refetchSession: () => Promise<unknown>;
}

const ProviderDashboardSessionContext = createContext<ProviderDashboardSessionValue | null>(null);

// Persistencia del último providerId que vio un admin via query string.
// Permite que la próxima visita sin ?providerId= reabra el mismo proveedor.
// Sólo se activa para sesiones con role=admin — el proveedor real nunca ve
// este comportamiento ni hay rastros en su UI.
const ADMIN_LAST_PROVIDER_STORAGE_KEY = "comparo3d.admin.lastProviderId";

function readAdminLastProviderId(): number | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(ADMIN_LAST_PROVIDER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeAdminLastProviderId(providerId: number) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ADMIN_LAST_PROVIDER_STORAGE_KEY, String(providerId));
  } catch {
    /* localStorage bloqueado: no es crítico */
  }
}

function parseRequestedProviderId(rawValue: string | null) {
  if (!rawValue) return null;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function ProviderDashboardSessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const sessionQuery = useQuery({
    queryKey: ["provider-dashboard", "session"],
    queryFn: fetchDashboardSession,
    retry: false,
    staleTime: 60_000,
  });

  const user = sessionQuery.data ?? null;
  const requestedProviderId = parseRequestedProviderId(
    searchParams.get("providerId") || searchParams.get("provider_id")
  );

  let providerId = user?.provider_id ?? null;
  if (user?.role === "admin") {
    // 1) Si vino ?providerId= en la URL, ese gana
    if (requestedProviderId) {
      providerId = requestedProviderId;
    } else {
      // 2) Si no, intentar recuperar el último que vio el admin
      const lastSeen = readAdminLastProviderId();
      if (lastSeen) providerId = lastSeen;
    }
  }

  // Persistir el providerId activo del admin para futuras visitas sin query string
  useEffect(() => {
    if (user?.role === "admin" && providerId) {
      writeAdminLastProviderId(providerId);
    }
  }, [user?.role, providerId]);

  const isUnauthorized = Boolean(
    sessionQuery.error &&
      typeof sessionQuery.error === "object" &&
      "status" in sessionQuery.error &&
      sessionQuery.error.status === 401
  );

  const value = useMemo<ProviderDashboardSessionValue>(
    () => ({
      user,
      providerId,
      requestedProviderId,
      isLoading: sessionQuery.isLoading,
      isUnauthorized,
      requiresProviderSelection: Boolean(user?.role === "admin" && !providerId),
      error: (sessionQuery.error as Error | null) ?? null,
      loginPath: "/proveedores/login",
      logout: async () => {
        await logoutDashboardSession();
        queryClient.removeQueries({ queryKey: ["provider-dashboard"] });
      },
      refetchSession: sessionQuery.refetch,
    }),
    [isUnauthorized, providerId, queryClient, requestedProviderId, sessionQuery.error, sessionQuery.isLoading, sessionQuery.refetch, user]
  );

  return (
    <ProviderDashboardSessionContext.Provider value={value}>
      {children}
    </ProviderDashboardSessionContext.Provider>
  );
}

export function useProviderDashboardSession() {
  const context = useContext(ProviderDashboardSessionContext);
  if (!context) {
    throw new Error("useProviderDashboardSession must be used within ProviderDashboardSessionProvider");
  }
  return context;
}
