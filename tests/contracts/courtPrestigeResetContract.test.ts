import assert from 'node:assert/strict';
import test from 'node:test';

import { createDefaultMeridianCourtSaveState } from '../../src/features/court/courtSaveTypes.js';
import { useCourtMeridianStore } from '../../src/features/court/useCourtMeridianStore.js';
import { COMPREHENSION_FLOOR } from '../../src/systems/meridians/index.js';
import { formMemoryFloor } from '../../src/systems/prestige/formMemory.js';

/**
 * W13a-6 — the Court's prestige reset (the action performPrestigeReset calls when the
 * flag is on). Locks the store glue over applyFormMemoryReset: ratings → Form-Memory
 * floor, lifetime folded, comprehension reset, roots re-rolled, forge heat cleared.
 */

const reset = () => useCourtMeridianStore.setState(createDefaultMeridianCourtSaveState());

test('W13a resetForPrestige folds lifetime, starts at the floor, re-rolls roots, clears heat', () => {
  reset();
  useCourtMeridianStore.setState({
    activeMeridianId: 'm1',
    rootByMeridianId: { m1: 'mortal', m2: 'mortal' },
    progressByMeridianId: {
      m1: { rating: 100, ratingXp: 5, masteryXp: 300, comprehension: 1 },
      m2: { rating: 10, ratingXp: 0, masteryXp: 0, comprehension: 1 },
    },
    lifetimeTotals: {},
    intensityId: 'harsh',
    fatigue: 70,
  });

  useCourtMeridianStore.getState().resetForPrestige(['m1', 'm2'], () => 0); // rng 0 → all heavenly
  const s = useCourtMeridianStore.getState();

  // lifetime folded from this life's ratings
  assert.equal(s.lifetimeTotals.m1, 100);
  assert.equal(s.lifetimeTotals.m2, 10);
  // ratings restart at the Form-Memory floor (non-zero after investment)
  assert.equal(s.progressByMeridianId.m1.rating, formMemoryFloor(100));
  assert.ok(s.progressByMeridianId.m1.rating > 0, 're-leveling starts above zero');
  assert.equal(s.progressByMeridianId.m2.rating, formMemoryFloor(10));
  // per-life fields reset
  assert.equal(s.progressByMeridianId.m1.comprehension, COMPREHENSION_FLOOR);
  assert.equal(s.progressByMeridianId.m1.masteryXp, 0);
  // roots re-rolled (rng 0 → heavenly), forge heat cleared, intensity preference carried
  assert.equal(s.rootByMeridianId.m1, 'heavenly');
  assert.equal(s.fatigue, 0);
  assert.equal(s.intensityId, 'harsh');
});
