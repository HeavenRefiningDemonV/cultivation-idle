import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { REALMS } from '../../src/constants/index.js';
import { cultivationService } from '../../src/services/cultivationService.js';
import { apply as applyOfflineCatchup } from '../../src/services/time/OfflineCatchup.js';
import { buildDefaultSaveState, mergeWithDefaults } from '../../src/save/defaultSaveState.js';
import { setInventoryStoreGetter, useGameStore } from '../../src/stores/gameStore.js';
import { useActivityStore } from '../../src/stores/activityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedContentPromise: Promise<ValidatedContent> | null = null;

const loadValidatedContent = async (): Promise<ValidatedContent> => {
  if (!validatedContentPromise) {
    validatedContentPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedContentPromise;
};

const primeContentStore = async () => {
  const validated = await loadValidatedContent();
  const citiesSorted = [...validated.cities].sort((a, b) => a.index - b.index);
  useContentStore.setState({
    raw: validated,
    economy: validated.economy,
    isLoaded: true,
    isLoading: false,
    error: null,
    citiesSorted,
    maps: {
      ...useContentStore.getState().maps,
      citiesById: Object.fromEntries(citiesSorted.map((city) => [city.id, city])) as never,
      itemsById: Object.fromEntries(validated.items.map((item) => [item.id, item])) as never,
      heartLawsById: Object.fromEntries(validated.heart_laws.map((law) => [law.id, law])) as never,
      apothecariesById: Object.fromEntries(validated.apothecary_shops.map((shop) => [shop.id, shop])) as never,
      apothecariesByCityId: Object.fromEntries(validated.apothecary_shops.map((shop) => [shop.cityId, shop])) as never,
    },
  });
};

const resetStores = () => {
  useActivityStore.getState().hardResetActivity();
  useCultivationStore.getState().resetForNewLife();
  useGameStore.getState().hardResetGameState();
  useInventoryStore.getState().hardResetInventory();
  setInventoryStoreGetter(() => useInventoryStore.getState());
};

const selectStarterHeartLaw = () => {
  const heartLawId = useContentStore.getState().raw?.heart_laws?.[0]?.id ?? null;
  assert.ok(heartLawId);
  useCultivationStore.setState((state) => ({
    ...state,
    selectedHeartLawId: heartLawId,
    unlockedHeartLawIds: [heartLawId],
    chapter: 1,
    comprehension: 0,
    lastInsightAt: null,
    nextInsightAt: null,
    studyEnabled: false,
    studyTechniqueId: null,
    activeConsumables: [],
    stability: 0,
    stabilityCap: 100,
  }));
  useGameStore.getState().calculateQiPerSecond();
};

test.beforeEach(async () => {
  resetStores();
  await primeContentStore();
  selectStarterHeartLaw();
});

test('Qi Elixir tiers modify real qi/sec and circulation family replacement favors t2', () => {
  const now = Date.now();
  const baseline = Number(useGameStore.getState().getBaseQiPerSecond());

  const t1 = useCultivationStore.getState().useCultivationConsumable('cons_qi_elixir_t1', now);
  assert.equal(t1.ok, true);
  useGameStore.getState().calculateQiPerSecond();
  assert.equal(Number(useGameStore.getState().qiPerSecond), baseline * 1.25);

  const t2 = useCultivationStore.getState().useCultivationConsumable('cons_qi_elixir_t2', now + 1_000);
  assert.equal(t2.ok, true);
  useGameStore.getState().calculateQiPerSecond();
  assert.equal(Number(useGameStore.getState().qiPerSecond), baseline * 1.4);

  const active = useCultivationStore.getState().getActiveCultivationConsumables(now + 1_000);
  assert.equal(active.length, 1);
  assert.equal(active[0]?.itemId, 'cons_qi_elixir_t2');
  assert.equal(active[0]?.family, 'circulation');
});

test('Meridian Warmth Draft increases qi/sec and stability gain, and Quiet Breath Tea boosts comprehension plus insight cadence', () => {
  const now = Date.now();
  useCultivationStore.setState((state) => ({ ...state, nextInsightAt: null, comprehension: 0, stability: 0 }));
  useGameStore.getState().calculateQiPerSecond();
  const baselineQi = Number(useGameStore.getState().qiPerSecond);

  cultivationService.tick(60_000);
  const baselineComprehension = useCultivationStore.getState().comprehension;
  const baselineStability = useCultivationStore.getState().stability;

  useCultivationStore.setState((state) => ({
    ...state,
    comprehension: 0,
    stability: 0,
    nextInsightAt: null,
    activeConsumables: [],
  }));
  useCultivationStore.getState().useCultivationConsumable('cons_meridian_warmth_draft_t1', now);
  useCultivationStore.getState().useCultivationConsumable('cons_quiet_breath_tea_t1', now);
  useGameStore.getState().calculateQiPerSecond();

  assert.equal(Number(useGameStore.getState().qiPerSecond), baselineQi * 1.15);

  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    useCultivationStore.getState().scheduleNextInsight(10_000);
  } finally {
    Math.random = originalRandom;
  }
  const buffedInsightAt = useCultivationStore.getState().nextInsightAt;
  assert.ok(buffedInsightAt !== null);
  assert.equal(buffedInsightAt, 10_000 + (15 * 60 * 1000) / 1.2);

  cultivationService.tick(60_000);
  assert.equal(useCultivationStore.getState().comprehension, baselineComprehension * 1.35);
  assert.equal(useCultivationStore.getState().stability, baselineStability * 1.25);
});

