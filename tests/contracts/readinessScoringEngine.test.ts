import assert from 'node:assert/strict';
import test from 'node:test';

import type { BuildAnalysis, BuildTechniqueAnalysisEntry } from '../../src/systems/builds/buildAnalysisTypes.js';
import type { CombatPostureFit } from '../../src/systems/builds/combatPostureTypes.js';
import type { EconomicShortfall } from '../../src/systems/economy/economicRecommendationTypes.js';
import type { ForgeFloorReadModel } from '../../src/systems/forge/forgeFloorReadModel.js';
import {
  getGateBuildFloor,
  READINESS_BAND_ORDER,
  READINESS_SEVERITY_ORDER,
  READINESS_SHORTFALL_ORDER,
  evaluateBuildReadiness,
  evaluateEconomicReadiness,
  evaluateForgeReadiness,
  evaluatePostureReadiness,
  postureRatingToReadinessBand,
  scoreGateReadiness,
  type GateForgeTargets,
} from '../../src/systems/readiness/index.js';

function makeBuildEntry(overrides: Partial<BuildTechniqueAnalysisEntry> = {}): BuildTechniqueAnalysisEntry {
  return {
    techId: 'tech_a',
    slotType: 'active',
    families: ['coreDamage'],
    supportFlags: [],
    pathFit: 'strong',
    pathFitScore: 2,
    manualGrade: 'earth',
    rarity: 'rare',
    masteryLevel: 25,
    masteryFloor: 25,
    masteryFloorMet: true,
    rank: 2,
    rankFloor: 2,
    rankCap: 5,
    rankFloorMet: true,
    runeSockets: 1,
    runeFloor: 1,
    appliedRuneCount: 1,
    runeFloorMet: true,
    ...overrides,
  };
}

function makeBuildAnalysis(overrides: Partial<BuildAnalysis> = {}): BuildAnalysis {
  return {
    loadoutId: 'loadout_1',
    archetypeId: null,
    pathAlignmentScore: 0,
    familyCoverage: {
      coreDamage: 0,
      aoe: 0,
      execute: 0,
      guard: 0,
      heal: 0,
      buff: 0,
      setup: 0,
      control: 0,
      mobility: 0,
      cleanse: 0,
      farm: 0,
    },
    supportCoverage: {
      survival: 0,
      tempo: 0,
      boss: 0,
      farm: 0,
    },
    emptyUnlockedSlots: 0,
    masteryFloorMet: true,
    rankFloorMet: true,
    runeFloorMet: true,
    equippedTechniques: [],
    gaps: [],
    ...overrides,
  };
}

function makeForgeFloor(overrides: Partial<ForgeFloorReadModel> = {}): ForgeFloorReadModel {
  return {
    weaponRefineFloor: 0,
    accessoryRefineFloor: 0,
    temperSuccessTotal: 0,
    temperSuccessesBySlot: {
      weapon: 0,
      accessory: 0,
    },
    runeInventoryCount: 0,
    runeSocketedCount: 0,
    runeTotalCount: 0,
    runeUniqueCount: 0,
    runeSummaryLabel: 'No crafted runes yet',
    nextGateRecommendation: null,
    ...overrides,
  };
}

function makeForgeTargets(overrides: Partial<GateForgeTargets> = {}): GateForgeTargets {
  return {
    minimum: {
      weaponRefine: 0,
      accessoryRefine: 0,
      temperSuccesses: 0,
      runeCount: 0,
      ...overrides.minimum,
    },
    recommended: {
      weaponRefine: 0,
      accessoryRefine: 0,
      temperSuccesses: 0,
      runeCount: 0,
      ...overrides.recommended,
    },
  };
}

function makePostureFit(overrides: Partial<CombatPostureFit> = {}): CombatPostureFit {
  return {
    aiFit: 'good',
    castingFit: 'good',
    pouchFit: 'good',
    warnings: [],
    ...overrides,
  };
}

function makeEconomicShortfall(id: string): EconomicShortfall {
  return {
    id,
    problemKind: 'belowHealingFloor',
    severity: 'high',
    currentValue: 0,
    targetValue: 1,
    gap: 1,
    mandatoryBeforeNextGate: true,
    spendPriorityId: 'maintain_consumable_floor',
    priorityBand: 1,
    primaryDestinationFamily: 'apothecary_buy',
    primaryRecommendedRouteKey: null,
    label: id,
    relatedIds: [],
    benefitCategory: 'consumable_floor',
  };
}

