import { expect, test } from '@playwright/test';
import { openSeatFixture, waitForApp, seedCultivationTab } from './cultivationSeatHarness.js';

/**
 * M.II.3 — smoke + the cutover invariant. As of flip #2 (§26.4) the Seat of Becoming is the PUBLIC
 * DEFAULT; the legacy screen is preserved beside it, reachable via `?cultivationSeat=legacy`. This
 * guards both directions: default → Seat (legacy unmounted), override → legacy (Seat unmounted).
 */
test.describe('M.II.3 Seat of Becoming — smoke + cutover invariant', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('the Seat renders behind the fixture override and the legacy screen is not mounted', async ({ page }) => {
    test.setTimeout(120_000);
    page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
    page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE.ERROR:', m.text()); });

    await openSeatFixture(page, 'heavenSeclusion', false);

    const root = page.getByTestId('cultivation-seat-root');
    await expect(root).toBeVisible();
    await expect(root).toHaveAttribute('data-path', 'heaven');
    await expect(root).toHaveAttribute('data-visual-state', 'seclusion');
    await expect(page.locator('[data-testid="cultivation-exact-page"]')).toHaveCount(0);
  });

  test('CUTOVER: the Seat is the public default (no query) — legacy unmounted', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/');
    await waitForApp(page);
    await seedCultivationTab(page);
    await expect(page.getByTestId('cultivation-seat-root')).toBeVisible();
    await expect(page.locator('[data-testid="cultivation-exact-page"]')).toHaveCount(0);
  });

  test('PRESERVE-FIRST: the legacy screen stays reachable via ?cultivationSeat=legacy — Seat unmounted', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/?cultivationSeat=legacy');
    await waitForApp(page);
    await seedCultivationTab(page);
    await expect(page.locator('[data-testid="cultivation-exact-page"]')).toBeVisible();
    await expect(page.getByTestId('cultivation-seat-root')).toHaveCount(0);
  });
});
