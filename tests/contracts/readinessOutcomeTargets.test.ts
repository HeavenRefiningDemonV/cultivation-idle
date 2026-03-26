import assert from 'node:assert/strict';
import test from 'node:test';

import {
  READINESS_CLOSE_CALL_POLICY,
  READINESS_LABEL_SEMANTICS,
  READINESS_OUTCOME_TARGETS,
} from '../../src/systems/balance/readinessOutcomeTargets.js';

test('packet 6.5 readiness outcome targets reuse five gate envelopes with locked label semantics', () => {
  assert.equal(READINESS_OUTCOME_TARGETS.length, 5);
  assert.deepEqual(READINESS_LABEL_SEMANTICS.bandToLabel, {
    below_minimum: 'Blocked',
    minimum_met_below_recommended: 'Risky',
    recommended_met: 'Ready',
  });
  assert.equal(READINESS_LABEL_SEMANTICS.closeLabel, 'Close');
});

test('packet 6.5 close-call policy stays explicit and bounded', () => {
  assert.equal(READINESS_CLOSE_CALL_POLICY.maxBossHpPct <= 20, true);
  assert.equal(READINESS_CLOSE_CALL_POLICY.minCompetitiveTimeToDieSec >= 6, true);
  assert.equal(READINESS_CLOSE_CALL_POLICY.maxImmediateMismatchSpikeRatio <= 0.7, true);
  assert.equal(READINESS_CLOSE_CALL_POLICY.minMeaningfulFightDurationSec >= 10, true);
});