test('packet 4.13 locks the exact readiness constants', () => {
  assert.deepEqual(READINESS_BAND_ORDER, ['below_minimum', 'minimum_met_below_recommended', 'recommended_met']);
  assert.deepEqual(READINESS_SEVERITY_ORDER, ['critical', 'high', 'medium', 'low']);
  assert.deepEqual(READINESS_SHORTFALL_ORDER, [
    'build_slots',
    'build_alignment',
    'build_mastery',
    'build_rank',
    'build_runes',
    'forge_floor',
    'economic_shortfall',
    'posture_ai',
    'posture_casting',
    'posture_pouch',
  ]);
});

test('packet 4.13 build readiness marks a healthy gate 1 build as exactly recommended', () => {
  const gateBuildFloor = getGateBuildFloor('trial_novices_clearing');
  assert.ok(gateBuildFloor);

  const buildAnalysis = makeBuildAnalysis({
    pathAlignmentScore: 60,
    equippedTechniques: [
      makeBuildEntry({ techId: 'tech_active_a', slotType: 'active', masteryLevel: 50, rank: 3, appliedRuneCount: 0 }),
      makeBuildEntry({ techId: 'tech_active_b', slotType: 'active', masteryLevel: 25, rank: 2, appliedRuneCount: 0 }),
      makeBuildEntry({ techId: 'tech_passive_a', slotType: 'passive', masteryLevel: 25, rank: 2, appliedRuneCount: 0 }),
    ],
  });

  const result = evaluateBuildReadiness({ gateBuildFloor, buildAnalysis });

  assert.equal(result.band, 'recommended_met');
  assert.equal(result.minimumMet, true);
  assert.equal(result.recommendedMet, true);
  assert.deepEqual(result.shortfalls, []);
});

test('packet 4.13 build readiness locks the exact severe gate 5 underbuild shortfalls', () => {
  const gateBuildFloor = getGateBuildFloor('trial_severing_court');
  assert.ok(gateBuildFloor);

  const buildAnalysis = makeBuildAnalysis({
    pathAlignmentScore: 35,
    equippedTechniques: [
      makeBuildEntry({ techId: 'a1', slotType: 'active', masteryLevel: 10, rank: 1, appliedRuneCount: 0 }),
      makeBuildEntry({ techId: 'a2', slotType: 'active', masteryLevel: 10, rank: 1, appliedRuneCount: 0 }),
      makeBuildEntry({ techId: 'a3', slotType: 'active', masteryLevel: 10, rank: 1, appliedRuneCount: 0 }),
      makeBuildEntry({ techId: 'a4', slotType: 'active', masteryLevel: 10, rank: 1, appliedRuneCount: 0 }),
      makeBuildEntry({ techId: 'p1', slotType: 'passive', masteryLevel: 10, rank: 1, appliedRuneCount: 0 }),
      makeBuildEntry({ techId: 'p2', slotType: 'passive', masteryLevel: 10, rank: 1, appliedRuneCount: 0 }),
    ],
  });

  const result = evaluateBuildReadiness({ gateBuildFloor, buildAnalysis });

  assert.equal(result.band, 'below_minimum');
  assert.equal(result.minimumMet, false);
  assert.equal(result.recommendedMet, false);
  assert.deepEqual(result.shortfalls, [
    {
      code: 'build_slots',
      severity: 'high',
      label: 'Build slots below gate floor',
      reason: 'The current build has not filled the gate-required technique slots yet.',
      currentValue: 6,
      minimumTarget: 7,
      recommendedTarget: 7,
    },
    {
      code: 'build_alignment',
      severity: 'high',
      label: 'Path alignment below gate floor',
      reason: 'Selected-path technique alignment is below the minimum gate threshold.',
      currentValue: 35,
      minimumTarget: 65,
      recommendedTarget: 85,
    },
    {
      code: 'build_mastery',
      severity: 'high',
      label: 'Technique mastery below gate floor',
      reason: 'The equipped build does not meet the minimum gate mastery targets.',
      currentValue: null,
      minimumTarget: null,
      recommendedTarget: null,
    },
    {
      code: 'build_rank',
      severity: 'high',
      label: 'Technique rank investment below gate floor',
      reason: 'Total rank investment is below the minimum gate target.',
      currentValue: 0,
      minimumTarget: 8,
      recommendedTarget: 12,
    },
    {
      code: 'build_runes',
      severity: 'high',
      label: 'Technique rune investment below gate floor',
      reason: 'Applied technique runes are below the minimum gate target.',
      currentValue: 0,
      minimumTarget: 2,
      recommendedTarget: 3,
    },
  ]);
});

