import assert from 'node:assert/strict';
import test from 'node:test';

import { deriveObservatoryMotionVars } from '../../src/ui/status/observatory/observatoryMotionModel.js';

const inputs = { qiPerSecond: 1000, purityPct: 80, fitAngleDeg: 42, cultivationRate: 0.5 };

test('reduced motion (animate=false) collapses durations but keeps the static truth', () => {
  const vars = deriveObservatoryMotionVars(inputs, false);
  assert.equal(vars['--tick-spin-dur'], '0s');
  assert.equal(vars['--qi-flow-rate'], '0.00');
  assert.equal(vars['--breath-period'], '0.0s');
  // static truths remain correct even with motion off
  assert.equal(vars['--needle-target-deg'], '42.0deg');
  assert.equal(vars['--purity-fill'], '0.800');
});

test('animated derives bounded flow + spin from telemetry; truths unchanged', () => {
  const vars = deriveObservatoryMotionVars(inputs, true);
  assert.notEqual(vars['--tick-spin-dur'], '0s');
  assert.notEqual(vars['--qi-flow-rate'], '0.00');
  assert.equal(vars['--needle-target-deg'], '42.0deg');
  assert.equal(vars['--purity-fill'], '0.800');
});

test('null telemetry is safe (zeros, no NaN)', () => {
  const vars = deriveObservatoryMotionVars(
    { qiPerSecond: null, purityPct: null, fitAngleDeg: null },
    true,
  );
  assert.equal(vars['--needle-target-deg'], '0.0deg');
  assert.equal(vars['--purity-fill'], '0.000');
  assert.ok(!vars['--qi-flow-rate'].includes('NaN'));
});
