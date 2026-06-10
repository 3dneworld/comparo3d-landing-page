import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfileReviews } from "./ProfileReviews";
import type { ProviderRating, ProviderReviews } from "../types";

// Fixtures realistas
const makeReview = (
  id: number,
  rating: number,
  author: string,
  comment: string,
  b2b = false,
  reply: { text: string; created_at: string } | null = null,
) => ({
  id,
  rating,
  comment,
  is_b2b_order: b2b,
  created_at: "2026-05-01T12:00:00Z",
  author_display: author,
  reply,
});

const reviews: ProviderReviews = {
  items: [
    makeReview(1, 5, "Ana García", "Excelente trabajo, muy prolijo."),
    makeReview(2, 5, "Luis Perez", "Entregó antes del plazo. Recomendado."),
    makeReview(3, 4, "Marta Díaz", "Buena calidad, demoró un día más."),
    makeReview(4, 4, "Carlos Ruiz", "Muy buen servicio, volvería a contratar."),
    makeReview(
      5,
      5,
      "Jorge Molina",
      "Perfecto. Respondió siempre rápido.",
      false,
      { text: "Gracias Jorge, fue un placer.", created_at: "2026-05-02T08:00:00Z" },
    ),
  ],
  total: 5,
  has_more: false,
};

const rating: ProviderRating = {
  average: 4.6,
  count: 5,
  distribution: { "5": 3, "4": 2, "3": 0, "2": 0, "1": 0 },
};

const defaultProps = {
  data: reviews,
  rating,
  providerId: 42,
  providerName: "GigaPrint BA",
};

describe("ProfileReviews", () => {
  it("muestra el promedio, autor y comentario del primer review", () => {
    render(<ProfileReviews {...defaultProps} />);

    // Promedio visible
    expect(screen.getByText("4.6")).toBeInTheDocument();

    // Autor y comentario de la primera reseña
    expect(screen.getByText("Ana García")).toBeInTheDocument();
    expect(screen.getByText("Excelente trabajo, muy prolijo.")).toBeInTheDocument();

    // Etiqueta de estrellas (aria-label generado por StarRow)
    expect(screen.getAllByLabelText("5 de 5 estrellas").length).toBeGreaterThan(0);
  });

  it("renderiza las barras de distribución (etiqueta '5 ★' presente)", () => {
    render(<ProfileReviews {...defaultProps} />);
    expect(screen.getByText("5 ★")).toBeInTheDocument();
    expect(screen.getByText("4 ★")).toBeInTheDocument();
  });

  it("filtra la lista al hacer click en un filtro de estrellas", () => {
    render(<ProfileReviews {...defaultProps} />);

    // Antes del filtro, reviews de 4★ son visibles
    expect(screen.getByText("Marta Díaz")).toBeInTheDocument();

    // Clic en "5★ (3)"
    fireEvent.click(screen.getByRole("button", { name: /5★ \(3\)/i }));

    // Solo reseñas de 5 estrellas deben quedar
    expect(screen.getByText("Ana García")).toBeInTheDocument();
    expect(screen.getByText("Luis Perez")).toBeInTheDocument();
    expect(screen.queryByText("Marta Díaz")).not.toBeInTheDocument();
    expect(screen.queryByText("Carlos Ruiz")).not.toBeInTheDocument();
  });

  it("renderiza la reply card con el nombre del proveedor", () => {
    render(<ProfileReviews {...defaultProps} />);

    // El review 5 tiene reply
    expect(screen.getByText("Respuesta de GigaPrint BA")).toBeInTheDocument();
    expect(screen.getByText("Gracias Jorge, fue un placer.")).toBeInTheDocument();
  });

  it("muestra estado vacío si total === 0", () => {
    render(
      <ProfileReviews
        data={{ items: [], total: 0, has_more: false }}
        rating={{ average: null, count: 0, distribution: null }}
        providerId={1}
        providerName="Test"
      />,
    );
    expect(
      screen.getByText(/Aún no hay reseñas/i),
    ).toBeInTheDocument();
  });
});