test('packet 4.13 build readiness keeps a recommended-only alignment miss at medium severity', () => {
  const gateBuildFloor = getGateBuildFloor('trial_stone_core_sanctum');
  assert.ok(gateBuildFloor);

  const buildAnalysis = makeBuildAnalysis({
    pathAlignmentScore: 60,
    equippedTechniques: [
      makeBuildEntry({ techId: 'a1', slotType: 'active', masteryLevel: 50, rank: 4, appliedRuneCount: 0 }),
      makeBuildEntry({ techId: 'a2', slotType: 'active', masteryLevel: 50, rank: 2, appliedRuneCount: 0 }),
      makeBuildEntry({ techId: 'a3', slotType: 'active', masteryLevel: 25, rank: 2, appliedRuneCount: 0 }),
      makeBuildEntry({ techId: 'p1', slotType: 'passive', masteryLevel: 25, rank: 2, appliedRuneCount: 0 }),
    ],
  });

  const result = evaluateBuildReadiness({ gateBuildFloor, buildAnalysis });

  assert.equal(result.band, 'minimum_met_below_recommended');
  assert.deepEqual(result.shortfalls, [
    {
      code: 'build_alignment',
      severity: 'medium',
      label: 'Path alignment below gate floor',
      reason: 'Selected-path technique alignment is below the recommended gate threshold.',
      currentValue: 60,
      minimumTarget: 50,
      recommendedTarget: 70,
    },
  ]);
});

test('packet 4.13 forge readiness locks the exact minimum-only case', () => {
  const forgeFloor = makeForgeFloor({
    weaponRefineFloor: 2,
    accessoryRefineFloor: 1,
    temperSuccessTotal: 1,
    runeTotalCount: 0,
  });
  const forgeTargets = makeForgeTargets({
    minimum: { weaponRefine: 2, accessoryRefine: 1, temperSuccesses: 1, runeCount: 0 },
    recommended: { weaponRefine: 3, accessoryRefine: 2, temperSuccesses: 2, runeCount: 0 },
  });

  const result = evaluateForgeReadiness({ forgeFloor, forgeTargets });

  assert.equal(result.band, 'minimum_met_below_recommended');
  assert.deepEqual(result.shortfalls, [
    {
      code: 'forge_floor',
      severity: 'medium',
      label: 'Forge floor below gate target',
      reason: 'Forge progress meets minimum, but not the recommended gate floor.',
      currentValue: 4,
      minimumTarget: 4,
      recommendedTarget: 7,
    },
  ]);
});

test('packet 4.13 forge readiness locks the exact below-minimum case', () => {
  const forgeFloor = makeForgeFloor({
    weaponRefineFloor: 1,
    accessoryRefineFloor: 0,
    temperSuccessTotal: 0,
    runeTotalCount: 0,
  });
  const forgeTargets = makeForgeTargets({
    minimum: { weaponRefine: 2, accessoryRefine: 1, temperSuccesses: 1, runeCount: 0 },
    recommended: { weaponRefine: 3, accessoryRefine: 2, temperSuccesses: 2, runeCount: 0 },
  });

  const result = evaluateForgeReadiness({ forgeFloor, forgeTargets });

  assert.equal(result.band, 'below_minimum');
  assert.deepEqual(result.shortfalls, [
    {
      code: 'forge_floor',
      severity: 'high',
      label: 'Forge floor below gate target',
      reason: 'Weapon refine, accessory refine, temper, or crafted rune totals are below the minimum gate floor.',
      currentValue: 1,
      minimumTarget: 4,
      recommendedTarget: 7,
    },
  ]);
});

test('packet 4.13 economic readiness keeps exact band mapping and top shortfall ids', () => {
  const recommended = evaluateEconomicReadiness({
    band: 'recommended_met',
    shortfalls: [],
    majorShortfallCount: 0,
  });
  assert.equal(recommended.band, 'recommended_met');
  assert.deepEqual(recommended.shortfalls, []);
  assert.deepEqual(recommended.topShortfallIds, []);

  const minimumOnly = evaluateEconomicReadiness({
    band: 'minimum_met_below_recommended',
    shortfalls: [makeEconomicShortfall('recommended-forge-floor'), makeEconomicShortfall('gate-prep-package')],
    majorShortfallCount: 0,
  });
  assert.deepEqual(minimumOnly.shortfalls, [
    {
      code: 'economic_shortfall',
      severity: 'medium',
      label: 'Economic prep below recommended gate floor',
      reason: 'Recommended prep routes still have open shortfalls.',
      currentValue: null,
      minimumTarget: null,
      recommendedTarget: null,
    },
  ]);
  assert.deepEqual(minimumOnly.topShortfallIds, ['recommended-forge-floor', 'gate-prep-package']);

  const belowMinimum = evaluateEconomicReadiness({
    band: 'below_minimum',
    shortfalls: [
      makeEconomicShortfall('healing-floor'),
      makeEconomicShortfall('minimum-forge-floor'),
      makeEconomicShortfall('merit-reserve'),
      makeEconomicShortfall('gate-prep-package'),
    ],
    majorShortfallCount: 3,
  });
  assert.deepEqual(belowMinimum.shortfalls, [
    {
      code: 'economic_shortfall',
      severity: 'critical',
      label: 'Economic prep below minimum gate floor',
      reason: 'Mandatory consumable, forge, or reserve prep shortfalls remain.',
      currentValue: null,
      minimumTarget: null,
      recommendedTarget: null,
    },
  ]);
  assert.deepEqual(belowMinimum.topShortfallIds, ['healing-floor', 'minimum-forge-floor', 'merit-reserve']);
});