test('Purity Elixir discounts only major breakthroughs, grants stability on success, and is not consumed by substage breakthroughs', () => {
  const now = Date.now();
  const currentRealm = REALMS[0]!;

  useGameStore.setState((state) => ({
    ...state,
    realm: { ...state.realm, index: 0, substage: currentRealm.substages },
  }));
  useCultivationStore.getState().useCultivationConsumable('cons_purity_elixir_t1', now);
  const majorRequirement = Number(useGameStore.getState().getBreakthroughRequirement());
  const undiscountedRequirement = Number(currentRealm.qiRequirement) * (1 ** (currentRealm.substages - 1));
  assert.equal(majorRequirement, undiscountedRequirement * 0.9);

  useGameStore.setState((state) => ({ ...state, qi: String(majorRequirement + 100) }));
  useInventoryStore.getState().addItem('gate_foundation_pill', 1);
  const brokeRealm = useGameStore.getState().breakthrough();
  assert.equal(brokeRealm, true);
  assert.equal(useGameStore.getState().realm.index, 1);
  assert.equal(useCultivationStore.getState().stability, 25);
  assert.equal(useCultivationStore.getState().getActiveCultivationConsumables(Date.now()).length, 0);

  useGameStore.setState((state) => ({
    ...state,
    realm: { ...state.realm, index: 0, substage: 1 },
    qi: '1000',
  }));
  useCultivationStore.setState((state) => ({ ...state, activeConsumables: [], stability: 0 }));
  useCultivationStore.getState().useCultivationConsumable('cons_purity_elixir_t1', now + 10_000);
  const substageRequirement = Number(useGameStore.getState().getBreakthroughRequirement());
  assert.equal(substageRequirement, Number(currentRealm.qiRequirement));
  useGameStore.setState((state) => ({ ...state, qi: String(substageRequirement + 100) }));
  const substageSuccess = useGameStore.getState().breakthrough();
  assert.equal(substageSuccess, true);
  assert.equal(useGameStore.getState().realm.index, 0);
  assert.equal(useGameStore.getState().realm.substage, 2);
  assert.equal(useCultivationStore.getState().getActiveCultivationConsumables(now + 11_000).length, 1);
  assert.equal(useCultivationStore.getState().stability, 0);
});

test('expired cultivation buffs stop applying, serialize safely, and offline catch-up only uses their real remaining duration', () => {
  const now = Date.now();
  useCultivationStore.getState().useCultivationConsumable('cons_qi_elixir_t1', now);
  useCultivationStore.getState().useCultivationConsumable('cons_meridian_warmth_draft_t1', now);
  const save = buildDefaultSaveState();
  assert.equal(save.heartLawState?.activeConsumables?.length, 2);

  const merged = mergeWithDefaults({
    ...save,
    heartLawState: {
      ...save.heartLawState,
      activeConsumables: save.heartLawState?.activeConsumables,
    },
  });
  assert.equal(merged.heartLawState?.activeConsumables?.length, 2);

  const baseQiPerSecond = Number(useGameStore.getState().getBaseQiPerSecond());
  const offlineResult = applyOfflineCatchup({
    lastActiveAtMs: 0,
    dtMs: 20 * 60 * 1000,
    rawMs: 20 * 60 * 1000,
    wasCapped: false,
    wasMeditating: true,
    now: now + 20 * 60 * 1000,
  });

  const offlineEfficiency = offlineResult.summary?.efficiency ?? 0;
  const expectedQi =
    baseQiPerSecond * 600 * 1.25 * 1.15 * offlineEfficiency
    + baseQiPerSecond * 300 * 1.15 * offlineEfficiency
    + baseQiPerSecond * 300 * offlineEfficiency;
  assert.equal(Number(useGameStore.getState().qi), expectedQi);

  const cleared = useCultivationStore.getState().clearExpiredCultivationConsumables(now + 20 * 60 * 1000);
  assert.equal(cleared, true);
  assert.deepEqual(useCultivationStore.getState().getCultivationConsumableModifiers(now + 20 * 60 * 1000), {
    qiRateMult: 1,
    stabilityGainMult: 1,
    comprehensionGainMult: 1,
    insightFrequencyMult: 1,
    breakthroughQiCostMult: 1,
    breakthroughStabilityBonus: 0,
  });
});
