import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StepConfirmation } from "./StepConfirmation";

describe("StepConfirmation", () => {
  it("renders a numeric public order ID with a hash prefix", () => {
    render(
      <StepConfirmation
        isEmpresa={false}
        sessionId="session-1"
        orderId="100"
        isLoading={false}
        progressMessage=""
        onReset={vi.fn()}
      />
    );

    expect(screen.getByText("#100")).toBeInTheDocument();
  });
});
