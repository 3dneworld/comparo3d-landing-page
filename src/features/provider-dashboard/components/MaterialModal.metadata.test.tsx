import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MaterialModal } from "./MaterialModal";
import { updateProviderMaterials } from "@/features/provider-dashboard/api";
import type { DashboardMaterial } from "@/features/provider-dashboard/types";

vi.mock("@/features/provider-dashboard/api", async () => {
  const actual = await vi.importActual<typeof import("@/features/provider-dashboard/api")>(
    "@/features/provider-dashboard/api"
  );
  return {
    ...actual,
    updateProviderMaterials: vi.fn().mockResolvedValue({ success: true, materials: [] }),
  };
});

vi.mock("@/components/ui/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function color(id: number, name: string, hex: string) {
  return { id, color_name: name, color_hex: hex, activo: 1, in_stock: 1, last_confirmed_at: null };
}

const materials: DashboardMaterial[] = [
  {
    id: 10,
    material_code: "PLA",
    activo: 1,
    precio_hora: 2500,
    in_stock: 1,
    last_confirmed_at: null,
    allow_custom_color: 0,
    trabajo_minimo_override: null,
    metadata: { color_count: 3, attributes: ["Técnico"] },
    colores: [color(101, "Blanco", "#FFFFFF"), color(102, "Negro", "#1F1F1F")],
  },
  {
    id: 20,
    material_code: "PETG",
    activo: 1,
    precio_hora: 3200,
    in_stock: 1,
    last_confirmed_at: null,
    allow_custom_color: 0,
    trabajo_minimo_override: null,
    metadata: { color_count: 7, attributes: ["Flexible"] },
    colores: [color(201, "Azul", "#2563EB")],
  },
];

function renderModal() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MaterialModal
        mode={{ kind: "edit", id: 10 }}
        providerId={1}
        materials={materials}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    </QueryClientProvider>
  );
}

describe("MaterialModal metadata", () => {
  beforeEach(() => vi.clearAllMocks());

  it("preserves metadata of non-edited materials when saving (no data loss)", async () => {
    renderModal();

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(updateProviderMaterials).toHaveBeenCalled());
    const [, payload] = vi.mocked(updateProviderMaterials).mock.calls[0];

    const petg = payload.materiales.find((m) => m.material_code === "PETG");
    expect(petg?.metadata).toEqual({ color_count: 7, attributes: ["Flexible"] });
  });

  it("writes color_count and attributes for the edited material", async () => {
    renderModal();

    // Agregar el atributo "Flexible" al material PLA editado.
    fireEvent.click(screen.getByRole("button", { name: "Flexible" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(updateProviderMaterials).toHaveBeenCalled());
    const [, payload] = vi.mocked(updateProviderMaterials).mock.calls[0];

    const pla = payload.materiales.find((m) => m.material_code === "PLA");
    expect(pla?.metadata?.color_count).toBe(3);
    expect(pla?.metadata?.attributes).toEqual(expect.arrayContaining(["Técnico", "Flexible"]));
  });
});
