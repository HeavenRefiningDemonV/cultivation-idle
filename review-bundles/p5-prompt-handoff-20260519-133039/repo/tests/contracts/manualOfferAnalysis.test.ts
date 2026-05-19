import assert from "node:assert/strict";
import test from "node:test";

import type { DoctrineSnapshot } from "../../src/systems/doctrine/index.js";
import type { LoadoutSnapshot } from "../../src/systems/builds/index.js";
import {
  analyzeManualOfferFromContext,
  isDuplicateManualOffer,
  isManualOfferQualityUpgrade,
} from "../../src/systems/manuals/index.js";

function createDoctrineSnapshot(): DoctrineSnapshot {
  return {
    path: "heaven",
    focusMode: "balanced",
    spiritRoot: null,
    heartLawId: null,
    heartLawChapter: 1,
    breathMode: "balanced",
    selectedLoadoutId: "loadout_1",
    aiProfile: "balanced",
    castingPolicy: "balanced",
    realmIndex: 0,
    majorRealmId: "qi_condensation",
    cityId: "city_pinewind_hamlet",
  };
}

function createLoadoutSnapshot(): LoadoutSnapshot {
  return {
    loadoutId: "loadout_1",
    aiProfile: "balanced",
    castingPolicy: "balanced",
    displayed: { active: 4, passive: 3 },
    unlocked: { active: 2, passive: 1, ultimate: false },
    equipped: { active: [], passive: [], ultimate: null },
    filled: { active: 0, passive: 0, ultimate: 0 },
    emptyUnlockedCount: 0,
    emptyUnlockedSlots: [],
    parkedLockedAssignments: [],
  };
}

function approxEqual(actual: number, expected: number, epsilon = 1e-9) {
  assert.equal(
    Math.abs(actual - expected) <= epsilon,
    true,
    `expected ${actual} ≈ ${expected}`,
  );
}

test("packet 4.9 strong path-aligned active offer into an empty unlocked active slot yields the exact analysis shape", () => {
  const loadout = createLoadoutSnapshot();
  loadout.emptyUnlockedCount = 1;
  loadout.emptyUnlockedSlots = [{ slotType: "active", slotIndex: 1 }];

  assert.deepEqual(
    analyzeManualOfferFromContext({
      techniqueId: "tech_offer_a",
      techniqueType: "active",
      pathFit: "strong",
      families: ["coreDamage"],
      supportFlags: [],
      snapshot: createDoctrineSnapshot(),
      loadoutSnapshot: loadout,
      currentEquippedFamilies: [],
      currentEquippedSupportFlags: [],
      ownedState: {
        hasTechnique: false,
        ownedGrade: "mortal",
        ownedRarity: "common",
        currentFragments: 0,
        nextRankCostFragments: null,
      },
      manualGrade: "earth",
      manualRarity: "rare",
      buildAnalysis: null,
    }),
    {
      techniqueId: "tech_offer_a",
      pathAligned: true,
      supportOffer: false,
      fillsCurrentGap: true,
      improvesCurrentMilestone: true,
      isDuplicate: false,
      fragmentProgressValue: 0,
    },
  );
});

test("packet 4.9 neutral survival offer becomes a support/gap fix and meaningful duplicate", () => {
  const analysis = analyzeManualOfferFromContext({
    techniqueId: "tech_offer_b",
    techniqueType: "passive",
    pathFit: "neutral",
    families: ["guard", "heal"],
    supportFlags: ["survival"],
    snapshot: createDoctrineSnapshot(),
    loadoutSnapshot: createLoadoutSnapshot(),
    currentEquippedFamilies: [],
    currentEquippedSupportFlags: [],
    ownedState: {
      hasTechnique: true,
      ownedGrade: "mortal",
      ownedRarity: "common",
      currentFragments: 35,
      nextRankCostFragments: 100,
    },
    manualGrade: "mortal",
    manualRarity: "common",
    buildAnalysis: null,
  });

  assert.equal(analysis.pathAligned, false);
  assert.equal(analysis.supportOffer, true);
  assert.equal(analysis.fillsCurrentGap, true);
  assert.equal(analysis.improvesCurrentMilestone, true);
  assert.equal(analysis.isDuplicate, true);
  assert.equal(analysis.fragmentProgressValue, 0.55);
});

