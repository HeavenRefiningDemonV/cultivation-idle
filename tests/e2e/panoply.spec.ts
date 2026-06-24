import { expect, test, type Page } from '@playwright/test';

/**
 * M.III.3 EQ-PORT — the Panoply/Vault screenshot matrix (Appendix J). Drives panoply-stage.html (fixture
 * mode) at 2048×1152 dSF 2, asserts ZERO console errors per cell, captures a screenshot, and asserts the
 * reduced-motion cell freezes all motion (document.getAnimations().length === 0). Chromium is the only valid
 * visual oracle. (Path×state cross needs path-parameterised fixtures — a noted follow-up; the 7 state seeds
 * each carry a baked-in path.)
 */

const PANOPLY_STATES = ['healthy', 'empty', 'blocked', 'contentCap', 'detail-affix', 'detail-legendary', 'unknown'] as const;
const VAULT_STATES = ['healthy', 'empty', 'detail-affix', 'detail-legendary'] as const;

test.use({ viewport: { width: 2048, height: 1152 }, deviceScaleFactor: 2 });

async function gotoStage(page: Page, fixture: string, surface: 'panoply' | 'vault'): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`/panoply-stage.html?panoplyFixture=${encodeURIComponent(fixture)}&panoplySurface=${surface}`);
  await expect(page.getByTestId(surface === 'vault' ? 'vault-surface' : 'panoply-surface')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return errors;
}

test.describe('Panoply', () => {
  for (const state of PANOPLY_STATES) {
    test(`panoply ${state}`, async ({ page }) => {
      const errors = await gotoStage(page, state, 'panoply');
      await expect(page.getByTestId('detail-rail')).toBeVisible();
      await page.screenshot({ path: `artifacts/mp-eq-port/panoply-${state}.png` });
      expect(errors, `console errors on panoply/${state}`).toEqual([]);
    });
  }
});

test.describe('Vault', () => {
  for (const state of VAULT_STATES) {
    test(`vault ${state}`, async ({ page }) => {
      const errors = await gotoStage(page, state, 'vault');
      await page.screenshot({ path: `artifacts/mp-eq-port/vault-${state}.png` });
      expect(errors, `console errors on vault/${state}`).toEqual([]);
    });
  }
});

test('reduced-motion: panoply healthy freezes all motion (0 active animations)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = await gotoStage(page, 'healthy', 'panoply');
  const active = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
  await page.screenshot({ path: 'artifacts/mp-eq-port/panoply-reducedmotion.png' });
  expect(active, 'active animations under prefers-reduced-motion').toBe(0);
  expect(errors, 'console errors under reduced-motion').toEqual([]);
});
