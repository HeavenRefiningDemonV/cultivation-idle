import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  COURT_INTENSITY_RATE,
  MERIDIAN_RATE_CLAMP,
  computeMeridianRate,
  fatigueDampening,
  type MeridianRateContext,
} from '../../src/systems/meridians/index.js';

/**
 * W3 — the one-meridian training-rate formula (§2.5). The factor list/order must
 * mirror the Practice-Tempo lens 1:1, the 2.25 clamp + intensity table + fatigue
 * curve are PRESERVED (§2.12), and aptitude scales the rate.
 */

function ctx(overrides: Partial<MeridianRateContext> = {}): MeridianRateContext {
  return {
    intensityId: 'steady',
    fatigue: 0,
    perception: 20, // pivot → perceptionMult 1.0
    rootGrade: 'true',
    masteryRank: 0,
    comprehension: 1,
    capPct: 0,
    ...overrides,
  };
}

test('rate returns the 10 lens factors in the documented order', () => {
  const result = computeMeridianRate(ctx());
  assert.deepEqual(
    result.factors.map((factor) => factor.key),
    ['regimenMastery', 'intensity', 'perception', 'aptitude', 'fatigue', 'comprehension', 'capFalloff', 'pathAffinity', 'offline', 'formMemory'],
  );
});

test('N9: mult is the clamped product of the factor values (clampMax 2.25)', () => {
  const result = computeMeridianRate(ctx({ intensityId: 'harsh', perception: 40, masteryRank: 5 }));
  const product = result.factors.reduce((acc, factor) => acc * factor.value, 1);
  assert.equal(result.rawMult, product);
  assert.equal(result.mult, Math.min(MERIDIAN_RATE_CLAMP, product));
  assert.equal(result.clampMax, 2.25);
});

test('N9: the 2.25 max-tick clamp holds under stacked multipliers', () => {
  const result = computeMeridianRate(ctx({ intensityId: 'limit', perception: 80, rootGrade: 'heavenly', masteryRank: 10 }));
  assert.ok(result.rawMult > 2.25, 'stacked factors should exceed the clamp');
  assert.equal(result.mult, 2.25);
});

test('N8: aptitude scales the rate — Heavenly faster than Mortal, all else equal', () => {
  const heavenly = computeMeridianRate(ctx({ rootGrade: 'heavenly' })).rawMult;
  const mortal = computeMeridianRate(ctx({ rootGrade: 'mortal' })).rawMult;
  assert.ok(heavenly > mortal);
});

test('N12: fatigue dampening curve is preserved', () => {
  assert.equal(fatigueDampening(0), 1);
  assert.equal(fatigueDampening(40), 1);
  assert.equal(fatigueDampening(140), 0.4); // floor
  assert.equal(fatigueDampening(70), Math.max(0.4, Math.min(1, 1 - (70 - 40) * 0.009)));
});

test('N13: intensity rate table matches the canonical content (no drift)', async () => {
  assert.deepEqual(COURT_INTENSITY_RATE, { quiet: 0.7, steady: 1.0, harsh: 1.35, limit: 1.75 });
  const file = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config', 'training_regimens.json');
  const config = JSON.parse(await fs.readFile(file, 'utf8')) as {
    intensities: Array<{ id: string; xpMultiplier: number }>;
  };
  for (const intensity of config.intensities) {
    const expected = COURT_INTENSITY_RATE[intensity.id as keyof typeof COURT_INTENSITY_RATE];
    assert.equal(intensity.xpMultiplier, expected, `intensity ${intensity.id} drifted from content`);
  }
});
