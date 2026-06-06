import assert from 'node:assert/strict';
import test from 'node:test';

import { getPrestigeResetContractSurface } from '../../src/services/prestige/PrestigeResetContract.js';

test('MP5 reset contract classifies Training, Dao Heart, root, activity, and memory truth', () => {
  const surface = getPrestigeResetContractSurface({
    purchasesById: {
      form_memory: 2,
      scripture_echo: 2,
      root_clarity: 1,
      calm_first_breath: 3,
      old_sparring_shadows: 1,
    },
  });

  const resetIds = new Set(surface.reset.map((line) => line.id));
  const hybridIds = new Set(surface.hybrid.map((line) => line.id));
  const rebuiltIds = new Set(surface.rebuilt.map((line) => line.id));

  assert.equal(resetIds.has('training_raw_ratings'), true);
  assert.equal(resetIds.has('training_fatigue_session'), true);
  assert.equal(resetIds.has('dao_heart_turbulence'), true);
  assert.equal(resetIds.has('root_awakening_state'), true);
  assert.equal(resetIds.has('combat_state'), true);
  assert.equal(rebuiltIds.has('root_clarity_floor'), true);
  assert.equal(hybridIds.has('form_memory'), true);
  assert.equal(hybridIds.has('scripture_echo'), true);
  assert.equal(hybridIds.has('calm_first_breath'), true);
  assert.equal(hybridIds.has('old_sparring_shadows'), true);
});
