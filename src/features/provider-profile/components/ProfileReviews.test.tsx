import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfileReviews } from "./ProfileReviews";

const reviews = Array.from({ length: 5 }, (_, index) => ({
  id: index + 1,
  rating: 5 - (index % 2),
  comment: `Comentario ${index + 1}`,
  is_b2b_order: index === 1,
  created_at: "2026-05-01T12:00:00Z",
  author_display: `Cliente ${index + 1}`,
}));

describe("ProfileReviews", () => {
  it("shows client name first, then stars, then the review text", () => {
    render(
      <ProfileReviews
        data={{ items: reviews.slice(0, 1), total: 1, has_more: false }}
        providerId={9}
      />,
    );

    const article = screen.getByRole("article");
    const text = article.textContent || "";

    expect(text.indexOf("Cliente 1")).toBeLessThan(text.indexOf("Comentario 1"));
    expect(within(article).getByLabelText("5 de 5 estrellas")).toBeInTheDocument();
  });

  it("lets the user reveal more reviews from the carousel", () => {
    render(
      <ProfileReviews
        data={{ items: reviews, total: 5, has_more: false }}
        providerId={9}
      />,
    );

    expect(screen.queryByText("Cliente 5")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /ver mas reseñas/i }));

    expect(screen.getByText("Cliente 5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reseñas anteriores/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reseñas siguientes/i })).toBeInTheDocument();
  });
});
