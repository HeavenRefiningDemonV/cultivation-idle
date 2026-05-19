import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { buildDefaultSaveState } from '../../src/save/defaultSaveState.js';
import { apply as applyOfflineCatchup } from '../../src/services/time/OfflineCatchup.js';
import { cultivationService } from '../../src/services/cultivationService.js';
import { getConsumableSpec } from '../../src/systems/consumables/consumableCatalog.js';
import { buildLiveConsumableRoster } from '../../src/systems/consumables/liveConsumableRoster.js';
import { buildCultivationConsumableCarryoverWindows } from '../../src/systems/consumables/cultivationConsumableEffects.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import { useGameStore, setInventoryStoreGetter, setPrestigeStoreGetter } from '../../src/stores/gameStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { REALMS } from '../../src/constants/index.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

async function readJson(fileName: string) {
  return JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8'));
}

async function loadValidatedContent() {
  return validateLoadedContent({
    economy: await readJson('economy.json'),
    cities: await readJson('cities.json'),
    items: await readJson('items.json'),
    techniques: await readJson('techniques.json'),
    pavilions: await readJson('pavilions.json'),
    outskirts: await readJson('outskirts.json'),
    enemies: await readJson('enemies.json'),
    trials: await readJson('trials.json'),
    ruins: await readJson('ruins.json'),
    alchemy_recipes: await readJson('alchemy_recipes.json'),
    forge_blueprints: await readJson('forge_blueprints.json'),
    runes: await readJson('runes.json'),
    talisman_recipes: await readJson('talisman_recipes.json'),
    apothecary_shops: await readJson('apothecary_shops.json'),
    expeditions: await readJson('expeditions.json'),
    bounties: await readJson('bounties.json'),
    heart_laws: await readJson('heart_laws.json'),
    prestige_store: await readJson('prestige_store.json'),
  } as never);
}

function primeContentStore(content: Awaited<ReturnType<typeof loadValidatedContent>>) {
  useContentStore.setState({
    raw: content,
    isLoaded: true,
    isLoading: false,
    error: null,
    citiesSorted: [...content.cities].sort((a, b) => a.index - b.index),
    maps: {
      ...useContentStore.getState().maps,
      citiesById: Object.fromEntries(content.cities.map((entry) => [entry.id, entry])) as never,
      itemsById: Object.fromEntries(content.items.map((entry) => [entry.id, entry])) as never,
      heartLawsById: Object.fromEntries(content.heart_laws.map((entry) => [entry.id, entry])) as never,
    },
  });
}

function resetStores() {
  useInventoryStore.getState().hardResetInventory();
  useCultivationStore.getState().resetForNewLife();
  useGameStore.getState().hardResetGameState();
  useCityStore.getState().hardResetCity();
  setPrestigeStoreGetter(() => ({
    updateHighestRealm: () => {},
    getQiMultiplier: () => 1,
    getCombatMultiplier: () => 1,
    getSpiritRootTotalMultiplier: () => 1,
    spiritRoot: null,
  }));
  setInventoryStoreGetter(() => ({
    getItemCount: (itemId: string) => useInventoryStore.getState().getItemCount(itemId),
    removeItem: (itemId: string, quantity: number) => useInventoryStore.getState().removeItem(itemId, quantity),
    resetInventory: () => useInventoryStore.getState().resetInventory(),
  }));
}

const approxEqual = (actual: number, expected: number, epsilon = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
};

let content: Awaited<ReturnType<typeof loadValidatedContent>>;

test.before(async () => {
  content = await loadValidatedContent();
});

test.beforeEach(() => {
  resetStores();
  primeContentStore(content);
  useCultivationStore.setState({ selectedHeartLawId: content.heart_laws[0]?.id ?? null, unlockedHeartLawIds: [content.heart_laws[0]?.id ?? ''] });
  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);
});

test('all live cultivation-use items have implemented use logic', () => {
  const liveCultivationIds = buildLiveConsumableRoster(content)
    .filter((entry) => entry.status === 'live' && entry.domain === 'cultivation')
    .map((entry) => entry.itemId)
    .sort();

  assert.deepEqual(liveCultivationIds, [
    'cons_meridian_warmth_draft_t1',
    'cons_purity_elixir_t1',
    'cons_qi_elixir_t1',
    'cons_qi_elixir_t2',
    'cons_quiet_breath_tea_t1',
  ]);
  liveCultivationIds.forEach((itemId) => {
    const spec = getConsumableSpec(itemId);
    assert.ok(spec);
    assert.equal(spec?.domain, 'cultivation');
  });
  assert.equal(buildLiveConsumableRoster(content).some((entry) => entry.itemId === 'cons_tribulation_buffer_t1' && entry.status === 'live'), false);
});

