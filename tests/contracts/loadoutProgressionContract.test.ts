import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LOADOUT_PROGRESSION_ORDER,
  SEMESTER_SLOT_CAPS,
  SEMESTER_SLOT_PROGRESSION,
  getLoadoutProgressionForRealmIndex,
  getSlotUnlockRequirementForProgression,
  resolveLoadoutProgressionSnapshot,
} from '../../src/systems/builds/index.js';

test('packet 4.7 locks the exact semester ladder and slot caps', () => {
  assert.deepEqual(LOADOUT_PROGRESSION_ORDER, [
    'qi_condensation',
    'foundation_establishment',
    'core_formation',
    'nascent_soul',
    'soul_formation',
    'spirit_severing',
  ]);

  assert.deepEqual(SEMESTER_SLOT_PROGRESSION, [
    { majorRealmId: 'qi_condensation', active: 2, passive: 1, ultimate: false },
    { majorRealmId: 'foundation_establishment', active: 3, passive: 1, ultimate: false },
    { majorRealmId: 'core_formation', active: 3, passive: 2, ultimate: false },
    { majorRealmId: 'nascent_soul', active: 4, passive: 2, ultimate: false },
    { majorRealmId: 'soul_formation', active: 4, passive: 2, ultimate: true },
    { majorRealmId: 'spirit_severing', active: 4, passive: 3, ultimate: true },
  ]);

  assert.deepEqual(SEMESTER_SLOT_CAPS, { active: 4, passive: 3 });
});

test('packet 4.7 realm-index progression resolution clamps to the live semester slice', () => {
  assert.equal(getLoadoutProgressionForRealmIndex(-99).majorRealmId, 'qi_condensation');
  assert.equal(getLoadoutProgressionForRealmIndex(0).majorRealmId, 'qi_condensation');
  assert.equal(getLoadoutProgressionForRealmIndex(2).majorRealmId, 'core_formation');
  assert.equal(getLoadoutProgressionForRealmIndex(99).majorRealmId, 'spirit_severing');
});

test('packet 4.7 no-bonus progression snapshots are exact across the live semester realms', () => {
  const expected = [
    { active: 2, passive: 1, ultimate: false },
    { active: 3, passive: 1, ultimate: false },
    { active: 3, passive: 2, ultimate: false },
    { active: 4, passive: 2, ultimate: false },
    { active: 4, passive: 2, ultimate: true },
    { active: 4, passive: 3, ultimate: true },
  ];

  expected.forEach((unlocked, realmIndex) => {
    const snapshot = resolveLoadoutProgressionSnapshot({ realmIndex });
    assert.deepEqual(snapshot.unlocked, unlocked);
    assert.equal(snapshot.displayed.active, 4);
    assert.equal(snapshot.displayed.passive, 3);
  });
});

test('packet 4.7 no-bonus unlock requirements are exact at Qi Condensation', () => {
  const snapshot = resolveLoadoutProgressionSnapshot({ realmIndex: 0 });

  assert.equal(snapshot.unlockRequirements.active[0], null);
  assert.equal(snapshot.unlockRequirements.active[1], null);
  assert.deepEqual(snapshot.unlockRequirements.active[2], {
    majorRealmId: 'foundation_establishment',
    realmIndex: 1,
    realmName: 'Foundation Establishment',
    reasonText: 'Unlocks at: Foundation Establishment',
  });
  assert.deepEqual(snapshot.unlockRequirements.active[3], {
    majorRealmId: 'nascent_soul',
    realmIndex: 3,
    realmName: 'Nascent Soul',
    reasonText: 'Unlocks at: Nascent Soul',
  });

  assert.equal(snapshot.unlockRequirements.passive[0], null);
  assert.deepEqual(snapshot.unlockRequirements.passive[1], {
    majorRealmId: 'core_formation',
    realmIndex: 2,
    realmName: 'Core Formation',
    reasonText: 'Unlocks at: Core Formation',
  });
  assert.deepEqual(snapshot.unlockRequirements.passive[2], {
    majorRealmId: 'spirit_severing',
    realmIndex: 5,
    realmName: 'Spirit Severing',
    reasonText: 'Unlocks at: Spirit Severing',
  });

  assert.deepEqual(snapshot.unlockRequirements.ultimate, {
    majorRealmId: 'soul_formation',
    realmIndex: 4,
    realmName: 'Soul Formation',
    reasonText: 'Unlocks at: Soul Formation',
  });
});

test('packet 4.7 bonus-slot acceleration is exact and bonus-aware', () => {
  const activePlusOne = resolveLoadoutProgressionSnapshot({ realmIndex: 0, activeBonusSlots: 1 });
  assert.equal(activePlusOne.unlocked.active, 3);
  assert.equal(activePlusOne.unlockRequirements.active[2], null);
  assert.deepEqual(activePlusOne.unlockRequirements.active[3], {
    majorRealmId: 'foundation_establishment',
    realmIndex: 1,
    realmName: 'Foundation Establishment',
    reasonText: 'Unlocks at: Foundation Establishment',
  });

  const activePlusTwo = resolveLoadoutProgressionSnapshot({ realmIndex: 0, activeBonusSlots: 2 });
  assert.equal(activePlusTwo.unlocked.active, 4);
  assert.equal(activePlusTwo.unlockRequirements.active[3], null);

  const passivePlusOne = resolveLoadoutProgressionSnapshot({ realmIndex: 0, passiveBonusSlots: 1 });
  assert.equal(passivePlusOne.unlocked.passive, 2);
  assert.equal(passivePlusOne.unlockRequirements.passive[1], null);
  assert.deepEqual(passivePlusOne.unlockRequirements.passive[2], {
    majorRealmId: 'core_formation',
    realmIndex: 2,
    realmName: 'Core Formation',
    reasonText: 'Unlocks at: Core Formation',
  });
});

test('packet 4.7 invalid slot unlock requests safely return null', () => {
  assert.equal(getSlotUnlockRequirementForProgression({ slotType: 'active', slotIndex: -1 }), null);
  assert.equal(getSlotUnlockRequirementForProgression({ slotType: 'active', slotIndex: 99 }), null);
  assert.equal(getSlotUnlockRequirementForProgression({ slotType: 'passive', slotIndex: 99 }), null);
  assert.equal(getSlotUnlockRequirementForProgression({ slotType: 'ultimate', slotIndex: 1 }), null);
});
