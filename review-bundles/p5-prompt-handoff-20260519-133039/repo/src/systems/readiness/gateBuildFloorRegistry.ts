import type { TrialId } from '../progression/contract/index.js';
import { SEMESTER_SLICE_CONTRACT } from '../progression/contract/index.js';
import type { GateBuildFloor, GateBuildFloorThresholds, GateBuildMasteryTarget } from './gateBuildFloorTypes.js';

const CURRENT_PATH_IDS = ['heaven', 'earth', 'martial'] as const;

function freezeMasteryTargets(targets: GateBuildMasteryTarget[]): readonly GateBuildMasteryTarget[] {
  return Object.freeze(targets.map((target) => Object.freeze({ ...target })));
}

function freezeThresholds<T extends GateBuildFloorThresholds>(thresholds: T): Readonly<T> {
  return Object.freeze({
    ...thresholds,
    masteryTargets: freezeMasteryTargets([...thresholds.masteryTargets]),
  });
}

function freezeGateBuildFloor(entry: GateBuildFloor): Readonly<GateBuildFloor> {
  return Object.freeze({
    trialId: entry.trialId,
    minimum: Object.freeze({
      ...freezeThresholds(entry.minimum),
      preferredAiByPath: Object.freeze({ ...entry.minimum.preferredAiByPath }),
    }),
    recommended: freezeThresholds(entry.recommended),
  });
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Gate build floor registry validation failed: ${message}`);
  }
}

function compareTargets(a: GateBuildMasteryTarget, b: GateBuildMasteryTarget): number {
  if (a.level !== b.level) return a.level - b.level;
  return a.count - b.count;
}

function validateMasteryTargets(trialId: TrialId, label: 'minimum' | 'recommended', targets: readonly GateBuildMasteryTarget[]): void {
  assert(targets.length > 0, `${trialId} ${label} must provide at least one mastery target.`);

  targets.forEach((target, index) => {
    assert(target.count > 0, `${trialId} ${label} mastery target #${index + 1} must have count > 0.`);
    assert(target.level > 0, `${trialId} ${label} mastery target #${index + 1} must have level > 0.`);
    if (index > 0) {
      assert(
        compareTargets(targets[index - 1], target) <= 0,
        `${trialId} ${label} mastery targets must be sorted by level ascending, then count ascending.`,
      );
    }
  });
}

function validateThresholdPair(entry: GateBuildFloor): void {
  assert(
    entry.recommended.activeSlotsFilled >= entry.minimum.activeSlotsFilled,
    `${entry.trialId} recommended activeSlotsFilled cannot be weaker than minimum.`,
  );
  assert(
    entry.recommended.passiveSlotsFilled >= entry.minimum.passiveSlotsFilled,
    `${entry.trialId} recommended passiveSlotsFilled cannot be weaker than minimum.`,
  );
  assert(
    entry.recommended.pathAlignmentScore >= entry.minimum.pathAlignmentScore,
    `${entry.trialId} recommended pathAlignmentScore cannot be weaker than minimum.`,
  );
  assert(
    entry.recommended.rankUpTotal >= entry.minimum.rankUpTotal,
    `${entry.trialId} recommended rankUpTotal cannot be weaker than minimum.`,
  );
  assert(
    entry.recommended.runeCount >= entry.minimum.runeCount,
    `${entry.trialId} recommended runeCount cannot be weaker than minimum.`,
  );
  assert(
    !entry.minimum.ultimateRequired || entry.recommended.ultimateRequired,
    `${entry.trialId} recommended ultimateRequired must stay true when minimum ultimateRequired is true.`,
  );
}

function validatePreferredAi(trialId: TrialId, preferredAiByPath: GateBuildFloor['minimum']['preferredAiByPath']): void {
  CURRENT_PATH_IDS.forEach((pathId) => {
    assert(preferredAiByPath[pathId] != null, `${trialId} minimum preferredAiByPath must include ${pathId}.`);
  });
}

function validateRegistryEntries(registry: readonly GateBuildFloor[]): void {
  const liveTrialIds = SEMESTER_SLICE_CONTRACT.liveTrialIds;
  const liveTrialIdSet = new Set<TrialId>(liveTrialIds);
  const seenTrialIds = new Set<TrialId>();

  assert(
    GATE_BUILD_FLOOR_TRIAL_ORDER.length === liveTrialIds.length,
    'GATE_BUILD_FLOOR_TRIAL_ORDER must match the live trial count.',
  );
  assert(
    GATE_BUILD_FLOOR_TRIAL_ORDER.every((trialId, index) => trialId === liveTrialIds[index]),
    'GATE_BUILD_FLOOR_TRIAL_ORDER must exactly cover SEMESTER_SLICE_CONTRACT.liveTrialIds in live order.',
  );
  assert(registry.length === liveTrialIds.length, 'Gate build floor registry length must equal the live trial count.');

  registry.forEach((entry) => {
    assert(liveTrialIdSet.has(entry.trialId), `${entry.trialId} is not in the semester live trial slice.`);
    assert(!seenTrialIds.has(entry.trialId), `${entry.trialId} appears more than once in the gate build floor registry.`);
    seenTrialIds.add(entry.trialId);

    validateThresholdPair(entry);
    validateMasteryTargets(entry.trialId, 'minimum', entry.minimum.masteryTargets);
    validateMasteryTargets(entry.trialId, 'recommended', entry.recommended.masteryTargets);
    validatePreferredAi(entry.trialId, entry.minimum.preferredAiByPath);
  });

  liveTrialIds.forEach((trialId) => {
    assert(seenTrialIds.has(trialId), `${trialId} is missing from the gate build floor registry.`);
  });
}