test('Qi Elixir t1/t2 adjust qps and circulation t2 overrides t1 within the same family registry slot', () => {
  const now = Date.now();
  useGameStore.getState().calculateQiPerSecond();
  const base = Number(useGameStore.getState().qiPerSecond);

  useCultivationStore.getState().useCultivationConsumable('cons_qi_elixir_t1', now);
  useGameStore.getState().calculateQiPerSecond();
  approxEqual(Number(useGameStore.getState().qiPerSecond), base * 1.25);

  useCultivationStore.getState().useCultivationConsumable('cons_qi_elixir_t2', now + 1_000);
  useGameStore.getState().calculateQiPerSecond();
  approxEqual(Number(useGameStore.getState().qiPerSecond), base * 1.4);
  const readModel = useCultivationStore.getState().getCultivationConsumableReadModel(now + 2_000);
  assert.deepEqual(readModel.entries.map((entry) => entry.itemId), ['cons_qi_elixir_t2']);
  assert.equal(readModel.activeByFamily.circulation?.itemId, 'cons_qi_elixir_t2');
});

test('Meridian Warmth boosts qps and stability gain, Quiet Breath boosts comprehension and insight cadence', () => {
  const now = Date.now();
  useGameStore.getState().calculateQiPerSecond();
  const baseQps = Number(useGameStore.getState().qiPerSecond);

  useCultivationStore.getState().useCultivationConsumable('cons_meridian_warmth_draft_t1', now);
  useGameStore.getState().calculateQiPerSecond();
  approxEqual(Number(useGameStore.getState().qiPerSecond), baseQps * 1.15);

  useCultivationStore.setState({
    insight: { pending: true, startedAt: now, expiresAt: now + 1, defaultChoiceId: 'stabilize', choices: [] },
  });
  useCultivationStore.getState().resolveInsight('stabilize');
  approxEqual(useCultivationStore.getState().stability, 12.5);

  useCultivationStore.getState().useCultivationConsumable('cons_quiet_breath_tea_t1', now);
  useCultivationStore.setState({ insight: null, insightProgressMs: 0, insightTargetMs: 120_000, nextInsightAt: null });
  useCultivationStore.getState().ensureInsightCycle(now);
  assert.equal(useCultivationStore.getState().nextInsightAt, now + 100_000);

  const before = useCultivationStore.getState().comprehension;
  cultivationService.applyContinuousGains(60_000, now + 60_000, true);
  approxEqual(useCultivationStore.getState().comprehension - before, 6.75);
});

test('Purity Elixir only affects major breakthroughs, grants stability on success, and expires honestly', () => {
  const now = Date.now();
  useInventoryStore.getState().addItem('gate_foundation_pill', 1);
  useGameStore.setState({ realm: { index: 0, substage: REALMS[0].substages, name: REALMS[0].name }, qi: '999999999999' });
  const baseRequirement = Number(useGameStore.getState().getBreakthroughRequirement());

  useCultivationStore.getState().useCultivationConsumable('cons_purity_elixir_t1', now);
  const discounted = Number(useGameStore.getState().getBreakthroughRequirement());
  approxEqual(discounted, baseRequirement * 0.9);

  const success = useGameStore.getState().breakthrough();
  assert.equal(success, true);
  assert.equal(useCultivationStore.getState().stability, 25);
  assert.equal(useCultivationStore.getState().getActiveCultivationConsumables(now + 1)[0]?.consumedOnMajorBreakthrough, true);

  useCultivationStore.getState().useCultivationConsumable('cons_purity_elixir_t1', now);
  useGameStore.setState({ realm: { index: 1, substage: 1, name: REALMS[1].name }, qi: '999999999999' });
  const beforeItems = useCultivationStore.getState().getActiveCultivationConsumables(now + 2).length;
  useGameStore.getState().breakthrough();
  assert.equal(useCultivationStore.getState().getActiveCultivationConsumables(now + 3).length, beforeItems);

  useGameStore.getState().calculateQiPerSecond();
  const baseQps = Number(useGameStore.getState().qiPerSecond);
  useCultivationStore.getState().useCultivationConsumable('cons_qi_elixir_t1', now);
  useCultivationStore.getState().clearExpiredCultivationConsumables(now + 601_000);
  useGameStore.getState().calculateQiPerSecond();
  approxEqual(Number(useGameStore.getState().qiPerSecond), baseQps);
});

