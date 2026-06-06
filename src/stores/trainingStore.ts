import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ForegroundActivityType } from '../types/activity.js';
import { COMBAT_ACTIVITY_TYPES } from '../types/activity.js';
import { useActivityStore } from './activityStore.js';
import { useContentStore } from './contentStore.js';
import { useGameStore } from './gameStore.js';
import {
  copyTrainingSaveState,
  createDefaultTrainingSaveState,
  createTrainingRuntimeContent,
  resolveTrainingOffline,
  resolveTrainingOfflineEfficiency,
  resolveTrainingRegimenUnlock,
  resolveTrainingSupportMultipliers,
  resolveTrainingTick,
  sanitizeTrainingSaveState,
  trainingStatCap,
  type ResolveTrainingSupportMultipliersInput,
  type SaveTrainingState,
  type TrainingActionFailureReason,
  type TrainingOfflineResult,
  type TrainingRuntimeContent,
  type TrainingTickResult,
} from '../systems/training/index.js';
import type { TrainingIntensityId } from '../content/types.js';
import { usePrestigeStore } from './prestigeStore.js';
import {
  applyFormMemoryTrainingFloor,
  resolveOldSparringMasteryMultiplier,
} from '../systems/prestige/prestigeMemory.js';
import {
  buildPathTrainingMemoryKey,
  buildSpiritRootMemoryKey,
  resolvePrestigeReclaimState,
} from '../systems/prestige/prestigeMemoryResolver.js';
import { GameEvents } from '../services/events/GameEvents.js';
import { useCultivationStore } from './cultivationStore.js';
import { getHeartLawBonuses } from '../systems/heartLaw/heartLawLogic.js';
import { getSpiritRootPairKey } from '../systems/spiritRoots/index.js';

export type TrainingStartResult =
  | { ok: true; previousActivityType: ForegroundActivityType | null }
  | { ok: false; reason: TrainingActionFailureReason };

type TrainingTickStoreResult = TrainingTickResult | { ok: false; reason: TrainingActionFailureReason };

interface TrainingStoreState extends SaveTrainingState {
  startTraining: (regimenId: string, intensityId: TrainingIntensityId, opts?: { now?: number }) => TrainingStartResult;
  stopTraining: (reason?: string) => void;
  tickTraining: (elapsedMs: number, opts?: { now?: number }) => TrainingTickStoreResult;
  applyOfflineTraining: (elapsedMs: number, opts?: { completedAt?: number }) => TrainingOfflineResult;
  hydrateFromSave: (slice?: unknown, opts?: { activeActivityType?: ForegroundActivityType | null }) => void;
  toSaveState: () => SaveTrainingState;
  resetForNewLife: () => void;
  hardResetTraining: () => void;
}

const saveFields = (state: SaveTrainingState): SaveTrainingState => copyTrainingSaveState(state);

const getRuntimeContent = (): TrainingRuntimeContent | null => {
  const raw = useContentStore.getState().raw;
  if (!raw) return null;
  const content = createTrainingRuntimeContent(raw);
  if (content.regimens.length === 0 || content.intensities.length === 0 || content.stats.length === 0) {
    return null;
  }
  return content;
};

const getTrainingContext = () => {
  const game = useGameStore.getState();
  return {
    realmIndex: game.realm?.index ?? 0,
    substageIndex: Math.max(0, (game.realm?.substage ?? 1) - 1),
    selectedPath: game.selectedPath ?? null,
  };
};

const getTrainingMemoryMultiplier = (regimenId: string): number => {
  const prestige = usePrestigeStore.getState();
  return resolveOldSparringMasteryMultiplier({
    purchasesById: prestige.purchasesById,
    currentMasteryXp: useTrainingStore.getState().regimenMasteryXpById[regimenId] ?? 0,
    previousMilestoneXp: prestige.memoryLedger.previousRegimenMasteryMilestonesById[regimenId],
  });
};

const getReclaimRank = (purchasesById: Record<string, number>): number =>
  Math.max(
    purchasesById.form_memory ?? 0,
    purchasesById.scripture_echo ?? 0,
    purchasesById.root_clarity ?? 0,
    purchasesById.old_sparring_shadows ?? 0,
  );

