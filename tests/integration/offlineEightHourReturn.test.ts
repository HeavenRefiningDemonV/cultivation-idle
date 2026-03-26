import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { apply as applyOfflineCatchup } from '../../src/services/time/OfflineCatchup.js';
import { useActivityStore } from '../../src/stores/activityStore.js';
import { useBountyStore } from '../../src/stores/bountyStore.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useCraftSessionStore } from '../../src/stores/craftSessionStore.js';
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import { useExpeditionStore } from '../../src/stores/expeditionStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import { usePrestigeStore } from '../../src/stores/prestigeStore.js';
import { useProfessionStore } from '../../src/stores/professionStore.js';
import { useRecipeMasteryStore } from '../../src/stores/recipeMasteryStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';
import { buildOfflineContext } from '../../src/systems/offline.js';
import { shouldShowOfflineProgressModal } from '../../src/systems/balance/offlineTargets.js';
import { buildOfflineModalRows } from '../../src/systems/offline/offlineSummaryReadModel.js';
import { getValidatedEconomicContent, primeContentStore, resetEconomicRuntimeStores } from '../helpers/economy/setupEconomicRuntimeScenario.js';

const SAVE_SERVICE_PATH = path.join(process.cwd(), 'src/services/save/SaveService.ts');

const resetOfflineHarness = async () => {
  resetEconomicRuntimeStores();
  useActivityStore.getState().hardResetActivity();
  useCraftSessionStore.getState().hardReset();
  useRecipeMasteryStore.getState().hardReset();
  useProfessionStore.setState({ alchemyQueue: [], talismanQueue: [], forgeQueue: [], lastTickAt: 0 });
  useCultivationStore.getState().resetForNewLife();
  usePrestigeStore.getState().hardResetPrestige();
  useUIStore.getState().hardResetUI();

  const content = await getValidatedEconomicContent();
  primeContentStore(content);
  useCityStore.getState().initializeFromContent(content.cities as never);

  useGameStore.setState({
    qi: '0',
    qiPerSecond: '20',
    lastActiveTime: 0,
    lastTickTime: 0,
  });
  useInventoryStore.setState({
    currencies: { gold: '999999', spiritStones: '999999', merit: '999999' },
    gold: '999999',
    spiritStones: '999999',
    merit: '999999',
    items: Object.fromEntries(content.items.map((item) => [item.id, 99])),
  });
};

test.beforeEach(async () => {
  await resetOfflineHarness();
});

test('simple 8h return shows only time + qi row and no queue/expedition rows', () => {
  const now = 8 * 60 * 60 * 1000;
  const result = applyOfflineCatchup(buildOfflineContext(0, { now }));
  assert.ok(result.summary);
  const summary = result.summary!;
  const rows = buildOfflineModalRows(summary);

  assert.equal(summary.offlineSeconds, 8 * 60 * 60);
  assert.equal(rows.some((row) => row.kind === 'qi_gained'), true);
  assert.equal(rows.some((row) => row.kind === 'queued_actions'), false);
  assert.equal(rows.some((row) => row.kind === 'expeditions'), false);
  assert.equal(shouldShowOfflineProgressModal(summary), true);
});

test('8h return with seeded queues + expedition marks ready counts without auto-claim/restart', () => {
  const content = useContentStore.getState().raw!;
  const cityWithForge = content.cities.find((city) => city.modules.includes('forge')) ?? content.cities[0];
  useCityStore.setState({ currentCityId: cityWithForge.id, unlockedCityIds: [cityWithForge.id] });

  const expeditionType = content.expeditions.types[0]?.id;
  const expeditionDuration = content.expeditions.durations[0]?.id;
  assert.ok(expeditionType && expeditionDuration);

  useProfessionStore.setState({
    alchemyQueue: [{ id: 'alchemy_job', recipeId: 'alchemy_seed', qty: 1, startedAt: 1_000, endsAt: 10_000, cityId: cityWithForge.id }],
    talismanQueue: [{ id: 'talisman_job', recipeId: 'talisman_seed', qty: 1, startedAt: 1_000, endsAt: 12_000, cityId: cityWithForge.id }],
    forgeQueue: [{
      id: 'forge_job',
      blueprintId: content.forge_blueprints[0]?.id ?? 'forge_seed',
      qty: 1,
      startedAt: 1_000,
      endsAt: 15_000,
      cityId: cityWithForge.id,
      status: 'ACTIVE',
      mode: 'IDLE',
    }],
  });
  useExpeditionStore.setState({
    slots: 1,
    active: [{
      slotIndex: 0,
      expeditionTypeId: expeditionType!,
      durationId: expeditionDuration!,
      cityId: cityWithForge.id,
      cityIndex: cityWithForge.index,
      startedAt: 1_000,
      endsAt: 18_000,
      seed: 123,
      status: 'running',
    }],
  });

  const preClaimItems = { ...useInventoryStore.getState().items };
  const now = 8 * 60 * 60 * 1000;
  const result = applyOfflineCatchup(buildOfflineContext(0, { now }));
  assert.ok(result.summary);
  const summary = result.summary!;
  const rows = buildOfflineModalRows(summary);

  const queueRow = rows.find((row) => row.kind === 'queued_actions');
  const expeditionRow = rows.find((row) => row.kind === 'expeditions');
  assert.ok(queueRow);
  assert.ok(expeditionRow);
  assert.equal(Number.parseInt(queueRow!.value, 10) > 0, true);
  assert.equal(Number.parseInt(expeditionRow!.value, 10) > 0, true);

  assert.deepEqual(useInventoryStore.getState().items, preClaimItems);
  assert.equal(useExpeditionStore.getState().active.filter((run) => run.status === 'complete').length, 1);

  const claimResult = useExpeditionStore.getState().claim(0);
  assert.equal(claimResult.ok, true);
  assert.equal(useExpeditionStore.getState().active.length, 0);
});

test('capped return exposes capped note framing and 12h processed window', () => {
  const result = applyOfflineCatchup(buildOfflineContext(0, { now: 60 * 60 * 1000 * 24 * 2 }));
  assert.ok(result.summary);
  assert.equal(result.summary!.wasCapped, true);
  assert.equal(result.summary!.offlineSeconds, 43_200);
});

test('persisted timestamps prevent immediate second-load re-application', () => {
  const firstNow = 8 * 60 * 60 * 1000;
  const first = applyOfflineCatchup(buildOfflineContext(0, { now: firstNow }));
  assert.ok(first.summary);
  assert.equal(useGameStore.getState().lastActiveTime, firstNow);

  const second = applyOfflineCatchup(buildOfflineContext(useGameStore.getState().lastActiveTime, { now: firstNow }));
  assert.equal(second.summary, null);
});

test('save service load path wires modal presentation and immediate persistence hooks', async () => {
  const source = await fs.readFile(SAVE_SERVICE_PATH, 'utf8');
  assert.match(source, /showOfflineProgress\(/);
  assert.match(source, /shouldShowOfflineProgressModal/);
  assert.match(source, /legacySaveGame\(\)/);
});
