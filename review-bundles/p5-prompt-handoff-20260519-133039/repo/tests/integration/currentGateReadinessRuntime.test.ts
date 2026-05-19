import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCurrentGateReadinessInput,
  evaluateCurrentGateReadiness,
  getCurrentGateTrialId,
} from '../../src/systems/readiness/index.js';
import { getPrepBudgetByTransitionId } from '../../src/systems/economy/prepBudgetRegistry.js';
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

function resetCurrentGateRuntimeStores() {
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

async function primeCurrentGateRuntime() {
  const content = await getContent();
  resetCurrentGateRuntimeStores();
  primeContentStore(content);
  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);
  useGameStore.setState((state) => ({
    ...state,
    selectedPath: 'heaven',
  }));
  return content;
}

test.beforeEach(() => {
  resetCurrentGateRuntimeStores();
});

test('packet 4.13 runtime bridge safely returns null when content is not loaded', () => {
  assert.equal(getCurrentGateTrialId(), null);
  assert.equal(buildCurrentGateReadinessInput(), null);
  assert.equal(evaluateCurrentGateReadiness(), null);
});

test('packet 4.13 runtime bridge resolves a fresh life to the first gate', async () => {
  await primeCurrentGateRuntime();

  assert.equal(getCurrentGateTrialId(), 'trial_novices_clearing');

  const result = evaluateCurrentGateReadiness();

  assert.notEqual(result, null);
  assert.equal(result?.trialId, 'trial_novices_clearing');
});

test('packet 4.13 runtime bridge advances to the second gate after the first gate is cleared', async () => {
  await primeCurrentGateRuntime();
  useTrialStore.getState().markCleared('trial_novices_clearing');

  assert.equal(getCurrentGateTrialId(), 'trial_stone_core_sanctum');

  const result = evaluateCurrentGateReadiness();

  assert.notEqual(result, null);
  assert.equal(result?.trialId, 'trial_stone_core_sanctum');
});

test('packet 4.13 runtime bridge preserves packet 4.10 posture warnings', async () => {
  await primeCurrentGateRuntime();
  useUIStore.getState().setSettings({
    combatAIProfile: 'farmer',
    useConsumablesInCombat: false,
  });

  const result = evaluateCurrentGateReadiness();

  assert.notEqual(result, null);
  assert.equal(result?.warnings.includes('Farmer AI is a poor fit for gate trials.'), true);
  assert.equal(result?.warnings.includes('Combat consumable auto-use is disabled.'), true);
  assert.equal(result?.posture.band, 'below_minimum');
});

test('packet 4.13 runtime bridge exposes gate forge targets from the prep-budget registry', async () => {
  await primeCurrentGateRuntime();

  const input = buildCurrentGateReadinessInput();
  const prepEntry = getPrepBudgetByTransitionId('qi_condensation_to_foundation');

  assert.notEqual(input, null);
  assert.notEqual(prepEntry, null);
  assert.equal(input?.forgeTargets.minimum.weaponRefine, prepEntry?.minimumPrepPackage.forgeFloor.weaponRefine);
  assert.equal(input?.forgeTargets.recommended.weaponRefine, prepEntry?.recommendedPrepPackage.forgeFloor.weaponRefine);
  assert.deepEqual(input?.forgeTargets, {
    minimum: {
      weaponRefine: 2,
      accessoryRefine: 1,
      temperSuccesses: 1,
      runeCount: 0,
    },
    recommended: {
      weaponRefine: 3,
      accessoryRefine: 2,
      temperSuccesses: 1,
      runeCount: 0,
    },
  });
});
