import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluateAiProfileFit,
  evaluateCastingPolicyFit,
  evaluateCombatPostureFitFromContext,
  evaluateMedicinePouchFit,
  type CombatLoadoutSignals,
} from '../../src/systems/builds/index.js';
import type { MedicinePouchSlotKey, MedicinePouchSlotState } from '../../src/types/index.js';

function makeSignals(overrides: Partial<CombatLoadoutSignals> = {}): CombatLoadoutSignals {
  return {
    equippedFamilies: [],
    equippedSupportFlags: [],
    hasSurvivalTool: false,
    hasBossTool: false,
    hasFarmTool: false,
    hasSetupTool: false,
    ...overrides,
  };
}

function makePouchSlots(
  overrides: Partial<Record<MedicinePouchSlotKey, Partial<MedicinePouchSlotState>>> = {},
): Record<MedicinePouchSlotKey, MedicinePouchSlotState> {
  return {
    healing: {
      slotKey: 'healing',
      equippedItemId: null,
      enabled: true,
      trigger: 'manual',
      thresholdPct: 35,
      cooldownSec: 10,
      bossOnly: false,
      lastUsedAt: null,
      ...(overrides.healing ?? {}),
    },
    utility: {
      slotKey: 'utility',
      equippedItemId: null,
      enabled: true,
      trigger: 'manual',
      thresholdPct: 35,
      cooldownSec: 30,
      bossOnly: false,
      lastUsedAt: null,
      ...(overrides.utility ?? {}),
    },
    specialty: {
      slotKey: 'specialty',
      equippedItemId: null,
      enabled: true,
      trigger: 'manual',
      thresholdPct: 35,
      cooldownSec: 60,
      bossOnly: true,
      lastUsedAt: null,
      ...(overrides.specialty ?? {}),
    },
  };
}

test('AI fit examples are exact', () => {
  assert.deepEqual(
    evaluateAiProfileFit({
      path: 'heaven',
      aiProfile: 'farmer',
      encounterType: 'outskirts',
      loadoutSignals: makeSignals({ hasFarmTool: true }),
    }),
    { rating: 'good', warnings: [] },
  );

  assert.deepEqual(
    evaluateAiProfileFit({
      path: 'earth',
      aiProfile: 'farmer',
      encounterType: 'trial',
      loadoutSignals: makeSignals(),
    }),
    {
      rating: 'bad',
      warnings: ['Farmer AI is a poor fit for gate trials.'],
    },
  );

  assert.deepEqual(
    evaluateAiProfileFit({
      path: 'martial',
      aiProfile: 'burst',
      encounterType: 'trial',
      loadoutSignals: makeSignals({ hasBossTool: false }),
    }),
    {
      rating: 'risky',
      warnings: ['Burst AI is under-supported: no boss-pressure tool is currently equipped.'],
    },
  );

  assert.deepEqual(
    evaluateAiProfileFit({
      path: null,
      aiProfile: 'survivor',
      encounterType: 'ruins',
      loadoutSignals: makeSignals({ hasSurvivalTool: true }),
    }),
    { rating: 'good', warnings: [] },
  );
});

