import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { buildLoadoutSnapshot } from '../../src/systems/builds/index.js';
import { GameEvents } from '../../src/services/events/GameEvents.js';
import { BASE_ACTIVE_SLOTS, BASE_PASSIVE_SLOTS, useTechniqueStore } from '../../src/stores/techniqueStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { applyPrestigeDerivedUnlocks } from '../../src/systems/prestige/applyPrestigeEffects.js';

const setRealmIndex = (realmIndex: number) => {
  useGameStore.setState((state) => ({
    ...state,
    realm: {
      ...state.realm,
      index: realmIndex,
    },
  }));
};

const resetLoadoutRuntime = () => {
  useGameStore.getState().hardResetGameState();
  useTechniqueStore.getState().setSlotCounts({
    active: BASE_ACTIVE_SLOTS,
    passive: BASE_PASSIVE_SLOTS,
  });
  useTechniqueStore.getState().resetLoadouts();
};

const hydrateFullDisplayedLoadout = () => {
  useTechniqueStore.getState().hydrateFromSave({
    selectedLoadoutId: 'loadout_1',
    loadouts: [
      {
        id: 'loadout_1',
        name: 'Loadout 1',
        aiProfile: 'balanced',
        castingPolicy: 'balanced',
        slots: {
          active: ['tech_a', 'tech_b', 'tech_c', 'tech_d'],
          passive: ['tech_p1', 'tech_p2', 'tech_p3'],
          ultimate: 'tech_u',
        },
      },
      {
        id: 'loadout_2',
        name: 'Loadout 2',
        aiProfile: 'survivor',
        castingPolicy: 'defensive',
        slots: { active: ['', '', '', ''], passive: ['', '', ''], ultimate: null },
      },
      {
        id: 'loadout_3',
        name: 'Loadout 3',
        aiProfile: 'burst',
        castingPolicy: 'aggressive',
        slots: { active: ['', '', '', ''], passive: ['', '', ''], ultimate: null },
      },
    ],
  });
};

test('packet 4.7 store reset initializes 4/3 displayed loadout arrays and semester display caps', () => {
  resetLoadoutRuntime();
  setRealmIndex(0);

  const state = useTechniqueStore.getState();
  assert.equal(state.loadouts.length, 3);
  assert.equal(state.selectedLoadoutId, 'loadout_1');
  state.loadouts.forEach((loadout) => {
    assert.equal(loadout.slots.active.length, 4);
    assert.equal(loadout.slots.passive.length, 3);
  });

  const snapshot = state.getSlotProgressionSnapshot(0);
  assert.equal(snapshot.displayed.active, 4);
  assert.equal(snapshot.displayed.passive, 3);
});

test('packet 4.7 store progression follows the semester ladder across all live realms', () => {
  resetLoadoutRuntime();

  const expected = [
    { active: 2, passive: 1, ultimate: false },
    { active: 3, passive: 1, ultimate: false },
    { active: 3, passive: 2, ultimate: false },
    { active: 4, passive: 2, ultimate: false },
    { active: 4, passive: 2, ultimate: true },
    { active: 4, passive: 3, ultimate: true },
  ];

  expected.forEach((unlocked, realmIndex) => {
    setRealmIndex(realmIndex);
    assert.deepEqual(useTechniqueStore.getState().getSlotProgressionSnapshot().unlocked, unlocked);
  });
});

test('packet 4.7 hydrateFromSave preserves selected loadout and expands legacy arrays to semester display caps', () => {
  resetLoadoutRuntime();

  useTechniqueStore.getState().hydrateFromSave({
    selectedLoadoutId: 'loadout_2',
    loadouts: [
      {
        id: 'loadout_1',
        name: 'Loadout 1',
        aiProfile: 'balanced',
        castingPolicy: 'balanced',
        slots: { active: ['a1', 'a2', 'a3'], passive: ['p1', 'p2'], ultimate: null },
      },
      {
        id: 'loadout_2',
        name: 'Loadout 2',
        aiProfile: 'survivor',
        slots: { active: ['b1', 'b2', 'b3'], passive: ['q1', 'q2'], ultimate: 'ult_b' },
      },
    ],
  });

  const state = useTechniqueStore.getState();
  assert.equal(state.selectedLoadoutId, 'loadout_2');
  const hydrated = state.loadouts.find((loadout) => loadout.id === 'loadout_2');
  assert.ok(hydrated);
  assert.equal(hydrated.slots.active.length, 4);
  assert.equal(hydrated.slots.passive.length, 3);
  assert.deepEqual(hydrated.slots.active.slice(0, 3), ['b1', 'b2', 'b3']);
  assert.deepEqual(hydrated.slots.passive.slice(0, 2), ['q1', 'q2']);
});

test('packet 4.7 getCombatEquippedTechIds is honest about currently unlocked techniques while displayed arrays preserve parked assignments', () => {
  resetLoadoutRuntime();
  hydrateFullDisplayedLoadout();

  setRealmIndex(0);
  assert.deepEqual(useTechniqueStore.getState().getEquippedTechIds('loadout_1'), {
    active: ['tech_a', 'tech_b', 'tech_c', 'tech_d'],
    passive: ['tech_p1', 'tech_p2', 'tech_p3'],
    ultimate: 'tech_u',
  });
  assert.deepEqual(useTechniqueStore.getState().getCombatEquippedTechIds('loadout_1'), {
    active: ['tech_a', 'tech_b'],
    passive: ['tech_p1'],
    ultimate: null,
  });

  setRealmIndex(4);
  assert.deepEqual(useTechniqueStore.getState().getCombatEquippedTechIds('loadout_1'), {
    active: ['tech_a', 'tech_b', 'tech_c', 'tech_d'],
    passive: ['tech_p1', 'tech_p2'],
    ultimate: 'tech_u',
  });
});

