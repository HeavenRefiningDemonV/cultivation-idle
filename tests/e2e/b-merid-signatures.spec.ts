import { test, expect, type Page } from '@playwright/test';

/**
 * B-MERID (packet #06) — the combat-layer meridian SIGNATURE seam, proven in a real browser.
 * resolveMeridianSignaturesForCombat() must read live court meridian ratings ONLY under the derived
 * engine (?statEngine=1), and stay INERT under the legacy default and under ?forceLegacy=1 (which
 * always wins). The unit contract proves the pure math + flag-off parity; this proves the gating +
 * the live store read end-to-end (window present, real Vite module graph).
 */

async function readVoidGazePen(page: Page, query: string): Promise<number> {
  await page.goto(`/${query}`);
  await page.waitForSelector('#root > *', { timeout: 30_000 });
  return page.evaluate(async () => {
    const imp = new Function('s', 'return import(s)') as (s: string) => Promise<any>;
    // seed a live Heaven Void-Gaze meridian rating (×0.5 ⇒ 50% DR-shred when the engine is on)
    const { useCourtMeridianStore } = await imp('/src/features/court/useCourtMeridianStore.ts');
    useCourtMeridianStore.setState({ progressByMeridianId: { heaven_void_gaze: { rating: 100 } } });
    const { resolveMeridianSignaturesForCombat } = await imp('/src/systems/meridians/meridianCombatSignatures.ts');
    return resolveMeridianSignaturesForCombat().voidGazeWeaknessPenPct as number;
  });
}

test.describe('B-MERID — the combat signature seam is flag-gated in the browser', () => {
  test('flag-on (?statEngine=1): a live Void-Gaze rating yields a real DR-shred', async ({ page }) => {
    test.setTimeout(90_000);
    expect(await readVoidGazePen(page, '?statEngine=1')).toBe(50); // rating 100 × 0.5
  });

  test('forceLegacy always wins: inert even with statEngine=1 + a live rating', async ({ page }) => {
    test.setTimeout(90_000);
    expect(await readVoidGazePen(page, '?statEngine=1&forceLegacy=1')).toBe(0);
  });

  test('legacy default (no flag): signatures are inert', async ({ page }) => {
    test.setTimeout(90_000);
    expect(await readVoidGazePen(page, '')).toBe(0);
  });
});
