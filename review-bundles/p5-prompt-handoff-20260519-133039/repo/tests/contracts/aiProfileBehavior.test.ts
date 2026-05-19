import assert from 'node:assert/strict';
import test from 'node:test';

import { applyAiProfileBias } from '../../src/systems/combat/aiProfiles.js';
import { getDefaultCastingPolicyForAiProfile } from '../../src/systems/builds/castingPolicyFit.js';

const LOW_HP_DEFENSIVE_TAGS = {
  isHeal: true,
  isShield: true,
  isCleanse: false,
  isAoe: false,
  isBurstDamage: false,
} as const;

const LOW_HP_DEFENSIVE_CLASSIFICATION = {
  isPassive: false,
  isUltimate: false,
  isDefensive: true,
  isAoE: false,
  isBurst: false,
} as const;

test('current AI scorer still produces distinct profile behavior on a low-HP defensive case', () => {
  const balanced = applyAiProfileBias(5, LOW_HP_DEFENSIVE_TAGS, LOW_HP_DEFENSIVE_CLASSIFICATION as never, {
    profile: 'balanced',
    hpPct: 0.3,
    enemyHpPct: 0.8,
    enemyIsBoss: true,
    isPlayerDebuffed: false,
  });
  const survivor = applyAiProfileBias(5, LOW_HP_DEFENSIVE_TAGS, LOW_HP_DEFENSIVE_CLASSIFICATION as never, {
    profile: 'survivor',
    hpPct: 0.3,
    enemyHpPct: 0.8,
    enemyIsBoss: true,
    isPlayerDebuffed: false,
  });
  const burst = applyAiProfileBias(5, LOW_HP_DEFENSIVE_TAGS, LOW_HP_DEFENSIVE_CLASSIFICATION as never, {
    profile: 'burst',
    hpPct: 0.3,
    enemyHpPct: 0.8,
    enemyIsBoss: true,
    isPlayerDebuffed: false,
  });
  const farmer = applyAiProfileBias(5, LOW_HP_DEFENSIVE_TAGS, LOW_HP_DEFENSIVE_CLASSIFICATION as never, {
    profile: 'farmer',
    hpPct: 0.3,
    enemyHpPct: 0.8,
    enemyIsBoss: true,
    isPlayerDebuffed: false,
  });

  assert.equal(survivor > balanced, true);
  assert.equal(balanced > farmer, true);
  assert.equal(burst < survivor, true);
});

test('current AI scorer still prefers AoE/farm behavior for Farmer', () => {
  const tags = {
    isHeal: false,
    isShield: false,
    isCleanse: false,
    isAoe: true,
    isBurstDamage: true,
  } as const;
  const classification = {
    isPassive: false,
    isUltimate: false,
    isDefensive: false,
    isAoE: true,
    isBurst: true,
  } as const;

  const balanced = applyAiProfileBias(4, tags, classification as never, {
    profile: 'balanced',
    hpPct: 0.9,
    enemyHpPct: 0.9,
    enemyIsBoss: false,
  });
  const survivor = applyAiProfileBias(4, tags, classification as never, {
    profile: 'survivor',
    hpPct: 0.9,
    enemyHpPct: 0.9,
    enemyIsBoss: false,
  });
  const burst = applyAiProfileBias(4, tags, classification as never, {
    profile: 'burst',
    hpPct: 0.9,
    enemyHpPct: 0.9,
    enemyIsBoss: false,
  });
  const farmer = applyAiProfileBias(4, tags, classification as never, {
    profile: 'farmer',
    hpPct: 0.9,
    enemyHpPct: 0.9,
    enemyIsBoss: false,
  });

  assert.equal(farmer > balanced, true);
  assert.equal(burst > 0, true);
  assert.equal(survivor < farmer, true);
});

test('shared default AI->casting mapping is exact', () => {
  assert.equal(getDefaultCastingPolicyForAiProfile('balanced'), 'balanced');
  assert.equal(getDefaultCastingPolicyForAiProfile('survivor'), 'defensive');
  assert.equal(getDefaultCastingPolicyForAiProfile('burst'), 'aggressive');
  assert.equal(getDefaultCastingPolicyForAiProfile('farmer'), 'balanced');
});
