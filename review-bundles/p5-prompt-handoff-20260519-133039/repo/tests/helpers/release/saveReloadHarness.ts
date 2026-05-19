import { getValidatedEconomicContent, primeContentStore, resetEconomicRuntimeStores } from '../economy/setupEconomicRuntimeScenario.js';
import { useActivityStore } from '../../../src/stores/activityStore.js';
import { useBuffStore } from '../../../src/stores/buffStore.js';
import { useCityStore } from '../../../src/stores/cityStore.js';
import { useCombatStore } from '../../../src/stores/combatStore.js';
import { useCraftSessionStore } from '../../../src/stores/craftSessionStore.js';
import { useEquipmentStore } from '../../../src/stores/equipmentStore.js';
import { useExpeditionStore } from '../../../src/stores/expeditionStore.js';
import { useGameStore } from '../../../src/stores/gameStore.js';
import { useCultivationStore } from '../../../src/stores/cultivationStore.js';
import { useInventoryStore } from '../../../src/stores/inventoryStore.js';
import { useManualPavilionStore } from '../../../src/stores/manualPavilionStore.js';
import { useManualSatchelStore } from '../../../src/stores/manualSatchelStore.js';
import { useMedicinePouchStore } from '../../../src/stores/medicinePouchStore.js';
import { useOutskirtsStore } from '../../../src/stores/outskirtsStore.js';
import { usePrestigeStore } from '../../../src/stores/prestigeStore.js';
import { useProfessionStore } from '../../../src/stores/professionStore.js';
import { useRecipeMasteryStore } from '../../../src/stores/recipeMasteryStore.js';
import { useRuinsStore } from '../../../src/stores/ruinsStore.js';
import { useShopStore } from '../../../src/stores/shopStore.js';
import { useTechCollectionStore } from '../../../src/stores/techCollectionStore.js';
import { useTechniqueStore } from '../../../src/stores/techniqueStore.js';
import { useTrialStore } from '../../../src/stores/trialStore.js';
import { useUIStore } from '../../../src/stores/uiStore.js';
import { useZoneStore } from '../../../src/stores/zoneStore.js';
import { loadGame, saveGame } from '../../../src/utils/saveload.js';
import { buildReloadSnapshot, type ReloadSnapshot } from './reloadSnapshot.js';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length() {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

const ensureWindowAndStorage = () => {
  if (!globalThis.localStorage) {
    (globalThis as typeof globalThis & { localStorage: Storage }).localStorage = new MemoryStorage();
  }
  if (!globalThis.window) {
    (globalThis as typeof globalThis & { window: Window & typeof globalThis }).window = globalThis as Window & typeof globalThis;
  }
  if (typeof globalThis.window.confirm !== 'function') {
    (globalThis.window as Window & { confirm: (message?: string) => boolean }).confirm = () => true;
  }
};

const resetRuntimeStoresForReload = () => {
  useGameStore.getState().hardResetGameState();
  useInventoryStore.getState().hardResetInventory();
  useTechniqueStore.getState().resetLoadouts();
  useZoneStore.getState().resetAllZones();
  useCityStore.getState().hardResetCity();
  useActivityStore.getState().hardResetActivity();
  useOutskirtsStore.getState().hardResetOutskirts();
  useTrialStore.getState().hardResetTrials();
  useRuinsStore.getState().hardResetRuins();
  useShopStore.getState().hardResetShop();
  useTechCollectionStore.getState().hardReset();
  useProfessionStore.setState({ alchemyQueue: [], talismanQueue: [], forgeQueue: [], lastTickAt: 0 });
  useEquipmentStore.getState().hardResetEquipment();
  useBuffStore.getState().hardResetBuffs();
  useExpeditionStore.setState((state) => ({ ...state, active: [] }));
  useCultivationStore.getState().resetForNewLife();
  useManualPavilionStore.getState().hardReset();
  useManualSatchelStore.getState().hardReset();
  useMedicinePouchStore.getState().hardReset();
  useCraftSessionStore.getState().hardReset();
  useRecipeMasteryStore.getState().hardReset();
  usePrestigeStore.getState().hardResetPrestige();
  const combat = useCombatStore.getState();
  if (combat.resetCombat) combat.resetCombat();
  else combat.exitCombat();
  useUIStore.getState().hardResetUI();
};

export type ReloadScenario = 'after_city_unlock' | 'after_prestige_ready' | 'after_cap_acknowledged';

export async function seedScenario(scenario: ReloadScenario) {
  ensureWindowAndStorage();
  localStorage.clear();
  resetEconomicRuntimeStores();
  const content = await getValidatedEconomicContent();
  primeContentStore(content);
  useCityStore.getState().initializeFromContent(content.cities);
  useGameStore.setState((state) => {
    state.realm.index = 0;
    state.realm.substage = 1;
    state.realm.name = 'Qi Condensation';
  });
  useGameStore.getState().setFocusMode('balanced');
  useGameStore.getState().selectPath('heaven');
  useUIStore.getState().clearCurrentChapterExhaustedAcknowledgement();

  if (scenario === 'after_city_unlock' || scenario === 'after_prestige_ready') {
    useGameStore.setState((state) => {
      state.realm.index = 1;
      state.realm.substage = 1;
      state.realm.name = 'Foundation Establishment';
    });
    useCityStore.setState((state) => {
      state.unlockedCityIds = ['city_pinewind_hamlet', 'city_stonecrag_town'];
      state.currentCityId = 'city_stonecrag_town';
      state.selectedModuleByCity = {
        city_pinewind_hamlet: 'outskirts',
        city_stonecrag_town: 'outskirts',
      };
    });
  }

  if (scenario === 'after_prestige_ready') {
    useGameStore.setState((state) => {
      state.realm.index = 2;
      state.realm.substage = 1;
      state.realm.name = 'Core Formation';
    });
    usePrestigeStore.setState({
      highestRealmReached: 2,
      totalAP: 30,
      lifetimeAP: 30,
      currentRunAP: 30,
    });
  }

  if (scenario === 'after_cap_acknowledged') {
    useGameStore.setState((state) => {
      state.realm.index = 4;
      state.realm.substage = 1;
      state.realm.name = 'Soul Formation';
    });
    useCityStore.setState((state) => {
      state.unlockedCityIds = content.cities.map((city) => city.id);
      state.currentCityId = content.cities[content.cities.length - 1]?.id ?? 'city_ironpeak_bastion';
    });
    usePrestigeStore.setState({
      highestRealmReached: 4,
      totalAP: 50,
      lifetimeAP: 50,
      currentRunAP: 50,
    });
  }
}

export function saveAndReloadSnapshot(): { before: ReloadSnapshot; after: ReloadSnapshot } {
  const before = buildReloadSnapshot();
  if (!saveGame()) throw new Error('saveGame failed in saveAndReloadSnapshot');
  resetRuntimeStoresForReload();
  const loaded = loadGame();
  if (!loaded) throw new Error('loadGame failed in saveAndReloadSnapshot');
  const after = buildReloadSnapshot();
  return { before, after };
}

export function resetRuntimeButKeepStorage() {
  resetRuntimeStoresForReload();
}

export function ensureHarnessEnvironment() {
  ensureWindowAndStorage();
}
