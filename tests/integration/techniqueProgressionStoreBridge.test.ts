import assert from 'node:assert/strict';
import test from 'node:test';

import { useTechCollectionStore } from '../../src/stores/techCollectionStore.js';
import { xpNeededForLevel } from '../../src/systems/builds/index.js';

function resetTechniqueProgressionRuntime() {
  useTechCollectionStore.getState().hardReset();
}

test.beforeEach(() => {
  resetTechniqueProgressionRuntime();
});

test('packet 4.8 store hydrate clamps Mortal over-cap data', () => {
  useTechCollectionStore.getState().hydrate({
    unlockedTechs: {
      tech_alpha: {
        unlocked: true,
        masteryXp: 999999,
        rank: 10,
        manualGrade: 'mortal',
        rarity: 'legendary',
        traits: [
          { id: 't1', value: 0.1 },
          { id: 't2', value: 0.1 },
        ],
        runes: ['r1', 'r2'],
      },
    },
    fragments: {},
    rngSeed: 7,
  });

  const entry = useTechCollectionStore.getState().unlockedTechs.tech_alpha;
  assert.equal(entry.rank, 3);
  assert.equal(entry.traits.length, 1);
  assert.equal(entry.runes.length, 0);
  assert.equal(useTechCollectionStore.getState().getRankCap('tech_alpha'), 3);
  assert.equal(useTechCollectionStore.getState().getEffectiveTraitSlots('tech_alpha'), 1);
  assert.equal(useTechCollectionStore.getState().getEffectiveRuneSlots('tech_alpha'), 0);
});

test('packet 4.8 store hydrate clamps Earth over-cap data', () => {
  useTechCollectionStore.getState().hydrate({
    unlockedTechs: {
      tech_beta: {
        unlocked: true,
        masteryXp: 0,
        rank: 7,
        manualGrade: 'earth',
        rarity: 'legendary',
        traits: [
          { id: 't1', value: 0.1 },
          { id: 't2', value: 0.1 },
        ],
        runes: ['r1', 'r2'],
      },
    },
    fragments: {},
    rngSeed: 7,
  });

  const entry = useTechCollectionStore.getState().unlockedTechs.tech_beta;
  assert.equal(entry.rank, 5);
  assert.equal(entry.traits.length, 1);
  assert.equal(entry.runes.length, 1);
  assert.equal(useTechCollectionStore.getState().getRankCap('tech_beta'), 5);
  assert.equal(useTechCollectionStore.getState().getEffectiveTraitSlots('tech_beta'), 1);
  assert.equal(useTechCollectionStore.getState().getEffectiveRuneSlots('tech_beta'), 1);
});

test('packet 4.8 store snapshot wrapper is safe and exact', () => {
  useTechCollectionStore.getState().hydrate({
    unlockedTechs: {
      tech_gamma: {
        unlocked: true,
        masteryXp: xpNeededForLevel(75),
        rank: 9,
        manualGrade: 'heaven',
        rarity: 'rare',
        traits: [{ id: 't1', value: 0.1 }],
        runes: ['r1'],
      },
    },
    fragments: {},
    rngSeed: 7,
  });

  const snapshot = useTechCollectionStore.getState().getTechniqueProgressionSnapshot('tech_gamma');
  assert.equal(snapshot.grade, 'heaven');
  assert.equal(snapshot.rank, 7);
  assert.equal(snapshot.rankCap, 7);
  assert.equal(snapshot.runeSockets, 2);
  assert.equal(snapshot.traitSlotBreakdown.effectiveSlots, 2);
  assert.equal(snapshot.masteryLevel, 75);
  assert.equal(snapshot.masteryMilestoneEffects.secondaryUnlocked, true);
  assert.equal(snapshot.secondaryPotencyMult, 1.25);
});

test('packet 4.8 missing-entry snapshot is safe', () => {
  assert.doesNotThrow(() => useTechCollectionStore.getState().getTechniqueProgressionSnapshot('missing_tech'));
  const snapshot = useTechCollectionStore.getState().getTechniqueProgressionSnapshot('missing_tech');
  assert.equal(snapshot.grade, 'mortal');
  assert.equal(snapshot.rarity, 'common');
  assert.equal(snapshot.rank, 1);
  assert.equal(snapshot.rankCap, 3);
  assert.equal(snapshot.runeSockets, 0);
  assert.equal(snapshot.traitSlotBreakdown.effectiveSlots, 1);
});

test('packet 4.8 setManualGrade re-normalizes sockets through the new contract', () => {
  useTechCollectionStore.getState().unlockTech('tech_delta', {
    manualGrade: 'mortal',
    rarity: 'rare',
    rank: 1,
  });

  useTechCollectionStore.getState().setManualGrade('tech_delta', 'heaven');

  const entry = useTechCollectionStore.getState().unlockedTechs.tech_delta;
  assert.equal(entry.manualGrade, 'heaven');
  assert.equal(entry.runes.length, 2);
  assert.equal(useTechCollectionStore.getState().getEffectiveRuneSlots('tech_delta'), 2);
});

test('packet 4.8 setRarityIfHigher still respects grade cap', () => {
  useTechCollectionStore.getState().unlockTech('tech_epsilon', {
    manualGrade: 'earth',
    rarity: 'common',
    rank: 1,
  });

  useTechCollectionStore.getState().ensureTraits('tech_epsilon');
  useTechCollectionStore.getState().setRarityIfHigher('tech_epsilon', 'legendary');
  useTechCollectionStore.getState().ensureTraits('tech_epsilon');

  assert.equal(useTechCollectionStore.getState().getEffectiveTraitSlots('tech_epsilon'), 1);
  assert.equal(useTechCollectionStore.getState().unlockedTechs.tech_epsilon.traits.length, 1);
});

test('packet 4.8 semester rank caps control getNextRankCost', () => {
  useTechCollectionStore.getState().hydrate({
    unlockedTechs: {
      tech_mortal_cap: { unlocked: true, rank: 3, manualGrade: 'mortal', rarity: 'common' },
      tech_earth_cap: { unlocked: true, rank: 5, manualGrade: 'earth', rarity: 'common' },
      tech_heaven_cap: { unlocked: true, rank: 7, manualGrade: 'heaven', rarity: 'common' },
      tech_mystic_cap: { unlocked: true, rank: 10, manualGrade: 'mystic', rarity: 'common' },
    },
    fragments: {},
    rngSeed: 7,
  });

  assert.equal(useTechCollectionStore.getState().getNextRankCost('tech_mortal_cap'), null);
  assert.equal(useTechCollectionStore.getState().getNextRankCost('tech_earth_cap'), null);
  assert.equal(useTechCollectionStore.getState().getNextRankCost('tech_heaven_cap'), null);
  assert.equal(useTechCollectionStore.getState().getNextRankCost('tech_mystic_cap'), null);
});

test('packet 4.8 store milestone helpers still match the contract', () => {
  assert.deepEqual(useTechCollectionStore.getState().getMasteryMilestoneEffects(75), {
    cooldownMult: 0.95,
    costMult: 0.9,
    effectMult: 1,
    secondaryUnlocked: true,
  });
  assert.deepEqual(useTechCollectionStore.getState().getNextMasteryMilestone(75), {
    level: 100,
    effectsSummary: ['Effect 10%', 'Title: Perfected'],
  });
});
