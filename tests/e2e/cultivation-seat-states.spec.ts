import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { openSeatFixture, seedPeakReadyCrossing, openGateScroll } from './cultivationSeatHarness.js';

/**
 * M.II.3 Wave 4 — the Chromium state matrix: the visual oracle + the structural acceptance
 * backbone for Waves 5-6. Renders the §14.2 matrix (path × realm × foreground × verdict × motion)
 * at 2x, captures a frame per cell, and asserts the contract invariants in a real browser:
 * no "Body" Focus spoke (R-1), Heart=Turbulence / band=stability (R-2), pity:null ⇒ no pity row
 * (R-3), the idle ledger is never taxed (§F), and reduced motion removes motes/shimmer (not info).
 */

const SHOT_DIR = path.resolve('artifacts/mii3-seat-matrix/screenshots');
const ensure = () => mkdirSync(SHOT_DIR, { recursive: true });

const PATHS = ['heaven', 'earth', 'martial'] as const;

interface Cell { id: string; path: string; state: string; reduced: boolean }
const scene = (p: string, realm: string, fg: string, reduced = false): Cell => ({
  id: `${p}-${realm}-${fg}${reduced ? '-reduced' : ''}`,
  path: p,
  state: fg === 'held' ? 'combatHeld' : fg === 'cultivating' ? 'cultivating' : 'seclusion',
  reduced,
});
const peak = (p: string, verdict: string, reduced = false): Cell => ({
  id: `${p}-peak-${verdict}${reduced ? '-reduced' : ''}`,
  path: p,
  state: verdict === 'ready' ? 'peakReady' : 'peakBlocked',
  reduced,
});

// Mirrors CULTIVATION_SEAT_MATRIX ids in cultivationSeatFixtures.ts (the id is the contract).
const CELLS: Cell[] = [
  ...PATHS.flatMap((p) => ['seclusion', 'cultivating', 'held'].map((fg) => scene(p, 'r3', fg))),
  ...PATHS.flatMap((p) => ['r1', 'r6'].map((r) => scene(p, r, 'seclusion'))),
  ...PATHS.flatMap((p) => ['ready', 'notReady', 'held'].map((v) => peak(p, v))),
  scene('heaven', 'r3', 'cultivating', true),
  scene('earth', 'r3', 'held', true),
  scene('martial', 'r6', 'seclusion', true),
  peak('heaven', 'ready', true),
  { id: 'edge-noPath', path: 'heaven', state: 'seclusion', reduced: false },
  { id: 'edge-peak-noPity', path: 'heaven', state: 'peakReady', reduced: false },
];

async function shotStage(page: Page, id: string) {
  ensure();
  const stage = page.locator('.cultivationSeatStage');
  await stage.screenshot({ path: path.join(SHOT_DIR, `${id}.png`) });
}

test.describe('M.II.3 Seat of Becoming — state matrix', () => {
  test.use({ viewport: { width: 2080, height: 1180 }, deviceScaleFactor: 2 });

  for (const cell of CELLS) {
    test(`frame: ${cell.id}`, async ({ page }) => {
      test.setTimeout(120_000);
      await openSeatFixture(page, cell.id, cell.reduced);

      const root = page.getByTestId('cultivation-seat-root');
      await expect(root).toBeVisible();
      await expect(root).toHaveAttribute('data-path', cell.path);
      await expect(root).toHaveAttribute('data-visual-state', cell.state);
      await expect(root).toHaveAttribute('data-reduced-motion', cell.reduced ? 'true' : 'false');

      // no horizontal overflow (the stage scales to fit)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2);
      expect(overflow).toBe(true);

      // reduced motion removes the motes (animation) but keeps the information (the breath-line read)
      if (cell.reduced) {
        await expect(page.locator('.cultivationSeatMote')).toHaveCount(0);
        await expect(page.getByTestId('cultivation-seat-breathline')).toContainText('qi / s');
      }

      await shotStage(page, cell.id);
    });
  }
});

