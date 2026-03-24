import assert from 'node:assert/strict';
import test from 'node:test';

import { buildStatusTroubleshootingSurface } from '../../src/systems/ui/status/statusTroubleshootingSurface.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useTechCollectionStore } from '../../src/stores/techCollectionStore.js';
import { useTechniqueStore } from '../../src/stores/techniqueStore.js';
import { useTrialStore } from '../../src/stores/trialStore.js';
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

async function primeRuntime() {
  const content = await getContent();
  resetStores();
  primeContentStore(content);
  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);
  useGameStore.setState((state) => ({
    ...state,
    selectedPath: 'heaven',
    realm: { ...state.realm, substage: 9 },
    qi: '120',
  }));
}

test.beforeEach(() => {
  resetStores();
});

test('status troubleshooting runtime surface returns locked shortfall line and safety-net context', async () => {
  await primeRuntime();

  const surface = buildStatusTroubleshootingSurface();

  assert.match(`${surface.shortfall.diagnosisLabel} — ${surface.shortfall.reason}`, /—/);
  assert.equal(surface.combatStrip.length, 4);
  assert.match(surface.safetyNet.progress, /Safety Net progress:/);
  assert.match(surface.safetyNet.affordability, /Affordable now|Need more Merit \/ Spirit Stones/);
});

test('status troubleshooting runtime cap state keeps gate wording honest', async () => {
  await primeRuntime();

  useGameStore.setState((state) => ({
    ...state,
    realm: { ...state.realm, index: 5, substage: 9 },
  }));

  const surface = buildStatusTroubleshootingSurface();

  if (surface.readiness.gateTrialName === 'No active gate trial') {
    assert.equal(surface.shortfall.reason, 'Current chapter cap reached.');
  }
  assert.doesNotMatch(surface.readiness.gateTrialName, /next|future/i);
});
