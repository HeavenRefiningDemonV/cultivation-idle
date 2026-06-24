import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { performPrestigeReset } from '../../src/services/prestige/PrestigeResetService.js';
import { useActivityStore } from '../../src/stores/activityStore.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useCombatStore } from '../../src/stores/combatStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import { useEquipmentStore } from '../../src/stores/equipmentStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import { useOutskirtsStore } from '../../src/stores/outskirtsStore.js';
import { useManualSatchelStore } from '../../src/stores/manualSatchelStore.js';
import { useProfessionStore } from '../../src/stores/professionStore.js';
import { useExpeditionStore } from '../../src/stores/expeditionStore.js';
import { useTechCollectionStore } from '../../src/stores/techCollectionStore.js';
import { useRecipeMasteryStore } from '../../src/stores/recipeMasteryStore.js';
import { usePrestigeStore, setGameStoreGetter } from '../../src/stores/prestigeStore.js';
import { useRuinsStore } from '../../src/stores/ruinsStore.js';
import { createDefaultTrialProgress, useTrialStore } from '../../src/stores/trialStore.js';
import { useZoneStore } from '../../src/stores/zoneStore.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

type RuntimeContent = {
  economy: Record<string, unknown>;
  cities: Array<{ id: string; index: number; name: string; modules: string[]; unlockMajorRealm: string }>;
  heart_laws: Array<{ id: string; tier?: string; isStarter?: boolean }>;
  items: Array<{ id: string }>;
  trials: Array<{ id: string; cityId: string; gateItemId: string; gatesToMajorRealm?: string; eligibilityRule?: unknown }>;
  bounties: Record<string, unknown>;
  prestige_store: { upgrades?: Array<{ id: string }> };
};

let runtimeContentPromise: Promise<RuntimeContent> | null = null;

