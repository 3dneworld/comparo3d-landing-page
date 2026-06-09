import { beforeEach, describe, expect, it, vi } from "vitest";

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

  it("ignores browser extension sources", () => {
    expect(reporter.shouldIgnoreClientErrorSource("chrome-extension://abc/content.js")).toBe(true);
    expect(reporter.shouldIgnoreClientErrorSource("moz-extension://abc/content.js")).toBe(true);
    expect(reporter.shouldIgnoreClientErrorSource("https://comparo3d.com.ar/assets/index.js")).toBe(false);
  });

  it("sends a critical client error to backend AND worker (canal alterno)", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    await reporter.reportClientError({
      event_type: "upload_timeout",
      message: "Upload timeout",
      context: { flow: "quote_upload", filename: "piece.stl" },
    });

    // Debe llamar a los dos canales: backend /api/client-error + worker /client-error
    const urls = fetchMock.mock.calls.map(([u]) => String(u));
    expect(urls.some((u) => u.includes("/api/client-error"))).toBe(true);
    expect(urls.some((u) => u.includes("workers.dev") && u.endsWith("/client-error"))).toBe(true);

    // Body identico en ambos canales
    for (const [, init] of fetchMock.mock.calls) {
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toMatchObject({
        event_type: "upload_timeout",
        message: "Upload timeout",
        severity: "critical",
      });
    }
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
