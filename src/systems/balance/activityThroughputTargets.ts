import { getSemesterBalanceTargets } from './semesterBalanceTargets.js';

export const ACTIVITY_THROUGHPUT_CATEGORY_IDS = Object.freeze([
  'goldPerMinute',
  'commonMaterialUnitsPerMinute',
  'targetedMaterialUnitsPerMinute',
  'anchorUnitsPerRun',
  'rareBundleCadence',
  'bossSpiritStoneSupportPerHour',
  'runDurationSeconds',
  'cycleDurationSeconds',
  'shortageRecoveryValue',
] as const);

export type ActivityThroughputCategoryId = (typeof ACTIVITY_THROUGHPUT_CATEGORY_IDS)[number];

type ActivityLoopId = 'outskirts' | 'ruins' | 'bounties' | 'expeditions';

export const ACTIVITY_LOOP_ROLE_OWNERSHIP = Object.freeze({
  outskirts: {
    activityId: 'outskirts',
    status: 'locked',
    primaryCategories: ['goldPerMinute', 'commonMaterialUnitsPerMinute'] as const,
    secondaryCategories: ['bossSpiritStoneSupportPerHour'] as const,
  },
  ruins: {
    activityId: 'ruins',
    status: 'locked',
    primaryCategories: ['targetedMaterialUnitsPerMinute', 'anchorUnitsPerRun', 'shortageRecoveryValue'] as const,
    secondaryCategories: ['rareBundleCadence'] as const,
  },
  bounties: {
    activityId: 'bounties',
    status: 'deferred',
    sourcePacket: '6.3c',
    notes: 'Prompt 2 owns explicit bounty merit/spirit-stone throughput targets.',
  },
  expeditions: {
    activityId: 'expeditions',
    status: 'deferred',
    sourcePacket: '6.3d',
    notes: 'Prompt 2 owns expedition equivalence ratios versus active loops.',
  },
} as const);

export const LOCKED_ACTIVITY_ROLE_STATEMENTS = Object.freeze({
  outskirtsPrimaryGoldAndCommon: {
    status: 'locked',
    statement: 'Outskirts is the primary active gold lane and primary common-material lane.',
  },
  outskirtsSpiritStoneSupportSecondary: {
    status: 'locked',
    statement: 'Outskirts boss spirit-stone support is secondary and must not replace the support route.',
  },
  ruinsPrimaryTargetedAndAnchor: {
    status: 'locked',
    statement: 'Ruins is the primary active targeted-material and anchor loop.',
  },
  ruinsBonusAdditiveToAnchor: {
    status: 'locked',
    statement: 'Ruins final-chest bonus bundles are additive and never replace guaranteed anchors.',
  },
});

export const ACTIVITY_THROUGHPUT_PROBE_ASSUMPTIONS = Object.freeze({
  outskirtsCycleDurationSecondsByCityIndex: [180, 216, 260, 308, 360],
  ruinsRunDurationSecondsByCityIndex: [240, 270, 324, 360, 420],
});

export const ACTIVITY_THROUGHPUT_VALIDATION_THRESHOLDS = Object.freeze({
  outskirtsGoldPerMinuteDominanceMinRatio: 1.25,
  outskirtsCommonPerMinuteDominanceMinRatio: 1.2,
  ruinsTargetedPerMinuteDominanceMinRatio: 1.35,
  ruinsAnchorUnitsPerRunMinimum: 1,
  outskirtsSupportVsPrimaryGoldMaxShare: 0.08,
});

export const DEFERRED_ACTIVITY_THROUGHPUT_TARGETS = Object.freeze({
  bountyMeritSpiritStoneThroughput: {
    status: 'deferred',
    sourcePacket: '6.3c',
    notes: 'Merit/spirit-stone throughput locking belongs to Prompt 2.',
  },
  expeditionEquivalenceRatios: {
    status: 'deferred',
    sourcePacket: '6.3d',
    notes: 'Expedition-to-active equivalence ratios belong to Prompt 2.',
  },
});

export function getActivityThroughputTargets() {
  const semesterTargets = getSemesterBalanceTargets();
  return {
    semesterSpineActivityTargetStatus: semesterTargets.activityThroughputTargets,
    categories: [...ACTIVITY_THROUGHPUT_CATEGORY_IDS],
    roleOwnership: ACTIVITY_LOOP_ROLE_OWNERSHIP,
    lockedRoleStatements: LOCKED_ACTIVITY_ROLE_STATEMENTS,
    probeAssumptions: ACTIVITY_THROUGHPUT_PROBE_ASSUMPTIONS,
    validationThresholds: ACTIVITY_THROUGHPUT_VALIDATION_THRESHOLDS,
    deferredTargets: DEFERRED_ACTIVITY_THROUGHPUT_TARGETS,
  };
}

export function getActivityProbeDurationSeconds(activityId: Extract<ActivityLoopId, 'outskirts' | 'ruins'>, cityIndex: number): number {
  const safeIndex = Math.max(0, Math.min(4, Math.floor(cityIndex)));
  if (activityId === 'outskirts') {
    return ACTIVITY_THROUGHPUT_PROBE_ASSUMPTIONS.outskirtsCycleDurationSecondsByCityIndex[safeIndex];
  }
  return ACTIVITY_THROUGHPUT_PROBE_ASSUMPTIONS.ruinsRunDurationSecondsByCityIndex[safeIndex];
}
