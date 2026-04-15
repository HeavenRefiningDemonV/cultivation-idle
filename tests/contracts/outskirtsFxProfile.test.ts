import assert from 'node:assert/strict';
import test from 'node:test';

import { buildOutskirtsFxProfile } from '../../src/ui/world/buildOutskirtsFxProfile.js';

void test('high fx profile enables only calm allowed families', () => {
  const profile = buildOutskirtsFxProfile({
    effectiveQuality: 'high',
    prefersReducedMotion: false,
    isCombatActive: true,
    isBossReady: true,
    cityId: 'city_pinewind_hamlet',
  });

  assert.equal(profile.quality, 'high');
  assert.equal(profile.animateContinuously, true);
  assert.equal(profile.families.ambientHaze, true);
  assert.equal(profile.families.dustDrift, true);
  assert.equal(profile.families.leafAccent, true);
  assert.equal(profile.families.panelGlint, true);
  assert.equal(profile.families.ritualGlow, false);
  assert.equal(profile.families.ruinFog, false);
  assert.equal(profile.families.gateAura, false);
});

void test('low fx profile reduces density and suppresses non-essential accents', () => {
  const profile = buildOutskirtsFxProfile({
    effectiveQuality: 'low',
    prefersReducedMotion: false,
    isCombatActive: false,
    isBossReady: false,
    cityId: 'city_stonecrag_town',
  });

  assert.equal(profile.quality, 'low');
  assert.equal(profile.animateContinuously, false);
  assert.equal(profile.moteCount, 1);
  assert.equal(profile.leafCount, 0);
  assert.equal(profile.glintCount, 0);
});

void test('reduced motion profile disables continuous motion and moving particles', () => {
  const profile = buildOutskirtsFxProfile({
    effectiveQuality: 'high',
    prefersReducedMotion: true,
    isCombatActive: true,
    isBossReady: false,
    cityId: 'city_lotusford',
  });

  assert.equal(profile.quality, 'reducedMotion');
  assert.equal(profile.animateContinuously, false);
  assert.equal(profile.moteCount, 0);
  assert.equal(profile.leafCount, 0);
  assert.equal(profile.glintCount, 0);
  assert.equal(profile.families.dustDrift, false);
});
