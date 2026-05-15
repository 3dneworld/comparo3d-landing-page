import { beforeEach, describe, expect, it, vi } from "vitest";
import { uploadStl } from "./api";
import { reportClientError } from "./clientErrorReporter";

vi.mock("./clientErrorReporter", () => ({
  reportClientError: vi.fn(),
}));

describe("uploadStl alerting", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("reports failed upload responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: false, error: "backend down" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await uploadStl(new File(["solid test\nendsolid test\n"], "piece.stl"));

    expect(result.success).toBe(false);
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: "upload_failed_response",
        message: expect.stringContaining("backend down"),
      })
    );
  });

  it("reports network errors during upload", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await uploadStl(new File(["solid test\nendsolid test\n"], "piece.stl"));

    expect(result.success).toBe(false);
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: "upload_fetch_error",
        message: "Failed to fetch",
      })
    );
  });

  it("blocks upload pre-flight when file exceeds Cloudflare 100MB limit", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    // Simulamos archivo de 110MB sin gastar memoria real (File acepta size en blob).
    const bigBlob = new Blob([new Uint8Array(110 * 1024 * 1024)]);
    const bigFile = new File([bigBlob], "huge.stl", { type: "model/stl" });

    const result = await uploadStl(bigFile);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/110\.0 MB/);
      expect(result.error).toMatch(/100 MB/);
    }
    // Pre-check evita el fetch (no malgasta el upload contra Cloudflare).
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: "upload_too_large_pre_check",
        status: 413,
        error_type: "file_too_large",
      })
    );
  });

  it("translates Cloudflare 413 HTML into clear file-too-large message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<html><body>413 Payload Too Large</body></html>", {
        status: 413,
        headers: { "Content-Type": "text/html" },
      })
    );

    // Archivo bajo el pre-check pero el server (Cloudflare) responde 413.
    const result = await uploadStl(new File(["x"], "piece.stl"));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/100 MB/);
    }
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: "upload_too_large_413",
        status: 413,
      })
    );
  });

  it("does not crash when server returns non-JSON body (e.g., Cloudflare HTML on 502)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<html>502 Bad Gateway</html>", {
        status: 502,
        headers: { "Content-Type": "text/html" },
      })
    );

    const result = await uploadStl(new File(["solid test\nendsolid test\n"], "piece.stl"));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/no JSON|HTTP 502/i);
    }
  });
});
