import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ProviderDashboardShell } from "./ProviderDashboardShell";

vi.mock("@/features/provider-dashboard/api", () => ({
  fetchProviderSummary: vi.fn().mockResolvedValue({
    provider: {
      id: 42,
      nombre: "Test 3D",
      localidad: "Flores",
      provincia: "CABA",
      estado: "activo",
    },
    metrics: { cotizaciones_participadas: 3, pedidos_abiertos: 1 },
  }),
  fetchDashboardSession: vi.fn(),
  logoutDashboardSession: vi.fn(),
}));

vi.mock(
  "@/features/provider-dashboard/context/ProviderDashboardSessionContext",
  () => ({
    useProviderDashboardSession: () => ({
      user: { provider_id: 42, email: "t@test", role: "provider" },
      providerId: 42,
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

function renderShell() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/proveedores-v2/resumen"]}>
        <ProviderDashboardShell
          user={{ provider_id: 42, email: "t@test", role: "provider" } as never}
          onLogout={vi.fn()}
        >
          <div data-testid="content">child</div>
        </ProviderDashboardShell>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ProviderDashboardShell (dark)", () => {
  it("renders the three navigation groups", () => {
    renderShell();
    expect(screen.getByText("Operacion")).toBeInTheDocument();
    expect(screen.getByText("Configuracion")).toBeInTheDocument();
    expect(screen.getByText("Reputacion")).toBeInTheDocument();
  });

  it("does NOT render a search input in the topbar", () => {
    renderShell();
    expect(screen.queryByPlaceholderText(/buscar/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("renders notif and help icon buttons", () => {
    renderShell();
    expect(screen.getByLabelText(/Notificaciones/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ayuda/i)).toBeInTheDocument();
  });

  it("renders content children inside the shell", () => {
    renderShell();
    expect(screen.getByTestId("content")).toHaveTextContent("child");
  });

  it("applies the dashboard-dark wrapper class", () => {
    const { container } = renderShell();
    expect(container.querySelector(".dashboard-dark")).not.toBeNull();
  });
});
