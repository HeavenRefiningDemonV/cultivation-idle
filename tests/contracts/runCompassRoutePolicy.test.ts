import assert from 'node:assert/strict';
import test from 'node:test';

import { REALMS } from '../../src/constants/index.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import { createDefaultTrialProgress, useTrialStore } from '../../src/stores/trialStore.js';
import { buildLiveRunCompassSurfaceV2 } from '../../src/systems/ui/runCompass/buildRunCompassSurfaceV2.js';
import { getValidatedEconomicContent, primeContentStore, resetEconomicRuntimeStores } from '../helpers/economy/setupEconomicRuntimeScenario.js';

async function primeRuntime() {
  const content = await getValidatedEconomicContent();
  resetEconomicRuntimeStores();
  primeContentStore(content);
  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);
  useGameStore.setState({ selectedPath: 'earth' });
  useCultivationStore.setState({ selectedHeartLawId: content.heart_laws[0]?.id ?? null });
  return content;
}

test('recent failed gate diagnosis outranks generic preparation advice', async () => {
  const content = await primeRuntime();
  const firstTrial = content.trials[0];
  const firstRealm = REALMS[0];
  useGameStore.setState({
    realm: { index: 0, substage: firstRealm.substages, name: firstRealm.name },
    qi: '999999999',
  });
  useTrialStore.setState((state) => ({
    ...state,
    progressByTrialId: {
      ...state.progressByTrialId,
      [firstTrial.id]: {
        ...createDefaultTrialProgress(),
        attempts: 3,
        sessionAttempts: 3,
        eligibleFailures: 3,
        lastAttemptAt: Date.now(),
        lastAttemptSummary: {
          trialId: firstTrial.id,
          startedAt: 0,
          endedAt: 30_000,
          durationSec: 30,
          bossHpPct: 80,
          maxHit: 100,
          maxHitLabel: 'Guardian pressure',
          suggestions: ['Raise forge floor before retrying.'],
        },
      },
    },
  }));

  const surface = buildLiveRunCompassSurfaceV2();

  assert.ok(surface);
  assert.equal([
    'gate_recent_failure',
    'safety_net_available',
    'readiness_shortfall',
    'forge_floor_shortfall',
    'apothecary_prep_shortfall',
    'build_correction_gap',
  ].includes(surface.primaryBlocker.kind), true);
  assert.notEqual(surface.primaryRoute.label, 'Stay the course');
  assert.ok(surface.primaryRoute.target);
});

test('safety net availability routes through Gate Trial instead of unrelated farming', async () => {
  const content = await primeRuntime();
  const firstTrial = content.trials[0];
  const firstRealm = REALMS[0];
  useGameStore.setState({
    realm: { index: 0, substage: firstRealm.substages, name: firstRealm.name },
    qi: '999999999',
  });
  useTrialStore.setState((state) => ({
    ...state,
    progressByTrialId: {
      ...state.progressByTrialId,
      [firstTrial.id]: {
        ...createDefaultTrialProgress(),
        attempts: 5,
        sessionAttempts: 5,
        eligibleFailures: 5,
        lastAttemptAt: Date.now(),
      },
    },
  }));

  const surface = buildLiveRunCompassSurfaceV2();

  assert.ok(surface);
  if (surface.safetyNet?.state === 'available') {
    assert.equal(surface.primaryBlocker.kind, 'safety_net_available');
    assert.equal(surface.primaryRoute.target?.kind, 'world_module');
    assert.equal(surface.primaryRoute.target?.moduleKey, 'gateTrial');
  }
});
