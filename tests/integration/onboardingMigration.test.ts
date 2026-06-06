import assert from 'node:assert/strict';
import test from 'node:test';

import { inferOnboardingStateFromSave } from '../../src/systems/onboarding/onboardingMigration.js';
import { sanitizeOnboardingState } from '../../src/stores/onboardingStore.js';

const NOW = 123_456;

const baseSave = (): {
  version: string;
  timestamp: number;
  gameState: {
    realm: { index: number; substage: number; name: string };
    qi: string;
    selectedPath: string | null;
    focusMode: string;
    pathPerks: string[];
    totalAuras: number;
    upgradeTiers: { idle: number; damage: number; hp: number };
    pityState: { killsSinceUncommon: number; killsSinceRare: number; killsSinceEpic: number; killsSinceLegendary: number };
    playerLuck: number;
  };
  inventoryState: { currencies: { gold: string; spiritStones: string; merit: string }; items: Record<string, number> };
  heartLawState: { selectedHeartLawId: string | null };
} => ({
  version: '2.0.0',
  timestamp: NOW,
  gameState: {
    realm: { index: 0, substage: 1, name: 'Qi Condensation' },
    qi: '0',
    selectedPath: null,
    focusMode: 'balanced',
    pathPerks: [],
    totalAuras: 0,
    upgradeTiers: { idle: 0, damage: 0, hp: 0 },
    pityState: { killsSinceUncommon: 0, killsSinceRare: 0, killsSinceEpic: 0, killsSinceLegendary: 0 },
    playerLuck: 0,
  },
  inventoryState: { currencies: { gold: '0', spiritStones: '0', merit: '0' }, items: {} },
  heartLawState: { selectedHeartLawId: null },
});

const withIdentity = (save: ReturnType<typeof baseSave>) => {
  save.gameState.selectedPath = 'heaven';
  save.heartLawState.selectedHeartLawId = 'heart_law_quiet_breath';
  return save;
};

test('onboarding migration keeps missing life identity at M0', () => {
  const state = inferOnboardingStateFromSave({ save: baseSave(), now: NOW, migratedFromVersion: '2.0.0' });

  assert.equal(state.activeMilestoneId, 'M0_life_start');
  assert.deepEqual(state.completedMilestoneIds, []);
  assert.deepEqual(state.unlockedTabs, []);
  assert.equal(state.firstLifeOnlyComplete, false);
});

test('onboarding migration moves committed Qi Condensation I saves to M1', () => {
  const state = inferOnboardingStateFromSave({ save: withIdentity(baseSave()), now: NOW, migratedFromVersion: '2.0.0' });

  assert.equal(state.activeMilestoneId, 'M1_cultivation_only');
  assert.deepEqual(state.completedMilestoneIds, ['M0_life_start']);
  assert.deepEqual(state.unlockedTabs, ['cultivation']);
});

test('onboarding migration unlocks Status and activates M2 at Qi Condensation II', () => {
  const save = withIdentity(baseSave());
  save.gameState.realm.substage = 2;

  const state = inferOnboardingStateFromSave({ save, now: NOW, migratedFromVersion: '2.0.0' });

  assert.equal(state.activeMilestoneId, 'M2_status_unlock');
  assert.deepEqual(state.completedMilestoneIds, ['M0_life_start', 'M1_cultivation_only']);
  assert.deepEqual(state.unlockedTabs, ['cultivation', 'status']);
});

test('onboarding migration infers Outskirts progress as M3 complete and Pavilion next', () => {
  const save = withIdentity(baseSave());
  Object.assign(save, {
    outskirtsState: {
      progressByOutskirtsId: {
        outskirts_pinewind: { killsSinceBoss: 2, totalKills: 2, bossDefeated: false },
      },
    },
  });

  const state = inferOnboardingStateFromSave({ save, now: NOW, migratedFromVersion: '2.0.0' });

  assert.equal(state.activeMilestoneId, 'M4_pavilion_satchel');
  assert.equal(state.completedMilestoneIds.includes('M3_world_outskirts'), true);
  assert.equal(state.unlockedWorldModules.includes('outskirts'), true);
  assert.equal(state.unlockedWorldModules.includes('manualPavilion'), true);
});

