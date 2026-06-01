import { describe, expect, it } from "vitest";

import { formatPublicOrderLabel } from "./orderLabels";

describe("formatPublicOrderLabel", () => {
  it("prefixes new numeric public order IDs", () => {
    expect(formatPublicOrderLabel("100")).toBe("#100");
  });

  it("preserves legacy public order IDs", () => {
    expect(formatPublicOrderLabel("ORD-20260525-000001")).toBe("ORD-20260525-000001");
  });

  it("uses a neutral internal fallback when no public ID exists", () => {
    expect(formatPublicOrderLabel("", 55)).toBe("#55");
  });
});
