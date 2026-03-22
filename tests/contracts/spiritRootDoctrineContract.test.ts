import assert from 'node:assert/strict';
import test from 'node:test';

import { SPIRIT_ROOT_POWER_DELTA_CAP, buildSpiritRootDoctrineProfile } from '../../src/systems/doctrine/index.js';
import {
  getSpiritRootPurityMultiplierForPurity,
  getSpiritRootQualityMultiplierForGrade,
  getSpiritRootTotalMultiplierForRoot,
} from '../../src/stores/prestigeStore.js';
import type { SpiritRoot } from '../../src/types/index.js';

function approxEqual(actual: number, expected: number, epsilon = 1e-9): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
}

test('buildSpiritRootDoctrineProfile returns null safely for null', () => {
  assert.equal(buildSpiritRootDoctrineProfile(null), null);
});

test('doctrine profile mirrors current live multiplier math for representative roots', () => {
  const sampleA: SpiritRoot = { grade: 1, element: 'fire', purity: 30 };
  const profileA = buildSpiritRootDoctrineProfile(sampleA);
  assert.ok(profileA);
  assert.equal(profileA.grade, 1);
  assert.equal(profileA.element, 'fire');
  assert.equal(profileA.purity, 30);
  assert.equal(profileA.qualityMultiplier, 1);
  assert.equal(profileA.purityMultiplier, 1.3);
  assert.equal(profileA.totalMultiplier, 1.3);

  const sampleB: SpiritRoot = { grade: 3, element: 'water', purity: 65 };
  const profileB = buildSpiritRootDoctrineProfile(sampleB);
  assert.ok(profileB);
  assert.equal(profileB.qualityMultiplier, 1.8);
  assert.equal(profileB.purityMultiplier, 1.65);
  approxEqual(profileB.totalMultiplier, 2.97);

  const sampleC: SpiritRoot = { grade: 5, element: 'metal', purity: 100 };
  const profileC = buildSpiritRootDoctrineProfile(sampleC);
  assert.ok(profileC);
  assert.equal(profileC.qualityMultiplier, 2.6);
  assert.equal(profileC.purityMultiplier, 2);
  approxEqual(profileC.totalMultiplier, 5.2);
});

test('doctrine profile clamps malformed purity values defensively', () => {
  const lowPurityRoot = { grade: 2, element: 'earth', purity: -10 } as SpiritRoot;
  const lowProfile = buildSpiritRootDoctrineProfile(lowPurityRoot);
  assert.ok(lowProfile);
  assert.equal(lowProfile.purity, 0);
  assert.equal(lowProfile.purityMultiplier, 1);

  const highPurityRoot = { grade: 2, element: 'earth', purity: 140 } as SpiritRoot;
  const highProfile = buildSpiritRootDoctrineProfile(highPurityRoot);
  assert.ok(highProfile);
  assert.equal(highProfile.purity, 100);
  assert.equal(highProfile.purityMultiplier, 2);
});

test('doctrine profile stays anchored to the extracted prestige helpers', () => {
  const samples: SpiritRoot[] = [
    { grade: 1, element: 'fire', purity: 30 },
    { grade: 3, element: 'water', purity: 65 },
    { grade: 5, element: 'metal', purity: 100 },
  ];

  samples.forEach((root) => {
    const profile = buildSpiritRootDoctrineProfile(root);
    assert.ok(profile);
    assert.equal(profile.qualityMultiplier, getSpiritRootQualityMultiplierForGrade(root.grade));
    assert.equal(profile.purityMultiplier, getSpiritRootPurityMultiplierForPurity(profile.purity));
    assert.equal(profile.totalMultiplier, getSpiritRootTotalMultiplierForRoot(root));
  });
});

test('spirit root power delta cap stays locked to the packet 4.4 guard rail', () => {
  assert.equal(SPIRIT_ROOT_POWER_DELTA_CAP, 0.12);
});
