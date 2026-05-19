import assert from 'node:assert/strict';
import test from 'node:test';

import { analyzeSelectedBuild, xpNeededForLevel } from '../../src/systems/builds/index.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useTechCollectionStore } from '../../src/stores/techCollectionStore.js';
import { useTechniqueStore } from '../../src/stores/techniqueStore.js';
import {
  primeExpeditionRuntimeStores,
  resetExpeditionRuntimeStores,
} from './expeditionRuntimeTestUtils.js';

function resetBuildRuntimeStores() {
  resetExpeditionRuntimeStores();
  useGameStore.getState().hardResetGameState();
  useTechniqueStore.getState().resetLoadouts();
  useTechCollectionStore.getState().hardReset();
}

test.beforeEach(async () => {
  resetBuildRuntimeStores();
  await primeExpeditionRuntimeStores();
});

test('packet 4.11 runtime wrapper is safe with no equipped techniques', () => {
  useGameStore.setState((state) => ({
    ...state,
    selectedPath: 'heaven',
  }));

  const result = analyzeSelectedBuild();

  assert.equal(result.loadoutId, 'loadout_1');
  assert.equal(result.archetypeId, null);
  assert.equal(result.emptyUnlockedSlots, 3);
  assert.deepEqual(result.gaps, [
    {
      code: 'empty_slot',
      severity: 'high',
      reason: 'Two or more unlocked technique slots are empty.',
    },
  ]);
});

test('packet 4.11 runtime wrapper detects a real Heaven Scripture Flow loadout', () => {
  useGameStore.setState((state) => ({
    ...state,
    selectedPath: 'heaven',
  }));

  const collection = useTechCollectionStore.getState();
  collection.unlockTech('tech_heaven_astral_needle', {
    manualGrade: 'heaven',
    rarity: 'rare',
    masteryXp: xpNeededForLevel(25),
    rank: 2,
  });
  collection.unlockTech('tech_heaven_heavens_pulse', {
    manualGrade: 'heaven',
    rarity: 'rare',
    masteryXp: xpNeededForLevel(25),
    rank: 2,
  });
  collection.unlockTech('tech_heaven_astral_focus', {
    manualGrade: 'heaven',
    rarity: 'rare',
    masteryXp: xpNeededForLevel(25),
    rank: 2,
  });

  const selected = useTechniqueStore.getState().selectedLoadoutId;
  assert.deepEqual(useTechniqueStore.getState().equipTechnique('active', 0, 'tech_heaven_astral_needle', selected), { ok: true });
  assert.deepEqual(useTechniqueStore.getState().equipTechnique('active', 1, 'tech_heaven_heavens_pulse', selected), { ok: true });
  assert.deepEqual(useTechniqueStore.getState().equipTechnique('passive', 0, 'tech_heaven_astral_focus', selected), { ok: true });

  const result = analyzeSelectedBuild();

  assert.equal(result.archetypeId, 'heaven_scripture_flow');
  assert.equal(result.pathAlignmentScore >= 67, true);
  assert.equal(result.gaps.some((gap) => gap.code === 'low_alignment'), false);
});

test('packet 4.11 runtime wrapper reports off-path real loadouts honestly', () => {
  useGameStore.setState((state) => ({
    ...state,
    selectedPath: 'heaven',
  }));

  const collection = useTechCollectionStore.getState();
  collection.unlockTech('tech_earth_stonebreaker_fist', {
    manualGrade: 'heaven',
    rarity: 'rare',
    masteryXp: xpNeededForLevel(25),
    rank: 2,
  });
  collection.unlockTech('tech_martial_gale_cut', {
    manualGrade: 'heaven',
    rarity: 'rare',
    masteryXp: xpNeededForLevel(25),
    rank: 2,
  });
  collection.unlockTech('tech_earth_stone_skin', {
    manualGrade: 'heaven',
    rarity: 'rare',
    masteryXp: xpNeededForLevel(25),
    rank: 2,
  });

  const selected = useTechniqueStore.getState().selectedLoadoutId;
  assert.deepEqual(useTechniqueStore.getState().equipTechnique('active', 0, 'tech_earth_stonebreaker_fist', selected), { ok: true });
  assert.deepEqual(useTechniqueStore.getState().equipTechnique('active', 1, 'tech_martial_gale_cut', selected), { ok: true });
  assert.deepEqual(useTechniqueStore.getState().equipTechnique('passive', 0, 'tech_earth_stone_skin', selected), { ok: true });

  const result = analyzeSelectedBuild();

  assert.equal(result.archetypeId, null);
  assert.equal(result.pathAlignmentScore < 40, true);
  assert.equal(
    result.gaps.some((gap) => gap.code === 'low_alignment' && gap.severity === 'high'),
    true,
  );
});

test('packet 4.11 runtime wrapper surfaces ultimate underbuild progression gaps', () => {
  useGameStore.setState((state) => ({
    ...state,
    selectedPath: 'heaven',
    realm: { ...state.realm, index: 4 },
  }));

  const collection = useTechCollectionStore.getState();
  collection.unlockTech('tech_heaven_heavenly_cataclysm', {
    manualGrade: 'heaven',
    rarity: 'rare',
    masteryXp: 0,
    rank: 1,
    runes: [],
  });

  const selected = useTechniqueStore.getState().selectedLoadoutId;
  assert.deepEqual(
    useTechniqueStore.getState().equipTechnique('ultimate', 0, 'tech_heaven_heavenly_cataclysm', selected),
    { ok: true },
  );

  const result = analyzeSelectedBuild();

  assert.equal(result.masteryFloorMet, false);
  assert.equal(result.rankFloorMet, false);
  assert.equal(result.runeFloorMet, false);
  assert.equal(result.gaps.some((gap) => gap.code === 'low_mastery'), true);
  assert.equal(result.gaps.some((gap) => gap.code === 'low_rank'), true);
  assert.equal(result.gaps.some((gap) => gap.code === 'rune_gap'), true);
});