test('offline catch-up honors partial buff duration and save snapshot carries cultivation buffs', () => {
  const now = Date.now();
  useGameStore.getState().calculateQiPerSecond();
  const baseQps = Number(useGameStore.getState().qiPerSecond);
  useCultivationStore.getState().useCultivationConsumable('cons_qi_elixir_t1', now);
  useGameStore.getState().calculateQiPerSecond();
  useGameStore.setState({ qi: '0', lastActiveTime: now, lastTickTime: now });

  const baseContext = {
    dtMs: 900_000,
    rawMs: 900_000,
    now: now + 900_000,
    wasCapped: false,
    lastActiveAtMs: now,
  };
  const resultWithoutMeditation = applyOfflineCatchup({ ...baseContext, wasMeditating: false });
  const qiWithoutMeditation = Number(useGameStore.getState().qi);
  useCultivationStore.getState().useCultivationConsumable('cons_qi_elixir_t1', now);
  useGameStore.setState({ qi: '0', lastActiveTime: now, lastTickTime: now });
  const resultWithMeditation = applyOfflineCatchup({ ...baseContext, wasMeditating: true });
  const qiAfter = Number(useGameStore.getState().qi);

  const appliedEfficiency = resultWithMeditation.summary?.efficiency ?? 0;
  const noBuffFloor = baseQps * 900 * appliedEfficiency;
  const fullBuffCeil = baseQps * 1.25 * 900 * appliedEfficiency;
  assert.ok(qiAfter > noBuffFloor);
  assert.ok(qiAfter < fullBuffCeil);
  approxEqual(qiAfter, qiWithoutMeditation);
  assert.ok(resultWithoutMeditation.summary?.parts.some((part) => part.label === 'Qi gained'));
  assert.ok(resultWithMeditation.summary?.parts.some((part) => part.label === 'Qi gained'));
  assert.deepEqual(useCultivationStore.getState().getActiveCultivationConsumables(now + 900_000), []);

  useCultivationStore.setState({ activeCultivationConsumables: [] });
  useCultivationStore.getState().useCultivationConsumable('cons_quiet_breath_tea_t1', now);
  const save = buildDefaultSaveState();
  assert.equal(save.heartLawState?.activeCultivationConsumables?.[0]?.itemId, 'cons_quiet_breath_tea_t1');
  assert.equal(typeof save.heartLawState?.insightProgressMs, 'number');
});


test('carryover windows keep cultivation buff modifiers honest across overlapping families and expiry boundaries', () => {
  const now = Date.now();
  useCultivationStore.getState().useCultivationConsumable('cons_qi_elixir_t1', now);
  useCultivationStore.setState((state) => {
    state.activeCultivationConsumables.push({
      itemId: 'cons_meridian_warmth_draft_t1',
      family: 'warmth',
      activatedAt: now + 300_000,
      expiresAt: now + 1_200_000,
      modifiers: {
        qiRateMult: 1.15,
        comprehensionGainMult: 1,
        stabilityGainMult: 1.25,
        insightFrequencyMult: 1,
        majorBreakthroughQiCostMult: 1,
        majorBreakthroughStabilityBonus: 0,
      },
      consumedOnMajorBreakthrough: false,
    });
  });

  const windows = buildCultivationConsumableCarryoverWindows(useCultivationStore.getState().activeCultivationConsumables, now, now + 950_000);

  assert.equal(windows.length, 3);
  assert.deepEqual(windows.map((window) => window.activeFamilies), [
    ['circulation'],
    ['circulation', 'warmth'],
    ['warmth'],
  ]);
  approxEqual(windows[0]?.modifiers.qiRateMult ?? 0, 1.25);
  approxEqual(windows[1]?.modifiers.qiRateMult ?? 0, 1.4375);
  approxEqual(windows[2]?.modifiers.qiRateMult ?? 0, 1.15);
});
