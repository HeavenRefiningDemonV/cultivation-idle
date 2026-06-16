import assert from 'node:assert/strict';
import test from 'node:test';

import {
  courtBreathDurSeconds,
  courtFillProgress,
  courtHeatLevel,
  courtMotionVars,
  courtQiDurSeconds,
} from '../../src/ui/court/motion/courtMotionVars.js';
import type { TemperingCourtSurface } from '../../src/systems/meridians/index.js';

/**
 * W9 — locks the artifact's motion-var formulas (§1.8). jsdom can't see the animation,
 * but these pure formulas (qiDur / breath-dur / heat / fill-p) ARE the parity contract:
 * tempo speeds qi-flow + breath, fatigue feeds heat, progress feeds fill.
 */

function surfaceOf(mult: number, fatigue: number, rating: number | null, cap: number): TemperingCourtSurface {
  return {
    rate: { mult },
    heat: { value: fatigue },
    activeMeridian: rating === null ? null : { rating, cap },
  } as unknown as TemperingCourtSurface;
}

test('W9 qiDur matches the artifact: 3.0 − clamp(mult,0.5,2.25)×0.8, faster as tempo rises', () => {
  assert.equal(courtQiDurSeconds(2.25), 1.2);
  assert.equal(courtQiDurSeconds(1), 2.2);
  assert.equal(courtQiDurSeconds(0.5), 2.6);
  // clamps outside [0.5, 2.25]
  assert.equal(courtQiDurSeconds(0.1), 2.6);
  assert.equal(courtQiDurSeconds(3.0), 1.2);
  // monotonic: higher tempo => shorter (faster) duration
  assert.ok(courtQiDurSeconds(2.0) < courtQiDurSeconds(1.0));
});

test('W9 breath-dur matches the artifact: 6.8 − min(1, mult/2.25)×2.4, faster as tempo rises', () => {
  assert.equal(courtBreathDurSeconds(2.25), 4.4);
  assert.equal(courtBreathDurSeconds(0), 6.8);
  assert.equal(courtBreathDurSeconds(1), 5.73);
  // saturates at mult >= 2.25 (min(1, …))
  assert.equal(courtBreathDurSeconds(5), 4.4);
  assert.ok(courtBreathDurSeconds(2.0) < courtBreathDurSeconds(0.5));
});

test('W9 heat = fatigue/100 (clamped) and fill = rating/cap (clamped, 0 when no active)', () => {
  assert.equal(courtHeatLevel(surfaceOf(1, 88, 50, 100)), 0.88);
  assert.equal(courtHeatLevel(surfaceOf(1, 140, 50, 100)), 1);
  assert.equal(courtHeatLevel(surfaceOf(1, -5, 50, 100)), 0);

  assert.equal(courtFillProgress(surfaceOf(1, 0, 50, 100)), 0.5);
  assert.equal(courtFillProgress(surfaceOf(1, 0, 200, 100)), 1);
  assert.equal(courtFillProgress(surfaceOf(1, 0, null, 100)), 0);
  assert.equal(courtFillProgress(surfaceOf(1, 0, 10, 0)), 0);
});

test('W9 courtMotionVars emits the 4 --th-* props in artifact format', () => {
  const vars = courtMotionVars(surfaceOf(2.0, 88, 50, 100)) as Record<string, string>;
  assert.equal(vars['--th-qi-dur'], '1.40s');
  assert.equal(vars['--th-breath-dur'], '4.67s');
  assert.equal(vars['--th-heat'], '0.880');
  assert.equal(vars['--th-fill-p'], '0.500');

  // higher tempo => shorter qi-dur string
  const fast = courtMotionVars(surfaceOf(2.25, 0, 0, 100)) as Record<string, string>;
  const slow = courtMotionVars(surfaceOf(0.5, 0, 0, 100)) as Record<string, string>;
  assert.ok(parseFloat(fast['--th-qi-dur']) < parseFloat(slow['--th-qi-dur']));
});
