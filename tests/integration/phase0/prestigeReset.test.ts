import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createPhase0Harness,
  performPrestigeRitual,
  seedCraftedProgressedLifeForPrestige,
  seedPrestigeMetaState,
} from '../../helpers/phase0Harness.ts';
import { expectCurrentlyBrokenContract } from '../../helpers/expectedFailure.ts';
import { useActivityStore } from '../../../src/stores/activityStore.ts';
import { useCityStore } from '../../../src/stores/cityStore.ts';
import { useCombatStore } from '../../../src/stores/combatStore.ts';
import { useGameStore } from '../../../src/stores/gameStore.ts';
import { useInventoryStore } from '../../../src/stores/inventoryStore.ts';
import { usePrestigeStore } from '../../../src/stores/prestigeStore.ts';
import { useTrialStore } from '../../../src/stores/trialStore.ts';
import { useUIStore } from '../../../src/stores/uiStore.ts';

test('PHASE0 CONTRACT (expected broken): prestige should reset per-life progression state to clean new life', () => {
  createPhase0Harness();
  seedCraftedProgressedLifeForPrestige();
  seedPrestigeMetaState();

  performPrestigeRitual();

  const game = useGameStore.getState();
  const inventory = useInventoryStore.getState();
  const combat = useCombatStore.getState();

  assert.equal(game.realm.index, 0, 'New life should return to starting major realm.');
  assert.equal(game.realm.substage, 1, 'New life should return to substage 1.');
  assert.equal(inventory.getItemCount('gate_foundation_pill'), 0, 'Per-life inventory should reset.');
  assert.equal(combat.inCombat, false, 'Combat state should reset on new life.');

  expectCurrentlyBrokenContract(() => {
    const city = useCityStore.getState();
    const trial = useTrialStore.getState();
    const activity = useActivityStore.getState();

    assert.equal(activity.active, null, 'Active foreground activity should be cleared on new life.');

    assert.deepEqual(
      city.unlockedCityIds,
      ['city_pinewind_hamlet'],
      'Per-life city progression should reset to starter city after prestige.',
    );

    const trialProgress = trial.getProgress('trial_novices_clearing');
    assert.equal(trialProgress.attempts, 0, 'Per-life trial progress should reset on prestige.');
  }, 'per-life city/trial reset is incomplete in current prestige flow');
});

test('PHASE0 CONTRACT: prestige should preserve meta-permanent state while creating a new life', () => {
  createPhase0Harness();
  seedCraftedProgressedLifeForPrestige();
  seedPrestigeMetaState();

  const ui = useUIStore.getState();
  ui.setSettings({ reduceMotion: true });

  const before = usePrestigeStore.getState();
  const beforePurchases = { ...before.purchasesById };

  performPrestigeRitual();

  const after = usePrestigeStore.getState();

  assert.equal(after.prestigeCount, before.prestigeCount + 1, 'Prestige count should increase after reincarnation.');
  assert.deepEqual(after.purchasesById, beforePurchases, 'Meta purchases should remain through new life reset.');
  assert.equal(useUIStore.getState().settings.reduceMotion, true, 'Account-level settings should persist.');
});

test('PHASE0 CONTRACT (expected broken): hybrid systems must be explicitly re-derived, not accidentally persistent', () => {
  createPhase0Harness();
  seedCraftedProgressedLifeForPrestige();
  seedPrestigeMetaState();

  const cityBefore = [...useCityStore.getState().unlockedCityIds];
  const trialBefore = useTrialStore.getState().getProgress('trial_novices_clearing').attempts;
  assert.ok(cityBefore.length > 1 || trialBefore > 0, 'Seed should produce non-fresh per-life/hybrid progress.');

  performPrestigeRitual();

  expectCurrentlyBrokenContract(() => {
    const cityAfter = useCityStore.getState().unlockedCityIds;
    const trialAfter = useTrialStore.getState().getProgress('trial_novices_clearing').attempts;

    assert.notDeepEqual(
      cityAfter,
      cityBefore,
      'City progression should be recalculated for a fresh life, not carried over accidentally.',
    );
    assert.equal(trialAfter, 0, 'Trial attempts should be re-derived to clean new-life state.');
  }, 'hybrid/per-life store slices survive because prestige reset omits city/trial stores');
});
