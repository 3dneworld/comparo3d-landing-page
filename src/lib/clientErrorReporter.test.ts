import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ClientErrorReporterModule = typeof import("./clientErrorReporter");

let reporter: ClientErrorReporterModule;

describe("clientErrorReporter", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_API_URL", "https://api.3dneworld.com");
    vi.resetModules();
    reporter = await import("./clientErrorReporter");
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ignores browser extension sources", () => {
    expect(reporter.shouldIgnoreClientErrorSource("chrome-extension://abc/content.js")).toBe(true);
    expect(reporter.shouldIgnoreClientErrorSource("moz-extension://abc/content.js")).toBe(true);
    expect(reporter.shouldIgnoreClientErrorSource("https://comparo3d.com.ar/assets/index.js")).toBe(false);
  });

  it("stops after the backend acknowledges the client error", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    await reporter.reportClientError({
      event_type: "upload_timeout",
      message: "Upload timeout",
      context: { flow: "quote_upload", filename: "piece.stl" },
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://api.3dneworld.com/api/client-error");
  });

  it("uses the Worker only after the backend request fails", async () => {
    let rejectBackend: ((reason?: unknown) => void) | undefined;
    const backendRequest = new Promise<Response>((_, reject) => {
      rejectBackend = reject;
    });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => backendRequest)
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    const report = reporter.reportClientError({
      event_type: "upload_timeout",
      message: "Upload timeout",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    rejectBackend?.(new TypeError("Failed to fetch"));
    await report;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("workers.dev/client-error");
    expect(fetchMock.mock.calls[1][1]?.body).toBe(fetchMock.mock.calls[0][1]?.body);
  });

  it("uses the Worker when the backend does not respond before the timeout", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => new Promise<Response>(() => undefined))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    const report = reporter.reportClientError({
      event_type: "window_error",
      message: "Backend timeout",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(10_000);
    await report;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("workers.dev/client-error");
  });

  it("does not send extension window errors", () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    reporter.installClientErrorReporting();

    window.dispatchEvent(
      new ErrorEvent("error", {
        message: "GrowthBook is not initialized yet",
        filename: "chrome-extension://abc/content.js",
      })
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
