import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ProviderSummaryView } from "./ProviderSummaryView";

vi.mock("@/features/provider-dashboard/api", () => ({
  fetchProviderSummary: vi.fn().mockResolvedValue({
    success: true,
    provider: {
      id: 1,
      nombre: "Test 3D",
      nombre_comercial: "Test 3D Studio",
      estado: "activo",
      localidad: "Flores",
      provincia: "CABA",
      tiempo_entrega_dias: 3,
      min_trabajo: 1500,
      calificacion: 4.8,
    },
    readiness: {
      quote_ready: true,
      visibility_ready: true,
      order_ready: false,
      blocking_reasons: ["MP_OAUTH_FALTANTE"],
    },
    effective_permissions: {
      visible_in_marketplace: true,
      included_in_new_quotes: true,
      can_manage_existing_orders: true,
      can_accept_confirmed_orders: false,
    },
    proximity: { proximity_enabled: true },
    postal_validation: {},
    profile_score: 78,
    metrics: {
      cotizaciones_participadas: 12,
      pedidos_abiertos: 3,
      pedidos_historicos: 25,
      ventas: 150000,
      cotizaciones_mostradas: 45,
      revenue_month: 35000,
      revenue_prev_month: 28000,
      sparkline_quotes_7d: [2, 3, 1, 4, 2, 3, 5],
      sparkline_orders_7d: [1, 0, 1, 2, 1, 0, 1],
      sparkline_revenue_7d: [5000, 0, 8000, 3000, 7000, 0, 12000],
      score_delta_30d: 5,
    },
    onboarding: {
      quote_stage: { complete: true, missing: [] },
      visibility_stage: { complete: true, missing: [] },
      order_stage: { complete: false, missing: ["MP_OAUTH_FALTANTE"] },
      optional_stage: { complete: false, missing: ["LOGO_URL_FALTANTE"] },
    },
  }),
}));

vi.mock(
  "@/features/provider-dashboard/context/ProviderDashboardSessionContext",
  () => ({
    useProviderDashboardSession: () => ({
      user: { provider_id: 1, email: "test@test.com", role: "provider" },
      providerId: 1,
      requestedProviderId: null,
      isLoading: false,
      isUnauthorized: false,
      requiresProviderSelection: false,
      error: null,
      loginPath: "/proveedores/login",
      logout: vi.fn(),
      refetchSession: vi.fn(),
    }),
  })
);

function renderView() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/proveedores-v2/resumen"]}>
        <ProviderSummaryView />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ProviderSummaryView (dark)", () => {
  it("renders the greeting with provider name", async () => {
    renderView();
    // The heading includes the greeting + provider name
    const heading = await screen.findByRole("heading", { name: /Test 3D Studio/ });
    expect(heading).toBeInTheDocument();
  });

  it("renders 4 metric cards", async () => {
    renderView();
    expect(await screen.findByText("Cotizaciones activas")).toBeInTheDocument();
    expect(screen.getByText("Pedidos en produccion")).toBeInTheDocument();
    expect(screen.getByText("Ingresos del mes")).toBeInTheDocument();
    expect(screen.getByText("Score de confianza")).toBeInTheDocument();
  });

  it("shows score delta text", async () => {
    renderView();
    expect(await screen.findByText("+5 pts este mes")).toBeInTheDocument();
  });

  it("shows Estado del perfil section", async () => {
    renderView();
    expect(await screen.findByText("Estado del perfil")).toBeInTheDocument();
  });

  it("shows next action when onboarding incomplete", async () => {
    renderView();
    // "Vincular Mercado Pago" appears both in "Siguiente accion" panel and in "Bloqueos prioritarios"
    const matches = await screen.findAllByText("Vincular Mercado Pago");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});