test('onboarding migration infers Manual, Technique, Pouch, Forge, Ruins, Gate, and Foundation evidence', () => {
  const manualSave = withIdentity(baseSave());
  Object.assign(manualSave, {
    manualSatchelState: {
      manuals: [{ id: 'manual_1', techId: 'tech_1', grade: 'mortal', rarity: 'common', acquiredAt: NOW }],
      activeStudy: null,
      lastLearned: null,
    },
  });
  assert.equal(inferOnboardingStateFromSave({ save: manualSave, now: NOW }).activeMilestoneId, 'M4_pavilion_satchel');

  const techniqueSave = withIdentity(baseSave());
  Object.assign(techniqueSave, {
    techCollectionState: { unlockedTechs: { tech_1: { unlocked: true, masteryXp: 0, rank: 1 } }, fragments: {} },
    techniqueState: { loadouts: [{ id: 'loadout_1', name: 'Main', aiProfile: 'balanced', slots: { active: ['tech_1'], passive: [], ultimate: null } }], selectedLoadoutId: 'loadout_1' },
  });
  const techniqueState = inferOnboardingStateFromSave({ save: techniqueSave, now: NOW });
  assert.equal(techniqueState.completedMilestoneIds.includes('M5_techniques_loadout'), true);
  assert.equal(techniqueState.activeMilestoneId, 'M6_apothecary_expedition');

  const pouchSave = withIdentity(baseSave());
  Object.assign(pouchSave, {
    medicinePouchState: {
      slots: {
        healing: { slotKey: 'healing', equippedItemId: 'cons_healing_pellet_t1', enabled: true, trigger: 'hpBelowPct', thresholdPct: 35, cooldownSec: 10, bossOnly: false, lastUsedAt: null },
        utility: { slotKey: 'utility', equippedItemId: null, enabled: true, trigger: 'manual', thresholdPct: 50, cooldownSec: 30, bossOnly: false, lastUsedAt: null },
        specialty: { slotKey: 'specialty', equippedItemId: null, enabled: true, trigger: 'manual', thresholdPct: 50, cooldownSec: 60, bossOnly: true, lastUsedAt: null },
      },
    },
  });
  assert.equal(inferOnboardingStateFromSave({ save: pouchSave, now: NOW }).activeMilestoneId, 'M7_forge');

  const forgeSave = withIdentity(baseSave());
  Object.assign(forgeSave, {
    equipmentState: {
      equippedWeaponId: null,
      equippedAccessoryId: null,
      refineLevelBySlot: { weapon: 1, accessory: 0 },
      temperBonusesBySlot: { weapon: [], accessory: [] },
      forgeToolTiers: { anvil: 1, hammer: 1, bellows: 1, quenchTub: 1 },
    },
  });
  assert.equal(inferOnboardingStateFromSave({ save: forgeSave, now: NOW }).activeMilestoneId, 'M8_ruins_bounties');

  const supportSave = withIdentity(baseSave());
  Object.assign(supportSave, {
    ruinsState: { progressByRuinId: { ruin_1: { totalRuns: 1, totalRoomsCleared: 3, bossKills: 0 } } },
  });
  assert.equal(inferOnboardingStateFromSave({ save: supportSave, now: NOW }).activeMilestoneId, 'M9_gate_trial');

  const gateSave = withIdentity(baseSave());
  Object.assign(gateSave, {
    trialState: { progressByTrialId: { trial_1: { attempts: 1, resolution: 'cleared', cleared: true, lastAttemptAt: NOW, lastClearAt: NOW } } },
  });
  const gateState = inferOnboardingStateFromSave({ save: gateSave, now: NOW });
  assert.equal(gateState.completedMilestoneIds.includes('M9_gate_trial'), true);
  assert.equal(gateState.activeMilestoneId, 'M10_foundation_graduation');

  const foundationSave = withIdentity(baseSave());
  foundationSave.gameState.realm.index = 1;
  const foundationState = inferOnboardingStateFromSave({ save: foundationSave, now: NOW });
  assert.equal(foundationState.activeMilestoneId, 'complete');
  assert.equal(foundationState.firstLifeOnlyComplete, true);
  assert.equal(foundationState.completedMilestoneIds.includes('M10_foundation_graduation'), true);
});

test('onboarding state sanitizer preserves valid state and defaults malformed state', () => {
  const valid = inferOnboardingStateFromSave({ save: withIdentity(baseSave()), now: NOW, migratedFromVersion: '2.0.0' });
  assert.deepEqual(sanitizeOnboardingState(valid).completedMilestoneIds, valid.completedMilestoneIds);

  const sanitized = sanitizeOnboardingState({ schemaVersion: 'wrong', completedMilestoneIds: [123] });
  assert.equal(sanitized.schemaVersion, 'onboarding-v1');
  assert.equal(sanitized.activeMilestoneId, 'M0_life_start');
});