export const GATE_BUILD_FLOOR_TRIAL_ORDER: readonly TrialId[] = Object.freeze([
  'trial_novices_clearing',
  'trial_stone_core_sanctum',
  'trial_patriarchs_seal',
  'trial_soul_lantern_vault',
  'trial_severing_court',
]);

export const GATE_BUILD_FLOOR_REGISTRY: readonly GateBuildFloor[] = Object.freeze([
  freezeGateBuildFloor({
    trialId: 'trial_novices_clearing',
    minimum: {
      activeSlotsFilled: 2,
      passiveSlotsFilled: 1,
      ultimateRequired: false,
      pathAlignmentScore: 40,
      masteryTargets: [{ count: 3, level: 25 }],
      rankUpTotal: 3,
      runeCount: 0,
      preferredAiByPath: {
        heaven: 'balanced',
        earth: 'balanced',
        martial: 'balanced',
      },
    },
    recommended: {
      activeSlotsFilled: 2,
      passiveSlotsFilled: 1,
      ultimateRequired: false,
      pathAlignmentScore: 60,
      masteryTargets: [
        { count: 3, level: 25 },
        { count: 1, level: 50 },
      ],
      rankUpTotal: 4,
      runeCount: 0,
    },
  }),
  freezeGateBuildFloor({
    trialId: 'trial_stone_core_sanctum',
    minimum: {
      activeSlotsFilled: 3,
      passiveSlotsFilled: 1,
      ultimateRequired: false,
      pathAlignmentScore: 50,
      masteryTargets: [{ count: 4, level: 25 }],
      rankUpTotal: 4,
      runeCount: 0,
      preferredAiByPath: {
        heaven: 'balanced',
        earth: 'survivor',
        martial: 'balanced',
      },
    },
    recommended: {
      activeSlotsFilled: 3,
      passiveSlotsFilled: 1,
      ultimateRequired: false,
      pathAlignmentScore: 70,
      masteryTargets: [
        { count: 4, level: 25 },
        { count: 2, level: 50 },
      ],
      rankUpTotal: 6,
      runeCount: 0,
    },
  }),
  freezeGateBuildFloor({
    trialId: 'trial_patriarchs_seal',
    minimum: {
      activeSlotsFilled: 3,
      passiveSlotsFilled: 2,
      ultimateRequired: false,
      pathAlignmentScore: 55,
      masteryTargets: [{ count: 5, level: 25 }],
      rankUpTotal: 5,
      runeCount: 1,
      preferredAiByPath: {
        heaven: 'burst',
        earth: 'survivor',
        martial: 'burst',
      },
    },
    recommended: {
      activeSlotsFilled: 3,
      passiveSlotsFilled: 2,
      ultimateRequired: false,
      pathAlignmentScore: 75,
      masteryTargets: [
        { count: 5, level: 25 },
        { count: 2, level: 50 },
      ],
      rankUpTotal: 8,
      runeCount: 1,
    },
  }),
  freezeGateBuildFloor({
    trialId: 'trial_soul_lantern_vault',
    minimum: {
      activeSlotsFilled: 4,
      passiveSlotsFilled: 2,
      ultimateRequired: false,
      pathAlignmentScore: 60,
      masteryTargets: [{ count: 6, level: 25 }],
      rankUpTotal: 6,
      runeCount: 2,
      preferredAiByPath: {
        heaven: 'burst',
        earth: 'survivor',
        martial: 'burst',
      },
    },
    recommended: {
      activeSlotsFilled: 4,
      passiveSlotsFilled: 2,
      ultimateRequired: false,
      pathAlignmentScore: 80,
      masteryTargets: [
        { count: 6, level: 25 },
        { count: 3, level: 50 },
      ],
      rankUpTotal: 10,
      runeCount: 2,
    },
  }),
  freezeGateBuildFloor({
    trialId: 'trial_severing_court',
    minimum: {
      activeSlotsFilled: 4,
      passiveSlotsFilled: 2,
      ultimateRequired: true,
      pathAlignmentScore: 65,
      masteryTargets: [
        { count: 7, level: 25 },
        { count: 1, level: 50 },
      ],
      rankUpTotal: 8,
      runeCount: 2,
      preferredAiByPath: {
        heaven: 'burst',
        earth: 'survivor',
        martial: 'burst',
      },
    },
    recommended: {
      activeSlotsFilled: 4,
      passiveSlotsFilled: 2,
      ultimateRequired: true,
      pathAlignmentScore: 85,
      masteryTargets: [
        { count: 7, level: 25 },
        { count: 2, level: 50 },
      ],
      rankUpTotal: 12,
      runeCount: 3,
    },
  }),
]);

validateRegistryEntries(GATE_BUILD_FLOOR_REGISTRY);

export const GATE_BUILD_FLOOR_BY_TRIAL_ID: Readonly<Record<TrialId, GateBuildFloor>> = Object.freeze(
  GATE_BUILD_FLOOR_REGISTRY.reduce<Record<TrialId, GateBuildFloor>>((acc, entry) => {
    acc[entry.trialId] = entry;
    return acc;
  }, {} as Record<TrialId, GateBuildFloor>),
);

export function getAllGateBuildFloors(): GateBuildFloor[] {
  return [...GATE_BUILD_FLOOR_REGISTRY];
}

export function getGateBuildFloor(trialId: string | null | undefined): GateBuildFloor | null {
  if (trialId == null) return null;
  return GATE_BUILD_FLOOR_BY_TRIAL_ID[trialId as TrialId] ?? null;
}
