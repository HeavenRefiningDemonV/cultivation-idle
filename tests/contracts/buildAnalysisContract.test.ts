import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ACTIVE_PASSIVE_MASTERY_FLOOR,
  ACTIVE_PASSIVE_MIN_RANK_FLOOR,
  ACTIVE_PASSIVE_MIN_RUNE_FLOOR,
  BUILD_GAP_ORDER,
  BUILD_GAP_SEVERITY_ORDER,
  TECHNIQUE_FAMILY_ORDER,
  TECHNIQUE_SUPPORT_FLAG_ORDER,
  ULTIMATE_MASTERY_FLOOR,
  ULTIMATE_MIN_RANK_FLOOR,
  ULTIMATE_MIN_RUNE_FLOOR,
  analyzeBuildFromInput,
  type BuildTechniqueAnalysisEntry,
  type LoadoutSnapshot,
  type TechniqueFamily,
  type TechniqueSupportFlag,
} from '../../src/systems/builds/index.js';
import type { DoctrineSnapshot } from '../../src/systems/doctrine/index.js';

function makeLoadoutSnapshot(overrides: Partial<LoadoutSnapshot> = {}): LoadoutSnapshot {
  return {
    loadoutId: 'loadout_1',
    aiProfile: 'balanced',
    castingPolicy: 'balanced',
    displayed: { active: 2, passive: 1 },
    unlocked: { active: 2, passive: 1, ultimate: false },
    equipped: { active: [], passive: [], ultimate: null },
    filled: { active: 0, passive: 0, ultimate: 0 },
    emptyUnlockedCount: 0,
    emptyUnlockedSlots: [],
    parkedLockedAssignments: [],
    ...overrides,
  };
}

function makeDoctrineSnapshot(overrides: Partial<DoctrineSnapshot> = {}): DoctrineSnapshot {
  return {
    path: 'heaven',
    focusMode: 'balanced',
    spiritRoot: null,
    heartLawId: null,
    heartLawChapter: 1,
    breathMode: 'balanced',
    selectedLoadoutId: 'loadout_1',
    aiProfile: 'balanced',
    castingPolicy: 'balanced',
    realmIndex: 0,
    majorRealmId: 'qi_condensation',
    cityId: 'city_pinewind_hamlet',
    ...overrides,
  };
}

function makeBuildEntry(
  overrides: Partial<BuildTechniqueAnalysisEntry> = {},
): BuildTechniqueAnalysisEntry {
  return {
    techId: 'tech_fixture',
    slotType: 'active',
    families: [],
    supportFlags: [],
    pathFit: 'strong',
    pathFitScore: 2,
    manualGrade: 'heaven',
    rarity: 'rare',
    masteryLevel: 25,
    masteryFloor: 25,
    masteryFloorMet: true,
    rank: 2,
    rankFloor: 2,
    rankCap: 10,
    rankFloorMet: true,
    runeSockets: 1,
    runeFloor: 1,
    appliedRuneCount: 1,
    runeFloorMet: true,
    ...overrides,
  };
}

function zeroFamilyCoverage(): Record<TechniqueFamily, number> {
  return Object.fromEntries(TECHNIQUE_FAMILY_ORDER.map((family) => [family, 0])) as Record<
    TechniqueFamily,
    number
  >;
}

function zeroSupportCoverage(): Record<TechniqueSupportFlag, number> {
  return Object.fromEntries(TECHNIQUE_SUPPORT_FLAG_ORDER.map((flag) => [flag, 0])) as Record<
    TechniqueSupportFlag,
    number
  >;
}

test('packet 4.11 contract constants are locked exactly', () => {
  assert.deepEqual(BUILD_GAP_ORDER, [
    'empty_slot',
    'low_alignment',
    'missing_survival_tool',
    'missing_setup_tool',
    'low_mastery',
    'low_rank',
    'rune_gap',
  ]);
  assert.deepEqual(BUILD_GAP_SEVERITY_ORDER, ['high', 'medium', 'low']);
  assert.equal(ACTIVE_PASSIVE_MASTERY_FLOOR, 25);
  assert.equal(ULTIMATE_MASTERY_FLOOR, 50);
  assert.equal(ACTIVE_PASSIVE_MIN_RANK_FLOOR, 2);
  assert.equal(ULTIMATE_MIN_RANK_FLOOR, 3);
  assert.equal(ACTIVE_PASSIVE_MIN_RUNE_FLOOR, 1);
  assert.equal(ULTIMATE_MIN_RUNE_FLOOR, 2);
});

