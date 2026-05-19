import test from "node:test";
import assert from "node:assert/strict";

import type { DoctrineSnapshot } from "../../src/systems/doctrine/index.js";
import type {
  LoadoutSnapshot,
  LoadoutSnapshotSource,
  TechniqueProgressionSnapshot,
  TechniqueTaxonomyProfile,
} from "../../src/systems/builds/index.js";
import { buildTechniqueFoundationContextFromSnapshots } from "../../src/systems/builds/index.js";

const doctrine: DoctrineSnapshot = {
  path: "heaven",
  focusMode: "balanced",
  spiritRoot: null,
  heartLawId: null,
  heartLawChapter: 1,
  breathMode: "balanced",
  selectedLoadoutId: "loadout_alpha",
  aiProfile: "balanced",
  castingPolicy: "balanced",
  realmIndex: 0,
  majorRealmId: "qi_condensation",
  cityId: null,
};

const loadout: LoadoutSnapshot = {
  loadoutId: "loadout_alpha",
  aiProfile: "balanced",
  castingPolicy: "balanced",
  displayed: { active: 4, passive: 3 },
  unlocked: { active: 2, passive: 1, ultimate: false },
  equipped: {
    active: ["tech_heaven_starfire_bolt"],
    passive: ["tech_heaven_astral_focus"],
    ultimate: null,
  },
  filled: { active: 1, passive: 1, ultimate: 0 },
  emptyUnlockedCount: 1,
  emptyUnlockedSlots: [{ slotType: "active", slotIndex: 1 }],
  parkedLockedAssignments: [
    {
      slotType: "active",
      slotIndex: 2,
      techId: "tech_earth_world_pillar_slam",
    },
    {
      slotType: "ultimate",
      slotIndex: 0,
      techId: "tech_martial_ninefold_sword_rain",
    },
  ],
};

const loadoutSource: LoadoutSnapshotSource = {
  id: "loadout_alpha",
  aiProfile: "balanced",
  castingPolicy: "balanced",
  slots: {
    active: ["tech_heaven_starfire_bolt", "", "tech_earth_world_pillar_slam"],
    passive: ["tech_heaven_astral_focus"],
    ultimate: "tech_martial_ninefold_sword_rain",
  },
};

const progressionByTechId = new Map<string, TechniqueProgressionSnapshot>([
  [
    "tech_heaven_starfire_bolt",
    {
      grade: "mortal",
      rarity: "common",
      gradePolicy: {
        grade: "mortal",
        maxRank: 3,
        runeSockets: 0,
        mastery75SecondaryPotencyBonus: 0,
        traitSlots: 1,
      },
      masteryXp: 0,
      masteryLevel: 1,
      rank: 1,
      rankCap: 3,
      masteryMilestoneEffects: {
        highestUnlockedMilestone: 0,
        effectMult: 1,
        cooldownMult: 1,
        costMult: 1,
        secondaryUnlocked: false,
      },
      nextMasteryMilestone: { level: 25, effectsSummary: ["Cooldown 5%"] },
      effectMultiplier: 1.1,
      cooldownReductionPct: 0,
      costReductionPct: 0,
      secondaryPotencyMult: 1,
      traitSlotBreakdown: {
        raritySlots: 1,
        gradeCap: 1,
        effectiveSlots: 1,
        rarity: "common",
        grade: "mortal",
      },
      runeSockets: 0,
      appliedTraitCount: 0,
      appliedRuneCount: 0,
    },
  ],
  [
    "tech_heaven_astral_focus",
    {
      grade: "earth",
      rarity: "rare",
      gradePolicy: {
        grade: "earth",
        maxRank: 5,
        runeSockets: 1,
        mastery75SecondaryPotencyBonus: 0,
        traitSlots: 1,
      },
      masteryXp: 30,
      masteryLevel: 4,
      rank: 2,
      rankCap: 5,
      masteryMilestoneEffects: {
        highestUnlockedMilestone: 0,
        effectMult: 1,
        cooldownMult: 1,
        costMult: 1,
        secondaryUnlocked: false,
      },
      nextMasteryMilestone: { level: 25, effectsSummary: ["Cooldown 5%"] },
      effectMultiplier: 1.3,
      cooldownReductionPct: 0,
      costReductionPct: 0,
      secondaryPotencyMult: 1,
      traitSlotBreakdown: {
        raritySlots: 2,
        gradeCap: 2,
        effectiveSlots: 2,
        rarity: "rare",
        grade: "earth",
      },
      runeSockets: 1,
      appliedTraitCount: 1,
      appliedRuneCount: 0,
    },
  ],
  [
    "tech_earth_world_pillar_slam",
    {
      grade: "earth",
      rarity: "rare",
      gradePolicy: {
        grade: "earth",
        maxRank: 5,
        runeSockets: 1,
        mastery75SecondaryPotencyBonus: 0,
        traitSlots: 1,
      },
      masteryXp: 80,
      masteryLevel: 6,
      rank: 2,
      rankCap: 5,
      masteryMilestoneEffects: {
        highestUnlockedMilestone: 0,
        effectMult: 1,
        cooldownMult: 1,
        costMult: 1,
        secondaryUnlocked: false,
      },
      nextMasteryMilestone: { level: 25, effectsSummary: ["Cooldown 5%"] },
      effectMultiplier: 1.2,
      cooldownReductionPct: 0,
      costReductionPct: 0,
      secondaryPotencyMult: 1,
      traitSlotBreakdown: {
        raritySlots: 2,
        gradeCap: 2,
        effectiveSlots: 2,
        rarity: "rare",
        grade: "earth",
      },
      runeSockets: 1,
      appliedTraitCount: 0,
      appliedRuneCount: 0,
    },
  ],
  [
    "tech_martial_ninefold_sword_rain",
    {
      grade: "heaven",
      rarity: "epic",
      gradePolicy: {
        grade: "heaven",
        maxRank: 7,
        runeSockets: 2,
        mastery75SecondaryPotencyBonus: 0.25,
        traitSlots: 2,
      },
      masteryXp: 300,
      masteryLevel: 11,
      rank: 4,
      rankCap: 7,
      masteryMilestoneEffects: {
        highestUnlockedMilestone: 0,
        effectMult: 1,
        cooldownMult: 1,
        costMult: 1,
        secondaryUnlocked: false,
      },
      nextMasteryMilestone: { level: 25, effectsSummary: ["Cooldown 5%"] },
      effectMultiplier: 1.4,
      cooldownReductionPct: 0,
      costReductionPct: 0,
      secondaryPotencyMult: 1,
      traitSlotBreakdown: {
        raritySlots: 2,
        gradeCap: 2,
        effectiveSlots: 2,
        rarity: "epic",
        grade: "heaven",
      },
      runeSockets: 2,
      appliedTraitCount: 1,
      appliedRuneCount: 1,
    },
  ],
]);

