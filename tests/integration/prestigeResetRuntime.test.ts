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

const loadRuntimeContent = async (): Promise<RuntimeContent> => {
  if (!runtimeContentPromise) {
    runtimeContentPromise = (async () => ({
      economy: await readJson('economy.json'),
      cities: await readJson('cities.json'),
      heart_laws: await readJson('heart_laws.json'),
      items: await readJson('items.json'),
      trials: await readJson('trials.json'),
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
  assert.deepEqual(useZoneStore.getState().unlockedZones, ['starting_plains']);
  assert.equal(useActivityStore.getState().active, null);
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
    highestRealmReached: 1,
  });
  useGameStore.setState((state) => ({
    ...state,
    realm: { ...state.realm, index: 1, substage: 4 },
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
});
