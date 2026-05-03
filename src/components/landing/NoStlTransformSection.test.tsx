import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NoStlTransformSection from "./NoStlTransformSection";

describe("NoStlTransformSection", () => {
  it("uses the standard section title size with the requested title", () => {
    const { container } = render(<NoStlTransformSection />);

    expect(
      screen.getByRole("heading", { level: 2, name: "¿No tenés un archivo STL?" }),
    ).toBeInTheDocument();
    expect(container.querySelector("style")?.textContent).toContain(`
          font-size: 32px;
          font-weight: 700;
          line-height: 1.08;`);
    expect(container.querySelector("style")?.textContent).toContain(`
            font-size: 42px;`);
  });

  it("keeps the transform cards in a compact section-sized grid", () => {
    const { container } = render(<NoStlTransformSection />);
    const styles = container.querySelector("style")?.textContent;

    expect(styles).toContain("width: min(1080px, 100%);");
    expect(styles).toContain("gap: 18px;");
    expect(styles).toContain("padding: 14px 14px 16px;");
    expect(styles).toContain("aspect-ratio: 1.22 / 1;");
  });

  it("keeps the idea CTA aligned and compact", () => {
    const { container } = render(<NoStlTransformSection />);
    const styles = container.querySelector("style")?.textContent;

    expect(styles).toContain("padding: 20px 24px;");
    expect(styles).toContain("font-size: 24px;");
    expect(styles).toContain(`
          .no-stl-cta-copy h3 {
            font-size: 28px;
          }`);
    expect(styles).not.toContain("font-size: clamp(1.45rem, 2vw, 2rem);");
  });
});
