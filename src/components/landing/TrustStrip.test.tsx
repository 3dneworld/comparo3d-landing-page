import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import TrustStrip from "./TrustStrip";

describe("TrustStrip", () => {
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

  it("uses the custom comparison icon for the clear comparison card", () => {
    render(<TrustStrip />);

    const icon = screen.getByLabelText("Icono Comparacion clara");

    expect(icon).toHaveClass("trust-comparison-icon");
    expect(icon).toHaveClass("h-9", "w-9");
  });
});
