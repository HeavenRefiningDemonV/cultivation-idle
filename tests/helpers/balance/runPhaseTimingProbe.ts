import { REALMS } from '../../../src/constants/index.js';
import { GameEvents, type GameEvent } from '../../../src/services/events/GameEvents.js';
import {
  buildPhaseTimingReport,
  getCumulativeMajorEntryTargetSeconds,
  GATE_1_TRANSITION,
  PROGRESSION_MILESTONE_IDS,
} from '../../../src/systems/balance/phaseTimingTargets.js';
import { getProgressionContract, getTransitionByFromRealm } from '../../../src/systems/progression/contract/progressionContract.js';
import type { MajorRealmId } from '../../../src/systems/progression/contract/contractTypes.js';
import { adaptProgressionAuthoredContent } from '../../../src/systems/progression/contract/contentAdapter.js';
import { getLiveRealmByIndex } from '../../../src/systems/progression/runtime/liveRealmProjection.js';
import { getTrialLifecycleSnapshot } from '../../../src/systems/progression/runtime/trialLifecycle.js';
import { useCityStore } from '../../../src/stores/cityStore.js';
import { useContentStore } from '../../../src/stores/contentStore.js';
import { useGameStore } from '../../../src/stores/gameStore.js';
import { useInventoryStore } from '../../../src/stores/inventoryStore.js';
import { useTrialStore } from '../../../src/stores/trialStore.js';
import { createTimingProbeScenario } from './createTimingProbeScenario.js';
import { progressionTimingTracker } from '../../../src/services/diagnostics/progressionTimingTracker.js';

const MAJOR_ENTRY_MILESTONE_BY_REALM_INDEX: Record<number, string> = {
  1: PROGRESSION_MILESTONE_IDS.FOUNDATION_ENTRY,
  2: PROGRESSION_MILESTONE_IDS.CORE_FORMATION_ENTRY,
  3: PROGRESSION_MILESTONE_IDS.NASCENT_SOUL_ENTRY,
  4: PROGRESSION_MILESTONE_IDS.SOUL_FORMATION_ENTRY,
  5: PROGRESSION_MILESTONE_IDS.SPIRIT_SEVERING_ENTRY,
};

export type PhaseTimingProbeResult = {
  representativePath: string;
  representativePathQiMultiplier: number;
  lifeStartMs: number;
  gate1AvailableMs: number | null;
  foundationEntryMs: number | null;
  cumulativeMilestoneSeconds: Partial<Record<string, number>>;
  milestoneOrder: string[];
  progressionEvents: GameEvent[];
  finalCityId: string | null;
  finalRealmId: string;
  phaseTimingReport: ReturnType<typeof buildPhaseTimingReport>;
};

const getRealmIdFromIndex = (realmIndex: number): string => {
  return getLiveRealmByIndex(realmIndex).id;
};

