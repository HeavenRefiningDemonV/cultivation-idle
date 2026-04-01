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

test('mid-run snapshot reflects realistic runtime state without mutating source stores', () => {
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

  assert.equal(snapshot.path, 'earth');
  assert.equal(snapshot.focusMode, 'spirit');
  assert.deepEqual(snapshot.spiritRoot, { grade: 5, element: 'wood', purity: 88 });
  assert.deepEqual(snapshot.spiritRootSummary, { grade: 5, element: 'wood', purity: 88 });
  assert.equal(snapshot.heartLawId, 'heartlaw_flame');
  assert.equal(snapshot.heartLawChapter, 4);
  assert.equal(snapshot.breathMode, 'fast');
  assert.equal(snapshot.selectedLoadoutId, 'loadout_2');
  assert.equal(snapshot.aiProfile, 'burst');
  assert.equal(snapshot.castingPolicy, 'aggressive');
  assert.equal(snapshot.realmIndex, 4);
  assert.equal(snapshot.majorRealmId, 'soul_formation');
  assert.equal(snapshot.cityId, 'city_lotusford');

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

test('switching breath mode updates snapshot without store mutation side effects', () => {
  useCultivationStore.getState().setBreathMode('safe');
  const safeSnapshot = buildDoctrineSnapshot();
  useCultivationStore.getState().setBreathMode('fast');
  const fastSnapshot = buildDoctrineSnapshot();

  assert.equal(safeSnapshot.breathMode, 'safe');
  assert.equal(fastSnapshot.breathMode, 'fast');
  assert.equal(useCultivationStore.getState().breathMode, 'fast');
});

test('switching focus mode updates snapshot without store mutation side effects', () => {
  useGameStore.getState().setFocusMode('body');
  const bodySnapshot = buildDoctrineSnapshot();
  useGameStore.getState().setFocusMode('spirit');
  const spiritSnapshot = buildDoctrineSnapshot();

  assert.equal(bodySnapshot.focusMode, 'body');
  assert.equal(spiritSnapshot.focusMode, 'spirit');
  assert.equal(useGameStore.getState().focusMode, 'spirit');
});

test('switching loadout and policy fields is reflected in snapshot', () => {
  useTechniqueStore.getState().setSelectedLoadout('loadout_3');
  useTechniqueStore.getState().setAiProfile('loadout_3', 'survivor');
  useTechniqueStore.getState().setCastingPolicy('loadout_3', 'defensive');

  const snapshot = buildDoctrineSnapshot();

  assert.equal(snapshot.selectedLoadoutId, 'loadout_3');
  assert.equal(snapshot.aiProfile, 'survivor');
  assert.equal(snapshot.castingPolicy, 'defensive');
  assert.equal(getDoctrineSnapshotWarnings(snapshot).invalidLoadoutFallback, false);
});

test('city unlock and manual travel are reflected in snapshot', () => {
  useCityStore.setState((state) => ({
    ...state,
    unlockedCityIds: ['city_pinewind_hamlet', 'city_lotusford'],
    currentCityId: 'city_lotusford',
  }));

  const traveledSnapshot = buildDoctrineSnapshot();
  assert.equal(traveledSnapshot.cityId, 'city_lotusford');

  useCityStore.setState((state) => ({
    ...state,
    currentCityId: 'city_pinewind_hamlet',
  }));
  const returnedSnapshot = buildDoctrineSnapshot();
  assert.equal(returnedSnapshot.cityId, 'city_pinewind_hamlet');
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

  assert.equal(snapshot.path, null);
  assert.equal(snapshot.focusMode, 'balanced');
  assert.equal(snapshot.spiritRoot, null);
  assert.equal(snapshot.spiritRootSummary, null);
  assert.equal(snapshot.heartLawId, null);
  assert.equal(snapshot.heartLawChapter, 1);
  assert.equal(snapshot.breathMode, 'balanced');
  assert.equal(snapshot.selectedLoadoutId, 'loadout_1');
  assert.equal(snapshot.aiProfile, 'balanced');
  assert.equal(snapshot.castingPolicy, 'balanced');
  assert.equal(snapshot.realmIndex, 0);
  assert.equal(snapshot.majorRealmId, 'qi_condensation');
  assert.equal(snapshot.cityId, null);

  assert.deepEqual(warnings, {
    missingPath: true,
    missingHeartLaw: true,
    missingSpiritRoot: true,
    missingLoadout: false,
    missingCity: true,
    clampedRealmIndex: false,
    invalidCityFiltered: false,
    invalidLoadoutFallback: false,
    invalidHeartLawProfile: false,
  });
});
