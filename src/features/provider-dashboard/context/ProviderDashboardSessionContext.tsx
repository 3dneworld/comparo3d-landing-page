/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import {
  DashboardApiError,
  fetchDashboardSession,
  logoutDashboardSession,
} from "@/features/provider-dashboard/api";
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
    retry: (failureCount, error) => {
      if (error instanceof DashboardApiError && error.status === 401) return false;
      return failureCount < 1;
    },
    staleTime: 60_000,
  });

  const user = sessionQuery.data ?? null;
  const requestedProviderId = parseRequestedProviderId(
    searchParams.get("providerId") || searchParams.get("provider_id")
  );

  let providerId = user?.provider_id ?? null;
  if (user?.role === "admin" && requestedProviderId) {
    providerId = requestedProviderId;
  }

  const isUnauthorized =
    sessionQuery.error instanceof DashboardApiError && sessionQuery.error.status === 401;

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
