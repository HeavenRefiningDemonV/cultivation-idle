import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildSection5ReadinessSurface,
  buildSection5StatusSurface,
} from '../../src/systems/readiness/index.js';
import { createDefaultTrialProgress, useTrialStore } from '../../src/stores/trialStore.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useTechCollectionStore } from '../../src/stores/techCollectionStore.js';
import { useTechniqueStore } from '../../src/stores/techniqueStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';
import { getValidatedEconomicContent, primeContentStore, resetEconomicRuntimeStores } from '../helpers/economy/setupEconomicRuntimeScenario.js';

let contentPromise: ReturnType<typeof getValidatedEconomicContent> | null = null;

async function getContent() {
  if (!contentPromise) contentPromise = getValidatedEconomicContent();
  return contentPromise;
}

function resetSection4SurfaceStores() {
  resetEconomicRuntimeStores();
  useGameStore.getState().hardResetGameState();
  useTechniqueStore.getState().resetLoadouts();
  useTechCollectionStore.getState().hardReset();
  useTrialStore.getState().hardResetTrials();
  useUIStore.getState().hardResetUI();
  useContentStore.setState({
    raw: null,
    economy: null,
    isLoaded: false,
    isLoading: false,
    error: null,
    citiesSorted: [],
    techniquesByPath: { heaven: [], earth: [], martial: [] },
    maps: {
      citiesById: {},
      itemsById: {},
      techniquesById: {},
      pavilionsById: {},
      outskirtsById: {},
      enemiesById: {},
      trialsById: {},
      trialsByCityId: {},
      ruinsById: {},
      runesById: {},
      heartLawsById: {},
      prestigeUpgradesById: {},
      apothecariesById: {},
      apothecariesByCityId: {},
    },
  });
}

async function primeSection4SurfaceRuntime() {
  const content = await getContent();
  resetSection4SurfaceStores();
  primeContentStore(content);
  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);
  useGameStore.setState((state) => ({
    ...state,
    selectedPath: 'heaven',
    realm: { ...state.realm, substage: 9 },
    qi: '100',
  }));
}

function createAttemptSummary(overrides: Record<string, unknown> = {}) {
  return {
    trialId: 'trial_novices_clearing',
    startedAt: 0,
    endedAt: 10_000,
    durationSec: 10,
    bossHpPct: 60,
    maxHit: 100,
    maxHitLabel: 'Boss hit',
    suggestions: [] as string[],
    ...overrides,
  };
}

test.beforeEach(() => {
  resetSection4SurfaceStores();
});

test('packet 4.14 section-5 readiness adapter surfaces live diagnosis output', async () => {
  await primeSection4SurfaceRuntime();

  useTrialStore.setState((state) => ({
    ...state,
    progressByTrialId: {
      ...state.progressByTrialId,
      trial_novices_clearing: {
        ...createDefaultTrialProgress(),
        lastAttemptSummary: createAttemptSummary(),
      },
    },
  }));

  const surface = buildSection5ReadinessSurface('trial_novices_clearing');

  assert.notEqual(surface, null);
  assert.equal(surface?.trialId, 'trial_novices_clearing');
  assert.equal(surface?.diagnosis?.primary, 'underbuilt');
  assert.equal(surface?.suggestions.length, 0);
  assert.equal(surface?.warnings.length, surface?.readiness?.warnings.length ?? 0);
});

test('packet 4.14 section-5 status adapter surfaces current-gate diagnosis and shortfalls', async () => {
  await primeSection4SurfaceRuntime();

  useGameStore.setState((state) => ({ ...state, qi: '1000000' }));
  useTrialStore.setState((state) => ({
    ...state,
    progressByTrialId: {
      ...state.progressByTrialId,
      trial_novices_clearing: {
        ...createDefaultTrialProgress(),
        eligibleFailures: 3,
        lastAttemptSummary: createAttemptSummary({ bossHpPct: 35, durationSec: 12 }),
      },
    },
  }));

  const status = buildSection5StatusSurface();

  assert.equal(status.currentGateTrialId, 'trial_novices_clearing');
  assert.notEqual(status.overallBand, null);
  assert.equal(status.currentDiagnosis?.secondary, 'bypassAvailable');
  assert.equal(status.topShortfallCodes.length > 0, true);
});
