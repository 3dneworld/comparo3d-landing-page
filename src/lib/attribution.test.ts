import { beforeEach, describe, expect, it } from "vitest";
import { captureAttributionFromUrl, getAttributionPayload } from "./attribution";

describe("attribution (F0)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("tráfico directo (sin utm) no persiste nada", () => {
    captureAttributionFromUrl("?foo=bar");
    expect(getAttributionPayload()).toEqual({});
  });

  it("aterrizaje con utm persiste y se adjunta al payload", () => {
    captureAttributionFromUrl(
      "?utm_source=instagram&utm_medium=organic&utm_campaign=mundial2026"
    );
    const p = getAttributionPayload();
    expect(p.utm_source).toBe("instagram");
    expect(p.utm_medium).toBe("organic");
    expect(p.utm_campaign).toBe("mundial2026");
    expect(typeof p.first_touch_at).toBe("string");
  });

  it("last-click pisa la red pero conserva first_touch_at", async () => {
    captureAttributionFromUrl("?utm_source=instagram&utm_campaign=mundial2026");
    const first = getAttributionPayload().first_touch_at;
    await new Promise((r) => setTimeout(r, 5));
    captureAttributionFromUrl("?utm_source=tiktok&utm_campaign=mundial2026");
    const p = getAttributionPayload();
    expect(p.utm_source).toBe("tiktok"); // last-click gana
    expect(p.first_touch_at).toBe(first); // primer contacto preservado
  });

  it("navegación interna (sin utm) no borra la atribución previa", () => {
    captureAttributionFromUrl("?utm_source=facebook&utm_campaign=mundial2026");
    captureAttributionFromUrl("?page=2"); // nav interna sin utm
    expect(getAttributionPayload().utm_source).toBe("facebook");
  });
});
