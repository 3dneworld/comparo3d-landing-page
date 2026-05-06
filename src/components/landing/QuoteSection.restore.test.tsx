import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { AudienceProvider } from "@/contexts/AudienceContext";
import QuoteSection from "./QuoteSection";

const apiMocks = vi.hoisted(() => ({
  getThumbnail: vi.fn(),
  uploadStl: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    getThumbnail: apiMocks.getThumbnail,
    uploadStl: apiMocks.uploadStl,
  };
});

describe("QuoteSection saved upload restore", () => {
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

    Element.prototype.scrollIntoView = vi.fn();
  });

  beforeEach(() => {
    localStorage.clear();
    apiMocks.getThumbnail.mockReset();
    apiMocks.uploadStl.mockReset();
  });

  it("does not restore a detected STL when the saved upload has no backend session", () => {
    localStorage.setItem(
      "comparo3d_quote",
      JSON.stringify({
        fileName: "2 balls.stl",
        step: 1,
        sessionId: "",
        tempName: "",
      })
    );

    render(
      <AudienceProvider>
        <QuoteSection />
      </AudienceProvider>
    );

    expect(screen.queryByText("2 balls.stl")).not.toBeInTheDocument();
    expect(screen.getByText(/Arrastra tu STL/i)).toBeInTheDocument();
  });

  it("continues to user data when upload returns a large thumbnail", async () => {
    apiMocks.uploadStl.mockResolvedValue({
      success: true,
      temp_name: "2_balls_1777727450",
      session_id: "2_balls_1777727450",
      stl_sha256: "abc123",
      stl_dimensions: { x: 1, y: 1, z: 1 },
      dimensions: { x: 1, y: 1, z: 1 },
      thumbnail_base64: `data:image/png;base64,${"a".repeat(900_000)}`,
      manifold_status: "ok",
      slicing: {
        slicing_available: true,
        print_time_minutes: 1,
        filament_grams: 1,
      },
    });

    render(
      <AudienceProvider>
        <QuoteSection />
      </AudienceProvider>
    );

    const file = new File(["solid test\nendsolid test\n"], "2 balls.stl", { type: "model/stl" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText("Tus datos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /opciones avanzadas/i })).toBeInTheDocument();
    expect(localStorage.getItem("comparo3d_quote")).not.toContain("data:image/png;base64");
  });

  it("replaces a preview thumbnail with the full thumbnail when backend finishes it", async () => {
    apiMocks.uploadStl.mockResolvedValue({
      success: true,
      temp_name: "octopus_1777727450",
      session_id: "octopus_1777727450",
      stl_sha256: "abc123",
      stl_dimensions: { x: 1, y: 1, z: 1 },
      dimensions: { x: 1, y: 1, z: 1 },
      thumbnail_base64: "data:image/png;base64,preview",
      thumbnail_quality: "preview",
      manifold_status: "ok",
      slicing: {
        slicing_available: false,
        print_time_minutes: 0,
        filament_grams: 0,
      },
    });
    apiMocks.getThumbnail.mockResolvedValue({
      success: true,
      thumbnail_base64: "data:image/png;base64,full",
      thumbnail_quality: "full",
      source: "cache",
    });

    render(
      <AudienceProvider>
        <QuoteSection />
      </AudienceProvider>
    );

    const file = new File(["solid test\nendsolid test\n"], "octopus.stl", { type: "model/stl" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText("Tus datos")).toBeInTheDocument();

    await waitFor(
      () => {
        expect(apiMocks.getThumbnail).toHaveBeenCalledWith("octopus_1777727450");
        expect(screen.getByAltText("Vista previa del modelo 3D")).toHaveAttribute(
          "src",
          "data:image/png;base64,full"
        );
      },
      { timeout: 2500 }
    );
  });

  it("does not show a redundant continue button for a restored quote", async () => {
    localStorage.setItem(
      "comparo3d_quote",
      JSON.stringify({
        fileName: "octopus.stl",
        step: 2,
        sessionId: "octopus_1777727450",
        tempName: "octopus_1777727450.stl",
        stlSha256: "abc123",
      })
    );
    apiMocks.getThumbnail.mockResolvedValue({
      success: true,
      thumbnail_base64: "data:image/png;base64,thumb",
      thumbnail_quality: "full",
      source: "cache",
    });

    render(
      <AudienceProvider>
        <QuoteSection />
      </AudienceProvider>
    );

    expect(await screen.findByText("Encontramos una cotización empezada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /empezar de nuevo/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^continuar$/i })).not.toBeInTheDocument();
  });

  it("clears a restored step 2 upload from the preview trash button", async () => {
    localStorage.setItem(
      "comparo3d_quote",
      JSON.stringify({
        fileName: "octopus.stl",
        step: 2,
        sessionId: "octopus_1777727450",
        tempName: "octopus_1777727450.stl",
        stlSha256: "abc123",
      })
    );
    apiMocks.getThumbnail.mockResolvedValue({
      success: true,
      thumbnail_base64: "data:image/png;base64,thumb",
      thumbnail_quality: "full",
      source: "cache",
    });

    render(
      <AudienceProvider>
        <QuoteSection />
      </AudienceProvider>
    );

    expect(await screen.findByText("Tus datos")).toBeInTheDocument();

    const removeButton = await screen.findByRole("button", { name: /quitar archivo/i });
    expect(removeButton).toHaveClass("text-red-500");
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.getByText(/Arrastra tu STL/i)).toBeInTheDocument();
    });

    const saved = JSON.parse(localStorage.getItem("comparo3d_quote") ?? "{}");
    expect(saved.fileName).toBe("");
    expect(saved.sessionId).toBe("");
  });

  it("clears a restored upload when the user removes the file", async () => {
    localStorage.setItem(
      "comparo3d_quote",
      JSON.stringify({
        fileName: "2 balls.stl",
        step: 1,
        sessionId: "2_balls_1777727450",
        tempName: "2_balls_1777727450.stl",
        stlSha256: "abc123",
        selectedQuote: { quote_option_uid: "quote-1" },
        orderId: "order-1",
      })
    );

    render(
      <AudienceProvider>
        <QuoteSection />
      </AudienceProvider>
    );

    expect(screen.getByText("2 balls.stl")).toBeInTheDocument();

    expect(() => {
      fireEvent.click(screen.getByRole("button", { name: /quitar archivo/i }));
    }).not.toThrow();

    await waitFor(() => {
      expect(screen.getByText(/Arrastra tu STL/i)).toBeInTheDocument();
    });

    const saved = JSON.parse(localStorage.getItem("comparo3d_quote") ?? "{}");
    expect(saved.fileName).toBe("");
    expect(saved.sessionId).toBe("");
    expect(saved.tempName).toBe("");
    expect(saved.stlSha256).toBe("");
    expect(saved.selectedQuote).toBeNull();
    expect(saved.orderId).toBe("");
  });
});
