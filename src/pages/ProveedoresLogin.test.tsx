import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProveedoresLogin from "./ProveedoresLogin";

const locationAssign = vi.fn();

Object.defineProperty(window, "location", {
  value: {
    href: "",
    assign: locationAssign,
  },
  writable: true,
});

describe("ProveedoresLogin", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    locationAssign.mockClear();
    window.location.href = "";
  });

  it("passes the requested dashboard path through Google OAuth", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false } as Response);

    render(
      <MemoryRouter initialEntries={["/proveedores/login?next=%2Fdashboard%2Fproveedores%2Fmateriales"]}>
        <Routes>
          <Route path="/proveedores/login" element={<ProveedoresLogin />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole("button", { name: /Continuar con Google/i }));

    expect(window.location.href).toBe(
      "/api/auth/login?redirect=%2Fdashboard%2Fproveedores%2Fmateriales"
    );
  });

  it("returns an already-authenticated provider to the requested dashboard path", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, provider_id: 1, role: "provider" }),
    } as Response);

    render(
      <MemoryRouter initialEntries={["/proveedores/login?next=%2Fdashboard%2Fproveedores%2Fmateriales"]}>
        <Routes>
          <Route path="/proveedores/login" element={<ProveedoresLogin />} />
          <Route path="/dashboard/proveedores/materiales" element={<div>Materiales destino</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Materiales destino")).toBeInTheDocument());
  });
});