test.describe('M.II.3 Seat of Becoming — contract invariants (visual oracle)', () => {
  test.use({ viewport: { width: 2080, height: 1180 }, deviceScaleFactor: 2 });

  test('R-1: the Focus dial offers the six canonical axes + Balanced and NO "Body" spoke', async ({ page }) => {
    test.setTimeout(120_000);
    await openSeatFixture(page, 'heaven-r3-seclusion', false);
    await page.locator('[data-instrument="focus-dial"]').click();
    const focusBody = page.locator('[data-scroll-body="focus"]');
    await expect(focusBody).toBeVisible();
    const options = focusBody.locator('button[data-axis]');
    await expect(options).toHaveCount(7);
    await expect(focusBody.getByText('Body', { exact: true })).toHaveCount(0);
    await expect(focusBody).toContainText('Qi Pool');
    await expect(focusBody).toContainText('Balanced');
    ensure();
    await page.locator('.cultivationSeatScroll').screenshot({ path: path.join(SHOT_DIR, 'scroll-focus-heaven.png') });
  });

  test('R-2: the Heart check reads Turbulence and the safety band is a separate read', async ({ page }) => {
    test.setTimeout(120_000);
    await openSeatFixture(page, 'heaven-peak-held', false);
    await openGateScroll(page);
    const gate = page.getByTestId('cultivation-seat-gate');
    await expect(gate).toHaveAttribute('data-verdict', 'held');
    await expect(gate.locator('[data-check="mind"]')).toContainText('Turbulence');
    await expect(gate.locator('[data-check="mind"]')).toHaveAttribute('data-state', 'blocked');
    await expect(gate.locator('[data-safety-band]')).toHaveCount(1);

    await openSeatFixture(page, 'heaven-peak-ready', false);
    await openGateScroll(page);
    await expect(page.getByTestId('cultivation-seat-gate')).toHaveAttribute('data-verdict', 'ready');
    await expect(page.getByTestId('cultivation-seat-commit')).toBeEnabled();
  });

  test('R-3: pity is live when present, and absent (no row) when the failSafe yields none', async ({ page }) => {
    test.setTimeout(120_000);
    await openSeatFixture(page, 'heaven-peak-ready', false);
    await openGateScroll(page);
    await expect(page.getByTestId('cultivation-seat-pity')).toBeVisible();
    await openSeatFixture(page, 'edge-peak-noPity', false);
    await openGateScroll(page);
    await expect(page.getByTestId('cultivation-seat-gate')).toBeVisible();
    await expect(page.getByTestId('cultivation-seat-pity')).toHaveCount(0);
  });

  test('§F: the idle ledger shows no tax, penalty, or decay term', async ({ page }) => {
    test.setTimeout(120_000);
    await openSeatFixture(page, 'heaven-r3-cultivating', false);
    await page.getByTestId('cultivation-seat-breathline').click();
    const ledger = page.getByTestId('cultivation-seat-ledger');
    await expect(ledger).toBeVisible();
    // §F reassurance is present, and the real mechanic is pause-at-cap × efficiency (never a deduction)
    await expect(ledger).toContainText('never taxed');
    await expect(ledger).toContainText('Accrual cap'); // the §F mechanic: pause-at-cap, never a deduction
    // after stripping the "never taxed / never decays" reassurance, no tax/penalty/deduction/decay term remains
    const stripped = (await ledger.innerText()).toLowerCase().replace(/never (taxed|decays)/g, '');
    expect(/\btax(ed|es)?\b|\bpenalt|\bdeduct|\bdecay/.test(stripped)).toBe(false);
    ensure();
    await page.locator('.cultivationSeatScroll').screenshot({ path: path.join(SHOT_DIR, 'scroll-ledger-heaven.png') });
  });

  test('scrolls: each instrument opens its scroll (frames per path mechanic)', async ({ page }) => {
    test.setTimeout(120_000);
    ensure();
    for (const p of PATHS) {
      await openSeatFixture(page, `${p}-r3-seclusion`, false);
      await page.locator('[data-instrument="path-mechanic"]').click();
      await expect(page.locator('[data-region="scroll-host"]')).toBeVisible();
      await page.locator('.cultivationSeatScroll').screenshot({ path: path.join(SHOT_DIR, `scroll-mechanic-${p}.png`) });
      await page.keyboard.press('Escape').catch(() => {});
    }
  });
});

async function realmIndex(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(async () => {
    const importModule = new Function('specifier', 'return import(specifier)') as (s: string) => Promise<any>;
    const { useGameStore } = await importModule('/src/stores/gameStore.ts');
    return useGameStore.getState().realm.index as number;
  });
}

test.describe('M.II.3 Seat of Becoming — the F2 ceremony seam (Wave 6)', () => {
  test.use({ viewport: { width: 2080, height: 1180 }, deviceScaleFactor: 2 });

  test('success: the crossing advances the realm and the F2 shell shows the success outcome', async ({ page }) => {
    test.setTimeout(120_000);
    await openSeatFixture(page, 'heaven-peak-ready', false);
    await seedPeakReadyCrossing(page, 0.99); // 0.99 ≥ risk/100 ⇒ the tribulation roll succeeds
    expect(await realmIndex(page)).toBe(0);

    await openGateScroll(page);
    await page.getByTestId('cultivation-seat-commit').click();

    // the F2 RitualCeremonyShell presents the held SUCCESS outcome + the never-regress readout
    const reveal = page.locator('[data-ceremony-zone="reveal"]');
    await expect(reveal).toBeVisible();
    await expect(reveal).toHaveAttribute('data-outcome', 'success');
    await expect(page.locator('[data-ceremony-zone="never-regress"]')).toBeVisible();
    // the ENGINE advanced the realm (the menu only requested it)
    expect(await realmIndex(page)).toBe(1);

    // the realm-perk choice is DEFERRED while the ceremony is open (no overlap with the F2 shell)
    await expect(page.locator('.perkSelectionModalOverlay')).toHaveCount(0);

    ensure();
    await page.screenshot({ path: path.join(SHOT_DIR, 'ceremony-success.png') });

    // exit closes the ceremony
    await page.locator('[data-ceremony-zone="exit"] button').click();
    await expect(reveal).toHaveCount(0);

    // …and the realm-perk choice is then surfaced, not silently lost (Wave 6 review fix)
    await expect(page.locator('.perkSelectionModalOverlay')).toBeVisible();
    await page.screenshot({ path: path.join(SHOT_DIR, 'ceremony-success-perk.png') });
  });

  test('post-failure: the crossing fails, the realm is invariant (never-regress), and the shell shows not-yet', async ({ page }) => {
    test.setTimeout(120_000);
    await openSeatFixture(page, 'heaven-peak-ready', false);
    await seedPeakReadyCrossing(page, 0); // roll 0 < risk/100 ⇒ the tribulation roll fails
    expect(await realmIndex(page)).toBe(0);

    await openGateScroll(page);
    await page.getByTestId('cultivation-seat-commit').click();

    const reveal = page.locator('[data-ceremony-zone="reveal"]');
    await expect(reveal).toBeVisible();
    await expect(reveal).toHaveAttribute('data-outcome', 'not-yet');
    await expect(page.locator('[data-ceremony-zone="never-regress"]')).toBeVisible();
    // never-regress: a failed crossing leaves the earned realm untouched
    expect(await realmIndex(page)).toBe(0);

    ensure();
    await page.screenshot({ path: path.join(SHOT_DIR, 'ceremony-notyet.png') });
  });
});
