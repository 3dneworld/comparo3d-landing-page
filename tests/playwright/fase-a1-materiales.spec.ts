import { test, expect } from "@playwright/test";
import * as path from "path";

/**
 * Fase A1 — Pixel-perfect gate Materiales
 *
 * Captura PROD (https://comparo3d.com.ar/proveedores-v2/materiales) y mockup local
 * para diff perceptual manual. NO falla por delta — el diff lo evalúa humano.
 *
 * Correr:
 *   npx playwright test tests/playwright/fase-a1-materiales.spec.ts --project=chromium
 */

const MOCKUP_ABS =
  "C:/Users/chris/Cotizador3d/marketplace-backend/Frontend/provider-dashboard/_design_review/MATERIALES - PERFIL - PROD - unpacked.html";

const SCREENS_DIR =
  "C:/Users/chris/Cotizador3d/comparo3d-landing-page/tests/playwright/screens";
const PROD_PNG = path.join(SCREENS_DIR, "materiales-prod-full.png");
const MOCK_PNG = path.join(SCREENS_DIR, "materiales-mock-full.png");
const LOGIN_FAIL_PNG = path.join(SCREENS_DIR, "materiales-prod-login-fail.png");

const VIEWPORT = { width: 1440, height: 900 };

test.use({ viewport: VIEWPORT });

test("Materiales — capturas PROD vs mockup", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: VIEWPORT });

  // ---------- 1) PROD ----------
  const prod = await ctx.newPage();
  let prodOk = false;
  try {
    await prod.goto("https://comparo3d.com.ar/proveedores/login", {
      waitUntil: "domcontentloaded",
      timeout: 25_000,
    });

    const emailSel = 'input[type="email"], input[name="email"], input[name="user"], input[name="username"]';
    const passSel = 'input[type="password"], input[name="password"]';
    await prod.waitForSelector(emailSel, { timeout: 12_000 });
    await prod.fill(emailSel, "3dclowbot@gmail.com");
    await prod.fill(passSel, "lapicera");

    await Promise.all([
      prod
        .waitForURL(/proveedores-v2|dashboard|materiales/, { timeout: 25_000 })
        .catch(() => {}),
      prod
        .click(
          'button[type="submit"], button:has-text("Ingresar"), button:has-text("Iniciar"), button:has-text("Entrar")'
        )
        .catch(() => {}),
    ]);

    await prod.goto("https://comparo3d.com.ar/proveedores-v2/materiales", {
      waitUntil: "domcontentloaded",
      timeout: 25_000,
    });

    await Promise.race([
      prod.waitForSelector('[data-screen-label="Materiales"]', { timeout: 15_000 }),
      prod.waitForSelector('text=/Materiales/i', { timeout: 15_000 }),
    ]).catch(() => {});
    await prod.waitForTimeout(2000);

    await prod.screenshot({ fullPage: true, path: PROD_PNG });
    prodOk = true;
    // eslint-disable-next-line no-console
    console.log(`[FASE-A1] PROD screenshot OK -> ${PROD_PNG}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[FASE-A1] PROD capture failed: ${(err as Error).message}`);
    try {
      await prod.screenshot({ fullPage: true, path: LOGIN_FAIL_PNG });
    } catch {
      // ignore
    }
  }

  // ---------- 2) Mockup ----------
  const mock = await ctx.newPage();
  const mockUrl = "file:///" + MOCKUP_ABS.replace(/\\/g, "/");
  await mock.goto(mockUrl, { waitUntil: "load", timeout: 20_000 });
  await mock.waitForTimeout(1200);
  await mock.screenshot({ fullPage: true, path: MOCK_PNG });
  // eslint-disable-next-line no-console
  console.log(`[FASE-A1] Mockup screenshot OK -> ${MOCK_PNG}`);

  // Smoke pass — diff perceptual lo hace humano
  expect(true).toBe(true);

  // eslint-disable-next-line no-console
  console.log(`[FASE-A1] prodOk=${prodOk}`);
});
