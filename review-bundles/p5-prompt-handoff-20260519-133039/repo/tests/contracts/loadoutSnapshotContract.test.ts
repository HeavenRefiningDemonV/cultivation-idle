import assert from 'node:assert/strict';
import test from 'node:test';

import { buildLoadoutSnapshotFromLoadout, type LoadoutSnapshotSource } from '../../src/systems/builds/index.js';

const sampleLoadout = {
  id: 'loadout_alpha',
  aiProfile: 'balanced',
  castingPolicy: 'balanced',
  slots: {
    active: ['tech_a', '', 'tech_c', 'tech_d'],
    passive: ['', 'tech_p2', 'tech_p3'],
    ultimate: 'tech_u',
  },
} as const;

const cloneLoadout = (loadout: typeof sampleLoadout): LoadoutSnapshotSource => ({
  id: loadout.id,
  aiProfile: loadout.aiProfile,
  castingPolicy: loadout.castingPolicy,
  slots: {
    active: [...loadout.slots.active],
    passive: [...loadout.slots.passive],
    ultimate: loadout.slots.ultimate,
  },
});

test('packet 4.7 Qi Condensation snapshot distinguishes equipped-now from parked future-slot assignments', () => {
  const snapshot = buildLoadoutSnapshotFromLoadout({
    loadout: cloneLoadout(sampleLoadout),
    realmIndex: 0,
    activeBonusSlots: 0,
    passiveBonusSlots: 0,
  });

  assert.equal(snapshot.loadoutId, 'loadout_alpha');
  assert.equal(snapshot.aiProfile, 'balanced');
  assert.equal(snapshot.castingPolicy, 'balanced');
  assert.deepEqual(snapshot.displayed, { active: 4, passive: 3 });
  assert.deepEqual(snapshot.unlocked, { active: 2, passive: 1, ultimate: false });
  assert.deepEqual(snapshot.equipped, { active: ['tech_a'], passive: [], ultimate: null });
  assert.deepEqual(snapshot.filled, { active: 1, passive: 0, ultimate: 0 });
  assert.deepEqual(snapshot.emptyUnlockedSlots, [
    { slotType: 'active', slotIndex: 1 },
    { slotType: 'passive', slotIndex: 0 },
  ]);
  assert.equal(snapshot.emptyUnlockedCount, 2);
  assert.deepEqual(snapshot.parkedLockedAssignments, [
    { slotType: 'active', slotIndex: 2, techId: 'tech_c' },
    { slotType: 'active', slotIndex: 3, techId: 'tech_d' },
    { slotType: 'passive', slotIndex: 1, techId: 'tech_p2' },
    { slotType: 'passive', slotIndex: 2, techId: 'tech_p3' },
    { slotType: 'ultimate', slotIndex: 0, techId: 'tech_u' },
  ]);
});

test('packet 4.7 Spirit Severing snapshot surfaces all stored assignments as equipped and leaves no parked entries', () => {
  const snapshot = buildLoadoutSnapshotFromLoadout({
    loadout: cloneLoadout(sampleLoadout),
    realmIndex: 5,
    activeBonusSlots: 0,
    passiveBonusSlots: 0,
  });

  assert.deepEqual(snapshot.unlocked, { active: 4, passive: 3, ultimate: true });
  assert.deepEqual(snapshot.equipped, {
    active: ['tech_a', 'tech_c', 'tech_d'],
    passive: ['tech_p2', 'tech_p3'],
    ultimate: 'tech_u',
  });
  assert.deepEqual(snapshot.filled, { active: 3, passive: 2, ultimate: 1 });
  assert.deepEqual(snapshot.parkedLockedAssignments, []);
});

test('packet 4.7 active bonus overlays remove parked active assignments honestly', () => {
  const snapshot = buildLoadoutSnapshotFromLoadout({
    loadout: cloneLoadout(sampleLoadout),
    realmIndex: 0,
    activeBonusSlots: 2,
    passiveBonusSlots: 0,
  });

  assert.deepEqual(snapshot.unlocked, { active: 4, passive: 1, ultimate: false });
  assert.deepEqual(snapshot.equipped.active, ['tech_a', 'tech_c', 'tech_d']);
  assert.equal(snapshot.filled.active, 3);
  assert.deepEqual(snapshot.parkedLockedAssignments, [
    { slotType: 'passive', slotIndex: 1, techId: 'tech_p2' },
    { slotType: 'passive', slotIndex: 2, techId: 'tech_p3' },
    { slotType: 'ultimate', slotIndex: 0, techId: 'tech_u' },
  ]);
});

test('packet 4.7 pure snapshot builder normalizes short arrays safely without mutating input', () => {
  const shortLoadout = {
    id: 'loadout_short',
    aiProfile: 'survivor',
    castingPolicy: 'defensive',
    slots: {
      active: ['tech_a'],
      passive: [],
      ultimate: null,
    },
  } as const;

  const snapshot = buildLoadoutSnapshotFromLoadout({
    loadout: {
      id: shortLoadout.id,
      aiProfile: shortLoadout.aiProfile,
      castingPolicy: shortLoadout.castingPolicy,
      slots: {
        active: [...shortLoadout.slots.active],
        passive: [...shortLoadout.slots.passive],
        ultimate: shortLoadout.slots.ultimate,
      },
    },
    realmIndex: 5,
    activeBonusSlots: 0,
    passiveBonusSlots: 0,
  });

  assert.deepEqual(snapshot.equipped, {
    active: ['tech_a'],
    passive: [],
    ultimate: null,
  });
  assert.deepEqual(snapshot.filled, { active: 1, passive: 0, ultimate: 0 });
  assert.equal(snapshot.emptyUnlockedCount, 7);
  assert.equal(shortLoadout.slots.active.length, 1);
  assert.equal(shortLoadout.slots.passive.length, 0);
});
