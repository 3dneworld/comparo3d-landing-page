import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HeroProcessDemo from "./HeroProcessDemo";

describe("HeroProcessDemo", () => {
  it("shows the final quoting flow with real provider logos", () => {
    render(<HeroProcessDemo audience="particular" forceComplete />);

    expect(screen.getByText("Archivo cargado")).toBeInTheDocument();
    expect(screen.getByText("Vista previa del modelo")).toBeInTheDocument();
    expect(screen.getByText("Cotizaciones recibidas")).toBeInTheDocument();
    expect(screen.getByText("Entrega coordinada")).toBeInTheDocument();

    expect(screen.getByAltText("Logo PRINTALOT")).toHaveAttribute("src", "/logos/PAL.png");
    expect(screen.getByAltText("Logo PISCOBOT")).toHaveAttribute("src", "/logos/Piscobot.png");
    expect(screen.getByAltText("Logo JOACO3D")).toHaveAttribute("src", "/logos/JOACO3D.png");
    expect(screen.queryByAltText("Logo NOST3R")).not.toBeInTheDocument();

    expect(screen.getByText("$32.300")).toBeInTheDocument();
    expect(screen.getByText("$30.100")).toBeInTheDocument();
    expect(screen.getByText("$29.000")).toBeInTheDocument();
  });

  it("marks Printalot as the first recommended provider", () => {
    const { container } = render(<HeroProcessDemo audience="particular" forceComplete />);
    const quoteRows = container.querySelectorAll(".hero-demo-quote");

    expect(quoteRows).toHaveLength(3);
    expect(within(quoteRows[0] as HTMLElement).getByText("PRINTALOT")).toBeInTheDocument();
    expect(within(quoteRows[0] as HTMLElement).getByText("Recomendado")).toBeInTheDocument();
    expect(quoteRows[0]).toHaveClass("is-highlighted");
    expect(quoteRows[2]).not.toHaveClass("is-highlighted");
  });
});
