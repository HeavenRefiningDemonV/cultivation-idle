import assert from 'node:assert/strict';
import test from 'node:test';

import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useRunDeltaStore } from '../../src/systems/runDeltas/runDeltaStore.js';
import { buildLiveRunCompassSurfaceV2 } from '../../src/systems/ui/runCompass/buildRunCompassSurfaceV2.js';
import { getValidatedEconomicContent, primeContentStore, resetEconomicRuntimeStores } from '../helpers/economy/setupEconomicRuntimeScenario.js';

test.beforeEach(() => {
  useRunDeltaStore.getState().clearDeltas();
});

test('RunCompassSurfaceV2 carries Dao Impression deltas as memory, not a new primary route', async () => {
  const content = await getValidatedEconomicContent();
  resetEconomicRuntimeStores();
  primeContentStore(content);
  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);
  useGameStore.setState({ selectedPath: 'earth' });
  useRunDeltaStore.getState().pushDelta({
    id: 'dao:threshold',
    source: 'dao_impression',
    timestamp: 2,
    tone: 'success',
    label: 'Dao Impression gained: Threshold Revelation',
    detail: '+15 Comprehension',
    memoryLine: 'Threshold Revelation deepened the Dao Heart after a Gate Trial clear.',
    rewardSummary: '+15 Comprehension',
    doctrineDelta: { heartLawId: 'heart_quiet_breath', amount: 15 },
  });

  const surface = buildLiveRunCompassSurfaceV2();

  assert.ok(surface);
  assert.equal(surface.recentDeltas[0].source, 'dao_impression');
  assert.match(surface.recentDeltas[0].memoryLine, /Threshold Revelation/i);
  assert.notEqual(surface.primaryRoute.id, 'dao:threshold');
});

test('RunCompassSurfaceV2 includes recent run deltas without inventing readiness math', async () => {
  const content = await getValidatedEconomicContent();
  resetEconomicRuntimeStores();
  primeContentStore(content);
  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);
  useGameStore.setState({ selectedPath: 'earth' });
  useRunDeltaStore.getState().pushDelta({
    id: 'reward:1',
    source: 'rewards',
    timestamp: 1,
    tone: 'success',
    label: 'Spoils gained',
    detail: '+300 Gold',
    memoryLine: 'Spoils gained: +300 Gold.',
    rewardSummary: '+300 Gold',
    readinessDelta: null,
  });

  const surface = buildLiveRunCompassSurfaceV2();

  assert.ok(surface);
  assert.equal(surface.recentDeltas.length, 1);
  assert.equal(surface.recentDeltas[0].label, 'Spoils gained');
  assert.equal(surface.recentDeltas[0].readinessDelta, null);
});