const getTrainingReclaimMemoryByStatId = (input: {
  regimen: TrainingRuntimeContent['regimens'][number];
  state: SaveTrainingState;
  gameContext: ReturnType<typeof getTrainingContext>;
}): NonNullable<Parameters<typeof resolveTrainingTick>[0]['reclaimMemoryByStatId']> => {
  const prestige = usePrestigeStore.getState();
  const rank = getReclaimRank(prestige.purchasesById);
  if (rank <= 0 || prestige.memoryLedger.records.length === 0 || !input.gameContext.selectedPath) return {};
  const cultivation = useCultivationStore.getState();
  const rootKey = prestige.spiritRoot
    ? buildSpiritRootMemoryKey({
        rootElement: prestige.spiritRoot.element,
        shape: 'single',
        variantKey: `grade_${prestige.spiritRoot.grade}`,
        lawPair: cultivation.selectedHeartLawId,
      })
    : null;
  const cap = trainingStatCap({
    realmIndex: input.gameContext.realmIndex,
    substageIndex: input.gameContext.substageIndex,
  });
  const result: NonNullable<Parameters<typeof resolveTrainingTick>[0]['reclaimMemoryByStatId']> = {};
  const statIds = new Set([input.regimen.primaryStatId, input.regimen.secondaryStatId, input.regimen.foundationStatId]);
  statIds.forEach((statId) => {
    const componentKey = buildPathTrainingMemoryKey({
      pathId: input.gameContext.selectedPath as string,
      statId,
      regimenId: input.regimen.id,
      realmBand: `realm_${Math.max(0, Math.floor(input.gameContext.realmIndex))}`,
    });
    const resolved = resolvePrestigeReclaimState({
      records: prestige.memoryLedger.records,
      reclaimRank: rank,
      current: {
        lifeId: `life-${Math.max(1, prestige.prestigeCount + 1)}`,
        realmIndex: input.gameContext.realmIndex,
        path: {
          pathId: input.gameContext.selectedPath as string,
          statId,
          regimenId: input.regimen.id,
          realmBand: `realm_${Math.max(0, Math.floor(input.gameContext.realmIndex))}`,
          currentRating: input.state.statRatingsById[statId] ?? 0,
          currentRealmCap: cap,
        },
        composite: {
          pathId: input.gameContext.selectedPath,
          heartLawId: cultivation.selectedHeartLawId,
          rootKey,
          gateChainId: null,
        },
      },
    });
    const row = resolved.rows.find((candidate) =>
      candidate.record.domain === 'path_training' && candidate.record.componentKey === componentKey && candidate.state === 'active');
    if (!row || row.record.priorBest.rating === undefined) return;
    result[statId] = {
      multiplier: row.activeMultiplier,
      floorValue: row.activeFloorValue,
      priorBestRating: row.record.priorBest.rating,
    };
  });
  return result;
};

export const getLiveTrainingSupportInput = (opts: { offline?: boolean } = {}): ResolveTrainingSupportMultipliersInput => {
  const cultivation = useCultivationStore.getState();
  const prestige = usePrestigeStore.getState();
  const heartLawId = cultivation.selectedHeartLawId;
  const heartLawDef = heartLawId ? useContentStore.getState().maps.heartLawsById[heartLawId] ?? null : null;
  const heartLawBonuses = heartLawDef
    ? getHeartLawBonuses({
        heartLawDef,
        chapter: cultivation.chapter,
        spiritRoot: prestige.spiritRoot,
      })
    : null;
  const rootResonance = prestige.spiritRoot
    ? cultivation.rootResonanceByPair[getSpiritRootPairKey(prestige.spiritRoot.element, heartLawId)] ?? 0
    : 0;
  const rootSupport = rootResonance > 0 ? 1 + Math.min(100, Math.max(0, rootResonance)) / 500 : undefined;
  const heartLawOfflineAdd = heartLawBonuses?.offlineEfficiencyAdd ?? 0;
  const prestigeOfflineAdd = prestige.getOfflineEfficiencyBonusAdditive();
  const offlineEfficiency = opts.offline
    ? resolveTrainingOfflineEfficiency() + Math.max(0, heartLawOfflineAdd) + Math.max(0, prestigeOfflineAdd)
    : undefined;
  const prestigeFloor = prestige.getPrestigeMemoryEffects().formMemoryFloor;

  return {
    pathAffinity: heartLawDef && prestige.spiritRoot ? heartLawBonuses?.affinityMultiplier : undefined,
    heartLawSupport: heartLawDef ? heartLawBonuses?.techniqueMasteryGainMult : undefined,
    rootSupport,
    offlineEfficiency,
    prestigeFloor: prestigeFloor > 0 ? prestigeFloor : undefined,
  };
};

