import assert from 'node:assert/strict';
import test from 'node:test';

import { REALMS } from '../../src/constants/index.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import { setGameStoreGetter } from '../../src/stores/prestigeStore.js';
import { useTrialStore } from '../../src/stores/trialStore.js';
import { useRunDeltaStore } from '../../src/systems/runDeltas/runDeltaStore.js';
import { buildLiveRunCompassSurfaceV2 } from '../../src/systems/ui/runCompass/buildRunCompassSurfaceV2.js';
import { buildLiveDaoMandateSurfaceV1 } from '../../src/systems/ui/daoMandate/index.js';
import { getValidatedEconomicContent, primeContentStore, resetEconomicRuntimeStores } from '../helpers/economy/setupEconomicRuntimeScenario.js';

async function primeRuntime() {
  const content = await getValidatedEconomicContent();
  resetEconomicRuntimeStores();
  primeContentStore(content);
  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);
  useGameStore.setState({ selectedPath: 'earth' });
  setGameStoreGetter(() => useGameStore.getState());
  useCultivationStore.setState({ selectedHeartLawId: content.heart_laws[0]?.id ?? null });
  useRunDeltaStore.getState().clearDeltas();
  return content;
}

test('Live Dao Mandate wraps Run Compass V2 milestone, obstruction, and primary route truth', async () => {
  await primeRuntime();

  const runCompass = buildLiveRunCompassSurfaceV2();
  const mandate = buildLiveDaoMandateSurfaceV1({ now: 777 });

  assert.ok(runCompass);
  assert.equal(mandate.meta.mode, 'live');
  assert.equal(typeof mandate.meta.generatedAt, 'number');
  assert.equal(mandate.milestone.state, runCompass.milestone.state);
  assert.equal(mandate.milestone.label, runCompass.milestone.label);
  assert.equal(mandate.obstruction.kind, runCompass.primaryBlocker.kind);
  assert.equal(mandate.obstruction.label, runCompass.primaryBlocker.label);
  assert.deepEqual(mandate.primaryRoute.target, runCompass.primaryRoute.target);
});

test('Live Dao Mandate preserves gate-resolved route back to Cultivation breakthrough', async () => {
  const content = await primeRuntime();
  const firstTrial = content.trials[0];
  const qiCondensation = REALMS[0];
  useGameStore.setState({
    realm: { index: 0, substage: qiCondensation.substages, name: qiCondensation.name },
    qi: '999999999',
    selectedPath: 'heaven',
  });
  useTrialStore.getState().markCleared(firstTrial.id);

  const runCompass = buildLiveRunCompassSurfaceV2();
  const mandate = buildLiveDaoMandateSurfaceV1();

  assert.ok(runCompass);
  assert.equal(runCompass.currentGate?.resolved, true);
  assert.equal(mandate.milestone.state, runCompass.milestone.state);
  assert.equal(mandate.primaryRoute.target?.kind, 'tab');
  assert.equal(mandate.primaryRoute.target?.kind === 'tab' ? mandate.primaryRoute.target.tab : null, 'cultivation');
  assert.deepEqual(mandate.primaryRoute.target, runCompass.primaryRoute.target);
});

test('Live Dao Mandate carries recent Run Compass deltas as omens without making them routes', async () => {
  await primeRuntime();
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

  const runCompass = buildLiveRunCompassSurfaceV2();
  const mandate = buildLiveDaoMandateSurfaceV1();

  assert.ok(runCompass);
  assert.equal(runCompass.recentDeltas.length, 1);
  assert.equal(mandate.recentOmens[0]?.id, runCompass.recentDeltas[0].id);
  assert.equal(mandate.recentOmens[0]?.memoryLine, runCompass.recentDeltas[0].memoryLine);
  assert.notEqual(mandate.primaryRoute.id, 'reward:1');
});

test('Live Dao Mandate keeps authored content cap honest and does not invent a future gate', async () => {
  const content = await primeRuntime();
  const lastRealm = REALMS[5] ?? REALMS.at(-1)!;
  useCityStore.setState({
    currentCityId: content.cities.at(-1)?.id ?? useCityStore.getState().currentCityId,
    unlockedCityIds: content.cities.map((city) => city.id),
  });
  useGameStore.setState({
    realm: { index: lastRealm.index, substage: lastRealm.substages, name: lastRealm.name },
    qi: '999999999',
    selectedPath: 'martial',
  });
  for (const trial of content.trials) {
    useTrialStore.getState().markCleared(trial.id);
  }
  useInventoryStore.getState().addCurrency('spiritStones', '9999');

  const runCompass = buildLiveRunCompassSurfaceV2();
  const mandate = buildLiveDaoMandateSurfaceV1();
  const text = [
    mandate.milestone.label,
    mandate.milestone.detail,
    mandate.obstruction.detail,
    mandate.primaryRoute.detail,
  ].join(' ');

  assert.ok(runCompass);
  assert.equal(['content_cap', 'prestige_recommended'].includes(runCompass.milestone.state), true);
  assert.equal(mandate.milestone.state, runCompass.milestone.state);
  assert.equal(['content_cap', 'prestige_recommended'].includes(mandate.obstruction.kind), true);
  assert.equal(mandate.milestone.nextRealmLabel, null);
  assert.doesNotMatch(text, /Unknown Gate|Prepare for Unknown/i);
});
