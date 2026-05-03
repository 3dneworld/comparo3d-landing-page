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
