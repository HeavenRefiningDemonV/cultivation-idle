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

function resetFailureDiagnosisRuntimeStores() {
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
    techniquesByPath: {
      heaven: [],
      earth: [],
      martial: [],
    },
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

async function primeFailureDiagnosisRuntime() {
  const content = await getContent();
  resetFailureDiagnosisRuntimeStores();
  primeContentStore(content);
  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);
  useGameStore.setState((state) => ({
    ...state,
    selectedPath: 'heaven',
    realm: {
      ...state.realm,
      substage: 9,
    },
    qi: '100',
  }));
  return content;
}

function makeAttemptSummary(overrides: Partial<ReturnType<typeof createAttemptSummaryFixture>> = {}) {
  return {
    ...createAttemptSummaryFixture(),
    ...overrides,
    suggestions: overrides.suggestions ?? [],
  };
}

function createAttemptSummaryFixture() {
  return {
    trialId: 'trial_novices_clearing',
    startedAt: 0,
    endedAt: 10_000,
    durationSec: 10,
    bossHpPct: 60,
    maxHit: 100,
    maxHitLabel: 'Boss hit',
    suggestions: [] as string[],
  };
}

test.beforeEach(() => {
  resetFailureDiagnosisRuntimeStores();
});

test('packet 4.14 section-5 runtime bridge diagnoses a live underbuilt gate attempt', async () => {
  await primeFailureDiagnosisRuntime();

  useTrialStore.setState((state) => ({
    ...state,
    progressByTrialId: {
      ...state.progressByTrialId,
      trial_novices_clearing: {
        ...createDefaultTrialProgress(),
        lastAttemptSummary: makeAttemptSummary(),
      },
    },
  }));

  const surface = buildSection5ReadinessSurface('trial_novices_clearing');

  assert.notEqual(surface, null);
  assert.equal(surface?.diagnosis?.primary, 'underbuilt');
  assert.equal(surface?.diagnosis?.secondary, 'underforged');
  assert.equal(surface?.diagnosis?.topFixes.some((fix) => fix.code === 'fill_slots'), true);
  assert.equal(surface?.warnings.length, surface?.readiness?.warnings.length ?? 0);
});

test('packet 4.14 section-5 status bridge exposes fail-safe bypass routing from live trial state', async () => {
  await primeFailureDiagnosisRuntime();

  useGameStore.setState((state) => ({
    ...state,
    qi: '1000000',
  }));

  useTrialStore.setState((state) => ({
    ...state,
    progressByTrialId: {
      ...state.progressByTrialId,
      trial_novices_clearing: {
        ...createDefaultTrialProgress(),
        eligibleFailures: 3,
        lastAttemptSummary: makeAttemptSummary({ bossHpPct: 35, durationSec: 12 }),
      },
    },
  }));

  const surface = buildSection5ReadinessSurface('trial_novices_clearing');
  const status = buildSection5StatusSurface();

  assert.notEqual(surface, null);
  assert.equal(surface?.diagnosis?.primary, 'underbuilt');
  assert.equal(surface?.diagnosis?.secondary, 'bypassAvailable');
  assert.equal(status.currentGateTrialId, 'trial_novices_clearing');
  assert.equal(status.currentDiagnosis?.primary, 'underbuilt');
  assert.equal(status.currentDiagnosis?.secondary, 'bypassAvailable');
});