export async function runPhaseTimingProbe(options: { pathStrategy?: 'representative' | 'highest_qi' } = {}): Promise<PhaseTimingProbeResult> {
  const scenario = await createTimingProbeScenario(options);
  const content = useContentStore.getState().raw;
  if (!content) {
    throw new Error('Timing probe requires loaded content.');
  }

  const contract = getProgressionContract(adaptProgressionAuthoredContent(content));

  for (const transition of contract.gateTransitions) {
    useInventoryStore.getState().addItem(transition.gateItemId, 3);
    const trial = useContentStore.getState().maps.trialsById[transition.trialId];
    if (trial?.requiredItemId) {
      useInventoryStore.getState().addItem(trial.requiredItemId, 3);
    }
  }

  const progressionEvents: GameEvent[] = [];
  const runStartTime = useGameStore.getState().runStartTime;
  progressionTimingTracker.resetForRun(runStartTime);
  const onAny = (event: GameEvent) => {
    if (event.type.startsWith('progression/')) {
      progressionEvents.push(event);
    }
  };
  GameEvents.onAny(onAny);
  progressionTimingTracker.emitLifeStarted(runStartTime);

  const stepMs = 1_000;
  const maxMs = 15 * 60 * 60 * 1000;
  let elapsedMs = 0;
  let gate1AvailableMs: number | null = null;
  let foundationEntryMs: number | null = null;

  const cumulativeMilestoneSeconds: Partial<Record<string, number>> = {
    [PROGRESSION_MILESTONE_IDS.LIFE_START]: 0,
  };
  const milestoneOrder: string[] = [PROGRESSION_MILESTONE_IDS.LIFE_START];
  const seenGateAvailability = new Set<string>();
  const resolvedGates = new Set<string>();
  let previousRealmIndex = useGameStore.getState().realm.index;

  try {
    while (elapsedMs <= maxMs && useGameStore.getState().realm.index < 5) {
      useGameStore.getState().tick(stepMs);
      elapsedMs += stepMs;

      const game = useGameStore.getState();
      const fromRealmId = getRealmIdFromIndex(game.realm.index);
      const activeTransition = getTransitionByFromRealm(contract, fromRealmId as MajorRealmId);

      if (activeTransition) {
        const trial = useContentStore.getState().maps.trialsById[activeTransition.trialId];
        const trialProgress = useTrialStore.getState().getProgress(activeTransition.trialId);
        const requiredItemSatisfied = trial?.requiredItemId
          ? useInventoryStore.getState().getItemCount(trial.requiredItemId) > 0
          : true;
        const lifecycle = getTrialLifecycleSnapshot({
          content,
          trial,
          progress: trialProgress,
          realm: game.realm,
          qi: game.qi,
          breakthroughRequirement: game.getBreakthroughRequirement(),
          requiredItemSatisfied,
        });

        if (lifecycle.canStart && !seenGateAvailability.has(activeTransition.trialId)) {
          seenGateAvailability.add(activeTransition.trialId);
          milestoneOrder.push(`gate_available:${activeTransition.toRealmId}`);
          cumulativeMilestoneSeconds[`gate_available:${activeTransition.toRealmId}`] = elapsedMs / 1000;
          if (activeTransition.fromRealmId === GATE_1_TRANSITION.fromRealmId) {
            gate1AvailableMs = elapsedMs;
          }
        }

        if (lifecycle.canStart && !resolvedGates.has(activeTransition.trialId)) {
          useTrialStore.getState().markCleared(activeTransition.trialId);
          resolvedGates.add(activeTransition.trialId);
          milestoneOrder.push(`gate_resolved:${activeTransition.toRealmId}`);
          cumulativeMilestoneSeconds[`gate_resolved:${activeTransition.toRealmId}`] = elapsedMs / 1000;
        }
      }

      const currentRealm = REALMS[game.realm.index] ?? REALMS[0];
      const isMajorBreakthrough = game.realm.substage >= currentRealm.substages;
      const qiReady = Number(game.qi) >= Number(game.getBreakthroughRequirement());
      if (qiReady) {
        if (!isMajorBreakthrough || (activeTransition ? resolvedGates.has(activeTransition.trialId) : true)) {
          useGameStore.getState().breakthrough();
        }
      }

      const nextRealmIndex = useGameStore.getState().realm.index;
      if (nextRealmIndex > previousRealmIndex) {
        const milestoneId = MAJOR_ENTRY_MILESTONE_BY_REALM_INDEX[nextRealmIndex];
        if (milestoneId && cumulativeMilestoneSeconds[milestoneId] === undefined) {
          cumulativeMilestoneSeconds[milestoneId] = elapsedMs / 1000;
          milestoneOrder.push(milestoneId);
          if (milestoneId === PROGRESSION_MILESTONE_IDS.FOUNDATION_ENTRY) {
            foundationEntryMs = elapsedMs;
          }
          if (milestoneId === PROGRESSION_MILESTONE_IDS.SPIRIT_SEVERING_ENTRY) {
            cumulativeMilestoneSeconds[PROGRESSION_MILESTONE_IDS.CONTENT_CAP_REACHED] = elapsedMs / 1000;
          }
        }
        previousRealmIndex = nextRealmIndex;
      }
    }
  } finally {
    GameEvents.offAny(onAny);
  }

  const requiredMilestones = getCumulativeMajorEntryTargetSeconds().map((entry) => entry.milestoneId);
  for (const milestoneId of requiredMilestones) {
    if (typeof cumulativeMilestoneSeconds[milestoneId] !== 'number') {
      throw new Error(`Timing probe ended without milestone: ${milestoneId}`);
    }
  }

  const phaseTimingReport = buildPhaseTimingReport({
    milestoneOrder,
    cumulativeMilestoneSeconds,
  });

  return {
    representativePath: scenario.representativePath,
    representativePathQiMultiplier: scenario.representativePathQiMultiplier,
    lifeStartMs: runStartTime,
    gate1AvailableMs,
    foundationEntryMs,
    cumulativeMilestoneSeconds,
    milestoneOrder,
    progressionEvents,
    finalCityId: useCityStore.getState().currentCityId,
    finalRealmId: getRealmIdFromIndex(useGameStore.getState().realm.index),
    phaseTimingReport,
  };
}
