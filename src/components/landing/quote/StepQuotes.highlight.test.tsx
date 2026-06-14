import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StepQuotes } from "./StepQuotes";
import type { QuoteOption } from "@/lib/api";

function makeQuote(overrides: Partial<QuoteOption>): QuoteOption {
  return {
    quote_option_uid: "uid",
    provider_id: 1,
    provider_name: "Proveedor",
    provider_score: 4.5,
    provider_tier: "production",
    provider_location: "CABA",
    price_ars: 10000,
    delivery_days: 3,
    logo_url: "",
    is_certified: false,
    trust_metrics: { score: 4.5, reviews_count: 10, on_time_pct: 0.9 },
    ...overrides,
  };
}

const baseProps = {
  isEmpresa: false,
  isProcessing: false,
  progressMessage: "",
  error: null,
  sessionId: "quote-highlight-test",
  thumbnailUrl: null,
  material: "PLA",
  selectedColor: null,
  cantidad: 1,
  stlDimensions: null,
  onSelectQuote: vi.fn(),
  onUpdateQuantity: vi.fn(),
  onRetry: vi.fn(),
  onBack: vi.fn(),
};

describe("StepQuotes deep-link highlight", () => {
  const quotes = [
    makeQuote({ quote_option_uid: "a", provider_id: 1, provider_name: "Otro Print", price_ars: 8000 }),
    makeQuote({ quote_option_uid: "b", provider_id: 2, provider_name: "Prototip", price_ars: 12000 }),
  ];

  it("shows the banner and the 'Tu eleccion' label for the matched provider", () => {
    render(<StepQuotes {...baseProps} quotes={quotes} highlightProviderSlug="prototip" />);

    expect(screen.getByText(/elegiste desde su perfil/i)).toBeInTheDocument();
    expect(screen.getByText("Tu elección")).toBeInTheDocument();
  });

  it("brings the matched provider card to the front", () => {
    const { container } = render(
      <StepQuotes {...baseProps} quotes={quotes} highlightProviderSlug="prototip" />,
    );

    const buyButtons = Array.from(container.querySelectorAll("button")).filter(
      (btn) => btn.textContent === "Comprar",
    );
    const firstCard = buyButtons[0].closest("div.relative");
    expect(firstCard?.textContent).toContain("Prototip");
  });

  it("does not render the banner when there is no match", () => {
    render(<StepQuotes {...baseProps} quotes={quotes} highlightProviderSlug="inexistente" />);

    expect(screen.queryByText(/elegiste desde su perfil/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Tu elección")).not.toBeInTheDocument();
  });
});
