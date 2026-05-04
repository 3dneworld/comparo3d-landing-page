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

  it("sends a critical client error to the backend", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    await reportClientError({
      event_type: "upload_timeout",
      message: "Upload timeout",
      context: { flow: "quote_upload", filename: "piece.stl" },
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/api/client-error");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      event_type: "upload_timeout",
      message: "Upload timeout",
      severity: "critical",
    });
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
