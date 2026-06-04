import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { AudienceProvider } from "@/contexts/AudienceContext";
import QuoteSection from "./QuoteSection";

const flowMocks = vi.hoisted(() => ({
  handleInitDraft: vi.fn(),
  startPollingOptions: vi.fn(),
}));

vi.mock("@/hooks/useQuoteFlow", () => ({
  useQuoteFlow: () => ({
    isLoading: false,
    isProcessing: false,
    progressMessage: "",
    progressPct: null,
    progressStep: null,
    progressStartedAt: null,
    error: null,
    quotes: [],
    orderId: null,
    stlFile: null,
    thumbnailUrl: null,
    thumbnailQuality: null,
    material: null,
    cantidad: null,
    stlDimensions: null,
    handleInitDraft: flowMocks.handleInitDraft,
    startPollingOptions: flowMocks.startPollingOptions,
    handleUpdateQuantity: vi.fn(),
    handleAcceptQuote: vi.fn(),
    handleRetrySlicing: vi.fn(),
    resetUploadState: vi.fn(),
    setStlFile: vi.fn(),
    clearError: vi.fn(),
    setError: vi.fn(),
  }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    getThumbnail: vi.fn().mockResolvedValue({
      success: true,
      thumbnail_base64: "data:image/png;base64,thumb",
      thumbnail_quality: "full",
      source: "cache",
    }),
  };
});

describe("QuoteSection requote", () => {
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
    flowMocks.handleInitDraft.mockReset().mockResolvedValue(true);
    flowMocks.startPollingOptions.mockReset();
    localStorage.setItem(
      "comparo3d_quote",
      JSON.stringify({
        fileName: "pinza.stl",
        step: 2,
        sessionId: "PINZA_1780505088",
        tempName: "PINZA_1780505088",
        stlSha256: "abc123",
        nombre: "Chris",
        email: "chris@example.com",
        telefono: "+541100000000",
        ubicacion: "CABA",
        material: "PETG",
        cantidad: "1",
        colorAcabado: "Gris",
      })
    );
  });

  it("polls again when the same session is requoted after changing the color", async () => {
    render(
      <AudienceProvider>
        <QuoteSection />
      </AudienceProvider>
    );

    expect(await screen.findByText("Tus datos")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /ver cotizaciones/i }));

    await waitFor(() => {
      expect(flowMocks.startPollingOptions).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: /volver/i }));
    fireEvent.click(screen.getByRole("button", { name: /opciones avanzadas/i }));
    fireEvent.click(screen.getByRole("button", { name: /naranja/i }));
    fireEvent.click(screen.getByRole("button", { name: /ver cotizaciones/i }));

    await waitFor(() => {
      expect(flowMocks.handleInitDraft).toHaveBeenLastCalledWith(
        expect.objectContaining({ material: "PETG", color_acabado: "Naranja" })
      );
      expect(flowMocks.startPollingOptions).toHaveBeenCalledTimes(2);
    });
  });
});