const readJson = async <T>(fileName: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;

const readArrayPayload = async <T>(
  fileName: string,
  key: string,
): Promise<T[]> => {
  const payload = await readJson<Record<string, unknown> | T[]>(fileName);
  if (Array.isArray(payload)) {
    return payload;
  }

  const value = payload[key];
  return Array.isArray(value) ? (value as T[]) : [];
};

const loadRuntimeContent = async (): Promise<RuntimeContent> => {
  if (!runtimeContentPromise) {
    runtimeContentPromise = (async () => ({
      economy: await readJson('economy.json'),
      cities: await readArrayPayload('cities.json', 'cities'),
      heart_laws: await readArrayPayload('heart_laws.json', 'heartLaws'),
      items: await readArrayPayload('items.json', 'items'),
      trials: await readArrayPayload('trials.json', 'trials'),
      bounties: await readJson('bounties.json'),
      prestige_store: await readJson('prestige_store.json'),
    }))();
  }
  return runtimeContentPromise;
};

const primeContentStore = async () => {
  const content = await loadRuntimeContent();
  const citiesSorted = [...content.cities].sort((a, b) => a.index - b.index);
  const citiesById = Object.fromEntries(citiesSorted.map((city) => [city.id, city]));
  const heartLawsById = Object.fromEntries(content.heart_laws.map((law) => [law.id, law]));

  useContentStore.setState({
    raw: content as never,
    economy: content.economy as never,
    isLoaded: true,
    isLoading: false,
    error: null,
    citiesSorted: citiesSorted as never,
    maps: {
      ...useContentStore.getState().maps,
      citiesById: citiesById as never,
      heartLawsById: heartLawsById as never,
    },
  });

  useCityStore.getState().initializeFromContent(citiesSorted as never);
};

const resetRuntimeStores = () => {
  useActivityStore.getState().hardResetActivity();
  useCityStore.getState().hardResetCity();
  useCombatStore.getState().hardResetCombat();
  useCultivationStore.getState().resetForNewLife();
  useEquipmentStore.getState().hardResetEquipment();
  useGameStore.getState().hardResetGameState();
  useInventoryStore.getState().hardResetInventory();
  useOutskirtsStore.getState().hardResetOutskirts();
  usePrestigeStore.getState().hardResetPrestige();
  useRuinsStore.getState().hardResetRuins();
  useTrialStore.getState().hardResetTrials();
  useZoneStore.getState().hardResetZones();
  useManualSatchelStore.getState().hardReset();
  useTechCollectionStore.getState().hardReset();
  useRecipeMasteryStore.getState().hardReset();
  useProfessionStore.setState({ alchemyQueue: [], talismanQueue: [], forgeQueue: [], lastTickAt: 0 });
  useExpeditionStore.setState((state) => ({ ...state, active: [] }));
  setGameStoreGetter(() => useGameStore.getState());
};

test.beforeEach(async () => {
  resetRuntimeStores();
  await primeContentStore();
});

test('prestige reset service creates a clean new life while preserving permanent and hybrid state', () => {
  usePrestigeStore.setState({
    totalAP: 42,
    purchasesById: { ap_idle_qi_mult: 2, ap_mastery_retention_25: 1 },
  });
  useGameStore.setState((state) => ({
    ...state,
    realm: { ...state.realm, index: 1, substage: 3 },
    qi: '999',
  }));
  useCultivationStore.setState({
    selectedHeartLawId: 'heartlaw_flame',
    chapter: 4,
    comprehension: 88,
    studyEnabled: true,
  });
  useInventoryStore.setState({
    items: { gate_foundation_pill: 2 },
    currencies: { gold: '55', spiritStones: '13', merit: '8' },
    gold: '55',
    spiritStones: '13',
    merit: '8',
  });
  useCityStore.setState((state) => ({
    ...state,
    currentCityId: 'city_stonecrag_town',
    unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
  }));
  useTrialStore.setState({
    activeTrialSessionId: 'trial_novices_clearing',
    progressByTrialId: {
      trial_novices_clearing: { ...createDefaultTrialProgress(), attempts: 2, eligibleFailures: 2 },
    },
  });
  useRuinsStore.setState({
    progressByRuinId: {
      ruins_alpha: {
        totalRuns: 2,
        totalRoomsCleared: 5,
        bossKills: 1,
        bestRunSeconds: 180,
        bossChestRareFailures: 0,
      },
    },
  });
  useEquipmentStore.setState({
    equippedWeaponId: 'sword_1',
    refineLevelBySlot: { weapon: 3, accessory: 0 },
  });
  useZoneStore.setState({ unlockedZones: ['starting_plains', 'forest_trail'], zoneProgress: { forest_trail: { completed: true, currentWave: 0, enemiesDefeated: 12, bestTime: null } } as never });
  useActivityStore.getState().startActivity('trial', { trialId: 'trial_novices_clearing' }, 'test');
  useManualSatchelStore.setState({ manuals: [{ id: 'm1', techId: 'tech_spark_strike', grade: 'mortal', rarity: 'common', acquiredAt: Date.now() }], activeStudy: null, lastLearned: null });
  useProfessionStore.setState({ alchemyQueue: [{ id: 'a', recipeId: 'recipe_minor_healing_pill', qty: 1, startedAt: Date.now(), endsAt: Date.now() + 5000, cityId: 'city_pinewind_hamlet' }], talismanQueue: [], forgeQueue: [], lastTickAt: 0 });
  useExpeditionStore.setState({ slots: 2, active: [{ slotIndex: 0, expeditionTypeId: 'exp_common_hunt', durationId: 'exp_short', cityId: 'city_pinewind_hamlet', cityIndex: 0, startedAt: Date.now(), endsAt: Date.now() + 5000, seed: 1, status: 'running' }], rareProgressByKey: {} });
  useTechCollectionStore.setState({ unlockedTechs: { tech_spark_strike: { unlocked: true, masteryXp: 80, rank: 2, manualGrade: 'earth', rarity: 'rare', traits: [], runes: [] } }, fragments: {}, rngSeed: 1 });
  useRecipeMasteryStore.setState({ alchemy: { recipe_minor_healing_pill: 60 } });

  const summary = performPrestigeReset({
    resetGameRun: () => useGameStore.getState().resetRun(),
  });

  assert.equal(summary.permanent.totalAP, 42);
  assert.deepEqual(summary.permanent.purchasesById, { ap_idle_qi_mult: 2, ap_mastery_retention_25: 1 });
  assert.equal(summary.hybrid.masteryRetentionCarryOver, 0.25);
  assert.equal(useGameStore.getState().realm.index, 0);
  assert.equal(useCultivationStore.getState().selectedHeartLawId, null);
  assert.deepEqual(useInventoryStore.getState().items, {});
  assert.equal(useEquipmentStore.getState().equippedWeaponId, null);
  assert.deepEqual(useTrialStore.getState().progressByTrialId, {});
  assert.deepEqual(useRuinsStore.getState().progressByRuinId, {});
  assert.deepEqual(useZoneStore.getState().unlockedZones, ['training_forest']);
  assert.equal(useActivityStore.getState().active, null);
  assert.deepEqual(useManualSatchelStore.getState().manuals, []);
  assert.equal(useProfessionStore.getState().alchemyQueue.length, 0);
  assert.equal(useExpeditionStore.getState().active.length, 0);
  // Expedition slots are now DERIVED from retained prestige purchases and recomputed on reset
  // (PrestigeResetService -> recomputeAndApplyPrestigeUnlocks -> applyPrestigeDerivedUnlocks).
  // The test's purchases grant no expedition-slot upgrade, so the reset normalizes the
  // un-backed slots:2 above back to the derived baseline of 1 (BASE_EXPEDITION_SLOTS).
  assert.equal(useExpeditionStore.getState().slots, 1);
  assert.deepEqual(useCityStore.getState().unlockedCityIds, ['city_pinewind_hamlet']);
  assert.equal(useCityStore.getState().currentCityId, 'city_pinewind_hamlet');
  assert.equal(summary.reset.cityBaselineId, 'city_pinewind_hamlet');
  assert.equal(summary.reset.clearedActivity, true);
});

test('prestige store performs AP grant and then delegates reset orchestration to a clean new life', () => {
  usePrestigeStore.setState({
    totalAP: 5,
    lifetimeAP: 7,
    prestigeCount: 1,
    purchasesById: { ap_mastery_retention_10: 1 },
    runStartTime: Date.now() - 3 * 60 * 60 * 1000,
    highestRealmReached: 2,
  });
  useGameStore.setState((state) => ({
    ...state,
    realm: { ...state.realm, index: 2, substage: 4 },
    qi: '1234',
  }));
  useInventoryStore.setState({
    items: { gate_foundation_pill: 1 },
    currencies: { gold: '100', spiritStones: '0', merit: '0' },
    gold: '100',
    spiritStones: '0',
    merit: '0',
  });
  useCityStore.setState((state) => ({
    ...state,
    currentCityId: 'city_stonecrag_town',
    unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
  }));
  useTechCollectionStore.setState({ unlockedTechs: { tech_spark_strike: { unlocked: true, masteryXp: 120, rank: 2, manualGrade: 'earth', rarity: 'rare', traits: [], runes: [] } }, fragments: {}, rngSeed: 1 });

  const beforeGain = usePrestigeStore.getState().calculateAPGain();
  assert.ok(beforeGain > 0);

  usePrestigeStore.getState().performPrestige();

  const prestigeState = usePrestigeStore.getState();
  assert.equal(prestigeState.prestigeCount, 2);
  assert.equal(prestigeState.totalAP, 5 + beforeGain);
  assert.equal(prestigeState.lifetimeAP, 7 + beforeGain);
  assert.equal(prestigeState.highestRealmReached, 0);
  assert.equal(prestigeState.prestigeRuns.length, 1);
  assert.equal(useGameStore.getState().realm.index, 0);
  assert.deepEqual(useInventoryStore.getState().items, {});
  assert.deepEqual(useCityStore.getState().unlockedCityIds, ['city_pinewind_hamlet']);
  assert.equal(useCityStore.getState().currentCityId, 'city_pinewind_hamlet');
  assert.equal(useCultivationStore.getState().selectedHeartLawId, null);
  assert.notEqual(prestigeState.spiritRoot, null);
  const retainedTech = useTechCollectionStore.getState().unlockedTechs.tech_spark_strike;
  if (retainedTech) {
    assert.equal(retainedTech.unlocked, false);
    assert.ok(retainedTech.masteryXp >= 0);
  }
});
