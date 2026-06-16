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
import { useTrainingStore } from '../../stores/trainingStore.js';
import { isTemperingCourtEnabled } from '../../ui/court/courtFlag.js';
import { useCourtMeridianStore } from '../../features/court/useCourtMeridianStore.js';
import { getMeridianPackCache } from '../../features/court/meridianPackCache.js';
import { useTechCollectionStore } from '../../stores/techCollectionStore.js';
import { useTrialStore } from '../../stores/trialStore.js';
import { useZoneStore } from '../../stores/zoneStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { hardResetBreakthroughEchoes } from '../../features/breakthroughEchoes/index.js';
import { deriveMasteryRetentionCarryOver } from './PrestigeResetContract.js';
import { GameEvents } from '../events/GameEvents.js';
import { recomputeAndApplyPrestigeUnlocks } from '../../systems/prestige/applyPrestigeEffects.js';
import {
  buildPrestigeMemoryLedgerForReset,
  type PrestigeMemoryAppliedRow,
} from '../../systems/prestige/prestigeMemory.js';
import { createTrainingRuntimeContent } from '../../systems/training/index.js';
import type { PathId } from '../../content/types.js';

export interface PrestigeResetOptions {
  resetGameRun: () => void;
  currentLife?: {
    selectedPath: PathId | null;
    realmIndex: number;
    substageIndex: number;
  };
}

export interface PrestigeResetSummary {
  permanent: {
    totalAP: number;
    purchasesById: Record<string, number>;
  };
  hybrid: {
    masteryRetentionCarryOver: number;
    memoryAppliedRows: PrestigeMemoryAppliedRow[];
  };
  reset: {
    cityBaselineId: string | null;
    clearedActivity: boolean;
  };
}

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

export function performPrestigeReset({ resetGameRun, currentLife }: PrestigeResetOptions): PrestigeResetSummary {
  const prestigeState = usePrestigeStore.getState();
  const totalAP = prestigeState.totalAP;
  const purchasesById = { ...prestigeState.purchasesById };
  const now = Date.now();

  const hybrid = {
    masteryRetentionCarryOver: deriveMasteryRetentionCarryOver(purchasesById),
    memoryAppliedRows: [] as PrestigeMemoryAppliedRow[],
  };

  const masterySnapshots = {
    techniqueXp: snapshotTechniqueMasteryXp(),
    recipeMastery: snapshotRecipeMastery(),
  };
  const rawContent = useContentStore.getState().raw;
  const trainingContent = rawContent ? createTrainingRuntimeContent(rawContent) : null;
  const trainingStateBeforeReset = useTrainingStore.getState().toSaveState();
  const cultivationStateBeforeReset = useCultivationStore.getState();
  const cityStateBeforeReset = useCityStore.getState();
  const trialProgressBeforeReset = { ...useTrialStore.getState().progressByTrialId };
  const memoryLedger = buildPrestigeMemoryLedgerForReset({
    purchasesById,
    previousLedger: prestigeState.memoryLedger,
    trainingState: trainingStateBeforeReset,
    trainingContent,
    heartLawState: {
      selectedHeartLawId: cultivationStateBeforeReset.selectedHeartLawId,
      heartLawLevelById: { ...cultivationStateBeforeReset.heartLawLevelById },
      heartLawXpById: { ...cultivationStateBeforeReset.heartLawXpById },
      verseMasteryByLawId: { ...cultivationStateBeforeReset.verseMasteryByLawId },
      rootResonanceByPair: { ...cultivationStateBeforeReset.rootResonanceByPair },
    },
    selectedPath: currentLife?.selectedPath,
    realmIndex: currentLife?.realmIndex,
    substageIndex: currentLife?.substageIndex,
    spiritRoot: prestigeState.spiritRoot,
    currentCityId: cityStateBeforeReset.currentCityId,
    trialProgressByTrialId: trialProgressBeforeReset,
    trialContent: rawContent?.trials ?? [],
    prestigeCount: prestigeState.prestigeCount,
    now,
  });
  hybrid.memoryAppliedRows = memoryLedger.lastAppliedRows.filter((row) => row.appliedAt === now);

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
  // W13a-6: reincarnation applies the Court's Form-Memory floor + re-rolls meridian roots
  // (§2.11). Flag-gated; the legacy training reset above is unchanged on the off path.
  if (isTemperingCourtEnabled()) {
    const path = currentLife?.selectedPath ?? null;
    const meridianIds = getMeridianPackCache()
      .filter((def) => !path || def.path === path)
      .map((def) => def.id);
    useCourtMeridianStore.getState().resetForPrestige(meridianIds);
  }
  useTechCollectionStore.getState().hardReset();
  useRecipeMasteryStore.getState().hardReset();
  useTrainingStore.getState().resetForNewLife();
  useProfessionStore.setState({ alchemyQueue: [], talismanQueue: [], forgeQueue: [], lastTickAt: 0 });
  useExpeditionStore.setState((state) => ({ ...state, active: [] }));
  useCraftSessionStore.setState({ activeSession: null });
  hardResetBreakthroughEchoes();

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
  recomputeAndApplyPrestigeUnlocks(purchasesById);
  usePrestigeStore.getState().setPrestigeMemoryLedger(memoryLedger);

  hybrid.memoryAppliedRows.forEach((row) => {
    GameEvents.emit({
      type: 'prestige/memory_applied',
      payload: {
        timestamp: now,
        effectId: row.effectId,
        rank: row.rank,
        value: row.value,
        targetId: row.targetId,
      },
    });
  });
  memoryLedger.lastResetBucketIds.forEach((bucketId) => {
    GameEvents.emit({
      type: 'prestige/reset_bucket_applied',
      payload: {
        timestamp: now,
        bucketId,
        kind: bucketId === 'root_clarity_floor' ? 'rebuilt' : bucketId.includes('memory') || bucketId.includes('echo') || bucketId.includes('sparring') || bucketId.includes('calm') || bucketId.includes('form') ? 'hybrid' : 'reset',
        label: bucketId.replaceAll('_', ' '),
      },
    });
  });

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
