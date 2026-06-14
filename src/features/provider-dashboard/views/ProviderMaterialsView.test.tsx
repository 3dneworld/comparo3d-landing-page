import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProviderMaterialsView } from "./ProviderMaterialsView";
import { updateProviderMaterials } from "@/features/provider-dashboard/api";

const mockData = vi.hoisted(() => {
  const defaultMaterials = [
    {
      id: 10,
      material_code: "PLA",
      activo: 1,
      precio_hora: 2500,
      in_stock: 1,
      last_confirmed_at: "2026-05-20T10:00:00+00:00",
      allow_custom_color: 0,
      trabajo_minimo_override: null,
      metadata: { color_count: 4, attributes: ["Técnico"] },
      colores: [
        {
          id: 101,
          color_name: "Blanco",
          color_hex: "#FFFFFF",
          activo: 1,
          in_stock: 1,
          last_confirmed_at: "2026-05-20T10:00:00+00:00",
        },
        {
          id: 102,
          color_name: "Negro",
          color_hex: "#1F1F1F",
          activo: 1,
          in_stock: 1,
          last_confirmed_at: "2026-05-20T10:00:00+00:00",
        },
      ],
    },
  ];
  return {
    defaultMaterials,
    materials: [...defaultMaterials],
  };
});

vi.mock("@/features/provider-dashboard/api", async () => {
  const actual = await vi.importActual<typeof import("@/features/provider-dashboard/api")>(
    "@/features/provider-dashboard/api"
  );
  return {
    ...actual,
    fetchProviderMaterials: vi.fn().mockImplementation(() => Promise.resolve({
      success: true,
      provider: { id: 1, nombre: "MEGA3D" },
      materials: mockData.materials,
    })),
    fetchMarketplacePromedios: vi.fn().mockResolvedValue({
      PLA: { avg_price_kg: 2000, sample_count: 2 },
    }),
    updateProviderMaterials: vi.fn().mockResolvedValue({
      success: true,
      provider: { id: 1, nombre: "MEGA3D" },
      materials: mockData.materials,
    }),
  };
});

vi.mock("@/features/provider-dashboard/context/ProviderDashboardSessionContext", () => ({
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
}));

vi.mock("@/components/ui/sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function renderView() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/proveedores-v2/materiales"]}>
        <ProviderMaterialsView />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ProviderMaterialsView", () => {
  beforeEach(() => {
    mockData.materials = [...mockData.defaultMaterials];
    vi.clearAllMocks();
  });

  it("renders one card per material with all customer-facing colors inside", async () => {
    renderView();

    expect(await screen.findByRole("heading", { name: "Materiales y precios" })).toBeInTheDocument();
    expect(screen.getByText("Confirma el stock de materiales y su costo por hora de impresión")).toBeInTheDocument();
    expect(screen.getAllByText("PLA")).toHaveLength(1);
    expect(screen.getByRole("button", { name: /Blanco disponible/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Negro disponible/i })).toBeInTheDocument();
    expect(screen.queryByText(/desactualizados/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Confirmar todo/i })).not.toBeInTheDocument();
  });

  it("toggling one color only changes that color in the update payload", async () => {
    renderView();

    fireEvent.click(await screen.findByRole("button", { name: /Negro disponible/i }));

    await waitFor(() => expect(updateProviderMaterials).toHaveBeenCalled());
    const [, payload] = vi.mocked(updateProviderMaterials).mock.calls[0];
    const pla = payload.materiales.find((m) => m.material_code === "PLA");

    expect(pla?.in_stock).toBe(true);
    // El toggle inline (PUT replace) NO debe perder el metadata del material.
    expect(pla?.metadata).toEqual({ color_count: 4, attributes: ["Técnico"] });
    expect(pla?.colores).toHaveLength(8);
    expect(pla?.colores).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color_name: "Blanco", in_stock: true }),
        expect.objectContaining({ color_name: "Negro", in_stock: false }),
      ])
    );
  });

  it("does not show a material as available when no color is available", async () => {
    mockData.materials = [
      {
        id: 20,
        material_code: "ABS",
        activo: 1,
        precio_hora: 2800,
        in_stock: 1,
        last_confirmed_at: "2026-05-20T10:00:00+00:00",
        allow_custom_color: 0,
        trabajo_minimo_override: null,
        colores: [
          { id: 201, color_name: "Blanco", color_hex: "#FFFFFF", activo: 1, in_stock: 0, last_confirmed_at: null },
          { id: 202, color_name: "Negro", color_hex: "#1F1F1F", activo: 1, in_stock: 0, last_confirmed_at: null },
        ],
      },
    ];

    renderView();

    expect(await screen.findByText("ABS")).toBeInTheDocument();
    expect(screen.getByText("Pausado para cotizaciones")).toBeInTheDocument();
    expect(screen.getByText("Sin stock")).toBeInTheDocument();
    expect(screen.queryByText("Disponible en cotizaciones")).not.toBeInTheDocument();
  });
});