test('packet 4.7 store-backed loadout snapshot wrapper exposes parked locked assignments honestly', () => {
  resetLoadoutRuntime();
  hydrateFullDisplayedLoadout();

  setRealmIndex(0);
  assert.deepEqual(buildLoadoutSnapshot('loadout_1').filled, { active: 2, passive: 1, ultimate: 0 });
  assert.deepEqual(buildLoadoutSnapshot('loadout_1').parkedLockedAssignments, [
    { slotType: 'active', slotIndex: 2, techId: 'tech_c' },
    { slotType: 'active', slotIndex: 3, techId: 'tech_d' },
    { slotType: 'passive', slotIndex: 1, techId: 'tech_p2' },
    { slotType: 'passive', slotIndex: 2, techId: 'tech_p3' },
    { slotType: 'ultimate', slotIndex: 0, techId: 'tech_u' },
  ]);

  setRealmIndex(4);
  assert.deepEqual(buildLoadoutSnapshot('loadout_1').filled, { active: 4, passive: 2, ultimate: 1 });
  assert.deepEqual(buildLoadoutSnapshot('loadout_1').parkedLockedAssignments, [
    { slotType: 'passive', slotIndex: 2, techId: 'tech_p3' },
  ]);
});

test('packet 4.7 buildLoadoutSnapshot wrapper is safe when the store has no loadouts', () => {
  resetLoadoutRuntime();
  setRealmIndex(0);
  useTechniqueStore.setState((state) => ({
    ...state,
    loadouts: [],
    selectedLoadoutId: 'default',
  }));

  assert.doesNotThrow(() => buildLoadoutSnapshot());
  const snapshot = buildLoadoutSnapshot();
  assert.equal(snapshot.loadoutId, 'default');
  assert.deepEqual(snapshot.filled, { active: 0, passive: 0, ultimate: 0 });
  assert.equal(snapshot.emptyUnlockedCount, 3);
});

test('packet 4.7 setSlotCounts clamps raw store slot counts to semester caps', () => {
  resetLoadoutRuntime();
  useTechniqueStore.getState().setSlotCounts({ active: 99, passive: 99 });

  const state = useTechniqueStore.getState();
  assert.equal(state.activeSlots, 4);
  assert.equal(state.passiveSlots, 3);
});

test('packet 4.7 setSlotCounts unlock events use unlocked-slot deltas instead of raw count deltas', () => {
  const captureUnlocks = () => {
    const seen: Array<{ slotType: string; slotIndex: number }> = [];
    const listener = (event: { type: string; payload: { slotType?: string; slotIndex?: number } }) => {
      if (event.type === 'techniques/slot_unlocked' && event.payload.slotType && typeof event.payload.slotIndex === 'number') {
        seen.push({ slotType: event.payload.slotType, slotIndex: event.payload.slotIndex });
      }
    };
    GameEvents.onAny(listener as never);
    return {
      seen,
      dispose: () => GameEvents.offAny(listener as never),
    };
  };

  resetLoadoutRuntime();
  setRealmIndex(0);
  {
    const capture = captureUnlocks();
    try {
      useTechniqueStore.getState().setSlotCounts({ active: 3 });
      assert.deepEqual(capture.seen, [{ slotType: 'active', slotIndex: 2 }]);
    } finally {
      capture.dispose();
    }
  }

  resetLoadoutRuntime();
  setRealmIndex(0);
  {
    const capture = captureUnlocks();
    try {
      useTechniqueStore.getState().setSlotCounts({ active: 4 });
      assert.deepEqual(capture.seen, [
        { slotType: 'active', slotIndex: 2 },
        { slotType: 'active', slotIndex: 3 },
      ]);
    } finally {
      capture.dispose();
    }
  }

  resetLoadoutRuntime();
  setRealmIndex(3);
  {
    const capture = captureUnlocks();
    try {
      useTechniqueStore.getState().setSlotCounts({ active: 4 });
      assert.deepEqual(capture.seen.filter((event) => event.slotType === 'active'), []);
    } finally {
      capture.dispose();
    }
  }
});

test('packet 4.7 prestige bridge remains active-only and clamps safely', () => {
  resetLoadoutRuntime();
  setRealmIndex(0);

  applyPrestigeDerivedUnlocks({
    extraTechniqueSlots: 99,
    expeditionSlots: 0,
    unlockedHeartLawIds: [],
  });

  const state = useTechniqueStore.getState();
  assert.equal(state.activeSlots, 4);
  assert.equal(state.passiveSlots, 1);
  assert.equal(state.getSlotProgressionSnapshot(0).unlocked.active, 4);
  assert.equal(state.getSlotProgressionSnapshot(0).unlocked.passive, 1);
});

test('packet 4.7 source guard proves the old inline ladder is gone from techniqueStore', async () => {
  const source = await fs.readFile(path.join(process.cwd(), 'src/stores/techniqueStore.ts'), 'utf8');

  assert.equal(source.includes('resolveLoadoutProgressionSnapshot'), true);
  assert.equal(source.includes('getSlotUnlockRequirementForProgression'), true);
  assert.equal(source.includes('MIN_DISPLAY_ACTIVE_SLOTS'), false);
  assert.equal(source.includes('MIN_DISPLAY_PASSIVE_SLOTS'), false);
  assert.equal(source.includes('const baselineUnlockedActive = realmIndex >= 1 ? 3 : 2'), false);
  assert.equal(source.includes('const baselineUnlockedPassive = realmIndex >= 2 ? 2 : 1'), false);
  assert.equal(source.includes('const ultimateUnlocked = realmIndex >= 3'), false);
});
