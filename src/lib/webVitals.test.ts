import { describe, expect, it, vi } from "vitest";

import { initWebVitals } from "./webVitals";

function metricApi() {
  return {
    onCLS: vi.fn(),
    onFCP: vi.fn(),
    onINP: vi.fn(),
    onLCP: vi.fn(),
    onTTFB: vi.fn(),
  };
}

describe("initWebVitals", () => {
  it("does not load web-vitals when Array.at is unavailable", async () => {
    const originalAt = Object.getOwnPropertyDescriptor(Array.prototype, "at");
    Object.defineProperty(Array.prototype, "at", {
      configurable: true,
      value: undefined,
    });
    const loader = vi.fn(async () => metricApi());

    try {
      await initWebVitals(loader);
      expect(loader).not.toHaveBeenCalled();
    } finally {
      if (originalAt) {
        Object.defineProperty(Array.prototype, "at", originalAt);
      }
    }
  });

  it("registers all metrics after the compatibility guard passes", async () => {
    const api = metricApi();
    const loader = vi.fn(async () => api);

    await initWebVitals(loader);

    expect(loader).toHaveBeenCalledOnce();
    expect(api.onLCP).toHaveBeenCalledOnce();
    expect(api.onINP).toHaveBeenCalledOnce();
    expect(api.onCLS).toHaveBeenCalledOnce();
    expect(api.onFCP).toHaveBeenCalledOnce();
    expect(api.onTTFB).toHaveBeenCalledOnce();
  });

  it("contains telemetry loader failures", async () => {
    const loader = vi.fn(async () => {
      throw new Error("chunk unavailable");
    });

    await expect(initWebVitals(loader)).resolves.toBeUndefined();
  });
});
