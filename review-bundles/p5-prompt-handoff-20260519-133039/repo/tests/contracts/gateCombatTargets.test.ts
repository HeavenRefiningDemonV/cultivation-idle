import assert from 'node:assert/strict';
import test from 'node:test';

import { GATE_COMBAT_TARGETS } from '../../src/systems/balance/gateCombatTargets.js';

test('packet 6.5 gate combat targets lock all five gate envelopes', () => {
  assert.equal(GATE_COMBAT_TARGETS.length, 5);

  for (const entry of GATE_COMBAT_TARGETS) {
    assert.equal(entry.gateIndex >= 1 && entry.gateIndex <= 5, true);
    assert.equal(entry.winRate.belowMinimum[0] <= entry.winRate.belowMinimum[1], true);
    assert.equal(entry.winRate.minimum[0] <= entry.winRate.minimum[1], true);
    assert.equal(entry.winRate.recommended[0] <= entry.winRate.recommended[1], true);
    assert.equal(entry.duration.minimumMedianSec > 0, true);
    assert.equal(entry.duration.recommendedMedianSec > 0, true);
  }
});
