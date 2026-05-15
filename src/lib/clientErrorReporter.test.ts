import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  installClientErrorReporting,
  reportClientError,
  shouldIgnoreClientErrorSource,
} from "./clientErrorReporter";

describe("clientErrorReporter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("ignores browser extension sources", () => {
    expect(shouldIgnoreClientErrorSource("chrome-extension://abc/content.js")).toBe(true);
    expect(shouldIgnoreClientErrorSource("moz-extension://abc/content.js")).toBe(true);
    expect(shouldIgnoreClientErrorSource("https://comparo3d.com.ar/assets/index.js")).toBe(false);
  });

  it("sends a critical client error to backend AND worker (canal alterno)", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    await reportClientError({
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
    installClientErrorReporting();

    window.dispatchEvent(
      new ErrorEvent("error", {
        message: "GrowthBook is not initialized yet",
        filename: "chrome-extension://abc/content.js",
      })
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