const clearActiveFields = (state: SaveTrainingState) => {
  state.activeRegimenId = null;
  state.activeIntensityId = null;
  state.lastTickAt = null;
};

export const useTrainingStore = create<TrainingStoreState>()(
  immer((set, get) => ({
    ...createDefaultTrainingSaveState(),

    startTraining: (regimenId, intensityId, opts) => {
      const content = getRuntimeContent();
      if (!content) return { ok: false, reason: 'content_unavailable' };
      const regimen = content.regimensById[regimenId];
      if (!regimen) return { ok: false, reason: 'invalid_regimen' };
      if (!content.intensitiesById[intensityId]) return { ok: false, reason: 'invalid_intensity' };

      const gameContext = getTrainingContext();
      if (!gameContext.selectedPath) return { ok: false, reason: 'path_not_selected' };
      if (gameContext.selectedPath !== regimen.path) return { ok: false, reason: 'path_mismatch' };
      if (!resolveTrainingRegimenUnlock({
        regimen,
        selectedPath: gameContext.selectedPath,
        realmIndex: gameContext.realmIndex,
      }).unlocked) {
        return { ok: false, reason: 'regimen_locked' };
      }

      const activityStore = useActivityStore.getState();
      const active = activityStore.active;
      if (active && COMBAT_ACTIVITY_TYPES.includes(active.type)) {
        return { ok: false, reason: 'combat_activity_active' };
      }

      const previousActivityType = active?.type ?? null;
      const now = opts?.now ?? Date.now();
      activityStore.startActivity(
        'path_training',
        { sourceId: regimenId, regimenId, intensityId },
        'training:start',
      );

      set((state) => {
        const withMemory = applyFormMemoryTrainingFloor({
          state,
          content,
          selectedPath: gameContext.selectedPath,
          realmIndex: gameContext.realmIndex,
          substageIndex: gameContext.substageIndex,
          purchasesById: usePrestigeStore.getState().purchasesById,
        });
        Object.assign(state, withMemory);
        state.activeRegimenId = regimenId;
        state.activeIntensityId = intensityId;
        state.lastTickAt = now;
      });
      GameEvents.emit({
        type: 'training/started',
        payload: {
          timestamp: now,
          path: gameContext.selectedPath,
          regimenId,
          intensity: intensityId,
          realmId: `realm_${gameContext.realmIndex}`,
          ratingSnapshot: { ...get().statRatingsById },
          fatigue: get().fatigue,
        },
      });

      return { ok: true, previousActivityType };
    },

    stopTraining: (reason = 'training:stop') => {
      if (useActivityStore.getState().active?.type === 'path_training') {
        useActivityStore.getState().stopActivity(reason);
      }
      set((state) => {
        clearActiveFields(state);
      });
    },

    tickTraining: (elapsedMs, opts) => {
      const active = useActivityStore.getState().active;
      if (active && COMBAT_ACTIVITY_TYPES.includes(active.type)) {
        return { ok: false, reason: 'combat_activity_active' };
      }
      if (active?.type !== 'path_training' || !get().activeRegimenId || !get().activeIntensityId) {
        return { ok: false, reason: 'no_active_training' };
      }
      const content = getRuntimeContent();
      if (!content) return { ok: false, reason: 'content_unavailable' };
      const gameContext = getTrainingContext();
      const before = get().toSaveState();
      const regimenId = get().activeRegimenId!;
      const intensityId = get().activeIntensityId!;
      const support = resolveTrainingSupportMultipliers(getLiveTrainingSupportInput());
      const regimen = content.regimensById[regimenId];
      const result = resolveTrainingTick({
        state: before,
        content,
        regimenId,
        intensityId,
        elapsedMs,
        ...gameContext,
        pathAffinity: support.pathAffinity,
        heartLawSupport: support.heartLawSupport,
        rootSupport: support.rootSupport,
        prestigeFloor: support.prestigeFloor,
        masteryXpMultiplier: getTrainingMemoryMultiplier(regimenId),
        reclaimMemoryByStatId: regimen
          ? getTrainingReclaimMemoryByStatId({ regimen, state: before, gameContext })
          : undefined,
      });

      if (!result.ok) return result;
      const now = opts?.now ?? Date.now();
      set((state) => {
        Object.assign(state, result.nextState);
        state.lastTickAt = now;
      });
      const cap = trainingStatCap({
        realmIndex: gameContext.realmIndex,
        substageIndex: gameContext.substageIndex,
      });
      Object.entries(result.ratingGainedById).forEach(([statId, gained]) => {
        if (gained <= 0) return;
        const oldGrade = Math.floor(before.statRatingsById[statId] ?? 0);
        const newGrade = Math.floor(result.nextState.statRatingsById[statId] ?? oldGrade);
        GameEvents.emit({
          type: 'training/grade_changed',
          payload: {
            timestamp: now,
            statId,
            oldGrade,
            newGrade,
            minutesSinceLastGrade: elapsedMs / 60_000,
            realmId: `realm_${gameContext.realmIndex}`,
          },
        });
        if (oldGrade < cap && newGrade >= cap) {
          GameEvents.emit({
            type: 'training/cap_hit',
            payload: {
              timestamp: now,
              statId,
              realmId: `realm_${gameContext.realmIndex}`,
              rating: newGrade,
              masteryRank: result.nextState.regimenMasteryXpById[regimenId] ?? 0,
            },
          });
        }
      });
      return result;
    },

    applyOfflineTraining: (elapsedMs, opts) => {
      const content = getRuntimeContent();
      if (!content) {
        return {
          nextState: get().toSaveState(),
          appliedMs: 0,
          blockedReason: 'content_unavailable',
          totalStatXpGainedById: {},
          totalRatingGainedById: {},
          totalMasteryXpGainedByRegimenId: {},
          totalFatigueGained: 0,
          intensityDowngrades: 0,
        };
      }
      const activeRegimenId = get().activeRegimenId;
      const gameContext = getTrainingContext();
      const before = get().toSaveState();
      const activeRegimen = activeRegimenId ? content.regimensById[activeRegimenId] : null;
      const support = resolveTrainingSupportMultipliers(getLiveTrainingSupportInput({ offline: true }));
      const result = resolveTrainingOffline({
        state: before,
        content,
        activeActivityType: useActivityStore.getState().active?.type ?? null,
        elapsedMs,
        ...gameContext,
        offlineEfficiency: support.offlineEfficiency,
        pathAffinity: support.pathAffinity,
        heartLawSupport: support.heartLawSupport,
        rootSupport: support.rootSupport,
        prestigeFloor: support.prestigeFloor,
        masteryXpMultiplier: activeRegimenId
          ? getTrainingMemoryMultiplier(activeRegimenId)
          : 1,
        reclaimMemoryByStatId: activeRegimen
          ? getTrainingReclaimMemoryByStatId({ regimen: activeRegimen, state: before, gameContext })
          : undefined,
        completedAt: opts?.completedAt,
      });
      if (result.appliedMs > 0) {
        set((state) => {
          Object.assign(state, result.nextState);
          state.lastTickAt = opts?.completedAt ?? Date.now();
        });
      }
      GameEvents.emit({
        type: 'training/offline_applied',
        payload: {
          timestamp: opts?.completedAt ?? Date.now(),
          appliedMs: result.appliedMs,
          ratingGainedById: { ...result.totalRatingGainedById },
          statXpGainedById: { ...result.totalStatXpGainedById },
          masteryXpGainedByRegimenId: { ...result.totalMasteryXpGainedByRegimenId },
          fatigueGained: result.totalFatigueGained,
          intensityDowngrades: result.intensityDowngrades,
          blockedReason: result.blockedReason,
        },
      });
      return result;
    },

    hydrateFromSave: (slice, opts) => {
      const content = getRuntimeContent();
      const sanitized = sanitizeTrainingSaveState(slice, content, opts);
      set(() => saveFields(sanitized));
    },

    toSaveState: () => saveFields(get()),

    resetForNewLife: () => {
      if (useActivityStore.getState().active?.type === 'path_training') {
        useActivityStore.getState().stopActivity('training:reset');
      }
      set(() => createDefaultTrainingSaveState());
    },

    hardResetTraining: () => {
      if (useActivityStore.getState().active?.type === 'path_training') {
        useActivityStore.getState().stopActivity('training:hard-reset');
      }
      set(() => createDefaultTrainingSaveState());
    },
  })),
);
