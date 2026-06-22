import { expect, test } from '@playwright/test';
import { openSeatFixture } from './cultivationSeatHarness.js';

/**
 * M.II.3 Wave 4 — smoke test for the Seat of Becoming visual oracle. Proves the harness end to
 * end: the dev server, the `?cultivationSeat=fixture&cultivationSeatFixture=<id>` route, the
 * cultivation-tab seed, and the render-only Seat surface. The full state matrix lives in
 * cultivation-seat-states.spec.ts; this guards the entry path + the preserve-first invariant.
 */
test.describe('M.II.3 Seat of Becoming — smoke', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('the Seat renders behind the flag and the legacy screen is not mounted', async ({ page }) => {
    test.setTimeout(120_000);
    page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
    page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE.ERROR:', m.text()); });

    await openSeatFixture(page, 'heavenSeclusion', false);

    const root = page.getByTestId('cultivation-seat-root');
    await expect(root).toBeVisible();
    await expect(root).toHaveAttribute('data-path', 'heaven');
    await expect(root).toHaveAttribute('data-visual-state', 'seclusion');
    // preserve-first: the legacy screen must NOT be mounted when the Seat flag is on
    await expect(page.locator('[data-testid="cultivation-exact-page"]')).toHaveCount(0);
  });
});
