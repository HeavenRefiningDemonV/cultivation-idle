import assert from 'node:assert/strict';
import test from 'node:test';

import { buildGateTrialReadinessSurface } from '../../src/systems/readiness/section5Adapters.js';
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

function resetRuntime() {
  resetEconomicRuntimeStores();
  useGameStore.getState().hardResetGameState();
  useTechniqueStore.getState().resetLoadouts();
  useTechCollectionStore.getState().hardReset();
  useTrialStore.getState().hardResetTrials();
  useUIStore.getState().hardResetUI();
}

async function primeRuntime() {
  const content = await getContent();
  resetRuntime();
  primeContentStore(content);
  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);
}

test('gate readiness runtime surfaces preparing and blocked states honestly', async () => {
  await primeRuntime();
  useGameStore.setState((state) => ({ ...state, realm: { ...state.realm, substage: 1 }, qi: '0' }));
  const preparing = buildGateTrialReadinessSurface('trial_novices_clearing');
  assert.ok(preparing);
  assert.equal(preparing?.readinessLabel, 'Preparing');

  useGameStore.setState((state) => ({ ...state, realm: { ...state.realm, substage: 9 }, qi: '1000000' }));
  useTrialStore.setState((state) => ({
    ...state,
    progressByTrialId: {
      ...state.progressByTrialId,
      trial_novices_clearing: {
        ...createDefaultTrialProgress(),
      },
    },
  }));
  const blockedOrBetter = buildGateTrialReadinessSurface('trial_novices_clearing');
  assert.ok(blockedOrBetter);
  assert.equal(['Blocked', 'Risky', 'Close', 'Ready'].includes(blockedOrBetter?.readinessLabel ?? ''), true);
});
