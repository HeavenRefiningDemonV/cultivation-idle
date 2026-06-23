import { test, expect } from '@playwright/test';
import path from 'node:path';
import { openSeatFixture } from './cultivationSeatHarness.js';

/**
 * S9/S10 — the LIVE per-path instrument fidelity matrix. Proves the three live instruments
 * (Heaven Premonition · Earth Beast-Lore · Martial Weapon-Bond) render TRUE — engine-on, `data-active`
 * — across the fidelity states, not just the engine-off preview. The fixtures carry each path's live
 * `derived` payload (perception / absorbed essences / bond kills) so the instrument flips active; the
 * route renders them via getSeatFixture (`live-<path>-<state>`).
 */

const PATHS = ['heaven', 'earth', 'martial'] as const;
const STATES = ['healthy', 'blocked', 'postFailure', 'prestige', 'contentCap'] as const;
const SHOT_DIR = path.resolve('artifacts/mii3-seat-matrix/live-instruments');

test.describe('S9/S10 — live per-path instruments render true across the fidelity states', () => {
  for (const p of PATHS) {
    for (const s of STATES) {
      const id = `live-${p}-${s}`;
      test(`live instrument: ${id}`, async ({ page }) => {
        await openSeatFixture(page, id, false);

        const root = page.locator('[data-testid="cultivation-seat-root"]');
        await expect(root).toBeVisible();

        // the per-path instrument is LIVE (engine-on + the path's live data) ⇒ data-active=true,
        // and its value is NOT the engine-off "Not yet active" preview.
        const inst = page.locator('[data-instrument="path-mechanic"]');
        await expect(inst).toHaveAttribute('data-active', 'true');
        await expect(inst).toHaveAttribute('data-kind', p);
        await expect(inst.locator('.cultivationSeatInst__val')).not.toHaveText(/not yet active/i);

        // layout holds (no horizontal overflow) in this state.
        const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2);
        expect(noOverflow).toBe(true);

        await page.locator('.cultivationSeatStage').screenshot({ path: path.join(SHOT_DIR, `${id}.png`) });
      });
    }
  }
});
