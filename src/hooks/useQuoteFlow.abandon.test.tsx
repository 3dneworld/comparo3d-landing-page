import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useQuoteFlow } from "./useQuoteFlow";
import { reportClientError } from "@/lib/clientErrorReporter";

vi.mock("@/lib/clientErrorReporter", () => ({
  reportClientError: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    getQuoteOptions: vi.fn().mockResolvedValue({
      success: false,
      status: "processing",
      progress_pct: 10,
      progress_message: "Procesando",
    }),
  };
});

describe("useQuoteFlow abandoned polling reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not report quote polling as abandoned on internal hook cleanup", async () => {
    const { result, unmount } = renderHook(() =>
      useQuoteFlow({
        sessionId: "Simple_Toothbrush_Case_V_1_0_1780319469",
        tempName: "Simple_Toothbrush_Case_V_1_0_1780319469",
        onSessionIdReady: vi.fn(),
        onQuotesReady: vi.fn(),
      })
    );

    act(() => {
      result.current.startPollingOptions();
    });

    await waitFor(() => {
      expect(result.current.isProcessing).toBe(true);
    });

    unmount();

    expect(reportClientError).not.toHaveBeenCalledWith(
      expect.objectContaining({ event_type: "quote_poll_abandoned" })
    );
  });

  it("reports quote polling as abandoned on pagehide after the minimum wait", async () => {
    let nowMs = Date.parse("2026-06-09T13:39:00.000Z");
    const dateNowSpy = vi.spyOn(Date, "now").mockImplementation(() => nowMs);

    const { result, unmount } = renderHook(() =>
      useQuoteFlow({
        sessionId: "Simple_Toothbrush_Case_V_1_0_1780319469",
        tempName: "Simple_Toothbrush_Case_V_1_0_1780319469",
        onSessionIdReady: vi.fn(),
        onQuotesReady: vi.fn(),
      })
    );

    act(() => {
      result.current.startPollingOptions();
    });

    await waitFor(() => {
      expect(result.current.isProcessing).toBe(true);
    });

    nowMs += 31_000;

    act(() => {
      window.dispatchEvent(new PageTransitionEvent("pagehide"));
    });

    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: "quote_poll_abandoned",
        context: expect.objectContaining({
          elapsed_ms: 31_000,
          session_id: "Simple_Toothbrush_Case_V_1_0_1780319469",
        }),
      })
    );

    unmount();
    dateNowSpy.mockRestore();
  });
});
