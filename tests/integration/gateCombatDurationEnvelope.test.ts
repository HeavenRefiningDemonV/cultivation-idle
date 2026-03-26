import assert from 'node:assert/strict';
import test from 'node:test';

import { getGateCombatTarget } from '../../src/systems/balance/gateCombatTargets.js';
import { createGateCombatProbeScenario } from '../helpers/balance/createGateCombatProbeScenario.js';
import { runGateCombatProbe } from '../helpers/balance/runGateCombatProbe.js';

for (const gateIndex of [1, 2, 3, 4, 5] as const) {
  test(`gate ${gateIndex} probe durations match canonical medians`, () => {
    const target = getGateCombatTarget(gateIndex);
    assert.ok(target);

    const minimumResult = runGateCombatProbe(createGateCombatProbeScenario(gateIndex, 'minimum'));
    assert.equal(minimumResult.medianDurationSec, target!.duration.minimumMedianSec);

    const recommendedResult = runGateCombatProbe(createGateCombatProbeScenario(gateIndex, 'recommended'));
    assert.equal(recommendedResult.medianDurationSec, target!.duration.recommendedMedianSec);
  });
}
