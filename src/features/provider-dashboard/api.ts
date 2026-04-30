import type {
  DashboardApiErrorShape,
  DashboardMaterialsFormPayload,
  DashboardPortfolioFormPayload,
  DashboardUser,
  DashboardPrintersFormPayload,
  ProviderGeoLocationPayload,
  DashboardLogisticsFormPayload,
  ProviderLogisticsResponse,
  ProviderMaterialsResponse,
  ProviderNotificationReadResponse,
  ProviderNotificationsResponse,
  ProviderOrderDetailResponse,
  ProviderOrderDispatchResponse,
  ProviderOrderPrintingResponse,
  ProviderOrderReadyToShipResponse,
  ProviderOrdersResponse,
  ProviderMiCorreoAgencyResponse,
  ProviderMiCorreoPayload,
  ProviderQuoteDetailResponse,
  ProviderQuotesResponse,
  ProviderProductionResponse,
  ProviderProfileFormPayload,
  ProviderProfileResponse,
  ProviderPortfolioDeleteResponse,
  ProviderPortfolioItemResponse,
  ProviderPortfolioResponse,
  ProviderBadgesResponse,
  ProviderCertificationProgressResponse,
  ProviderMetricsResponse,
  ProviderReviewsResponse,
  ProviderScoreBreakdownResponse,
  ProviderShipmentMutationResponse,
  ProviderShipmentsResponse,
  ProviderSummaryResponse,
  ProviderCompetitivenessResponse,
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

export function fetchProviderProfile(providerId: number) {
  return dashboardFetch<ProviderProfileResponse>(`/api/provider-dashboard/proveedores/${providerId}/perfil`);
}

export function updateProviderProfile(providerId: number, payload: ProviderProfileFormPayload) {
  return dashboardFetch<ProviderProfileResponse>(`/api/provider-dashboard/proveedores/${providerId}/perfil`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function fetchProviderProduction(providerId: number) {
  return dashboardFetch<ProviderProductionResponse>(`/api/provider-dashboard/proveedores/${providerId}/impresoras`);
}

export function updateProviderProduction(providerId: number, payload: DashboardPrintersFormPayload) {
  return dashboardFetch<ProviderProductionResponse>(`/api/provider-dashboard/proveedores/${providerId}/impresoras`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function fetchProviderMaterials(providerId: number) {
  return dashboardFetch<ProviderMaterialsResponse>(`/api/provider-dashboard/proveedores/${providerId}/materiales`);
}

export function updateProviderMaterials(providerId: number, payload: DashboardMaterialsFormPayload) {
  return dashboardFetch<ProviderMaterialsResponse>(`/api/provider-dashboard/proveedores/${providerId}/materiales`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function fetchProviderQuotes(providerId: number, estado?: string) {
  const params = new URLSearchParams();
  if (estado) params.set("estado", estado);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return dashboardFetch<ProviderQuotesResponse>(`/api/provider-dashboard/proveedores/${providerId}/cotizaciones${suffix}`);
}

export function fetchProviderQuoteDetail(providerId: number, matchId: number) {
  return dashboardFetch<ProviderQuoteDetailResponse>(
    `/api/provider-dashboard/proveedores/${providerId}/cotizaciones/${matchId}`
  );
}

export function fetchProviderOrders(providerId: number, estado?: string) {
  const params = new URLSearchParams();
  if (estado) params.set("estado", estado);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return dashboardFetch<ProviderOrdersResponse>(`/api/provider-dashboard/proveedores/${providerId}/pedidos${suffix}`);
}

export function fetchProviderOrderDetail(providerId: number, orderId: number) {
  return dashboardFetch<ProviderOrderDetailResponse>(
    `/api/provider-dashboard/proveedores/${providerId}/pedidos/${orderId}`
  );
}

export function markProviderOrderPrinting(providerId: number, orderId: number, resendEmail = false) {
  return dashboardFetch<ProviderOrderPrintingResponse>(
    `/api/provider-dashboard/proveedores/${providerId}/pedidos/${orderId}/printing`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ resend_email: resendEmail }),
    }
  );
}

export function markProviderOrderReadyToShip(
  providerId: number,
  orderId: number,
  options?: { resendEmail?: boolean; photos?: File[] }
) {
  const formData = new FormData();
  if (options?.resendEmail) {
    formData.append("resend_email", "1");
  }
  for (const photo of options?.photos || []) {
    formData.append("photos", photo);
  }
  return dashboardFetch<ProviderOrderReadyToShipResponse>(
    `/api/provider-dashboard/proveedores/${providerId}/pedidos/${orderId}/ready-to-ship`,
    {
      method: "POST",
      body: formData,
    }
  );
}

export function dispatchProviderOrder(orderId: number) {
  return dashboardFetch<ProviderOrderDispatchResponse>(`/api/shipping/orders/${orderId}/dispatch`, {
    method: "POST",
  });
}

export function fetchProviderShipments(providerId: number, estado?: string) {
  const params = new URLSearchParams();
  if (estado) params.set("estado", estado);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return dashboardFetch<ProviderShipmentsResponse>(`/api/provider-dashboard/proveedores/${providerId}/shipments${suffix}`);
}

export function updateProviderShipmentTracking(providerId: number, shipmentId: number, trackingCode: string) {
  return dashboardFetch<ProviderShipmentMutationResponse>(`/api/shipping/${shipmentId}/tracking?proveedor_id=${providerId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tracking_code: trackingCode }),
  });
}

export function updateProviderShipmentStatus(providerId: number, shipmentId: number, status: string) {
  return dashboardFetch<ProviderShipmentMutationResponse>(`/api/shipping/${shipmentId}/status?proveedor_id=${providerId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
}

export function fetchProviderNotifications(providerId: number, unreadOnly = false) {
  const suffix = unreadOnly ? "?unread_only=1" : "";
  return dashboardFetch<ProviderNotificationsResponse>(
    `/api/provider-dashboard/proveedores/${providerId}/notifications${suffix}`
  );
}

export function markProviderNotificationRead(providerId: number, notificationId: number) {
  return dashboardFetch<ProviderNotificationReadResponse>(
    `/api/provider-dashboard/proveedores/${providerId}/notifications/${notificationId}/read`,
    { method: "PUT" }
  );
}

export function markAllProviderNotificationsRead(providerId: number) {
  return dashboardFetch<ProviderNotificationReadResponse>(
    `/api/provider-dashboard/proveedores/${providerId}/notifications/read-all`,
    { method: "PUT" }
  );
}

export function fetchProviderPortfolio(providerId: number) {
  return dashboardFetch<ProviderPortfolioResponse>(`/api/providers/${providerId}/portfolio`);
}

export function addProviderPortfolioItem(providerId: number, payload: DashboardPortfolioFormPayload) {
  return dashboardFetch<ProviderPortfolioItemResponse>(`/api/providers/${providerId}/portfolio`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function deleteProviderPortfolioItem(providerId: number, itemId: number) {
  return dashboardFetch<ProviderPortfolioDeleteResponse>(`/api/providers/${providerId}/portfolio/${itemId}`, {
    method: "DELETE",
  });
}

export function fetchProviderCertificationProgress(providerId: number) {
  return dashboardFetch<ProviderCertificationProgressResponse>(
    `/api/provider-dashboard/proveedores/${providerId}/certification-progress`
  );
}

export function fetchProviderMetrics(providerId: number, includeRaw = false) {
  const suffix = includeRaw ? "?dashboard=1" : "";
  return dashboardFetch<ProviderMetricsResponse>(`/api/provider-dashboard/proveedores/${providerId}/metrics${suffix}`);
}

export function fetchProviderBadges(providerId: number) {
  return dashboardFetch<ProviderBadgesResponse>(`/api/providers/${providerId}/badges`);
}

export function fetchProviderReviews(providerId: number) {
  return dashboardFetch<ProviderReviewsResponse>(`/api/providers/${providerId}/reviews`);
}

export function fetchProviderScoreBreakdown(providerId: number) {
  return dashboardFetch<ProviderScoreBreakdownResponse>(
    `/api/provider-dashboard/proveedores/${providerId}/score-breakdown`
  );
}

export function fetchProviderCompetitiveness(providerId: number, materialCode: string) {
  const params = new URLSearchParams({ material: materialCode });
  return dashboardFetch<ProviderCompetitivenessResponse>(
    `/api/provider-dashboard/proveedores/${providerId}/competitividad?${params.toString()}`
  );
}

export function captureProviderGeoLocation(providerId: number, payload: ProviderGeoLocationPayload) {
  return dashboardFetch<ProviderProfileResponse>(
    `/api/provider-dashboard/proveedores/${providerId}/geo-location`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );
}

export function validateProviderPostalAddress(providerId: number) {
  return dashboardFetch<ProviderProfileResponse>(
    `/api/provider-dashboard/proveedores/${providerId}/postal-validation/validate`,
    {
      method: "POST",
    }
  );
}

export function fetchProviderLogistics(providerId: number) {
  return dashboardFetch<ProviderLogisticsResponse>(`/api/provider-dashboard/proveedores/${providerId}/logistica`);
}

export function updateProviderLogistics(providerId: number, payload: DashboardLogisticsFormPayload) {
  return dashboardFetch<ProviderLogisticsResponse>(`/api/provider-dashboard/proveedores/${providerId}/logistica`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function updateProviderMiCorreo(providerId: number, payload: ProviderMiCorreoPayload) {
  return dashboardFetch<ProviderLogisticsResponse>(`/api/provider-dashboard/proveedores/${providerId}/micorreo`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function fetchProviderMiCorreoSuggestedAgency(providerId: number) {
  return dashboardFetch<ProviderMiCorreoAgencyResponse>(
    `/api/provider-dashboard/proveedores/${providerId}/micorreo/sucursal-sugerida`
  );
}

export async function logoutDashboardSession() {
  await dashboardFetch<{ success: true; message: string }>("/api/auth/logout", {
    method: "POST",
  });
}
