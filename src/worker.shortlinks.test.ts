import { describe, expect, it } from "vitest";
import worker from "./worker";

type KvValue = string | null;

class MemoryKv {
  private values = new Map<string, string>();

  async get(key: string): Promise<KvValue> {
    return this.values.get(key) ?? null;
  }

  async put(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }
}

function buildEnv(kv = new MemoryKv()) {
  return {
    ASSETS: {
      fetch: async () => new Response(null, { status: 404 }),
    },
    SHORTLINKS_KV: kv,
    SHORTLINK_ADMIN_TOKEN: "test-secret",
  };
}

describe("short-link worker routes", () => {
  it("redirects the built-in /r/fbg slug to the campaign URL and tracks the click", async () => {
    const kv = new MemoryKv();
    const response = await worker.fetch(
      new Request("https://comparo3d.com.ar/r/fbg"),
      buildEnv(kv),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://comparo3d.com.ar/?utm_source=facebook_grupo&utm_medium=organic&utm_campaign=mundial2026#trending",
    );
    expect(await kv.get("clicks:fbg:total")).toBe("1");
  });

  it("redirects the bare /adorni campaign slug to step 1 (#cotizar) and tracks the click", async () => {
    const kv = new MemoryKv();
    const response = await worker.fetch(
      new Request("https://comparo3d.com.ar/adorni"),
      buildEnv(kv),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://comparo3d.com.ar/?utm_source=email&utm_medium=email&utm_campaign=adorni#cotizar",
    );
    expect(await kv.get("clicks:adorni:total")).toBe("1");
  });

  it("creates a KV-backed short link through the admin API", async () => {
    const kv = new MemoryKv();
    const response = await worker.fetch(
      new Request("https://comparo3d.com.ar/api/shortlinks", {
        method: "POST",
        headers: {
          authorization: "Bearer test-secret",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          slug: "fb-test",
          utm_source: "facebook_grupo",
          utm_campaign: "mundial2026",
          utm_content: "post_01",
        }),
      }),
      buildEnv(kv),
    );

    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload).toMatchObject({
      ok: true,
      short_url: "https://comparo3d.com.ar/r/fb-test",
      target_url:
        "https://comparo3d.com.ar/?utm_source=facebook_grupo&utm_medium=organic&utm_campaign=mundial2026&utm_content=post_01#trending",
    });

    const stored = JSON.parse((await kv.get("link:fb-test")) || "{}");
    expect(stored).toMatchObject({
      utm_source: "facebook_grupo",
      utm_campaign: "mundial2026",
      utm_content: "post_01",
    });
  });

  it("redirects a KV-backed short link and increments total and daily counters", async () => {
    const kv = new MemoryKv();
    await kv.put(
      "link:ig-campaign",
      JSON.stringify({
        destination_path: "/",
        fragment: "trending",
        utm_source: "instagram",
        utm_medium: "organic",
        utm_campaign: "mundial2026",
      }),
    );

    const response = await worker.fetch(
      new Request("https://comparo3d.com.ar/r/ig-campaign"),
      buildEnv(kv),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://comparo3d.com.ar/?utm_source=instagram&utm_medium=organic&utm_campaign=mundial2026#trending",
    );
    expect(await kv.get("clicks:ig-campaign:total")).toBe("1");
    const dailyKeys = ["clicks:ig-campaign:daily:"];
    expect(
      [...(kv as unknown as { values: Map<string, string> }).values.keys()].some((key) =>
        dailyKeys.some((prefix) => key.startsWith(prefix)),
      ),
    ).toBe(true);
  });
});
