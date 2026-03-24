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
  return content;
}

test('gate readiness surface exposes bounded checklist rows and canonical readiness labels', async () => {
  await primeRuntime();
  const surface = buildGateTrialReadinessSurface('trial_novices_clearing');
  assert.ok(surface);
  if (!surface) throw new Error('Missing gate readiness surface');
  assert.equal(surface.minimumChecklist.length, 5);
  assert.equal(surface.recommendedChecklist.length, 5);
  assert.equal(['Blocked', 'Preparing', 'Risky', 'Close', 'Ready'].includes(surface.readinessLabel), true);
});

test('TrialProgress no longer keeps hardcoded recommendation table as source of truth', async () => {
  const source = await import('node:fs/promises').then((fs) => fs.readFile('src/features/trials/ui/TrialProgress.tsx', 'utf8'));
  assert.doesNotMatch(source, /TRIAL_RECOMMENDATIONS/);
  assert.match(source, /buildGateTrialReadinessSurface/);
});

test('close diagnosis can surface Close readiness label', async () => {
  await primeRuntime();
  useGameStore.setState((state) => ({ ...state, qi: '1000000', realm: { ...state.realm, substage: 9 } }));
  useTrialStore.setState((state) => ({
    ...state,
    progressByTrialId: {
      ...state.progressByTrialId,
      trial_novices_clearing: {
        ...createDefaultTrialProgress(),
        lastAttemptSummary: {
          trialId: 'trial_novices_clearing',
          startedAt: 0,
          endedAt: 15_000,
          durationSec: 15,
          bossHpPct: 18,
          maxHit: 100,
          maxHitLabel: 'Boss hit',
          suggestions: [],
        },
      },
    },
  }));
  const surface = buildGateTrialReadinessSurface('trial_novices_clearing');
  assert.ok(surface);
  if (!surface) throw new Error('Missing gate readiness surface');
  assert.equal(['Close', 'Ready', 'Risky', 'Blocked', 'Preparing'].includes(surface.readinessLabel), true);
});
