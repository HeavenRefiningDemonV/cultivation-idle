import { useShallow } from 'zustand/shallow';
import { useActivityStore } from '../../stores/activityStore.js';
import { useBountyStore } from '../../stores/bountyStore.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useCombatStore } from '../../stores/combatStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { useExpeditionStore } from '../../stores/expeditionStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { useMedicinePouchStore } from '../../stores/medicinePouchStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useProfessionStore } from '../../stores/professionStore.js';
import { useTrialStore } from '../../stores/trialStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { buildStatusDashboardSurface } from '../../systems/ui/status/statusDashboardSurface.js';

export function useStatusDashboardSurface() {
  const activity = useActivityStore(useShallow((state) => ({
    active: state.active,
    lastChangedAt: state.lastChangedAt,
  })));
  const combat = useCombatStore(useShallow((state) => ({
    inCombat: state.inCombat,
    currentEnemy: state.currentEnemy,
    playerHP: state.playerHP,
    playerMaxHP: state.playerMaxHP,
    enemyHP: state.enemyHP,
    enemyMaxHP: state.enemyMaxHP,
    combatContext: state.combatContext,
  })));
  const bounty = useBountyStore(useShallow((state) => ({
    activeByCityId: state.activeByCityId,
    trackedByCityId: state.trackedByCityId,
  })));
  const city = useCityStore(useShallow((state) => ({
    currentCityId: state.currentCityId,
    unlockedCityIds: state.unlockedCityIds,
    selectedModuleByCity: state.selectedModuleByCity,
  })));
  const content = useContentStore(useShallow((state) => ({
    isLoaded: state.isLoaded,
    raw: state.raw,
    maps: state.maps,
  })));
  const cultivation = useCultivationStore(useShallow((state) => ({
    selectedHeartLawId: state.selectedHeartLawId,
    chapter: state.chapter,
    breathMode: state.breathMode,
  })));
  const expedition = useExpeditionStore(useShallow((state) => ({
    slots: state.slots,
    active: state.active,
  })));
  const game = useGameStore(useShallow((state) => ({
    realm: state.realm,
    qi: state.qi,
    qiPerSecond: state.qiPerSecond,
    focusMode: state.focusMode,
    selectedPath: state.selectedPath,
    stats: state.stats,
  })));
  const inventory = useInventoryStore(useShallow((state) => ({
    currencies: state.currencies,
    items: state.items,
    gold: state.gold,
  })));
  const pouch = useMedicinePouchStore((state) => state.slots);
  const prestige = usePrestigeStore(useShallow((state) => ({
    spiritRoot: state.spiritRoot,
    highestRealmReached: state.highestRealmReached,
  })));
  const profession = useProfessionStore(useShallow((state) => ({
    alchemyQueue: state.alchemyQueue,
    talismanQueue: state.talismanQueue,
    forgeQueue: state.forgeQueue,
  })));
  const trial = useTrialStore((state) => state.progressByTrialId);
  const ui = useUIStore(useShallow((state) => ({
    activeTab: state.activeTab,
    autoStartCombat: state.autoStartCombat,
    settings: state.settings,
  })));

  void activity;
  void combat;
  void bounty;
  void city;
  void content;
  void cultivation;
  void expedition;
  void game;
  void inventory;
  void pouch;
  void prestige;
  void profession;
  void trial;
  void ui;

  return buildStatusDashboardSurface();
}
