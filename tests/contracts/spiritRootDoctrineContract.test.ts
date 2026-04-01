import assert from 'node:assert/strict';
import test from 'node:test';

import { SPIRIT_ROOT_POWER_DELTA_CAP, buildSpiritRootDoctrineProfile } from '../../src/systems/doctrine/index.js';
import type { SpiritRoot } from '../../src/types/index.js';

function approxEqual(actual: number, expected: number, epsilon = 1e-9): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
}

test('buildSpiritRootDoctrineProfile returns null safely for null', () => {
  assert.equal(buildSpiritRootDoctrineProfile(null), null);
});

test('doctrine profile exposes bounded D.4 potency fields for representative roots', () => {
  const sampleA: SpiritRoot = { grade: 1, element: 'fire', purity: 30 };
  const profileA = buildSpiritRootDoctrineProfile(sampleA);
  assert.ok(profileA);
  assert.equal(profileA.grade, 1);
  assert.equal(profileA.element, 'fire');
  assert.equal(profileA.purity, 30);
  assert.equal(profileA.gradeLabel, 'Mortal');
  assert.equal(profileA.purityBand, 'muddy');
  assert.equal(profileA.powerBand, 'baseline');
  assert.equal(profileA.totalPowerDeltaPct <= SPIRIT_ROOT_POWER_DELTA_CAP, true);

  const sampleB: SpiritRoot = { grade: 3, element: 'water', purity: 65 };
  const profileB = buildSpiritRootDoctrineProfile(sampleB);
  assert.ok(profileB);
  assert.equal(profileB.gradeLabel, 'Uncommon');
  assert.equal(profileB.purityBand, 'stable');
  assert.equal(profileB.powerBand, 'elevated');
  assert.equal(profileB.totalPowerDeltaPct <= SPIRIT_ROOT_POWER_DELTA_CAP, true);

  const sampleC: SpiritRoot = { grade: 5, element: 'metal', purity: 100 };
  const profileC = buildSpiritRootDoctrineProfile(sampleC);
  assert.ok(profileC);
  assert.equal(profileC.gradeLabel, 'Legendary');
  assert.equal(profileC.purityBand, 'immaculate');
  assert.equal(profileC.powerBand, 'elite');
  approxEqual(profileC.totalPowerDeltaPct, SPIRIT_ROOT_POWER_DELTA_CAP);
  assert.equal(profileC.boundedRuntimeMultiplier <= 1.06, true);
});

test('doctrine profile clamps malformed purity values defensively', () => {
  const lowPurityRoot = { grade: 2, element: 'earth', purity: -10 } as SpiritRoot;
  const lowProfile = buildSpiritRootDoctrineProfile(lowPurityRoot);
  assert.ok(lowProfile);
  assert.equal(lowProfile.purity, 0);
  assert.equal(lowProfile.totalPowerDeltaPct >= 0, true);

  const highPurityRoot = { grade: 2, element: 'earth', purity: 140 } as SpiritRoot;
  const highProfile = buildSpiritRootDoctrineProfile(highPurityRoot);
  assert.ok(highProfile);
  assert.equal(highProfile.purity, 100);
  assert.equal(highProfile.totalPowerDeltaPct <= SPIRIT_ROOT_POWER_DELTA_CAP, true);
});

test('doctrine potency remains monotonic and bounded across representative roots', () => {
  const low = buildSpiritRootDoctrineProfile({ grade: 1, element: 'fire', purity: 0 });
  const mid = buildSpiritRootDoctrineProfile({ grade: 3, element: 'water', purity: 65 });
  const high = buildSpiritRootDoctrineProfile({ grade: 5, element: 'metal', purity: 100 });
  assert.ok(low && mid && high);
  assert.equal(low.totalPowerDeltaPct < mid.totalPowerDeltaPct, true);
  assert.equal(mid.totalPowerDeltaPct < high.totalPowerDeltaPct, true);
  assert.equal(high.totalPowerDeltaPct <= SPIRIT_ROOT_POWER_DELTA_CAP, true);
  assert.equal(high.boundedRuntimeMultiplier - low.boundedRuntimeMultiplier <= SPIRIT_ROOT_POWER_DELTA_CAP, true);
});

test('spirit root power delta cap stays locked to the packet 4.4 guard rail', () => {
  assert.equal(SPIRIT_ROOT_POWER_DELTA_CAP, 0.12);
});
