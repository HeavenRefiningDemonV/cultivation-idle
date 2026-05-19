import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildTechniqueProgressionSnapshot,
  normalizeTechniqueProgressionState,
  xpNeededForLevel,
  type TechniqueProgressionSource,
} from '../../src/systems/builds/index.js';

test('packet 4.8 mortal over-cap source normalizes correctly', () => {
  const source: TechniqueProgressionSource = {
    manualGrade: 'mortal',
    rarity: 'legendary',
    masteryXp: 999999,
    rank: 10,
    traits: [
      { id: 't1', value: 0.1 },
      { id: 't2', value: 0.1 },
      { id: 't3', value: 0.1 },
    ],
    runes: ['r1', 'r2'],
  };

  assert.deepEqual(normalizeTechniqueProgressionState(source), {
    manualGrade: 'mortal',
    rarity: 'legendary',
    masteryXp: 999999,
    rank: 3,
    traits: [{ id: 't1', value: 0.1 }],
    runes: [],
  });

  const snapshot = buildTechniqueProgressionSnapshot(source);
  assert.equal(snapshot.grade, 'mortal');
  assert.equal(snapshot.rank, 3);
  assert.equal(snapshot.rankCap, 3);
  assert.equal(snapshot.traitSlotBreakdown.effectiveSlots, 1);
  assert.equal(snapshot.runeSockets, 0);
  assert.equal(snapshot.appliedTraitCount, 1);
  assert.equal(snapshot.appliedRuneCount, 0);
  assert.equal(snapshot.masteryLevel, 100);
  assert.equal(snapshot.secondaryPotencyMult, 1);
});

test('packet 4.8 earth over-cap source normalizes correctly', () => {
  const source: TechniqueProgressionSource = {
    manualGrade: 'earth',
    rarity: 'legendary',
    masteryXp: 0,
    rank: 7,
    traits: [
      { id: 't1', value: 0.1 },
      { id: 't2', value: 0.1 },
    ],
    runes: ['r1', 'r2'],
  };

  assert.deepEqual(normalizeTechniqueProgressionState(source), {
    manualGrade: 'earth',
    rarity: 'legendary',
    masteryXp: 0,
    rank: 5,
    traits: [{ id: 't1', value: 0.1 }],
    runes: ['r1'],
  });

  const snapshot = buildTechniqueProgressionSnapshot(source);
  assert.equal(snapshot.rankCap, 5);
  assert.equal(snapshot.traitSlotBreakdown.effectiveSlots, 1);
  assert.equal(snapshot.runeSockets, 1);
  assert.equal(snapshot.appliedRuneCount, 1);
});

test('packet 4.8 heaven snapshot exposes semester rune sockets and the Heaven 75 bonus', () => {
  const source: TechniqueProgressionSource = {
    manualGrade: 'heaven',
    rarity: 'rare',
    masteryXp: xpNeededForLevel(75),
    rank: 9,
    traits: [{ id: 't1', value: 0.1 }],
    runes: ['r1'],
  };

  assert.deepEqual(normalizeTechniqueProgressionState(source), {
    manualGrade: 'heaven',
    rarity: 'rare',
    masteryXp: xpNeededForLevel(75),
    rank: 7,
    traits: [{ id: 't1', value: 0.1 }],
    runes: ['r1', null],
  });

  const snapshot = buildTechniqueProgressionSnapshot(source);
  assert.equal(snapshot.rankCap, 7);
  assert.equal(snapshot.runeSockets, 2);
  assert.equal(snapshot.traitSlotBreakdown.effectiveSlots, 2);
  assert.equal(snapshot.masteryLevel, 75);
  assert.equal(snapshot.masteryMilestoneEffects.secondaryUnlocked, true);
  assert.equal(snapshot.secondaryPotencyMult, 1.25);
});

test('packet 4.8 mystic snapshot exposes semester rune sockets', () => {
  const source: TechniqueProgressionSource = {
    manualGrade: 'mystic',
    rarity: 'legendary',
    masteryXp: 0,
    rank: 12,
    traits: [
      { id: 't1', value: 0.1 },
      { id: 't2', value: 0.1 },
      { id: 't3', value: 0.1 },
      { id: 't4', value: 0.1 },
    ],
    runes: ['r1', 'r2', 'r3', 'r4'],
  };

  assert.deepEqual(normalizeTechniqueProgressionState(source), {
    manualGrade: 'mystic',
    rarity: 'legendary',
    masteryXp: 0,
    rank: 10,
    traits: [
      { id: 't1', value: 0.1 },
      { id: 't2', value: 0.1 },
      { id: 't3', value: 0.1 },
    ],
    runes: ['r1', 'r2', 'r3'],
  });

  const snapshot = buildTechniqueProgressionSnapshot(source);
  assert.equal(snapshot.rankCap, 10);
  assert.equal(snapshot.runeSockets, 3);
  assert.equal(snapshot.traitSlotBreakdown.effectiveSlots, 3);
  assert.equal(snapshot.appliedRuneCount, 3);
});

test('packet 4.8 missing and invalid values normalize safely', () => {
  const source = {
    manualGrade: 'weird',
    rarity: 'odd',
    masteryXp: -10,
    rank: -99,
    traits: null,
    runes: null,
  };

  assert.deepEqual(normalizeTechniqueProgressionState(source as never), {
    manualGrade: 'mortal',
    rarity: 'common',
    masteryXp: 0,
    rank: 1,
    traits: [],
    runes: [],
  });
});
