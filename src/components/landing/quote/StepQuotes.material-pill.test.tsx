import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StepQuotes } from "./StepQuotes";

const baseProps = {
  isEmpresa: false,
  isProcessing: false,
  progressMessage: "",
  error: null,
  quotes: [],
  sessionId: "quote-color-test",
  thumbnailUrl: null,
  material: "PETG",
  cantidad: 1,
  stlDimensions: null,
  onSelectQuote: vi.fn(),
  onUpdateQuantity: vi.fn(),
  onRetry: vi.fn(),
  onBack: vi.fn(),
};

describe("StepQuotes material pill", () => {
  it("uses the selected filament color as the material pill background", () => {
    render(<StepQuotes {...baseProps} selectedColor="Naranja" />);

    const pill = screen.getByText("PETG").closest("span");

    expect(pill).toHaveStyle({
      backgroundColor: "#EA580C",
      color: "#0F172A",
    });
    expect(pill?.querySelector("svg")).not.toHaveClass("text-primary");
  });

  it("keeps white filament readable with a dark foreground and visible border", () => {
    render(<StepQuotes {...baseProps} selectedColor="Blanco" />);

    expect(screen.getByText("PETG").closest("span")).toHaveStyle({
      backgroundColor: "#FFFFFF",
      borderColor: "#D1D5DB",
      color: "#0F172A",
    });
  });
});
