import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ProviderOrdersView } from "./ProviderOrdersView";
import { dispatchProviderOrder, updateProviderShipmentTracking } from "@/features/provider-dashboard/api";

const testData = vi.hoisted(() => ({
  mockOrder: {
    id: 55,
    public_order_id: "ORD-20260525-000001",
    cotizacion_id: 101,
    proveedor_id: 17,
    client_name: "Ada",
    client_email: "ada@example.com",
    client_phone: "11 2222 3333",
    delivery_method: "correo_argentino",
    delivery_address_json: "{}",
    payment_status: "approved",
    order_status: "ready_to_ship",
    created_at: "2026-05-25T10:00:00",
    updated_at: "2026-05-25T10:00:00",
    cantidad: 4,
    print_time_min: 120,
    shipment_id: 700,
    shipment_tracking_code: null,
    payment_payer_email: "cliente.mp@example.com",
    shipping_refund_amount_ars: 1599.5,
    files: [],
    dispatch_photos: [],
  },
}));

vi.mock("@/features/provider-dashboard/api", async () => {
  const actual = await vi.importActual<typeof import("@/features/provider-dashboard/api")>(
    "@/features/provider-dashboard/api"
  );
  return {
    ...actual,
    fetchProviderOrders: vi.fn().mockResolvedValue({ success: true, items: [testData.mockOrder] }),
    fetchProviderOrderDetail: vi.fn().mockResolvedValue({ success: true, item: testData.mockOrder }),
    markProviderOrderPrinting: vi.fn(),
    markProviderOrderReadyToShip: vi.fn(),
    dispatchProviderOrder: vi.fn().mockResolvedValue({
      success: true,
      order_id: 55,
      shipment_id: 700,
      trackingNumber: "",
      product_type: "pickup",
      email_sent: true,
    }),
    cancelProviderOrder: vi.fn(),
    requestProviderOrderReview: vi.fn(),
    updateProviderShipmentTracking: vi.fn().mockResolvedValue({ success: true, item: {} }),
  };
});

vi.mock("@/features/provider-dashboard/context/ProviderDashboardSessionContext", () => ({
  useProviderDashboardSession: () => ({
    user: { provider_id: 17, email: "test@test.com", role: "provider" },
    providerId: 17,
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
      <MemoryRouter initialEntries={["/proveedores-v2/pedidos?pedido_id=55"]}>
        <ProviderOrdersView />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ProviderOrdersView", () => {
  it("shows an inline Correo Argentino tracking field in the order detail grid", async () => {
    renderView();

    const input = await screen.findByLabelText("Tracking Correo Argentino");
    const trackingCard = input.closest("form");
    expect(screen.getByText("Cantidad")).toBeInTheDocument();
    expect(screen.getByText("Recibido")).toBeInTheDocument();
    expect(screen.queryByText("Tracking Correo Argentino")).not.toBeInTheDocument();
    expect(input.className).toContain("w-full");
    expect(trackingCard?.className).toContain("animate-tracking-attention");
    expect(trackingCard?.className).not.toContain("bg-amber-50");

    fireEvent.change(input, { target: { value: "LC123456789AR" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar tracking" }));

    await waitFor(() => {
      expect(updateProviderShipmentTracking).toHaveBeenCalledWith(17, 700, "LC123456789AR");
    });
    await waitFor(() => {
      expect(trackingCard?.className).not.toContain("animate-tracking-attention");
    });
  });

  it("warns before dispatch without tracking and disables the tracking field when moto or lab pickup is selected", async () => {
    renderView();

    const trackingInput = await screen.findByLabelText("Tracking Correo Argentino");
    const trackingCard = trackingInput.closest("form");

    expect(trackingCard?.className).toContain("animate-tracking-attention");
    expect(trackingCard?.className).not.toContain("bg-amber-50");

    fireEvent.click(screen.getAllByRole("button", { name: "Despachar" })[0]);

    expect(
      await screen.findByText(
        "Antes de poder despachar el pedido debes ingresar el número de tracking. En caso que el envío lo hagas en moto u otro medio, deberás tildar que el envío se hace por moto"
      )
    ).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("El envío se hace con moto"));

    expect(trackingInput).toBeDisabled();
    expect(trackingCard?.className).toContain("bg-slate-100");

    fireEvent.click(screen.getByLabelText("Retiro por Laboratorio"));
    expect(screen.getByText(/cliente.mp@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/\$ 1.599,50/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar despacho" }));

    await waitFor(() => {
      expect(dispatchProviderOrder).toHaveBeenCalledWith(
        55,
        expect.objectContaining({ useLaboratoryPickup: true, useMotorcycle: false })
      );
    });
  });
});
