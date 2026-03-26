import assert from 'node:assert/strict';
import test from 'node:test';

import { getGateCombatTarget } from '../../src/systems/balance/gateCombatTargets.js';
import { createGateCombatProbeScenario } from '../helpers/balance/createGateCombatProbeScenario.js';
import { runGateCombatProbe } from '../helpers/balance/runGateCombatProbe.js';

for (const gateIndex of [1, 2, 3, 4, 5] as const) {
  test(`gate ${gateIndex} probe win-rates stay in envelope`, () => {
    const target = getGateCombatTarget(gateIndex);
    assert.ok(target);

    for (const readinessBand of ['belowMinimum', 'minimum', 'recommended'] as const) {
      const result = runGateCombatProbe(createGateCombatProbeScenario(gateIndex, readinessBand));
      const envelope = target!.winRate[readinessBand] as readonly [number, number];
      const min = envelope[0];
      const max = envelope[1];
      assert.equal(result.winRate >= min && result.winRate <= max, true);
    }
  });
}
