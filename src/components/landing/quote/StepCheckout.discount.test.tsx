import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StepCheckout } from "./StepCheckout";

const apiMocks = vi.hoisted(() => ({
  createCheckout: vi.fn(),
  getAddressProvinces: vi.fn(),
  getPostalLocalityCandidates: vi.fn(),
  getShippingEstimate: vi.fn(),
  getShippingMethods: vi.fn(),
  searchAddressLocalities: vi.fn(),
  validateCheckoutDiscountCode: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    createCheckout: apiMocks.createCheckout,
    getAddressProvinces: apiMocks.getAddressProvinces,
    getPostalLocalityCandidates: apiMocks.getPostalLocalityCandidates,
    getShippingEstimate: apiMocks.getShippingEstimate,
    getShippingMethods: apiMocks.getShippingMethods,
    searchAddressLocalities: apiMocks.searchAddressLocalities,
    validateCheckoutDiscountCode: apiMocks.validateCheckoutDiscountCode,
  };
});

vi.mock("@/lib/normalizeAddressFlow", () => ({
  runNormalizeAddress: vi.fn(),
}));

vi.mock("@/components/ui/sonner", () => ({
  toast: vi.fn(),
}));

vi.mock("./TrimmedThumbnail", () => ({
  TrimmedThumbnail: () => <div data-testid="thumb" />,
}));

describe("StepCheckout discount flow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    apiMocks.getAddressProvinces.mockResolvedValue({
      success: true,
      items: [{ id: "caba", name: "Ciudad Autonoma de Buenos Aires", correo_code: "C" }],
    });
    apiMocks.getShippingMethods.mockResolvedValue({
      success: true,
      methods: [{ id: "retiro", name: "Retiro en oficinas del proveedor", eta_days: 0 }],
    });
    apiMocks.getPostalLocalityCandidates.mockResolvedValue({ success: true, items: [] });
    apiMocks.searchAddressLocalities.mockResolvedValue({ success: true, items: [] });
  });

  it("shows the discount input and updates totals after applying a valid code", async () => {
    apiMocks.validateCheckoutDiscountCode.mockResolvedValue({
      success: true,
      code: "REVIEW-ADA",
      status: "issued",
      expires_at: "2026-06-30T10:00:00",
      issued_at: "2026-05-31T10:00:00",
      discount_pct: 5,
      print_amount: 10000,
      shipping_amount: 0,
      discount_amount: 500,
      discounted_print_amount: 9500,
      customer_total: 9500,
      marketplace_fee_base: 1500,
      marketplace_fee_final: 1000,
      provider_payout: 8500,
    });

    render(
      <StepCheckout
        selectedQuote={{
          quote_option_uid: "qo-1",
          provider_id: 7,
          provider_name: "Proveedor Demo",
          provider_score: 92,
          provider_tier: "Certificado",
          provider_location: "CABA",
          price_ars: 10000,
          delivery_days: 3,
          logo_url: "",
          is_certified: true,
          trust_metrics: {
            score: 92,
            reviews_count: 14,
            on_time_pct: 98,
          },
        }}
        orderId="ORD-123"
        sessionId="SESSION-123"
        isEmpresa={false}
        onBack={() => {}}
      />
    );

    const input = await screen.findByPlaceholderText("Ej: REVIEW-5");
    fireEvent.change(input, { target: { value: "review-ada" } });
    fireEvent.click(screen.getByRole("button", { name: /aplicar/i }));

    await waitFor(() => {
      expect(apiMocks.validateCheckoutDiscountCode).toHaveBeenCalledWith("SESSION-123", {
        order_id: "ORD-123",
        code: "REVIEW-ADA",
        shipping: { price: 0 },
      });
    });

    expect(await screen.findByText("Codigo aplicado: REVIEW-ADA")).toBeTruthy();
    expect(screen.getByText("Descuento review")).toBeTruthy();
    expect(screen.getByText("-$500")).toBeTruthy();
    expect(screen.getAllByText("$9.500").length).toBeGreaterThan(0);
  });
});
