import { test, expect } from '@playwright/test';

/**
 * W7 visual gate — the Tempering Court stage rendered at native 2048×1152 (Appendix F
 * harness size) from a fixture surface. Dev-only; the full 13-state matrix is added as
 * the regions land. Removed at W13 cutover.
 */
test.use({ viewport: { width: 2048, height: 1152 }, deviceScaleFactor: 1 });

test('court stage skeleton renders at 2048x1152', async ({ page }) => {
  await page.goto('/court-stage.html');
  await page.waitForSelector('[data-testid="tempering-court"]');
  await expect(page.locator('.courtStage__lintel').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'artifacts/court/w7/stage-skeleton.png', fullPage: false });
});
