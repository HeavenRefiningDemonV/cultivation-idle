import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GATE_BUILD_FLOOR_BY_TRIAL_ID,
  GATE_BUILD_FLOOR_REGISTRY,
  GATE_BUILD_FLOOR_TRIAL_ORDER,
  getAllGateBuildFloors,
  getGateBuildFloor,
} from '../../src/systems/readiness/index.js';
import { SEMESTER_SLICE_CONTRACT, type TrialId } from '../../src/systems/progression/contract/index.js';
import type { GateBuildFloor, GateBuildMasteryTarget } from '../../src/systems/readiness/gateBuildFloorTypes.js';

const EXACT_LIVE_TRIAL_ORDER: TrialId[] = [
  'trial_novices_clearing',
  'trial_stone_core_sanctum',
  'trial_patriarchs_seal',
  'trial_soul_lantern_vault',
  'trial_severing_court',
];

const EXACT_REGISTRY: GateBuildFloor[] = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
];

function isSortedMasteryTargets(targets: GateBuildMasteryTarget[]): boolean {
  return targets.every((target, index) => {
    if (index === 0) return true;
    const previous = targets[index - 1];
    if (!previous) return true;
    return previous.level < target.level || (previous.level === target.level && previous.count <= target.count);
  });
}

test('packet 4.12 locks the exact live trial order', () => {
  assert.deepEqual(SEMESTER_SLICE_CONTRACT.liveTrialIds, EXACT_LIVE_TRIAL_ORDER);
  assert.deepEqual(GATE_BUILD_FLOOR_TRIAL_ORDER, EXACT_LIVE_TRIAL_ORDER);
});

test('packet 4.12 locks the exact semester gate build floor registry', () => {
  assert.deepEqual(GATE_BUILD_FLOOR_REGISTRY, EXACT_REGISTRY);
  assert.deepEqual(GATE_BUILD_FLOOR_BY_TRIAL_ID.trial_novices_clearing, EXACT_REGISTRY[0]);
  assert.deepEqual(GATE_BUILD_FLOOR_BY_TRIAL_ID.trial_severing_court, EXACT_REGISTRY[4]);
});

test('packet 4.12 lookup helpers are safe and deterministic', () => {
  assert.equal(getGateBuildFloor(null), null);
  assert.equal(getGateBuildFloor(undefined), null);
  assert.equal(getGateBuildFloor('unknown_trial'), null);
  assert.deepEqual(getGateBuildFloor('trial_novices_clearing'), EXACT_REGISTRY[0]);
  assert.deepEqual(getGateBuildFloor('trial_severing_court'), EXACT_REGISTRY[4]);
});

test('packet 4.12 getAllGateBuildFloors returns a fresh array containing canonical entries', () => {
  const a = getAllGateBuildFloors();
  const b = getAllGateBuildFloors();

  assert.notStrictEqual(a, b);
  assert.deepEqual(a, GATE_BUILD_FLOOR_REGISTRY);
  assert.deepEqual(b, GATE_BUILD_FLOOR_REGISTRY);
});

test('packet 4.12 registry forbids out-of-slice trials', () => {
  const registryIds = GATE_BUILD_FLOOR_REGISTRY.map((entry) => entry.trialId).sort();
  const liveIds = [...SEMESTER_SLICE_CONTRACT.liveTrialIds].sort();

  assert.equal(GATE_BUILD_FLOOR_REGISTRY.length, SEMESTER_SLICE_CONTRACT.liveTrialIds.length);
  assert.deepEqual(registryIds, liveIds);
});

test('packet 4.12 registry entries stay structurally complete and monotonic', () => {
  GATE_BUILD_FLOOR_REGISTRY.forEach((entry) => {
    assert.equal(entry.minimum.activeSlotsFilled >= 0, true);
    assert.equal(entry.minimum.passiveSlotsFilled >= 0, true);
    assert.equal(entry.recommended.activeSlotsFilled >= entry.minimum.activeSlotsFilled, true);
    assert.equal(entry.recommended.passiveSlotsFilled >= entry.minimum.passiveSlotsFilled, true);
    assert.equal(entry.recommended.pathAlignmentScore >= entry.minimum.pathAlignmentScore, true);
    assert.equal(entry.recommended.rankUpTotal >= entry.minimum.rankUpTotal, true);
    assert.equal(entry.recommended.runeCount >= entry.minimum.runeCount, true);
    assert.equal(!entry.minimum.ultimateRequired || entry.recommended.ultimateRequired, true);
    assert.notEqual(entry.minimum.preferredAiByPath.heaven, undefined);
    assert.notEqual(entry.minimum.preferredAiByPath.earth, undefined);
    assert.notEqual(entry.minimum.preferredAiByPath.martial, undefined);

    [entry.minimum.masteryTargets, entry.recommended.masteryTargets].forEach((targets) => {
      assert.equal(targets.length > 0, true);
      assert.equal(isSortedMasteryTargets(targets), true);
      targets.forEach((target) => {
        assert.equal(target.count > 0, true);
        assert.equal(target.level > 0, true);
      });
    });
  });
});

