import { test, expect } from '@playwright/test';

/**
 * W7 visual gate — the 13-state Tempering Court matrix (Appendix F), each at native
 * 2048×1152 from a fixture surface. Dev-only; removed at W13 cutover.
 */
const STATES = [
  '01_martial_R2', '02_earth_R3', '03_heaven_R4', '04_martial_R1_signature',
  '05_heaven_R6', '06_earth_R7_all', '07_idle', '08_blocked_combat',
  '09_overworked', '10_reduced_motion', '11_capped', '12_return', '13_no_path',
];

test.use({ viewport: { width: 2048, height: 1152 }, deviceScaleFactor: 1 });

for (const state of STATES) {
  test(`court matrix · ${state}`, async ({ page }) => {
    await page.goto(`/court-stage.html?state=${state}`);
    await page.waitForSelector('[data-testid="tempering-court"]');
    await expect(page.locator('.courtStage__lintel').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `artifacts/court/w7/matrix/${state}.png`, fullPage: false });
  });
}
