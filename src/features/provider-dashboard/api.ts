import type {
  DashboardApiErrorShape,
  DashboardUser,
  ProviderSummaryResponse,
} from "@/features/provider-dashboard/types";

const DASHBOARD_API_BASE = (import.meta.env.VITE_DASHBOARD_API_BASE || "").replace(/\/$/, "");

const buildDashboardUrl = (path: string) => `${DASHBOARD_API_BASE}${path}`;

export class DashboardApiError extends Error {
  status: number;
  code?: string;
  loginUrl?: string;
  details?: unknown;

  constructor(message: string, options?: { status?: number; code?: string; loginUrl?: string; details?: unknown }) {
    super(message);
    this.name = "DashboardApiError";
    this.status = options?.status ?? 500;
    this.code = options?.code;
    this.loginUrl = options?.loginUrl;
    this.details = options?.details;
  }
}

async function dashboardFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildDashboardUrl(path), {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const payload = (await response.json().catch(() => null)) as DashboardApiErrorShape | T | null;

  if (!response.ok) {
    const errorPayload = (payload || {}) as DashboardApiErrorShape;
    throw new DashboardApiError(errorPayload.error || "No pudimos completar la solicitud.", {
      status: response.status,
      code: errorPayload.code,
      loginUrl: errorPayload.login_url,
      details: errorPayload.details,
    });
  }

  return payload as T;
}

export function fetchDashboardSession() {
  return dashboardFetch<DashboardUser>("/api/auth/me");
}

export function fetchProviderSummary(providerId: number) {
  return dashboardFetch<ProviderSummaryResponse>(`/api/provider-dashboard/proveedores/${providerId}/resumen`);
}

export async function logoutDashboardSession() {
  await dashboardFetch<{ success: true; message: string }>("/api/auth/logout", {
    method: "POST",
  });
}
