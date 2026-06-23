import { test, expect, type Page } from '@playwright/test';
import { waitForApp } from './cultivationSeatHarness.js';

/**
 * C-PATH slice 1 — Heaven Premonition (Day's Omen), proven in a real browser. The Seat input seam
 * must read live perception (spirit_sense rating) + the derived-engine flag, so the Heaven instrument
 * flips from the honest "not yet active" preview to a live forecast ONLY under ?statEngine=1.
 * forceLegacy / the legacy default keep it inert (the preview), preserve-first.
 */
async function readDerived(page: Page, query: string): Promise<{ engineActive: boolean; perception: number }> {
  await page.goto(`/${query}`);
  await waitForApp(page);
  return page.evaluate(async () => {
    const imp = new Function('s', 'return import(s)') as (s: string) => Promise<any>;
    // seed a live perception rating (the same statRatingsById source the breakthrough risk seam reads)
    const { useTrainingStore } = await imp('/src/stores/trainingStore.ts');
    useTrainingStore.setState((s: { statRatingsById?: Record<string, number> }) => ({
      statRatingsById: { ...(s.statRatingsById ?? {}), spirit_sense: 50 },
    }));
    const { readCultivationSeatRawInput } = await imp('/src/systems/ui/cultivation/cultivationSeatInput.ts');
    const raw = readCultivationSeatRawInput();
    return raw.derived as { engineActive: boolean; perception: number };
  });
}

test.describe('C-PATH — Heaven Premonition reads the live engine + perception', () => {
  test('flag-on (?statEngine=1): the seam reports the engine active + the live perception', async ({ page }) => {
    test.setTimeout(90_000);
    const d = await readDerived(page, '?statEngine=1');
    expect(d.engineActive).toBe(true);
    expect(d.perception).toBe(50);
  });

  test('forceLegacy always wins: engine inert even with statEngine=1', async ({ page }) => {
    test.setTimeout(90_000);
    const d = await readDerived(page, '?statEngine=1&forceLegacy=1');
    expect(d.engineActive).toBe(false);
  });

  test('legacy default (no flag): engine inert ⇒ the honest "not yet active" preview holds', async ({ page }) => {
    test.setTimeout(90_000);
    const d = await readDerived(page, '');
    expect(d.engineActive).toBe(false);
  });
});
