import assert from 'node:assert/strict';
import test from 'node:test';

import { buildTechniqueLoadoutSnapshot } from '../../src/systems/builds/index.js';
import type { TechniqueLoadout } from '../../src/stores/techniqueStore.js';

function makeLoadout(overrides?: Partial<TechniqueLoadout>): TechniqueLoadout {
  return {
    id: 'loadout_1',
    name: 'Loadout 1',
    aiProfile: 'balanced',
    castingPolicy: 'balanced',
    slots: {
      active: ['tech_a', 'tech_b', 'tech_c'],
      passive: ['tech_p', 'tech_q'],
      ultimate: 'tech_u',
    },
    ...overrides,
  };
}

test('loadout snapshot keeps selected loadout semantics and clamps combat-facing equips to semester truth', () => {
  const snapshot = buildTechniqueLoadoutSnapshot({
    loadouts: [makeLoadout()],
    selectedLoadoutId: 'loadout_1',
    activeSlots: 2,
    passiveSlots: 1,
    realmIndex: 0,
  });

  assert.equal(snapshot.selectedLoadoutId, 'loadout_1');
  assert.equal(snapshot.aiProfile, 'balanced');
  assert.equal(snapshot.castingPolicy, 'balanced');
  assert.deepEqual(snapshot.equippedTechIds, {
    active: ['tech_a', 'tech_b', 'tech_c'],
    passive: ['tech_p', 'tech_q'],
    ultimate: 'tech_u',
  });
  assert.deepEqual(snapshot.combatEquippedTechIds, {
    active: ['tech_a', 'tech_b'],
    passive: ['tech_p'],
    ultimate: null,
  });
});

test('loadout snapshot degrades safely when the selected loadout is missing', () => {
  const snapshot = buildTechniqueLoadoutSnapshot({
    loadouts: [],
    selectedLoadoutId: 'missing_loadout',
    activeSlots: 2,
    passiveSlots: 1,
    realmIndex: 0,
  });

  assert.equal(snapshot.selectedLoadoutId, null);
  assert.equal(snapshot.loadoutId, null);
  assert.equal(snapshot.aiProfile, 'balanced');
  assert.equal(snapshot.castingPolicy, 'balanced');
  assert.deepEqual(snapshot.equippedTechIds, {
    active: ['', '', ''],
    passive: ['', ''],
    ultimate: null,
  });
  assert.deepEqual(snapshot.combatEquippedTechIds, {
    active: [],
    passive: [],
    ultimate: null,
  });
});
