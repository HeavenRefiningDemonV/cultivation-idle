import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDoctrineSnapshot,
  getDoctrineSnapshotWarnings,
  getDoctrineSourceFlags,
} from '../../src/systems/doctrine/index.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
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

function seedHeartLawCatalog() {
  useContentStore.setState((state) => ({
    ...state,
    isLoaded: true,
    raw: {
      ...(state.raw ?? {}),
      heart_laws: [
        {
          id: 'heart_ember_thread_sutra',
          name: 'Flame Sutra',
          tier: 'starter',
          archetype: 'offense',
          daoTags: ['flame'],
          spiritRootAffinities: ['fire'],
          signature: [],
          chapters: [],
        },
      ],
      heart_law_affinity_rules: null,
    } as any,
  }));
}

function resetDoctrineStores() {
  useContentStore.getState().clearLoadedContent();
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

test('safe fresh baseline snapshot is structurally complete with deterministic metadata', () => {
  const snapshot = buildDoctrineSnapshot();
  const flags = getDoctrineSourceFlags(snapshot);
  const warnings = getDoctrineSnapshotWarnings(snapshot);

  assert.equal(snapshot.path, null);
  assert.equal(snapshot.focusSemantics?.label, 'Balanced');
  assert.equal(snapshot.heartLawId, null);
  assert.equal(snapshot.heartLawName, null);
  assert.equal(snapshot.heartLawFamily, null);
  assert.equal(snapshot.spiritRoot, null);
  assert.equal(snapshot.spiritRootSummary, null);
  assert.equal(snapshot.breathSemantics?.label, 'Balanced');
  assert.ok(snapshot.modePosture);
  assert.equal(snapshot.selectedLoadoutId, 'loadout_1');
  assert.ok(VALID_AI_PROFILES.includes(snapshot.aiProfile));
  assert.ok(VALID_CASTING_POLICIES.includes(snapshot.castingPolicy));
  assert.equal(snapshot.realmIndex, 0);
  assert.equal(snapshot.majorRealmId, 'qi_condensation');
  assert.equal(snapshot.cityId, null);

  assert.deepEqual(flags, snapshot.sourceFlags);
  assert.deepEqual(warnings, snapshot.warnings);
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
    missingCity: true,
    clampedRealmIndex: false,
    invalidCityFiltered: false,
    invalidLoadoutFallback: false,
    invalidHeartLawProfile: false,
  });
});

test('doctrine snapshot clamps out-of-slice realm indices and sets warning', () => {
  useGameStore.setState((state) => ({
    ...state,
    realm: { ...state.realm, index: 999 },
  }));

  let snapshot = buildDoctrineSnapshot();
  assert.equal(snapshot.realmIndex, 5);
  assert.equal(snapshot.majorRealmId, 'spirit_severing');
  assert.equal(getDoctrineSnapshotWarnings(snapshot).clampedRealmIndex, true);

  useGameStore.setState((state) => ({
    ...state,
    realm: { ...state.realm, index: -7 },
  }));

  snapshot = buildDoctrineSnapshot();
  assert.equal(snapshot.realmIndex, 0);
  assert.equal(snapshot.majorRealmId, 'qi_condensation');
  assert.equal(getDoctrineSnapshotWarnings(snapshot).clampedRealmIndex, true);
});

test('invalid and non-live city ids are filtered to null with warning', () => {
  useCityStore.setState((state) => ({
    ...state,
    currentCityId: '',
    unlockedCityIds: [],
  }));
  let snapshot = buildDoctrineSnapshot();
  assert.equal(snapshot.cityId, null);
  assert.equal(getDoctrineSnapshotWarnings(snapshot).invalidCityFiltered, false);
  assert.equal(getDoctrineSnapshotWarnings(snapshot).missingCity, true);

  useCityStore.setState((state) => ({
    ...state,
    currentCityId: 'city_future_unknown',
    unlockedCityIds: ['city_future_unknown'],
  }));
  snapshot = buildDoctrineSnapshot();
  assert.equal(snapshot.cityId, null);
  assert.equal(getDoctrineSnapshotWarnings(snapshot).invalidCityFiltered, true);

  useCityStore.setState((state) => ({
    ...state,
    currentCityId: 'city_lotusford',
    unlockedCityIds: ['city_pinewind_hamlet'],
  }));
  snapshot = buildDoctrineSnapshot();
  assert.equal(snapshot.cityId, null);
  assert.equal(getDoctrineSnapshotWarnings(snapshot).invalidCityFiltered, true);
});

test('selected loadout missing falls back to null and balanced defaults with warnings', () => {
  useTechniqueStore.setState((state) => ({
    ...state,
    loadouts: [],
    selectedLoadoutId: 'missing_loadout',
  }));

  const snapshot = buildDoctrineSnapshot();

  assert.equal(snapshot.selectedLoadoutId, null);
  assert.equal(snapshot.aiProfile, 'balanced');
  assert.equal(snapshot.castingPolicy, 'balanced');
  assert.equal(getDoctrineSourceFlags(snapshot).hasLoadout, false);
  assert.equal(getDoctrineSnapshotWarnings(snapshot).missingLoadout, true);
  assert.equal(getDoctrineSnapshotWarnings(snapshot).invalidLoadoutFallback, true);
});

test('heart law selected and resolvable includes law summary fields', () => {
  seedHeartLawCatalog();
  useCultivationStore.setState((state) => ({
    ...state,
    selectedHeartLawId: 'heart_ember_thread_sutra',
    chapter: 3,
  }));

  const snapshot = buildDoctrineSnapshot();

  assert.equal(snapshot.heartLawId, 'heart_ember_thread_sutra');
  assert.equal(snapshot.heartLawChapter, 3);
  assert.equal(snapshot.heartLawName, 'Flame Sutra');
  assert.equal(snapshot.heartLawFamily, 'burst');
  assert.equal(getDoctrineSnapshotWarnings(snapshot).invalidHeartLawProfile, false);
});

test('heart law selected but unresolvable preserves id and marks invalid profile warning', () => {
  useCultivationStore.setState((state) => ({
    ...state,
    selectedHeartLawId: 'heartlaw_missing',
    chapter: 0,
  }));

  const snapshot = buildDoctrineSnapshot();

  assert.equal(snapshot.heartLawId, 'heartlaw_missing');
  assert.equal(snapshot.heartLawChapter, 1);
  assert.equal(snapshot.heartLawName, null);
  assert.equal(snapshot.heartLawFamily, null);
  assert.equal(getDoctrineSnapshotWarnings(snapshot).missingHeartLaw, false);
  assert.equal(getDoctrineSnapshotWarnings(snapshot).invalidHeartLawProfile, true);
});

test('spirit root summary mirrors live root with purity clamp', () => {
  usePrestigeStore.setState((state) => ({
    ...state,
    spiritRoot: { grade: 4, element: 'earth', purity: 250 },
  }));

  const snapshot = buildDoctrineSnapshot();

  assert.deepEqual(snapshot.spiritRoot, { grade: 4, element: 'earth', purity: 250 });
  assert.deepEqual(snapshot.spiritRootSummary, { grade: 4, element: 'earth', purity: 100 });
  assert.equal(getDoctrineSnapshotWarnings(snapshot).missingSpiritRoot, false);
});

test('source flags and warnings are deterministic pure derivations of snapshot', () => {
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
  assert.deepEqual(flagsA, snapshot.sourceFlags);
  assert.deepEqual(warningsA, snapshot.warnings);
  assert.equal(snapshot.focusSemantics?.label, 'Balanced');
  assert.equal(snapshot.breathSemantics?.label, 'Balanced');
});
