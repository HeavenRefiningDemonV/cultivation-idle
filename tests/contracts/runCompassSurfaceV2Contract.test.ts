import assert from 'node:assert/strict';
import test from 'node:test';

import { REALMS } from '../../src/constants/index.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import { useTrialStore } from '../../src/stores/trialStore.js';
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
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

function assertSinglePrimary(surface: NonNullable<ReturnType<typeof buildLiveRunCompassSurfaceV2>>) {
  assert.equal(surface.version, 2);
  assert.ok(surface.primaryBlocker.kind.length > 0);
  assert.ok(surface.primaryRoute.id.length > 0);
  assert.ok(surface.primaryRoute.label.length > 0);
  assert.ok(surface.primaryRoute.actionLabel.length > 0);
  assert.ok(Array.isArray(surface.secondaryRoutes));
  assert.ok(surface.secondaryRoutes.length <= 3);
}

test('RunCompassSurfaceV2 returns a typed single-command surface for a fresh life', async () => {
  await primeRuntime();

  const surface = buildLiveRunCompassSurfaceV2();

  assert.ok(surface);
  assertSinglePrimary(surface);
  assert.equal(surface.mode, 'live');
  assert.equal(surface.milestone.currentRealmLabel, 'Qi Condensation');
  assert.notEqual(surface.primaryRoute.target?.kind, 'world_module');
  assert.equal(surface.primaryRoute.target?.kind, 'tab');
  assert.equal(surface.primaryRoute.target?.tab, 'cultivation');
  assert.ok(surface.currentCity);
  assert.equal(Array.isArray(surface.recentDeltas), true);
});

test('RunCompassSurfaceV2 routes cleared or bypassed gate state back to Cultivation breakthrough', async () => {
  const content = await primeRuntime();
  const firstTrial = content.trials[0];
  const qiCondensation = REALMS[0];
  useGameStore.setState({
    realm: { index: 0, substage: qiCondensation.substages, name: qiCondensation.name },
    qi: '999999999',
    selectedPath: 'heaven',
  });
  useTrialStore.getState().markCleared(firstTrial.id);

  const surface = buildLiveRunCompassSurfaceV2();

  assert.ok(surface);
  assertSinglePrimary(surface);
  assert.equal(surface.currentGate?.resolved, true);
  assert.equal(surface.primaryRoute.target?.kind, 'tab');
  assert.equal(surface.primaryRoute.target?.tab, 'cultivation');
  assert.match(surface.primaryRoute.label, /break\s*through|cultivation/i);
});

test('RunCompassSurfaceV2 reports the authored content cap without inventing a future gate', async () => {
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

  const surface = buildLiveRunCompassSurfaceV2();

  assert.ok(surface);
  assertSinglePrimary(surface);
  assert.equal(['content_cap', 'prestige_recommended'].includes(surface.milestone.state), true);
  assert.equal(surface.currentGate, null);
  assert.equal(surface.primaryBlocker.kind === 'content_cap' || surface.primaryBlocker.kind === 'prestige_recommended', true);
  assert.doesNotMatch(`${surface.milestone.label} ${surface.milestone.detail} ${surface.primaryRoute.detail}`, /Unknown Gate|Prepare for Unknown/i);
});