const taxonomyByTechId = new Map<string, TechniqueTaxonomyProfile>([
  [
    "tech_heaven_starfire_bolt",
    {
      techId: "tech_heaven_starfire_bolt",
      path: "heaven",
      type: "attack",
      families: ["coreDamage"],
      alignment: "strong",
      supportFlags: [],
      derivedFrom: ["test"],
    },
  ],
  [
    "tech_heaven_astral_focus",
    {
      techId: "tech_heaven_astral_focus",
      path: "heaven",
      type: "support",
      families: ["buff"],
      alignment: "neutral",
      supportFlags: ["tempo"],
      derivedFrom: ["test"],
    },
  ],
  [
    "tech_earth_world_pillar_slam",
    {
      techId: "tech_earth_world_pillar_slam",
      path: "earth",
      type: "attack",
      families: ["coreDamage"],
      alignment: "strong",
      supportFlags: [],
      derivedFrom: ["test"],
    },
  ],
  [
    "tech_martial_ninefold_sword_rain",
    {
      techId: "tech_martial_ninefold_sword_rain",
      path: "martial",
      type: "attack",
      families: ["mobility"],
      alignment: "neutral",
      supportFlags: [],
      derivedFrom: ["test"],
    },
  ],
]);

const alignmentByTechId = new Map<string, "strong" | "neutral" | "off">([
  ["tech_heaven_starfire_bolt", "strong"],
  ["tech_heaven_astral_focus", "neutral"],
  ["tech_earth_world_pillar_slam", "off"],
  ["tech_martial_ninefold_sword_rain", "neutral"],
]);

test("packet 4.9 foundation context composes doctrine, loadout, progression, and taxonomy into one honest read model", () => {
  const context = buildTechniqueFoundationContextFromSnapshots({
    doctrine,
    loadout,
    loadoutSource,
    getTechniqueProgressionSnapshot: (techId) => {
      const snapshot = progressionByTechId.get(techId);
      assert.ok(snapshot, `missing progression snapshot for ${techId}`);
      return snapshot;
    },
    getTechniqueTaxonomyProfile: (techId) =>
      taxonomyByTechId.get(techId) ?? null,
    getPathAlignmentStrength: (techId) =>
      alignmentByTechId.get(techId) ?? "off",
  });

  assert.equal(context.assignedTechniques.length, 4);
  assert.equal(context.equippedTechniques.length, 2);
  assert.equal(context.parkedLockedTechniques.length, 2);
  assert.deepEqual(context.alignmentSummary, { strong: 1, neutral: 2, off: 1 });

  assert.deepEqual(
    context.equippedTechniques.map((entry) => [
      entry.slotType,
      entry.slotIndex,
      entry.techId,
      entry.availability,
      entry.pathAlignment,
    ]),
    [
      ["active", 0, "tech_heaven_starfire_bolt", "equipped", "strong"],
      ["passive", 0, "tech_heaven_astral_focus", "equipped", "neutral"],
    ],
  );

  assert.deepEqual(
    context.parkedLockedTechniques.map((entry) => [
      entry.slotType,
      entry.slotIndex,
      entry.techId,
      entry.availability,
      entry.pathAlignment,
    ]),
    [
      ["active", 2, "tech_earth_world_pillar_slam", "parked_locked", "off"],
      [
        "ultimate",
        0,
        "tech_martial_ninefold_sword_rain",
        "parked_locked",
        "neutral",
      ],
    ],
  );

  assert.equal(context.doctrineFlags.hasLoadout, true);
  assert.equal(context.doctrineWarnings.missingPath, false);
  assert.equal(context.assignedTechniques[0]?.taxonomy?.path, "heaven");
});
