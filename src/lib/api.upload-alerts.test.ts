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
});