test("packet 4.9 higher-quality manual is an upgrade, not a duplicate", () => {
  assert.equal(
    isManualOfferQualityUpgrade({
      hasTechnique: true,
      ownedGrade: "earth",
      ownedRarity: "rare",
      offerGrade: "heaven",
      offerRarity: "rare",
    }),
    true,
  );
  assert.equal(
    isDuplicateManualOffer({
      hasTechnique: true,
      ownedGrade: "earth",
      ownedRarity: "rare",
      offerGrade: "heaven",
      offerRarity: "rare",
    }),
    false,
  );

  const analysis = analyzeManualOfferFromContext({
    techniqueId: "tech_offer_upgrade",
    techniqueType: "active",
    pathFit: "off",
    families: [],
    supportFlags: [],
    snapshot: createDoctrineSnapshot(),
    loadoutSnapshot: createLoadoutSnapshot(),
    currentEquippedFamilies: [],
    currentEquippedSupportFlags: [],
    ownedState: {
      hasTechnique: true,
      ownedGrade: "earth",
      ownedRarity: "rare",
      currentFragments: 0,
      nextRankCostFragments: 500,
    },
    manualGrade: "heaven",
    manualRarity: "rare",
    buildAnalysis: null,
  });

  assert.equal(analysis.improvesCurrentMilestone, true);
  assert.equal(analysis.fragmentProgressValue, 0);
});

test("packet 4.9 lower-quality manual is a duplicate, not an upgrade", () => {
  assert.equal(
    isManualOfferQualityUpgrade({
      hasTechnique: true,
      ownedGrade: "heaven",
      ownedRarity: "epic",
      offerGrade: "earth",
      offerRarity: "rare",
    }),
    false,
  );
  assert.equal(
    isDuplicateManualOffer({
      hasTechnique: true,
      ownedGrade: "heaven",
      ownedRarity: "epic",
      offerGrade: "earth",
      offerRarity: "rare",
    }),
    true,
  );

  const analysis = analyzeManualOfferFromContext({
    techniqueId: "tech_offer_duplicate",
    techniqueType: "active",
    pathFit: "off",
    families: [],
    supportFlags: [],
    snapshot: createDoctrineSnapshot(),
    loadoutSnapshot: createLoadoutSnapshot(),
    currentEquippedFamilies: [],
    currentEquippedSupportFlags: [],
    ownedState: {
      hasTechnique: true,
      ownedGrade: "heaven",
      ownedRarity: "epic",
      currentFragments: 0,
      nextRankCostFragments: 500,
    },
    manualGrade: "earth",
    manualRarity: "rare",
    buildAnalysis: null,
  });

  assert.equal(analysis.improvesCurrentMilestone, false);
  approxEqual(analysis.fragmentProgressValue, 0.264);
});

test("packet 4.9 build-gap codes are interpreted exactly", () => {
  const base = {
    techniqueId: "tech_gap_test",
    techniqueType: "active",
    snapshot: createDoctrineSnapshot(),
    loadoutSnapshot: createLoadoutSnapshot(),
    currentEquippedFamilies: [] as const,
    currentEquippedSupportFlags: [] as const,
    ownedState: {
      hasTechnique: true,
      ownedGrade: "mortal" as const,
      ownedRarity: "common" as const,
      currentFragments: 0,
      nextRankCostFragments: 100,
    },
    manualGrade: "mortal" as const,
    manualRarity: "common" as const,
  };

  assert.equal(
    analyzeManualOfferFromContext({
      ...base,
      pathFit: "strong",
      families: ["coreDamage"],
      supportFlags: [],
      buildAnalysis: { gaps: [{ code: "low_alignment", severity: "high" }] },
    }).fillsCurrentGap,
    true,
  );

  assert.equal(
    analyzeManualOfferFromContext({
      ...base,
      pathFit: "off",
      families: ["setup"],
      supportFlags: [],
      buildAnalysis: {
        gaps: [{ code: "missing_setup_tool", severity: "medium" }],
      },
    }).fillsCurrentGap,
    true,
  );

  assert.equal(
    analyzeManualOfferFromContext({
      ...base,
      pathFit: "off",
      families: [],
      supportFlags: [],
      buildAnalysis: { gaps: [{ code: "low_rank", severity: "high" }] },
    }).fillsCurrentGap,
    true,
  );

  assert.equal(
    analyzeManualOfferFromContext({
      ...base,
      pathFit: "off",
      families: [],
      supportFlags: [],
      buildAnalysis: { gaps: [{ code: "low_alignment", severity: "low" }] },
    }).fillsCurrentGap,
    false,
  );
});
