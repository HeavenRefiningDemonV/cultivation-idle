import assert from 'node:assert/strict';
import test from 'node:test';

import { createDefaultMeridianCourtSaveState } from '../../src/features/court/courtSaveTypes.js';
import { useCourtMeridianStore } from '../../src/features/court/useCourtMeridianStore.js';

/**
 * W13a-5 — Court save persistence. Locks the store's toSaveState/hydrateFromSave round-trip
 * (the data that gatherGameState writes + applySaveData restores). The live save→reload
 * round-trip itself is verified in-game by the user; this proves the slice serialization.
 */

const reset = () => useCourtMeridianStore.setState(createDefaultMeridianCourtSaveState());

test('W13a createDefaultMeridianCourtSaveState is an empty, well-formed slice', () => {
  const d = createDefaultMeridianCourtSaveState();
  assert.equal(d.activeMeridianId, null);
  assert.deepEqual(d.rootByMeridianId, {});
  assert.deepEqual(d.progressByMeridianId, {});
  assert.deepEqual(d.lifetimeTotals, {});
  assert.equal(d.intensityId, 'steady');
  assert.equal(d.fatigue, 0);
});

test('W13a toSaveState → hydrateFromSave round-trips the full slice', () => {
  reset();
  useCourtMeridianStore.setState({
    activeMeridianId: 'martial_flowing_step',
    rootByMeridianId: { martial_flowing_step: 'earthly', martial_weapon_intent: 'true' },
    progressByMeridianId: {
      martial_flowing_step: { rating: 44, ratingXp: 3, masteryXp: 210, comprehension: 1 },
      martial_weapon_intent: { rating: 61, ratingXp: 0, masteryXp: 400, comprehension: 1 },
    },
    lifetimeTotals: { martial_flowing_step: 120 },
    intensityId: 'harsh',
    fatigue: 42,
  });

  const saved = useCourtMeridianStore.getState().toSaveState();
  // The save snapshot is a deep copy — mutating the store must not change it.
  useCourtMeridianStore.setState(createDefaultMeridianCourtSaveState());
  assert.equal(useCourtMeridianStore.getState().activeMeridianId, null);

  useCourtMeridianStore.getState().hydrateFromSave(saved);
  const s = useCourtMeridianStore.getState();
  assert.equal(s.activeMeridianId, 'martial_flowing_step');
  assert.equal(s.intensityId, 'harsh');
  assert.equal(s.fatigue, 42);
  assert.deepEqual(s.rootByMeridianId, { martial_flowing_step: 'earthly', martial_weapon_intent: 'true' });
  assert.equal(s.progressByMeridianId.martial_flowing_step.rating, 44);
  assert.equal(s.progressByMeridianId.martial_weapon_intent.masteryXp, 400);
  assert.deepEqual(s.lifetimeTotals, { martial_flowing_step: 120 });
});

test('W13a hydrateFromSave is defensive: null → defaults; partial → filled', () => {
  reset();
  useCourtMeridianStore.setState({ fatigue: 99, intensityId: 'limit' });
  useCourtMeridianStore.getState().hydrateFromSave(null);
  assert.equal(useCourtMeridianStore.getState().fatigue, 0);
  assert.equal(useCourtMeridianStore.getState().intensityId, 'steady');

  // a legacy/partial slice missing fields falls back to safe defaults
  useCourtMeridianStore.getState().hydrateFromSave({ activeMeridianId: 'x' } as never);
  const s = useCourtMeridianStore.getState();
  assert.equal(s.activeMeridianId, 'x');
  assert.deepEqual(s.rootByMeridianId, {});
  assert.equal(s.intensityId, 'steady');
  assert.equal(s.fatigue, 0);
});
