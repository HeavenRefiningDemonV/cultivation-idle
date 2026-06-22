import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { waitForApp, seedCultivationTab, seedPeakReadyCrossing } from './cultivationSeatHarness.js';

/**
 * M.II.3 — LIVE pipeline acceptance (cutover-readiness). Every other Seat e2e drives FIXTURE
 * surfaces; these drive the real `stores → readCultivationSeatRawInput → buildCultivationSeatSurface
 * → screen` pipeline that the §26.4 cutover will flip on. The flag default is untouched — liveness
 * comes from the `?cultivationSeat=live` override.
 */

const SHOT_DIR = path.resolve('artifacts/mii3-seat-matrix/screenshots');
const ensure = () => mkdirSync(SHOT_DIR, { recursive: true });

async function openLiveSeat(page: Page) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?cultivationSeat=live');
  await waitForApp(page);
  await seedCultivationTab(page);
  await page.getByTestId('cultivation-seat-root').waitFor({ state: 'visible', timeout: 30_000 });
}

async function realmIndex(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const importModule = new Function('specifier', 'return import(specifier)') as (s: string) => Promise<any>;
    const { useGameStore } = await importModule('/src/stores/gameStore.ts');
    return useGameStore.getState().realm.index as number;
  });
}

test.describe('M.II.3 Seat of Becoming — LIVE pipeline acceptance (cutover-readiness)', () => {
  test.use({ viewport: { width: 2080, height: 1180 }, deviceScaleFactor: 2 });

  test('the live surface renders from the real stores (not a fixture)', async ({ page }) => {
    test.setTimeout(120_000);
    await openLiveSeat(page);
    const root = page.getByTestId('cultivation-seat-root');
    await expect(root).toHaveAttribute('data-path', 'heaven'); // the seeded life identity
    await expect(root).toHaveAttribute('data-realm', /^[1-6]$/); // a valid live realm (1-based display)
    await expect(root).toHaveAttribute('data-visual-state', /seclusion|cultivating|combatHeld|peakReady|peakBlocked/);
    // the breath-line binds the live qi/s
    await expect(page.getByTestId('cultivation-seat-breathline')).toContainText('qi / s');
    // R-1 holds on the LIVE focus mapping: 6 canonical axes + Balanced, NO Body spoke
    await page.locator('[data-instrument="focus-dial"]').click();
    const focusBody = page.locator('[data-scroll-body="focus"]');
    await expect(focusBody.locator('button[data-axis]')).toHaveCount(7);
    await expect(focusBody.getByText('Body', { exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape').catch(() => {});
    ensure();
    await page.locator('.cultivationSeatStage').screenshot({ path: path.join(SHOT_DIR, 'live-heaven.png') });
  });

  test('a real peak crossing runs end-to-end on the live surface (gate → ceremony → perk)', async ({ page }) => {
    test.setTimeout(120_000);
    await openLiveSeat(page);
    await seedPeakReadyCrossing(page, 0.99, { gateItem: true });

    const gate = page.getByTestId('cultivation-seat-gate');
    await expect(gate).toBeVisible();
    await expect(gate.locator('[data-check="item"]')).toHaveAttribute('data-state', 'ok'); // the gate item is held
    await expect(gate).toHaveAttribute('data-verdict', 'ready');
    const commit = page.locator('[data-region="gate-readiness"] [data-testid="cultivation-seat-commit"]');
    await expect(commit).toBeEnabled();
    ensure();
    await page.locator('.cultivationSeatStage').screenshot({ path: path.join(SHOT_DIR, 'live-peak-ready.png') });

    expect(await realmIndex(page)).toBe(0);
    await commit.click();
    const reveal = page.locator('[data-ceremony-zone="reveal"]');
    await expect(reveal).toHaveAttribute('data-outcome', 'success');
    expect(await realmIndex(page)).toBe(1); // the engine advanced the realm — on the LIVE surface
    await page.locator('[data-ceremony-zone="exit"] button').click();
    await expect(reveal).toHaveCount(0);
    await expect(page.locator('.perkSelectionModalOverlay')).toBeVisible();
  });

  test('the live gate honestly reflects a MISSING gate item (not-yet · item blocked · commit disabled)', async ({ page }) => {
    test.setTimeout(120_000);
    await openLiveSeat(page);
    await seedPeakReadyCrossing(page, 0.99, { gateItem: false }); // qi + peak, but no gate item

    const gate = page.getByTestId('cultivation-seat-gate');
    await expect(gate).toBeVisible();
    // the live seam now reads the real item gate (was stubbed to null pre-fix) — so the row blocks
    await expect(gate.locator('[data-check="item"]')).toHaveAttribute('data-state', 'blocked');
    await expect(gate).toHaveAttribute('data-verdict', 'not-yet');
    await expect(page.locator('[data-region="gate-readiness"] [data-testid="cultivation-seat-commit"]')).toBeDisabled();
    ensure();
    await page.locator('.cultivationSeatStage').screenshot({ path: path.join(SHOT_DIR, 'live-peak-noitem.png') });
  });
});
