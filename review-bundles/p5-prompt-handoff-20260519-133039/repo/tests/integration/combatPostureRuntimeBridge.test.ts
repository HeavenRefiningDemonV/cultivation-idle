import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCurrentCombatPostureContext,
  buildLoadoutSnapshot,
  evaluateCurrentCombatPostureFit,
} from '../../src/systems/builds/index.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useMedicinePouchStore } from '../../src/stores/medicinePouchStore.js';
import { useTechCollectionStore } from '../../src/stores/techCollectionStore.js';
import { useTechniqueStore } from '../../src/stores/techniqueStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';
import {
  primeExpeditionRuntimeStores,
  resetExpeditionRuntimeStores,
} from './expeditionRuntimeTestUtils.js';

function resetRuntimeStores() {
  resetExpeditionRuntimeStores();
  useUIStore.getState().hardResetUI();
  useTechniqueStore.getState().resetLoadouts();
  useTechCollectionStore.getState().hardReset();
  useMedicinePouchStore.getState().hardReset();
  useGameStore.getState().hardResetGameState();
}

function unlockTechniques(...techniqueIds: string[]) {
  const collection = useTechCollectionStore.getState();
  techniqueIds.forEach((techniqueId) => {
    collection.unlockTech(techniqueId);
  });
}

test.beforeEach(async () => {
  resetRuntimeStores();
  await primeExpeditionRuntimeStores();
});

test('runtime context respects the UI AI override', () => {
  const selected = useTechniqueStore.getState().selectedLoadoutId;
  useTechniqueStore.getState().setAiProfile(selected, 'survivor');
  useTechniqueStore.getState().setCastingPolicy(selected, 'defensive');
  useUIStore.getState().setSettings({
    combatAIProfile: 'farmer',
    useConsumablesInCombat: true,
  });

  const context = buildCurrentCombatPostureContext('trial');

  assert.equal(context.aiProfile, 'farmer');
  assert.equal(context.castingPolicy, 'defensive');
});

test('runtime posture respects disabled combat consumables', () => {
  useUIStore.getState().setSettings({
    combatAIProfile: 'balanced',
    useConsumablesInCombat: false,
  });

  const fit = evaluateCurrentCombatPostureFit('trial');

  assert.equal(fit.pouchFit, 'bad');
  assert.equal(fit.warnings.includes('Combat consumable auto-use is disabled.'), true);
});

test('runtime wrapper can build loadout signals from real equipped techniques', () => {
  const selected = useTechniqueStore.getState().selectedLoadoutId;
  useGameStore.setState((state) => ({
    ...state,
    realm: { ...state.realm, index: 4 },
  }));
  unlockTechniques(
    'tech_earth_dragon_vein_surge',
    'tech_earth_rooted_breath',
    'tech_earth_world_pillar_slam',
  );

  assert.deepEqual(useTechniqueStore.getState().equipTechnique('active', 0, 'tech_earth_dragon_vein_surge', selected), {
    ok: true,
  });
  assert.deepEqual(useTechniqueStore.getState().equipTechnique('passive', 0, 'tech_earth_rooted_breath', selected), {
    ok: true,
  });
  assert.deepEqual(useTechniqueStore.getState().equipTechnique('ultimate', 0, 'tech_earth_world_pillar_slam', selected), {
    ok: true,
  });

  const snapshot = buildLoadoutSnapshot(selected);
  const context = buildCurrentCombatPostureContext('trial');

  assert.deepEqual(snapshot.equipped.active, ['tech_earth_dragon_vein_surge']);
  assert.deepEqual(snapshot.equipped.passive, ['tech_earth_rooted_breath']);
  assert.equal(snapshot.equipped.ultimate, 'tech_earth_world_pillar_slam');
  assert.equal(context.loadoutSignals.hasBossTool, true);
  assert.equal(context.loadoutSignals.hasSurvivalTool, true);
});

test('runtime trial posture becomes good when the pieces are actually in place', () => {
  const selected = useTechniqueStore.getState().selectedLoadoutId;
  useGameStore.setState((state) => ({
    ...state,
    realm: { ...state.realm, index: 4 },
    selectedPath: 'earth',
  }));
  useTechniqueStore.getState().setAiProfile(selected, 'survivor');
  useTechniqueStore.getState().setCastingPolicy(selected, 'defensive');
  useUIStore.getState().setSettings({
    combatAIProfile: 'survivor',
    useConsumablesInCombat: true,
  });
  unlockTechniques(
    'tech_earth_dragon_vein_surge',
    'tech_earth_rooted_breath',
    'tech_earth_world_pillar_slam',
  );

  assert.deepEqual(useTechniqueStore.getState().equipTechnique('active', 0, 'tech_earth_dragon_vein_surge', selected), {
    ok: true,
  });
  assert.deepEqual(useTechniqueStore.getState().equipTechnique('passive', 0, 'tech_earth_rooted_breath', selected), {
    ok: true,
  });
  assert.deepEqual(useTechniqueStore.getState().equipTechnique('ultimate', 0, 'tech_earth_world_pillar_slam', selected), {
    ok: true,
  });

  useMedicinePouchStore.getState().equip('healing', 'cons_healing_pellet_t1');
  useMedicinePouchStore.getState().setSlotConfig('healing', {
    enabled: true,
    trigger: 'hpBelowPct',
    thresholdPct: 35,
    bossOnly: false,
  });
  useMedicinePouchStore.getState().equip('utility', 'cons_ward_salt_t1');
  useMedicinePouchStore.getState().setSlotConfig('utility', {
    enabled: true,
    trigger: 'fightStart',
    bossOnly: false,
  });
  useMedicinePouchStore.getState().equip('specialty', 'cons_ironblood_pellet_t1');
  useMedicinePouchStore.getState().setSlotConfig('specialty', {
    enabled: true,
    trigger: 'bossStart',
    bossOnly: true,
  });

  const fit = evaluateCurrentCombatPostureFit('trial');

  assert.equal(fit.aiFit, 'good');
  assert.equal(fit.castingFit, 'good');
  assert.equal(fit.pouchFit, 'good');
});
