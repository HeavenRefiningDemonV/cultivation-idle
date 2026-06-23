import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { waitForApp, seedCultivationTab, seedPeakReadyCrossing, openGateScroll } from './cultivationSeatHarness.js';

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
    // §6 Option B on the LIVE surface: the artifact's seven axes incl. Body, no Balanced
    await page.locator('[data-instrument="focus-dial"]').click();
    const focusBody = page.locator('[data-scroll-body="focus"]');
    await expect(focusBody.locator('button[data-axis]')).toHaveCount(7);
    await expect(focusBody.getByText('Body', { exact: true })).toHaveCount(1);
    await page.keyboard.press('Escape').catch(() => {});
    ensure();
    await page.locator('.cultivationSeatStage').screenshot({ path: path.join(SHOT_DIR, 'live-heaven.png') });
  });

  test('a real peak crossing runs end-to-end on the live surface (gate → ceremony → perk)', async ({ page }) => {
    test.setTimeout(120_000);
    await openLiveSeat(page);
    await seedPeakReadyCrossing(page, 0.99, { gateItem: true });
    ensure();
    await page.locator('.cultivationSeatStage').screenshot({ path: path.join(SHOT_DIR, 'live-peak-ready.png') });

    await openGateScroll(page); // the diagnosis lives in the gatereadiness scroll (F2)
    const gate = page.getByTestId('cultivation-seat-gate');
    await expect(gate).toBeVisible();
    await expect(gate.locator('[data-check="item"]')).toHaveAttribute('data-state', 'ok'); // the gate item is held
    await expect(gate).toHaveAttribute('data-verdict', 'ready');
    const commit = page.getByTestId('cultivation-seat-commit');
    await expect(commit).toBeEnabled();

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

    await openGateScroll(page); // the diagnosis lives in the gatereadiness scroll (F2)
    const gate = page.getByTestId('cultivation-seat-gate');
    await expect(gate).toBeVisible();
    // the live seam now reads the real item gate (was stubbed to null pre-fix) — so the row blocks
    await expect(gate.locator('[data-check="item"]')).toHaveAttribute('data-state', 'blocked');
    await expect(gate).toHaveAttribute('data-verdict', 'not-yet');
    await expect(page.getByTestId('cultivation-seat-commit')).toBeDisabled();
    ensure();
    await page.screenshot({ path: path.join(SHOT_DIR, 'live-peak-noitem.png') });
  });

  test('the Focus pick works + persists exactly (artifact behaviour): the clicked axis stays the emphasis', async ({ page }) => {
    test.setTimeout(120_000);
    await openLiveSeat(page);
    await page.locator('[data-instrument="focus-dial"]').click();
    const focusBody = page.locator('[data-scroll-body="focus"]');
    await expect(focusBody).toBeVisible();
    // default emphasis is Qi Purity (the artifact S.emph=1)
    await expect(focusBody.locator('button[data-axis="qiPurity"]')).toHaveClass(/is-emph/);
    // click Body — THE CLICKED axis becomes the emphasis (not a lossy round-trip to another spoke)
    await focusBody.locator('button[data-axis="body"]').click();
    await expect(focusBody.locator('button[data-axis="body"]')).toHaveClass(/is-emph/);
    await expect(focusBody.locator('button[data-axis="qiPurity"]')).not.toHaveClass(/is-emph/);
    await expect(focusBody.locator('button[data-axis="body"]')).toContainText('52%'); // the emphasis bias
    ensure();
    await page.locator('.cultivationSeatScroll').screenshot({ path: path.join(SHOT_DIR, 'live-focus-body-picked.png') });
    // persists: close + reopen, Body is still the emphasis (uiStore.cultivationFocusAxis)
    await page.locator('.seatScroll__close').click();
    await expect(focusBody).toHaveCount(0);
    await page.locator('[data-instrument="focus-dial"]').click();
    await expect(focusBody.locator('button[data-axis="body"]')).toHaveClass(/is-emph/);
  });
});
