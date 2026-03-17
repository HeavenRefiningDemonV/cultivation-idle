import { setCombatStoreGetter, setInventoryStoreGetter as setGameInventoryStoreGetter, setPrestigeStoreGetter, useGameStore } from '../../src/stores/gameStore.ts';
import { setGameStoreGetter, setInventoryStoreGetter as setPrestigeInventoryStoreGetter, usePrestigeStore } from '../../src/stores/prestigeStore.ts';
import { useActivityStore } from '../../src/stores/activityStore.ts';
import { useBountyStore } from '../../src/stores/bountyStore.ts';
import { useBuffStore } from '../../src/stores/buffStore.ts';
import { useCityStore } from '../../src/stores/cityStore.ts';
import { useCombatStore } from '../../src/stores/combatStore.ts';
import { useCraftSessionStore } from '../../src/stores/craftSessionStore.ts';
import { useEquipmentStore } from '../../src/stores/equipmentStore.ts';
import { useInventoryStore } from '../../src/stores/inventoryStore.ts';
import { useManualPavilionStore } from '../../src/stores/manualPavilionStore.ts';
import { useManualSatchelStore } from '../../src/stores/manualSatchelStore.ts';
import { useMedicinePouchStore } from '../../src/stores/medicinePouchStore.ts';
import { useOutskirtsStore } from '../../src/stores/outskirtsStore.ts';
import { useRecipeMasteryStore } from '../../src/stores/recipeMasteryStore.ts';
import { useRuinsStore } from '../../src/stores/ruinsStore.ts';
import { useShopStore } from '../../src/stores/shopStore.ts';
import { useTechCollectionStore } from '../../src/stores/techCollectionStore.ts';
import { useTrialStore } from '../../src/stores/trialStore.ts';
import { useUIStore } from '../../src/stores/uiStore.ts';
import { useZoneStore } from '../../src/stores/zoneStore.ts';
import { useHeartLawStore } from '../../src/stores/heartLawStore.ts';

export function wireStoreDependenciesForTests(): void {
  setGameStoreGetter(() => useGameStore.getState());
  setPrestigeStoreGetter(() => usePrestigeStore.getState());
  setCombatStoreGetter(() => useCombatStore.getState());
  setGameInventoryStoreGetter(() => useInventoryStore.getState());
  setPrestigeInventoryStoreGetter(() => useInventoryStore.getState());
}

export function resetAllStoresForTest(): void {
  useActivityStore.getState().hardResetActivity();
  useBountyStore.getState().hardResetBounties();
  useBuffStore.getState().hardResetBuffs();
  useCityStore.getState().hardResetCity();
  useCombatStore.getState().hardResetCombat();
  useCraftSessionStore.getState().hardReset();
  useEquipmentStore.getState().hardResetEquipment();
  useGameStore.getState().hardResetGameState();
  useHeartLawStore.getState().resetForNewLife();
  useInventoryStore.getState().hardResetInventory();
  useManualPavilionStore.getState().hardReset();
  useManualSatchelStore.getState().hardReset();
  useMedicinePouchStore.getState().hardReset();
  useOutskirtsStore.getState().hardResetOutskirts();
  usePrestigeStore.getState().hardResetPrestige();
  useRecipeMasteryStore.getState().hardReset();
  useRuinsStore.getState().hardResetRuins();
  useShopStore.getState().hardResetShop();
  useTechCollectionStore.getState().hardReset();
  useTrialStore.getState().hardResetTrials();
  useUIStore.getState().hardResetUI();
  useZoneStore.getState().hardResetZones();
}
