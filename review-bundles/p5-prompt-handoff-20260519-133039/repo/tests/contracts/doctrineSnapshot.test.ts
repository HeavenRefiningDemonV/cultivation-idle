import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDoctrineSnapshot,
  getDoctrineSnapshotWarnings,
  getDoctrineSourceFlags,
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

const VALID_AI_PROFILES = ['balanced', 'survivor', 'burst', 'farmer'];
const VALID_CASTING_POLICIES = ['aggressive', 'balanced', 'defensive'];

function resetDoctrineStores() {
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
  resetDoctrineStores();
});

test('fresh-life doctrine snapshot is safe and structurally complete', () => {
  const snapshot = buildDoctrineSnapshot();
  const flags = getDoctrineSourceFlags(snapshot);
  const warnings = getDoctrineSnapshotWarnings(snapshot);

  assert.equal(snapshot.path, null);
  assert.equal(snapshot.heartLawId, null);
  assert.equal(snapshot.spiritRoot, null);
  assert.equal(snapshot.selectedLoadoutId, 'loadout_1');
  assert.ok(VALID_AI_PROFILES.includes(snapshot.aiProfile));
  assert.ok(VALID_CASTING_POLICIES.includes(snapshot.castingPolicy));
  assert.equal(snapshot.realmIndex, 0);
  assert.equal(snapshot.majorRealmId, 'qi_condensation');

  assert.deepEqual(flags, {
    hasPath: false,
    hasHeartLaw: false,
    hasSpiritRoot: false,
    hasLoadout: true,
    hasCity: false,
  });
  assert.deepEqual(warnings, {
    missingPath: true,
    missingHeartLaw: true,
    missingSpiritRoot: true,
    missingLoadout: false,
  });
});

test('doctrine snapshot clamps realm indices to the semester slice', () => {
  useGameStore.setState((state) => ({
    ...state,
    realm: { ...state.realm, index: 999 },
  }));

  let snapshot = buildDoctrineSnapshot();
  assert.equal(snapshot.realmIndex, 5);
  assert.equal(snapshot.majorRealmId, 'spirit_severing');

  useGameStore.setState((state) => ({
    ...state,
    realm: { ...state.realm, index: -7 },
  }));

  snapshot = buildDoctrineSnapshot();
  assert.equal(snapshot.realmIndex, 0);
  assert.equal(snapshot.majorRealmId, 'qi_condensation');
});

test('mid-run doctrine snapshot mirrors normalized live state', () => {
  useGameStore.setState((state) => ({
    ...state,
    selectedPath: 'earth',
    focusMode: 'body',
    realm: { ...state.realm, index: 2 },
  }));
  useCultivationStore.setState((state) => ({
    ...state,
    selectedHeartLawId: 'heartlaw_flame',
    chapter: 3,
    breathMode: 'safe',
  }));
  usePrestigeStore.setState((state) => ({
    ...state,
    spiritRoot: { grade: 4, element: 'earth', purity: 72 },
  }));
  useCityStore.setState((state) => ({
    ...state,
    currentCityId: 'city_spirit_cavern_city',
    unlockedCityIds: ['city_pinewind_hamlet', 'city_spirit_cavern_city'],
  }));
  useTechniqueStore.getState().setSelectedLoadout('loadout_3');
  useTechniqueStore.getState().setAiProfile('loadout_3', 'survivor');
  useTechniqueStore.getState().setCastingPolicy('loadout_3', 'defensive');

  const snapshot = buildDoctrineSnapshot();

  assert.deepEqual(snapshot, {
    path: 'earth',
    focusMode: 'body',
    spiritRoot: { grade: 4, element: 'earth', purity: 72 },
    heartLawId: 'heartlaw_flame',
    heartLawChapter: 3,
    breathMode: 'safe',
    selectedLoadoutId: 'loadout_3',
    aiProfile: 'survivor',
    castingPolicy: 'defensive',
    realmIndex: 2,
    majorRealmId: 'core_formation',
    cityId: 'city_spirit_cavern_city',
  });
});

test('missing selected loadout degrades safely to null with balanced defaults', () => {
  useTechniqueStore.setState((state) => ({
    ...state,
    loadouts: [],
    selectedLoadoutId: 'missing_loadout',
  }));

  const snapshot = buildDoctrineSnapshot();
  const flags = getDoctrineSourceFlags(snapshot);
  const warnings = getDoctrineSnapshotWarnings(snapshot);

  assert.equal(snapshot.selectedLoadoutId, null);
  assert.equal(snapshot.aiProfile, 'balanced');
  assert.equal(snapshot.castingPolicy, 'balanced');
  assert.equal(flags.hasLoadout, false);
  assert.equal(warnings.missingLoadout, true);
});

test('invalid city ids never leak into the doctrine snapshot', () => {
  useCityStore.setState((state) => ({
    ...state,
    currentCityId: '',
    unlockedCityIds: [],
  }));
  assert.equal(buildDoctrineSnapshot().cityId, null);

  useCityStore.setState((state) => ({
    ...state,
    currentCityId: 'city_future_unknown',
    unlockedCityIds: ['city_future_unknown'],
  }));
  assert.equal(buildDoctrineSnapshot().cityId, null);

  useCityStore.setState((state) => ({
    ...state,
    currentCityId: 'city_lotusford',
    unlockedCityIds: ['city_pinewind_hamlet'],
  }));
  assert.equal(buildDoctrineSnapshot().cityId, null);
});

test('doctrine flags and warnings are pure deterministic derivations of the snapshot', () => {
  useGameStore.setState((state) => ({
    ...state,
    selectedPath: 'martial',
  }));
  useCultivationStore.setState((state) => ({
    ...state,
    selectedHeartLawId: 'heartlaw_stone',
  }));
  usePrestigeStore.setState((state) => ({
    ...state,
    spiritRoot: { grade: 3, element: 'metal', purity: 60 },
  }));
  useCityStore.setState((state) => ({
    ...state,
    currentCityId: 'city_pinewind_hamlet',
    unlockedCityIds: ['city_pinewind_hamlet'],
  }));

  const snapshot = buildDoctrineSnapshot();
  const flagsA = getDoctrineSourceFlags(snapshot);
  const flagsB = getDoctrineSourceFlags(snapshot);
  const warningsA = getDoctrineSnapshotWarnings(snapshot);
  const warningsB = getDoctrineSnapshotWarnings(snapshot);

  assert.deepEqual(flagsA, flagsB);
  assert.deepEqual(warningsA, warningsB);
  assert.deepEqual(flagsA, {
    hasPath: snapshot.path !== null,
    hasHeartLaw: snapshot.heartLawId !== null,
    hasSpiritRoot: snapshot.spiritRoot !== null,
    hasLoadout: snapshot.selectedLoadoutId !== null,
    hasCity: snapshot.cityId !== null,
  });
  assert.deepEqual(warningsA, {
    missingPath: snapshot.path === null,
    missingHeartLaw: snapshot.heartLawId === null,
    missingLoadout: snapshot.selectedLoadoutId === null,
    missingSpiritRoot: snapshot.spiritRoot === null,
  });
});