test('casting fit examples are exact', () => {
  assert.deepEqual(
    evaluateCastingPolicyFit({
      aiProfile: 'burst',
      castingPolicy: 'aggressive',
      encounterType: 'trial',
      loadoutSignals: makeSignals({ hasSurvivalTool: false, hasBossTool: false }),
    }),
    {
      rating: 'bad',
      warnings: ['Aggressive casting is a bad fit for a gate trial without both survival and boss-pressure tools.'],
    },
  );

  assert.deepEqual(
    evaluateCastingPolicyFit({
      aiProfile: 'balanced',
      castingPolicy: 'balanced',
      encounterType: 'ruins',
      loadoutSignals: makeSignals(),
    }),
    { rating: 'good', warnings: [] },
  );

  assert.deepEqual(
    evaluateCastingPolicyFit({
      aiProfile: 'balanced',
      castingPolicy: 'defensive',
      encounterType: 'outskirts',
      loadoutSignals: makeSignals(),
    }),
    {
      rating: 'risky',
      warnings: ['Defensive casting slows open-world clears when the current loadout is not under real pressure.'],
    },
  );

  assert.deepEqual(
    evaluateCastingPolicyFit({
      aiProfile: 'survivor',
      castingPolicy: 'aggressive',
      encounterType: 'ruins',
      loadoutSignals: makeSignals({ hasSurvivalTool: false }),
    }),
    {
      rating: 'bad',
      warnings: [
        'Aggressive casting is risky in ruins when the loadout lacks survival support.',
        "Casting policy diverges from the selected AI profile's natural posture.",
      ],
    },
  );
});

test('medicine-pouch fit examples are exact', () => {
  const disabledFit = evaluateMedicinePouchFit({
    encounterType: 'trial',
    pouchAutoUseEnabled: false,
    slots: makePouchSlots(),
  });
  assert.equal(disabledFit.rating, 'bad');
  assert.equal(disabledFit.warnings.includes('Combat consumable auto-use is disabled.'), true);

  const outskirtsFit = evaluateMedicinePouchFit({
    encounterType: 'outskirts',
    pouchAutoUseEnabled: true,
    slots: makePouchSlots(),
  });
  assert.equal(outskirtsFit.rating, 'risky');
  assert.equal(
    outskirtsFit.warnings.includes('Healing pouch slot is empty, disabled, or not carrying a healing consumable.'),
    true,
  );

  const ruinsFit = evaluateMedicinePouchFit({
    encounterType: 'ruins',
    pouchAutoUseEnabled: true,
    slots: makePouchSlots({
      healing: {
        equippedItemId: 'cons_healing_pellet_t1',
        trigger: 'hpBelowPct',
        thresholdPct: 35,
        bossOnly: false,
      },
    }),
  });
  assert.equal(ruinsFit.rating, 'risky');
  assert.equal(
    ruinsFit.warnings.includes('Serious encounters want at least one enabled utility or specialty pouch item.'),
    true,
  );

  assert.deepEqual(
    evaluateMedicinePouchFit({
      encounterType: 'trial',
      pouchAutoUseEnabled: true,
      slots: makePouchSlots({
        healing: {
          equippedItemId: 'cons_healing_pellet_t1',
          trigger: 'hpBelowPct',
          thresholdPct: 35,
          bossOnly: false,
        },
        utility: {
          equippedItemId: 'cons_ward_salt_t1',
          trigger: 'fightStart',
          bossOnly: false,
        },
        specialty: {
          equippedItemId: 'cons_ironblood_pellet_t1',
          trigger: 'bossStart',
          bossOnly: true,
        },
      }),
    }),
    { rating: 'good', warnings: [] },
  );
});

test('combined posture fit merges warnings in stable order', () => {
  assert.deepEqual(
    evaluateCombatPostureFitFromContext({
      path: 'earth',
      aiProfile: 'farmer',
      castingPolicy: 'aggressive',
      encounterType: 'trial',
      loadoutSignals: makeSignals({
        hasSurvivalTool: false,
        hasBossTool: false,
        hasFarmTool: false,
      }),
      pouchAutoUseEnabled: false,
      pouchSlots: makePouchSlots(),
    }),
    {
      aiFit: 'bad',
      castingFit: 'bad',
      pouchFit: 'bad',
      warnings: [
        'Farmer AI is a poor fit for gate trials.',
        'Aggressive casting is a bad fit for a gate trial without both survival and boss-pressure tools.',
        'Combat consumable auto-use is disabled.',
        'Healing pouch slot is empty, disabled, or not carrying a healing consumable.',
        'Serious encounters want at least one enabled utility or specialty pouch item.',
      ],
    },
  );
});
