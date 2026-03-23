import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getMasteryMilestoneContract,
  getNextMasteryMilestoneContract,
  getRetainedMasteryXp,
  getTechniqueSecondaryPotencyMultiplier,
  masteryLevelFromXp,
  masteryMilestones,
  masteryMultiplier,
  MASTERY_MILESTONE_ORDER,
  MASTERY_XP_SCALE,
  MAX_TECHNIQUE_MASTERY_LEVEL,
  rankMultiplier,
  TECHNIQUE_MASTERY_EFFECT_MULTIPLIER_PER_LEVEL,
  TECHNIQUE_RANK_MULTIPLIER_PER_RANK,
  xpNeededForLevel,
} from '../../src/systems/builds/index.js';

const approxEqual = (actual: number, expected: number, epsilon = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} ≈ ${expected}`);
};

test('packet 4.8 mastery constants are exact', () => {
  assert.equal(MASTERY_XP_SCALE, 3);
  assert.equal(MAX_TECHNIQUE_MASTERY_LEVEL, 100);
  assert.equal(TECHNIQUE_MASTERY_EFFECT_MULTIPLIER_PER_LEVEL, 0.003);
  assert.equal(TECHNIQUE_RANK_MULTIPLIER_PER_RANK, 0.1);
  assert.deepEqual(MASTERY_MILESTONE_ORDER, [25, 50, 75, 100]);
});

test('packet 4.8 XP curve is exact', () => {
  assert.equal(xpNeededForLevel(1), 0);
  assert.equal(xpNeededForLevel(2), 3);
  assert.equal(xpNeededForLevel(25), 1728);
  assert.equal(xpNeededForLevel(50), 7203);
  assert.equal(xpNeededForLevel(75), 16428);
  assert.equal(xpNeededForLevel(100), 29403);
});

test('packet 4.8 mastery level from XP is exact', () => {
  assert.equal(masteryLevelFromXp(-10), 1);
  assert.equal(masteryLevelFromXp(0), 1);
  assert.equal(masteryLevelFromXp(xpNeededForLevel(25)), 25);
  assert.equal(masteryLevelFromXp(xpNeededForLevel(50)), 50);
  assert.equal(masteryLevelFromXp(999999), 100);
});

test('packet 4.8 boolean milestone helper is exact', () => {
  assert.deepEqual(masteryMilestones(24), { at25: false, at50: false, at75: false, at100: false });
  assert.deepEqual(masteryMilestones(75), { at25: true, at50: true, at75: true, at100: false });
});

test('packet 4.8 cumulative milestone contract is exact', () => {
  assert.deepEqual(getMasteryMilestoneContract(24), {
    highestUnlockedMilestone: 0,
    effectMult: 1,
    cooldownMult: 1,
    costMult: 1,
    secondaryUnlocked: false,
  });
  assert.deepEqual(getMasteryMilestoneContract(25), {
    highestUnlockedMilestone: 25,
    effectMult: 1,
    cooldownMult: 0.95,
    costMult: 1,
    secondaryUnlocked: false,
  });
  assert.deepEqual(getMasteryMilestoneContract(50), {
    highestUnlockedMilestone: 50,
    effectMult: 1,
    cooldownMult: 0.95,
    costMult: 0.9,
    secondaryUnlocked: false,
  });
  assert.deepEqual(getMasteryMilestoneContract(75), {
    highestUnlockedMilestone: 75,
    effectMult: 1,
    cooldownMult: 0.95,
    costMult: 0.9,
    secondaryUnlocked: true,
  });
  assert.deepEqual(getMasteryMilestoneContract(100), {
    highestUnlockedMilestone: 100,
    effectMult: 1.1,
    cooldownMult: 0.95,
    costMult: 0.9,
    secondaryUnlocked: true,
    cosmeticTitle: 'Perfected',
  });
});

test('packet 4.8 next milestone summaries are exact', () => {
  assert.deepEqual(getNextMasteryMilestoneContract(24), { level: 25, effectsSummary: ['Cooldown 5%'] });
  assert.deepEqual(getNextMasteryMilestoneContract(25), { level: 50, effectsSummary: ['Cost 10%'] });
  assert.deepEqual(getNextMasteryMilestoneContract(50), { level: 75, effectsSummary: ['Secondary effect unlock'] });
  assert.deepEqual(getNextMasteryMilestoneContract(75), { level: 100, effectsSummary: ['Effect 10%', 'Title: Perfected'] });
  assert.equal(getNextMasteryMilestoneContract(100), null);
});

test('packet 4.8 rank and mastery multipliers remain current-live shape', () => {
  assert.equal(rankMultiplier(1), 1);
  assert.equal(rankMultiplier(3), 1.2);
  assert.equal(rankMultiplier(10), 1.9);
  approxEqual(masteryMultiplier(100), 1.43);
});

test('packet 4.8 Heaven-only secondary potency is exact', () => {
  assert.equal(getTechniqueSecondaryPotencyMultiplier({ grade: 'heaven', masteryLevel: 74 }), 1);
  assert.equal(getTechniqueSecondaryPotencyMultiplier({ grade: 'heaven', masteryLevel: 75 }), 1.25);
  assert.equal(getTechniqueSecondaryPotencyMultiplier({ grade: 'earth', masteryLevel: 100 }), 1);
  assert.equal(getTechniqueSecondaryPotencyMultiplier({ grade: 'mystic', masteryLevel: 100 }), 1);
});

test('packet 4.8 retained mastery helper is safe and capped', () => {
  assert.equal(getRetainedMasteryXp(3000, 0.25), 750);
  assert.equal(getRetainedMasteryXp(-50, 0.5), 0);
  assert.equal(getRetainedMasteryXp(3000, -5), 0);
  assert.equal(getRetainedMasteryXp(3000, 2), 3000);
  assert.equal(getRetainedMasteryXp(999999, 1), 29403);
});
