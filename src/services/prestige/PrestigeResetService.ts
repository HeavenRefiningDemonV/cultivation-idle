import { useActivityStore } from '../../stores/activityStore.js';
import { useBountyStore } from '../../stores/bountyStore.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useCombatStore } from '../../stores/combatStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useCraftSessionStore } from '../../stores/craftSessionStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { useEquipmentStore } from '../../stores/equipmentStore.js';
import { useExpeditionStore } from '../../stores/expeditionStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { useManualPavilionStore } from '../../stores/manualPavilionStore.js';
import { useManualSatchelStore } from '../../stores/manualSatchelStore.js';
import { useOutskirtsStore } from '../../stores/outskirtsStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useProfessionStore } from '../../stores/professionStore.js';
import { useRecipeMasteryStore } from '../../stores/recipeMasteryStore.js';
import { useRuinsStore } from '../../stores/ruinsStore.js';
import { useTechCollectionStore } from '../../stores/techCollectionStore.js';
import { useTrialStore } from '../../stores/trialStore.js';
import { useZoneStore } from '../../stores/zoneStore.js';
import { useUIStore } from '../../stores/uiStore.js';

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

const snapshotTechniqueMasteryXp = (): Record<string, number> => {
  const unlocked = useTechCollectionStore.getState().unlockedTechs;
  return Object.fromEntries(
    Object.entries(unlocked)
      .filter(([, state]) => Number(state?.masteryXp ?? 0) > 0)
      .map(([techId, state]) => [techId, Number(state.masteryXp ?? 0)]),
  );
};

const snapshotRecipeMastery = (): Record<string, number> => ({ ...useRecipeMasteryStore.getState().alchemy });

const applyMasteryRetention = (carryOver: number, snapshots: { techniqueXp: Record<string, number>; recipeMastery: Record<string, number> }) => {
  if (carryOver <= 0) return;

  const retainedTechniqueXp = Object.fromEntries(
    Object.entries(snapshots.techniqueXp)
      .map(([techId, masteryXp]) => [techId, Math.floor(masteryXp * carryOver)])
      .filter(([, masteryXp]) => Number(masteryXp) > 0),
  );

  if (Object.keys(retainedTechniqueXp).length > 0) {
    useTechCollectionStore.setState((state) => ({
      ...state,
      unlockedTechs: Object.fromEntries(
        Object.entries(retainedTechniqueXp).map(([techId, masteryXp]) => [
          techId,
          {
            unlocked: false,
            masteryXp,
            rank: 1,
            manualGrade: 'mortal',
            rarity: 'common',
            traits: [],
            runes: [],
            favorite: false,
          },
        ]),
      ),
    }));
  }

  const retainedRecipeMastery = Object.fromEntries(
    Object.entries(snapshots.recipeMastery)
      .map(([recipeId, mastery]) => [recipeId, Math.floor(mastery * carryOver)])
      .filter(([, mastery]) => Number(mastery) > 0),
  );
  useRecipeMasteryStore.setState({ alchemy: retainedRecipeMastery });
};

export function performPrestigeReset({ resetGameRun }: PrestigeResetOptions): PrestigeResetSummary {
  const prestigeState = usePrestigeStore.getState();
  const totalAP = prestigeState.totalAP;
  const purchasesById = { ...prestigeState.purchasesById };

  const hybrid = {
    masteryRetentionCarryOver: deriveMasteryRetentionCarryOver(purchasesById),
  };

  const masterySnapshots = {
    techniqueXp: snapshotTechniqueMasteryXp(),
    recipeMastery: snapshotRecipeMastery(),
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
  useUIStore.getState().clearCurrentChapterExhaustedAcknowledgement();
  useManualSatchelStore.getState().hardReset();
  useManualPavilionStore.getState().hardReset();
  useTechCollectionStore.getState().hardReset();
  useRecipeMasteryStore.getState().hardReset();
  useProfessionStore.setState({ alchemyQueue: [], talismanQueue: [], forgeQueue: [], lastTickAt: 0 });
  useExpeditionStore.setState((state) => ({ ...state, active: [] }));
  useCraftSessionStore.setState({ activeSession: null });

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

  applyMasteryRetention(hybrid.masteryRetentionCarryOver, masterySnapshots);

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