test('packet 4.11 healthy Heaven Scripture Flow analysis is exact', () => {
  const result = analyzeBuildFromInput({
    snapshot: makeDoctrineSnapshot({ path: 'heaven' }),
    loadoutSnapshot: makeLoadoutSnapshot({
      loadoutId: 'loadout_1',
      emptyUnlockedCount: 1,
      emptyUnlockedSlots: [{ slotType: 'passive', slotIndex: 1 }],
    }),
    equippedTechniques: [
      makeBuildEntry({ techId: 'a', families: ['setup', 'control'], pathFit: 'strong', pathFitScore: 2, supportFlags: [] }),
      makeBuildEntry({ techId: 'b', families: ['buff'], pathFit: 'strong', pathFitScore: 2, supportFlags: ['tempo'] }),
      makeBuildEntry({ techId: 'c', slotType: 'passive', families: ['guard'], pathFit: 'neutral', pathFitScore: 1, supportFlags: [] }),
    ],
  });

  assert.equal(result.loadoutId, 'loadout_1');
  assert.equal(result.archetypeId, 'heaven_scripture_flow');
  assert.equal(result.pathAlignmentScore, 83);

  const expectedFamilyCoverage = zeroFamilyCoverage();
  expectedFamilyCoverage.setup = 1;
  expectedFamilyCoverage.control = 1;
  expectedFamilyCoverage.buff = 1;
  expectedFamilyCoverage.guard = 1;
  assert.deepEqual(result.familyCoverage, expectedFamilyCoverage);

  const expectedSupportCoverage = zeroSupportCoverage();
  expectedSupportCoverage.tempo = 1;
  assert.deepEqual(result.supportCoverage, expectedSupportCoverage);

  assert.equal(result.emptyUnlockedSlots, 1);
  assert.equal(result.masteryFloorMet, true);
  assert.equal(result.rankFloorMet, true);
  assert.equal(result.runeFloorMet, true);
  assert.deepEqual(result.gaps, [
    {
      code: 'empty_slot',
      severity: 'medium',
      reason: 'An unlocked technique slot is still empty.',
    },
  ]);
});

test('packet 4.11 fully off-path underbuilt Heaven build produces the full severe gap stack', () => {
  const result = analyzeBuildFromInput({
    snapshot: makeDoctrineSnapshot({ path: 'heaven' }),
    loadoutSnapshot: makeLoadoutSnapshot({ emptyUnlockedCount: 0 }),
    equippedTechniques: [
      makeBuildEntry({
        techId: 'off_active',
        slotType: 'active',
        families: ['coreDamage'],
        supportFlags: [],
        pathFit: 'off',
        pathFitScore: 0,
        masteryLevel: 10,
        masteryFloor: 25,
        masteryFloorMet: false,
        rank: 1,
        rankFloor: 2,
        rankFloorMet: false,
        runeSockets: 1,
        runeFloor: 1,
        appliedRuneCount: 0,
        runeFloorMet: false,
      }),
      makeBuildEntry({
        techId: 'off_passive',
        slotType: 'passive',
        families: ['buff'],
        supportFlags: [],
        pathFit: 'off',
        pathFitScore: 0,
        masteryLevel: 20,
        masteryFloor: 25,
        masteryFloorMet: false,
        rank: 1,
        rankFloor: 2,
        rankFloorMet: false,
        runeSockets: 0,
        runeFloor: 0,
        appliedRuneCount: 0,
        runeFloorMet: true,
      }),
      makeBuildEntry({
        techId: 'off_ultimate',
        slotType: 'ultimate',
        families: ['execute'],
        supportFlags: [],
        pathFit: 'off',
        pathFitScore: 0,
        masteryLevel: 40,
        masteryFloor: 50,
        masteryFloorMet: false,
        rank: 1,
        rankFloor: 3,
        rankCap: 10,
        rankFloorMet: false,
        runeSockets: 2,
        runeFloor: 2,
        appliedRuneCount: 0,
        runeFloorMet: false,
      }),
    ],
  });

  assert.equal(result.archetypeId, null);
  assert.equal(result.pathAlignmentScore, 0);
  assert.equal(result.masteryFloorMet, false);
  assert.equal(result.rankFloorMet, false);
  assert.equal(result.runeFloorMet, false);
  assert.deepEqual(result.gaps, [
    {
      code: 'low_alignment',
      severity: 'high',
      reason: 'Most equipped techniques are off-path or only loosely aligned to the selected path.',
    },
    {
      code: 'missing_survival_tool',
      severity: 'medium',
      reason: 'The current build lacks a real survival tool.',
    },
    {
      code: 'missing_setup_tool',
      severity: 'medium',
      reason: 'The current build lacks setup/control support.',
    },
    {
      code: 'low_mastery',
      severity: 'high',
      reason: 'One or more equipped techniques are below the semester mastery floor.',
    },
    {
      code: 'low_rank',
      severity: 'high',
      reason: 'One or more equipped techniques are below the semester rank floor.',
    },
    {
      code: 'rune_gap',
      severity: 'medium',
      reason: 'One or more equipped techniques have rune sockets below the semester floor.',
    },
  ]);
});

