import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  resolveEquipmentHandlingSnapshot,
  type EquipmentHandlingInput,
} from '../../src/systems/equipment/equipmentHandlingResolver.js';
import {
  resolveMedicineHandlingSnapshot,
} from '../../src/systems/consumables/medicineHandlingResolver.js';
import { resolveTrainingSupportMultipliers, type TrainingReadOnlySnapshot } from '../../src/systems/training/index.js';

function makeTrainingSnapshot(ratings: Record<string, number>) {
  const rows = Object.entries(ratings).map(([statId, rating]) => ({
    statId,
    displayName: statId,
    rating,
    xp: 0,
    xpToNext: 0,
    grade: 'transcendent' as const,
    cap: 100,
    capPct: 100,
    capState: 'capped' as const,
    category: 'path' as const,
    tier: 'core' as const,
  }));
  return {
    path: 'earth',
    pathLabel: 'Earth Path',
    roomTitle: 'Test Room',
    realmCap: 100,
    fatigue: 0,
    fatigueTier: 'fresh',
    fatigueDampening: 1,
    pathStats: rows,
    futureStats: [],
    regimensForPath: [],
    lockedRegimensForPath: [],
    activeRegimen: null,
    activeIntensity: null,
    currentBottleneck: rows[0] ?? null,
    pathFoundation: {
      label: 'Path Foundation',
      valueLabel: '100',
      averageRating: 100,
      grade: 'transcendent',
      progressPct: 100,
    },
    nextUnlock: null,
    supportMultipliers: resolveTrainingSupportMultipliers(),
    offlineSummary: null,
  } satisfies TrainingReadOnlySnapshot;
}

const baseEquipment: EquipmentHandlingInput['equipment'] = {
  equippedWeaponId: 'weapon_test',
  equippedAccessoryId: 'tal_guardian_seal_t1',
  refineLevelBySlot: { weapon: 10, accessory: 10 },
  temperBonusesBySlot: {
    weapon: [{ id: 'atk', label: 'Attack', stat: 'atkPct', valuePct: 8 }],
    accessory: [
      { id: 'def', label: 'Defense', stat: 'defPct', valuePct: 6 },
      { id: 'hp', label: 'Vitality', stat: 'hpPct', valuePct: 6 },
    ],
  },
};

test('mp4 equipment handling applies exact caps without mutating gear state', () => {
  const equipmentBefore = JSON.stringify(baseEquipment);
  const snapshot = resolveEquipmentHandlingSnapshot({
    trainingSnapshot: makeTrainingSnapshot({
      weapon_bond: 999,
      armor_harmony: 999,
      artifact_attunement: 999,
    }),
    equipment: baseEquipment,
  });

  assert.equal(snapshot.weapon.effectBonusPct, 14);
  assert.equal(snapshot.armor.effectBonusPct, 18);
  assert.equal(snapshot.artifact.effectBonusPct, 14);
  assert.equal(snapshot.statMultipliers.atk, 1.14);
  assert.equal(snapshot.statMultipliers.def, 1.18);
  assert.equal(snapshot.statMultipliers.maxHp, 1.18);
  assert.equal(snapshot.statMultipliers.talisman, 1.14);
  assert.equal(JSON.stringify(baseEquipment), equipmentBefore);
});

test('mp4 armor handling is inactive when current gear has no defensive signal', () => {
  const snapshot = resolveEquipmentHandlingSnapshot({
    trainingSnapshot: makeTrainingSnapshot({ armor_harmony: 100 }),
    equipment: {
      ...baseEquipment,
      equippedAccessoryId: null,
      refineLevelBySlot: { weapon: 1, accessory: 0 },
      temperBonusesBySlot: { weapon: [], accessory: [] },
    },
  });

  assert.equal(snapshot.armor.active, false);
  assert.equal(snapshot.armor.effectBonusPct, 0);
  assert.equal(snapshot.statMultipliers.def, 1);
});

test('mp4 medicine handling boosts quality and tolerance without changing pouch slots', () => {
  const pouch = {
    slots: {
      healing: {
        slotKey: 'healing' as const,
        equippedItemId: 'pill_minor_healing',
        enabled: true,
        trigger: 'hpBelowPct' as const,
        thresholdPct: 35,
        cooldownSec: 10,
        bossOnly: false,
        lastUsedAt: null,
      },
      utility: {
        slotKey: 'utility' as const,
        equippedItemId: null,
        enabled: true,
        trigger: 'manual' as const,
        thresholdPct: 50,
        cooldownSec: 30,
        bossOnly: false,
        lastUsedAt: null,
      },
      specialty: {
        slotKey: 'specialty' as const,
        equippedItemId: null,
        enabled: true,
        trigger: 'manual' as const,
        thresholdPct: 50,
        cooldownSec: 60,
        bossOnly: true,
        lastUsedAt: null,
      },
    },
  };
  const before = JSON.stringify(pouch);
  const snapshot = resolveMedicineHandlingSnapshot({
    trainingSnapshot: makeTrainingSnapshot({
      medicine_familiarity: 999,
      meridian_fortitude: 999,
    }),
    pouch,
  });

  assert.equal(snapshot.qualityBonusPct, 10);
  assert.equal(snapshot.absorptionBonusPct, 10);
  assert.equal(snapshot.backlashReductionPct, 15);
  assert.equal(snapshot.effectMultiplier, 1.1);
  assert.equal(JSON.stringify(pouch), before);
});