test('packet 4.12 slot-fill floors align to the semester slot ladder', () => {
  const minimumSlotExpectations = EXACT_REGISTRY.map((entry) => ({
    trialId: entry.trialId,
    activeSlotsFilled: entry.minimum.activeSlotsFilled,
    passiveSlotsFilled: entry.minimum.passiveSlotsFilled,
    ultimateRequired: entry.minimum.ultimateRequired,
  }));

  assert.deepEqual(minimumSlotExpectations, [
    { trialId: 'trial_novices_clearing', activeSlotsFilled: 2, passiveSlotsFilled: 1, ultimateRequired: false },
    { trialId: 'trial_stone_core_sanctum', activeSlotsFilled: 3, passiveSlotsFilled: 1, ultimateRequired: false },
    { trialId: 'trial_patriarchs_seal', activeSlotsFilled: 3, passiveSlotsFilled: 2, ultimateRequired: false },
    { trialId: 'trial_soul_lantern_vault', activeSlotsFilled: 4, passiveSlotsFilled: 2, ultimateRequired: false },
    { trialId: 'trial_severing_court', activeSlotsFilled: 4, passiveSlotsFilled: 2, ultimateRequired: true },
  ]);

  GATE_BUILD_FLOOR_REGISTRY.forEach((entry) => {
    assert.equal(entry.recommended.activeSlotsFilled, entry.minimum.activeSlotsFilled);
    assert.equal(entry.recommended.passiveSlotsFilled, entry.minimum.passiveSlotsFilled);
    assert.equal(entry.recommended.ultimateRequired, entry.minimum.ultimateRequired);
  });
});

test('packet 4.12 path-alignment thresholds stay exact and increasing', () => {
  assert.deepEqual(
    GATE_BUILD_FLOOR_REGISTRY.map((entry) => entry.minimum.pathAlignmentScore),
    [40, 50, 55, 60, 65],
  );
  assert.deepEqual(
    GATE_BUILD_FLOOR_REGISTRY.map((entry) => entry.recommended.pathAlignmentScore),
    [60, 70, 75, 80, 85],
  );
});

test('packet 4.12 rank and rune expectations stay exact', () => {
  assert.deepEqual(
    GATE_BUILD_FLOOR_REGISTRY.map((entry) => entry.minimum.rankUpTotal),
    [3, 4, 5, 6, 8],
  );
  assert.deepEqual(
    GATE_BUILD_FLOOR_REGISTRY.map((entry) => entry.recommended.rankUpTotal),
    [4, 6, 8, 10, 12],
  );
  assert.deepEqual(
    GATE_BUILD_FLOOR_REGISTRY.map((entry) => entry.minimum.runeCount),
    [0, 0, 1, 2, 2],
  );
  assert.deepEqual(
    GATE_BUILD_FLOOR_REGISTRY.map((entry) => entry.recommended.runeCount),
    [0, 0, 1, 2, 3],
  );
});

test('packet 4.12 AI preferences stay exact by gate', () => {
  assert.deepEqual(GATE_BUILD_FLOOR_REGISTRY[0]?.minimum.preferredAiByPath, {
    heaven: 'balanced',
    earth: 'balanced',
    martial: 'balanced',
  });
  assert.deepEqual(GATE_BUILD_FLOOR_REGISTRY[1]?.minimum.preferredAiByPath, {
    heaven: 'balanced',
    earth: 'survivor',
    martial: 'balanced',
  });

  [2, 3, 4].forEach((index) => {
    assert.deepEqual(GATE_BUILD_FLOOR_REGISTRY[index]?.minimum.preferredAiByPath, {
      heaven: 'burst',
      earth: 'survivor',
      martial: 'burst',
    });
  });
});
