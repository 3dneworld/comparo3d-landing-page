import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import HowItWorks from "./HowItWorks";

describe("HowItWorks", () => {
  beforeAll(() => {
    class IntersectionObserverMock {
      observe = () => {};
      unobserve = () => {};
      disconnect = () => {};
    }

    Object.defineProperty(window, "IntersectionObserver", {
      writable: true,
      value: IntersectionObserverMock,
    });

    Object.defineProperty(globalThis, "IntersectionObserver", {
      writable: true,
      value: IntersectionObserverMock,
    });
  });

  it("uses the custom comparison icon on Paso 2", () => {
    render(<HowItWorks />);

    expect(screen.getByLabelText("Icono Paso 2 Comparacion")).toHaveClass("trust-comparison-icon");
  });
});