test('packet 4.13 posture rating maps exactly to readiness bands', () => {
  assert.equal(postureRatingToReadinessBand('good'), 'recommended_met');
  assert.equal(postureRatingToReadinessBand('risky'), 'minimum_met_below_recommended');
  assert.equal(postureRatingToReadinessBand('bad'), 'below_minimum');
});

test('packet 4.13 posture readiness locks the exact mixed risky and bad case', () => {
  const result = evaluatePostureReadiness(makePostureFit({
    aiFit: 'good',
    castingFit: 'risky',
    pouchFit: 'bad',
    warnings: [
      'Defensive casting slows open-world clears when the current loadout is not under real pressure.',
      'Combat consumable auto-use is disabled.',
      'Combat consumable auto-use is disabled.',
    ],
  }));

  assert.equal(result.band, 'below_minimum');
  assert.equal(result.minimumMet, false);
  assert.equal(result.recommendedMet, false);
  assert.deepEqual(result.warnings, [
    'Defensive casting slows open-world clears when the current loadout is not under real pressure.',
    'Combat consumable auto-use is disabled.',
  ]);
  assert.deepEqual(result.shortfalls, [
    {
      code: 'posture_casting',
      severity: 'medium',
      label: 'Casting posture below gate floor',
      reason: 'The selected casting policy is only a risky fit for the current gate posture.',
      currentValue: null,
      minimumTarget: null,
      recommendedTarget: null,
    },
    {
      code: 'posture_pouch',
      severity: 'high',
      label: 'Medicine pouch posture below gate floor',
      reason: 'The current medicine pouch setup is a poor fit for the current gate posture.',
      currentValue: null,
      minimumTarget: null,
      recommendedTarget: null,
    },
  ]);
});

test('packet 4.13 scoreGateReadiness merges shortfalls in exact packet order and preserves warnings', () => {
  const gateBuildFloor = getGateBuildFloor('trial_novices_clearing');
  assert.ok(gateBuildFloor);

  const result = scoreGateReadiness({
    trialId: 'trial_novices_clearing',
    gateBuildFloor,
    buildAnalysis: makeBuildAnalysis({
      pathAlignmentScore: 60,
      equippedTechniques: [
        makeBuildEntry({ techId: 'tech_active_a', slotType: 'active', masteryLevel: 50, rank: 3, appliedRuneCount: 0 }),
        makeBuildEntry({ techId: 'tech_active_b', slotType: 'active', masteryLevel: 25, rank: 2, appliedRuneCount: 0 }),
        makeBuildEntry({ techId: 'tech_passive_a', slotType: 'passive', masteryLevel: 25, rank: 2, appliedRuneCount: 0 }),
      ],
    }),
    forgeFloor: makeForgeFloor({
      weaponRefineFloor: 2,
      accessoryRefineFloor: 1,
      temperSuccessTotal: 1,
      runeTotalCount: 0,
    }),
    forgeTargets: makeForgeTargets({
      minimum: { weaponRefine: 2, accessoryRefine: 1, temperSuccesses: 1, runeCount: 0 },
      recommended: { weaponRefine: 3, accessoryRefine: 2, temperSuccesses: 2, runeCount: 0 },
    }),
    economicReadinessBand: 'below_minimum',
    economicShortfalls: [
      makeEconomicShortfall('healing-floor'),
      makeEconomicShortfall('minimum-forge-floor'),
      makeEconomicShortfall('merit-reserve'),
      makeEconomicShortfall('gate-prep-package'),
    ],
    economicMajorShortfallCount: 3,
    postureFit: makePostureFit({
      aiFit: 'bad',
      castingFit: 'good',
      pouchFit: 'bad',
      warnings: [
        'Farmer AI is a poor fit for gate trials.',
        'Combat consumable auto-use is disabled.',
      ],
    }),
  });

  assert.equal(result.overallBand, 'below_minimum');
  assert.deepEqual(result.shortfalls.map((shortfall) => shortfall.code), [
    'forge_floor',
    'economic_shortfall',
    'posture_ai',
    'posture_pouch',
  ]);
  assert.deepEqual(result.warnings, [
    'Farmer AI is a poor fit for gate trials.',
    'Combat consumable auto-use is disabled.',
  ]);
});