test('packet 4.11 empty build with open slots is handled exactly', () => {
  const result = analyzeBuildFromInput({
    snapshot: makeDoctrineSnapshot({ path: 'martial' }),
    loadoutSnapshot: makeLoadoutSnapshot({
      emptyUnlockedCount: 3,
      emptyUnlockedSlots: [
        { slotType: 'active', slotIndex: 0 },
        { slotType: 'active', slotIndex: 1 },
        { slotType: 'passive', slotIndex: 0 },
      ],
      equipped: { active: [], passive: [], ultimate: null },
    }),
    equippedTechniques: [],
  });

  assert.equal(result.archetypeId, null);
  assert.equal(result.pathAlignmentScore, 0);
  assert.equal(result.masteryFloorMet, true);
  assert.equal(result.rankFloorMet, true);
  assert.equal(result.runeFloorMet, true);
  assert.deepEqual(result.gaps, [
    {
      code: 'empty_slot',
      severity: 'high',
      reason: 'Two or more unlocked technique slots are empty.',
    },
  ]);
});

test('packet 4.11 off-path techniques do not drive archetype detection', () => {
  const result = analyzeBuildFromInput({
    snapshot: makeDoctrineSnapshot({ path: 'heaven' }),
    loadoutSnapshot: makeLoadoutSnapshot({ emptyUnlockedCount: 0 }),
    equippedTechniques: [
      makeBuildEntry({
        techId: 'martial_like_1',
        pathFit: 'off',
        pathFitScore: 0,
        families: ['coreDamage', 'execute', 'setup'],
        supportFlags: ['boss'],
      }),
      makeBuildEntry({
        techId: 'martial_like_2',
        pathFit: 'off',
        pathFitScore: 0,
        families: ['aoe'],
        supportFlags: ['farm'],
      }),
    ],
  });

  assert.equal(result.archetypeId, null);
});

test('packet 4.11 low-alignment medium threshold is exact', () => {
  const result = analyzeBuildFromInput({
    snapshot: makeDoctrineSnapshot({ path: 'heaven' }),
    loadoutSnapshot: makeLoadoutSnapshot({ emptyUnlockedCount: 0 }),
    equippedTechniques: [
      makeBuildEntry({ techId: 'strong', pathFit: 'strong', pathFitScore: 2 }),
      makeBuildEntry({ techId: 'off', pathFit: 'off', pathFitScore: 0 }),
    ],
  });

  assert.equal(result.pathAlignmentScore, 50);
  assert.deepEqual(result.gaps[0], {
    code: 'low_alignment',
    severity: 'medium',
    reason: 'The current build is only partially aligned to the selected path.',
  });
});

test('packet 4.11 Earth missing-setup severity is low, not medium', () => {
  const result = analyzeBuildFromInput({
    snapshot: makeDoctrineSnapshot({ path: 'earth' }),
    loadoutSnapshot: makeLoadoutSnapshot({ emptyUnlockedCount: 0 }),
    equippedTechniques: [
      makeBuildEntry({
        techId: 'earth_survival',
        pathFit: 'strong',
        pathFitScore: 2,
        families: ['guard', 'heal'],
        supportFlags: ['survival'],
      }),
    ],
  });

  assert.deepEqual(
    result.gaps.find((gap) => gap.code === 'missing_setup_tool'),
    {
      code: 'missing_setup_tool',
      severity: 'low',
      reason: 'The current build lacks setup/control support.',
    },
  );
});
