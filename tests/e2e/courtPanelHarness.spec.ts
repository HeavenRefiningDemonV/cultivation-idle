import { test, expect } from '@playwright/test';

/**
 * W1 visual gate — renders the Tempering Court panel-material harness
 * (court-harness.html) via the dev server (which compiles the Court SCSS the
 * production build never references) and captures a parity screenshot to compare
 * against an artifact panel header. Dev-only; removed at W13 cutover.
 */
test.use({ viewport: { width: 1120, height: 1000 }, deviceScaleFactor: 1 });

test('court panel material harness renders', async ({ page }) => {
  await page.goto('/court-harness.html');
  await page.waitForSelector('[data-testid="court-panel-harness"]');
  // The gold double-frame layer must exist (the mask-composite frame trick).
  await expect(page.locator('.courtPanel__gframe').first()).toBeVisible();
  await expect(page.locator('.courtPanel__banner').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'artifacts/court/w1/panel-harness.png', fullPage: true });
});
