import { defineConfig, devices } from "@playwright/test";

// Config dedicada Fase A1 — aislada de la config Lovable del root.
export default defineConfig({
  testDir: ".",
  timeout: 90_000,
  expect: { timeout: 12_000 },
  reporter: [["list"]],
  use: {
    headless: true,
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
