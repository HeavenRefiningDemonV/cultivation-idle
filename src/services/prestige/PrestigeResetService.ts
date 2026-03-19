import { useActivityStore } from '../../stores/activityStore.js';
import { useBountyStore } from '../../stores/bountyStore.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useCombatStore } from '../../stores/combatStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { useEquipmentStore } from '../../stores/equipmentStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { useOutskirtsStore } from '../../stores/outskirtsStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useRuinsStore } from '../../stores/ruinsStore.js';
import { useTrialStore } from '../../stores/trialStore.js';
import { useZoneStore } from '../../stores/zoneStore.js';

export interface PrestigeResetOptions {
  resetGameRun: () => void;
}

export interface PrestigeResetSummary {
  permanent: {
    totalAP: number;
    purchasesById: Record<string, number>;
  };
  hybrid: {
    masteryRetentionCarryOver: number;
  };
  reset: {
    cityBaselineId: string | null;
    clearedActivity: boolean;
  };
}

const MASTERY_RETENTION_BY_NODE_ID: Readonly<Record<string, number>> = {
  ap_mastery_retention_10: 0.1,
  ap_mastery_retention_25: 0.25,
  ap_mastery_retention_50: 0.5,
};

export const deriveMasteryRetentionCarryOver = (purchasesById: Record<string, number>): number =>
  Object.entries(MASTERY_RETENTION_BY_NODE_ID).reduce((best, [nodeId, ratio]) => {
    const purchasedLevels = purchasesById[nodeId] ?? 0;
    return purchasedLevels > 0 ? Math.max(best, ratio) : best;
  }, 0);

export function performPrestigeReset({ resetGameRun }: PrestigeResetOptions): PrestigeResetSummary {
  const prestigeState = usePrestigeStore.getState();
  const totalAP = prestigeState.totalAP;
  const purchasesById = { ...prestigeState.purchasesById };

  const hybrid = {
    masteryRetentionCarryOver: deriveMasteryRetentionCarryOver(purchasesById),
  };

  const hadActiveActivity = useActivityStore.getState().active !== null;

  resetGameRun();
  useCultivationStore.getState().resetForNewLife();
  useInventoryStore.getState().resetInventory();
  useEquipmentStore.getState().hardResetEquipment();
  useTrialStore.getState().hardResetTrials();
  useRuinsStore.getState().hardResetRuins();
  useZoneStore.getState().resetAllZones();
  useOutskirtsStore.getState().hardResetOutskirts();
  useBountyStore.getState().hardResetBounties();
  useActivityStore.getState().hardResetActivity();

  const combatStore = useCombatStore.getState();
  if (combatStore.resetCombat) {
    combatStore.resetCombat();
  } else {
    combatStore.exitCombat();
  }

  const cityStore = useCityStore.getState();
  cityStore.hardResetCity();
  const citiesSorted = useContentStore.getState().citiesSorted;
  if (citiesSorted.length > 0) {
    useCityStore.getState().initializeFromContent(citiesSorted);
  }

  return {
    permanent: {
      totalAP,
      purchasesById,
    },
    hybrid,
    reset: {
      cityBaselineId: useCityStore.getState().currentCityId,
      clearedActivity: hadActiveActivity,
    },
  };
}
