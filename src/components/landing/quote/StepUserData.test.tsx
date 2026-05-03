import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { StepUserData } from "./StepUserData";

const baseData = {
  nombre: "Test",
  email: "test@example.com",
  telefono: "",
  ubicacion: "Buenos Aires",
  material: "PLA",
  cantidad: "1",
  detalles: "",
  colorAcabado: "",
  infill: "20%",
  alturaCapa: "0.2mm",
  observaciones: "",
};

describe("StepUserData advanced options", () => {
  it("keeps advanced options stable after selecting a filament color", () => {
    const Wrapper = () => {
      const [data, setData] = useState(baseData);

      return (
        <StepUserData
          data={data}
          fileName=""
          thumbnailUrl={null}
          isEmpresa={false}
          isLoading={false}
          progressMessage=""
          error={null}
          onChange={(field, value) => setData((prev) => ({ ...prev, [field]: value }))}
          onRemoveFile={() => {}}
          onReplacementFileSelect={() => {}}
          onBack={() => {}}
          onContinue={() => {}}
        />
      );
    };

    render(<Wrapper />);

    fireEvent.click(screen.getByRole("button", { name: /opciones avanzadas/i }));
    fireEvent.click(screen.getByRole("button", { name: /azul/i }));

    expect(screen.getByText("COLOR")).toBeVisible();
    expect(screen.getByRole("button", { name: /azul/i })).toBeVisible();
  });
});
