import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import FAQ from "./FAQ";

describe("FAQ", () => {
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

  it("includes NO STL questions without saying the STL is generated with AI", () => {
    render(<FAQ />);

    expect(screen.getByText("¿Qué hago si no tengo un archivo STL?")).toBeInTheDocument();
    expect(screen.getByText("¿Puedo cotizar desde una foto, boceto o plano simple?")).toBeInTheDocument();
    expect(screen.getByText("¿El archivo resultante sirve para cotizar en la plataforma?")).toBeInTheDocument();

    expect(document.body.textContent?.toLowerCase()).not.toContain("generan los stl con ai");
    expect(document.body.textContent?.toLowerCase()).not.toContain("inteligencia artificial");
  });
});
