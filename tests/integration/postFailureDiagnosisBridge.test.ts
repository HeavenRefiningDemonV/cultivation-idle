import assert from 'node:assert/strict';
import test from 'node:test';

import { buildSection5PostFailureSurface } from '../../src/systems/readiness/index.js';
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

function resetStores() {
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

async function primeRuntime() {
  const content = await getContent();
  resetStores();
  primeContentStore(content);
  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);
  useGameStore.setState((state) => ({
    ...state,
    selectedPath: 'heaven',
    realm: {
      ...state.realm,
      substage: 9,
    },
    qi: '1000000',
  }));
}

function makeAttemptSummary() {
  return {
    trialId: 'trial_novices_clearing',
    startedAt: 0,
    endedAt: 10_000,
    durationSec: 10,
    bossHpPct: 52,
    maxHit: 400,
    maxHitLabel: 'Boss hit',
    suggestions: ['old telemetry suggestion'],
  };
}

test.beforeEach(() => {
  resetStores();
});

test('section-5 post-failure bridge surfaces canonical diagnosis/fix copy and recap', async () => {
  await primeRuntime();

  useTrialStore.setState((state) => ({
    ...state,
    progressByTrialId: {
      ...state.progressByTrialId,
      trial_novices_clearing: {
        ...createDefaultTrialProgress(),
        eligibleFailures: 3,
        lastAttemptSummary: makeAttemptSummary(),
      },
    },
  }));

  const surface = buildSection5PostFailureSurface('trial_novices_clearing');

  assert.notEqual(surface, null);
  assert.equal(surface?.state, 'available');
  assert.notEqual(surface?.primaryLabel, null);
  assert.equal(surface?.secondaryBadgeLabel, 'Safety Net Available');
  assert.equal(surface?.reasons.length ? surface.reasons[0]?.includes('bypassAvailable') : false, false);
  assert.equal(surface?.headline.includes('fail-safe'), false);
  assert.equal(surface?.fixes.length ? surface.fixes[0]?.label.includes('_') : false, false);
  assert.equal(surface?.fixes.length ? surface.fixes[0]?.label.includes('build_slots') : false, false);
  assert.notEqual(surface?.attemptRecap?.bossHpRemainingLine, null);
  assert.notEqual(surface?.attemptRecap?.timeSurvivedLine, null);
  assert.notEqual(surface?.attemptRecap?.biggestHitLine, null);
});

test('section-5 post-failure bridge returns quiet resolved surface for bypassed gates with stale summary data', async () => {
  await primeRuntime();

  useTrialStore.setState((state) => ({
    ...state,
    progressByTrialId: {
      ...state.progressByTrialId,
      trial_novices_clearing: {
        ...createDefaultTrialProgress(),
        resolution: 'bypassed',
        bypassedAt: Date.now(),
        lastAttemptSummary: makeAttemptSummary(),
      },
    },
  }));

  const surface = buildSection5PostFailureSurface('trial_novices_clearing');

  assert.notEqual(surface, null);
  assert.equal(surface?.state, 'resolved');
  assert.equal(surface?.fixes.length, 0);
  assert.equal(surface?.attemptRecap, null);
});
