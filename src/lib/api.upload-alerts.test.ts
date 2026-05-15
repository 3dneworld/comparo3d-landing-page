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

  it("routes file >= 95MB to large-upload flow (R2 init, R2 PUT, finalize)", async () => {
    const bigBlob = new Blob([new Uint8Array(110 * 1024 * 1024)]);
    const bigFile = new File([bigBlob], "huge.stl", { type: "model/stl" });
    const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      fetchCalls.push({ url, init: init as RequestInit });
      if (url.endsWith("/api/large-upload/init")) {
        return new Response(
          JSON.stringify({
            success: true,
            url: "https://r2.example.com/upload-presigned",
            r2_key: "uploads/test/abc-huge.stl",
            expires_in_seconds: 3600,
            method: "PUT",
            headers: { "Content-Type": "application/octet-stream" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.endsWith("/api/large-upload/finalize")) {
        return new Response(
          JSON.stringify({
            success: true,
            temp_name: "huge_123",
            session_id: "huge_123",
            stl_sha256: "abc",
            stl_dimensions: { x: 100, y: 100, z: 100 },
            dimensions: { x: 100, y: 100, z: 100 },
            thumbnail_base64: null,
            manifold_status: "ok",
            slicing: { slicing_available: true, print_time_minutes: 60, filament_grams: 50 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response("not mocked", { status: 500 });
    });

    // Mockear XMLHttpRequest (PUT a R2) - simular exito sincrono.
    class FakeXhr {
      upload = { onprogress: null as ((e: { loaded: number; total: number; lengthComputable: boolean }) => void) | null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onabort: (() => void) | null = null;
      status = 0;
      responseText = "";
      open() { /* noop */ }
      setRequestHeader() { /* noop */ }
      send() {
        setTimeout(() => {
          this.status = 200;
          this.upload.onprogress?.({ loaded: bigFile.size, total: bigFile.size, lengthComputable: true });
          this.onload?.();
        }, 0);
      }
    }
    vi.stubGlobal("XMLHttpRequest", FakeXhr);

    const progressEvents: Array<[number, number]> = [];
    const result = await uploadStl(bigFile, undefined, (loaded, total) => progressEvents.push([loaded, total]));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.session_id).toBe("huge_123");
    }
    // Llamó init y finalize al backend, NO al endpoint upload-and-orient legacy
    const callUrls = fetchCalls.map(c => c.url);
    expect(callUrls.some(u => u.endsWith("/api/large-upload/init"))).toBe(true);
    expect(callUrls.some(u => u.endsWith("/api/large-upload/finalize"))).toBe(true);
    expect(callUrls.some(u => u.endsWith("/api/upload-and-orient"))).toBe(false);
    // Reporta el routing como warning (no critico).
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: "upload_routed_to_large", severity: "warning" })
    );
    // Hubo al menos 1 evento de progreso.
    expect(progressEvents.length).toBeGreaterThan(0);
  });

  it("falls back with friendly message when /api/large-upload/init returns 503 (R2 not configured)", async () => {
    const bigBlob = new Blob([new Uint8Array(110 * 1024 * 1024)]);
    const bigFile = new File([bigBlob], "huge.stl", { type: "model/stl" });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: false, error: "R2 no configurado" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await uploadStl(bigFile);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/info@comparo3d\.com\.ar/);
      expect(result.error).not.toMatch(/ventas@/);
    }
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: "large_upload_init_fail", status: 503 })
    );
  });

  it("does not crash when Cloudflare returns 413 with HTML for a small file (edge case)", async () => {
    // Archivo chico (size < 95MB) que igual recibe 413 del edge - escenario raro
    // pero posible. El frontend debe degradar a uploadStlLarge en lugar de
    // crashear parseando HTML como JSON, y reportar el caso.
    let callIdx = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      callIdx += 1;
      if (callIdx === 1) {
        // Primera call: upload-and-orient devuelve 413 con HTML.
        return new Response("<html><body>413 Payload Too Large</body></html>", {
          status: 413,
          headers: { "Content-Type": "text/html" },
        });
      }
      // Subsiguientes calls al flujo large: 503 R2 no configurado en este mock.
      return new Response(JSON.stringify({ success: false, error: "R2 no configurado" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    });

    const result = await uploadStl(new File(["x"], "piece.stl"));

    expect(result.success).toBe(false);
    // El reporte 413 debe haberse disparado igual.
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
