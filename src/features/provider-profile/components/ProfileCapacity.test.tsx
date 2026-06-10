import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfileCapacity } from "./ProfileCapacity";

describe("ProfileCapacity", () => {
  it("renders printer brands as part of technical capacity", () => {
    render(
      <ProfileCapacity
        capacity={{
          cama_max_mm: { x: 400, y: 400, z: 450 },
          impresoras_declaradas: 4,
          materiales_activos: ["PLA", "PETG"],
          materiales: null,
          marcas: ["Bambu Lab", "Prusa"],
        }}
      />,
    );

    expect(screen.getByText("Marcas")).toBeInTheDocument();
    expect(screen.getByText("Bambu Lab · Prusa")).toBeInTheDocument();
  });
});
