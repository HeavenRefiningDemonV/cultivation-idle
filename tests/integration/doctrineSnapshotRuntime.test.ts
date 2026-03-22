import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDoctrineSnapshot,
  getDoctrineSnapshotWarnings,
} from '../../src/systems/doctrine/index.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { usePrestigeStore } from '../../src/stores/prestigeStore.js';
import {
  BASE_ACTIVE_SLOTS,
  BASE_PASSIVE_SLOTS,
  useTechniqueStore,
} from '../../src/stores/techniqueStore.js';

function resetDoctrineRuntimeStores() {
  useGameStore.getState().hardResetGameState();
  useCultivationStore.getState().resetForNewLife();
  usePrestigeStore.getState().hardResetPrestige();
  useCityStore.getState().hardResetCity();
  useTechniqueStore.setState({
    activeSlots: BASE_ACTIVE_SLOTS,
    passiveSlots: BASE_PASSIVE_SLOTS,
  });
  useTechniqueStore.getState().resetLoadouts();
}

test.beforeEach(() => {
  resetDoctrineRuntimeStores();
});

test('doctrine snapshot reads realistic runtime state without mutating source stores', () => {
  useGameStore.setState((state) => ({
    ...state,
    selectedPath: 'earth',
    focusMode: 'spirit',
    realm: { ...state.realm, index: 4, substage: 2 },
  }));
  useCultivationStore.setState((state) => ({
    ...state,
    selectedHeartLawId: 'heartlaw_flame',
    chapter: 4,
    breathMode: 'fast',
  }));
  usePrestigeStore.setState((state) => ({
    ...state,
    spiritRoot: { grade: 5, element: 'wood', purity: 88 },
  }));
  useCityStore.setState((state) => ({
    ...state,
    currentCityId: 'city_lotusford',
    unlockedCityIds: ['city_pinewind_hamlet', 'city_lotusford'],
  }));
  useTechniqueStore.getState().setSelectedLoadout('loadout_2');
  useTechniqueStore.getState().setAiProfile('loadout_2', 'burst');
  useTechniqueStore.getState().setCastingPolicy('loadout_2', 'aggressive');

  const before = {
    selectedPath: useGameStore.getState().selectedPath,
    focusMode: useGameStore.getState().focusMode,
    realmIndex: useGameStore.getState().realm.index,
    heartLawId: useCultivationStore.getState().selectedHeartLawId,
    chapter: useCultivationStore.getState().chapter,
    breathMode: useCultivationStore.getState().breathMode,
    spiritRoot: structuredClone(usePrestigeStore.getState().spiritRoot),
    selectedLoadoutId: useTechniqueStore.getState().selectedLoadoutId,
    aiProfile: useTechniqueStore.getState().getSelectedAiProfile(),
    castingPolicy: useTechniqueStore.getState().getSelectedCastingPolicy(),
    currentCityId: useCityStore.getState().currentCityId,
    unlockedCityIds: [...useCityStore.getState().unlockedCityIds],
  };

  const snapshot = buildDoctrineSnapshot();

  assert.deepEqual(snapshot, {
    path: 'earth',
    focusMode: 'spirit',
    spiritRoot: { grade: 5, element: 'wood', purity: 88 },
    heartLawId: 'heartlaw_flame',
    heartLawChapter: 4,
    breathMode: 'fast',
    selectedLoadoutId: 'loadout_2',
    aiProfile: 'burst',
    castingPolicy: 'aggressive',
    realmIndex: 4,
    majorRealmId: 'soul_formation',
    cityId: 'city_lotusford',
  });

  assert.deepEqual(
    {
      selectedPath: useGameStore.getState().selectedPath,
      focusMode: useGameStore.getState().focusMode,
      realmIndex: useGameStore.getState().realm.index,
      heartLawId: useCultivationStore.getState().selectedHeartLawId,
      chapter: useCultivationStore.getState().chapter,
      breathMode: useCultivationStore.getState().breathMode,
      spiritRoot: structuredClone(usePrestigeStore.getState().spiritRoot),
      selectedLoadoutId: useTechniqueStore.getState().selectedLoadoutId,
      aiProfile: useTechniqueStore.getState().getSelectedAiProfile(),
      castingPolicy: useTechniqueStore.getState().getSelectedCastingPolicy(),
      currentCityId: useCityStore.getState().currentCityId,
      unlockedCityIds: [...useCityStore.getState().unlockedCityIds],
    },
    before,
  );
});

test('post-prestige baseline still yields a safe doctrine snapshot', () => {
  useGameStore.getState().hardResetGameState();
  useCultivationStore.getState().resetForNewLife();
  usePrestigeStore.getState().hardResetPrestige();
  useCityStore.getState().hardResetCity();
  useTechniqueStore.setState({
    activeSlots: BASE_ACTIVE_SLOTS,
    passiveSlots: BASE_PASSIVE_SLOTS,
  });
  useTechniqueStore.getState().resetLoadouts();

  const snapshot = buildDoctrineSnapshot();
  const warnings = getDoctrineSnapshotWarnings(snapshot);

  assert.deepEqual(snapshot, {
    path: null,
    focusMode: 'balanced',
    spiritRoot: null,
    heartLawId: null,
    heartLawChapter: 1,
    breathMode: 'balanced',
    selectedLoadoutId: 'loadout_1',
    aiProfile: 'balanced',
    castingPolicy: 'balanced',
    realmIndex: 0,
    majorRealmId: 'qi_condensation',
    cityId: null,
  });
  assert.deepEqual(warnings, {
    missingPath: true,
    missingHeartLaw: true,
    missingLoadout: false,
    missingSpiritRoot: true,
  });
});
