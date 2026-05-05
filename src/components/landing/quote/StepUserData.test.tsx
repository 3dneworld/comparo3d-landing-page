import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StepUserData } from "./StepUserData";

const baseData = {
  nombre: "",
  email: "",
  telefono: "",
  ubicacion: "",
  material: "PLA",
  cantidad: "1",
  detalles: "",
  colorAcabado: "",
  infill: "20%",
  alturaCapa: "0.2mm",
  observaciones: "",
};

describe("StepUserData", () => {
  it("does not show the generic model image when the STL thumbnail is missing", () => {
    render(
      <StepUserData
        data={baseData}
        fileName="cliente-real.stl"
        thumbnailUrl={null}
        isEmpresa={false}
        isLoading={false}
        progressMessage=""
        error={null}
        onChange={vi.fn()}
        onBack={vi.fn()}
        onContinue={vi.fn()}
      />
    );

    expect(screen.queryByAltText("Vista previa del modelo 3D")).not.toBeInTheDocument();
    expect(screen.getByText(/generando vista previa real/i)).toBeInTheDocument();
  });
});
