import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDoctrineSnapshot } from '../../src/systems/doctrine/index.js';
import { buildInitialStock, refreshStock } from '../../src/features/manuals/pavilionStockGenerator.js';
import { resolvePavilionRerollCost } from '../../src/systems/manuals/pavilionRerollCost.js';
import { buildFortuneDrawSurfaceLive } from '../../src/systems/ui/fortune/fortuneDrawLiveInput.js';
import { FORTUNE_DRAW_SCHEMA_VERSION } from '../../src/systems/ui/fortune/fortuneDrawTypes.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useManualPavilionStore } from '../../src/stores/manualPavilionStore.js';
import { useTechniqueStore } from '../../src/stores/techniqueStore.js';
import {
  primeExpeditionRuntimeStores,
  resetExpeditionRuntimeStores,
} from '../integration/expeditionRuntimeTestUtils.js';

/**
 * M.IV.1 ARTS-MECH / Step 2 — the reroll + the never-regress pity guarantee (D17 verification: "a test that
 * pity accumulates toward a guaranteed rare, never-regress on acquisition" + idle-parity of the daily fortune).
 */

const FIXED_NOW = 1_735_689_600_000;
const PAVILION = 'pavilion_pinewind';

function ctx() {
  useGameStore.setState((state) => ({ ...state, selectedPath: 'heaven', realm: { ...state.realm, index: 0 } }));
  useTechniqueStore.getState().resetLoadouts();
  return { snapshot: buildDoctrineSnapshot(), buildAnalysis: null };
}

test.beforeEach(async () => {
  resetExpeditionRuntimeStores();
  useGameStore.getState().hardResetGameState();
  useTechniqueStore.getState().resetLoadouts();
  await primeExpeditionRuntimeStores();
});

test('Fortune pity: a primed featured pity (threshold-1) forces a guaranteed epic+ and resets — accumulation works', () => {
  const c = ctx();
  const base = buildInitialStock(PAVILION, FIXED_NOW, c);
  const featuredBase = base.slots.find((s) => s.shelf === 'featured');
  assert.ok(featuredBase, 'the pinewind stock exposes a featured slot (pity is exercised)');

  // epic guarantee threshold is 10 → priming featuredEpic to 9 forces the next featured roll to epic+.
  const primed = { ...base, pity: { featuredEpic: 9, featuredLegendary: 0 } };
  const refreshed = refreshStock(primed, FIXED_NOW + 1, c);
  const featured = refreshed.slots.find((s) => s.shelf === 'featured');
  assert.ok(featured, 'featured slot present after the guaranteed refresh');
  assert.ok(['epic', 'legendary'].includes(featured!.rarity), 'the guarantee fired — the featured offer is epic+');
  assert.equal(refreshed.pity.featuredEpic, 0, 'pity reset on the guaranteed acquisition (never-regress payoff)');
});

test('Fortune pity: across many refreshes the featured pity never regresses except on an epic+ win', () => {
  const c = ctx();
  let stock = buildInitialStock(PAVILION, FIXED_NOW, c);
  let sawGuarantee = false;
  for (let i = 0; i < 16; i += 1) {
    const before = stock.pity.featuredEpic;
    stock = refreshStock(stock, FIXED_NOW + i + 1, c);
    const after = stock.pity.featuredEpic;
    const featured = stock.slots.find((s) => s.shelf === 'featured');
    const wonEpicPlus = !!featured && (featured.rarity === 'epic' || featured.rarity === 'legendary');
    if (after < before) {
      assert.ok(wonEpicPlus, `featured pity only resets on an epic+ win (step ${i})`);
      assert.equal(after, 0, `reset to 0 on the win (step ${i})`);
      sawGuarantee = true;
    } else {
      assert.ok(after >= before, `featured pity never regresses without a win (step ${i})`);
    }
  }
  assert.ok(sawGuarantee, 'within 16 refreshes the epic guarantee delivered at least once');
});

test('Fortune reroll: cost is HELD → D15 (unconfigured in content), so the reroll is gated honestly', () => {
  assert.equal(resolvePavilionRerollCost(0), null, 'no authored reroll cost — HELD until D15');
  useManualPavilionStore.getState().ensureStock(PAVILION, FIXED_NOW);
  const result = useManualPavilionStore.getState().rerollStock(PAVILION, FIXED_NOW);
  assert.equal(result.ok, false, 'the reroll is gated');
  assert.equal(result.reason, 'reroll_not_configured', 'gated specifically on the HELD cost (not a spend failure)');
});

test('Fortune draw idle-parity: the daily fortune builds a live surface from idle state, surfacing the pity', () => {
  useManualPavilionStore.getState().ensureStock(PAVILION, FIXED_NOW);
  const stock = useManualPavilionStore.getState().getStock(PAVILION);
  assert.ok(stock, 'stock ensured idle (no combat, no draw)');

  const surface = buildFortuneDrawSurfaceLive(PAVILION, FIXED_NOW);
  assert.equal(surface.schemaVersion, FORTUNE_DRAW_SCHEMA_VERSION, 'a valid render-only surface');
  assert.ok(surface.offers.length > 0, 'the lectern carries the live offers');
  // the live pity is surfaced (the fate-thread mirrors the live counters).
  assert.equal(surface.fateThread.epic.current, Math.min(stock!.pity.featuredEpic, surface.fateThread.epic.threshold), 'epic fate-thread mirrors the live pity');
  assert.ok(surface.fateThread.epic.ratio >= 0 && surface.fateThread.epic.ratio <= 1, 'fate-thread ratio in [0,1]');
  // the reroll row is honest: gated cost shown as HELD.
  assert.equal(surface.reroll.available, false, 'reroll gated (cost HELD → D15)');
  assert.equal(surface.reroll.costText, '[tune] → D15', 'reroll cost surfaced as HELD');
});
