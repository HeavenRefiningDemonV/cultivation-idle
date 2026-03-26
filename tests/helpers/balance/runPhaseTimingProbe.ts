import { REALMS } from '../../../src/constants/index.js';
import { GameEvents, type GameEvent } from '../../../src/services/events/GameEvents.js';
import { getProgressionContract, getTransitionByFromRealm } from '../../../src/systems/progression/contract/progressionContract.js';
import { adaptProgressionAuthoredContent } from '../../../src/systems/progression/contract/contentAdapter.js';
import { getTrialLifecycleSnapshot } from '../../../src/systems/progression/runtime/trialLifecycle.js';
import { useContentStore } from '../../../src/stores/contentStore.js';
import { useGameStore } from '../../../src/stores/gameStore.js';
import { useInventoryStore } from '../../../src/stores/inventoryStore.js';
import { useTrialStore } from '../../../src/stores/trialStore.js';
import { GATE_1_TRANSITION, PROGRESSION_MILESTONE_IDS } from '../../../src/systems/balance/phaseTimingTargets.js';
import { createTimingProbeScenario } from './createTimingProbeScenario.js';
import { progressionTimingTracker } from '../../../src/services/diagnostics/progressionTimingTracker.js';

export type PhaseTimingProbeResult = {
  representativePath: string;
  representativePathQiMultiplier: number;
  lifeStartMs: number;
  gate1AvailableMs: number | null;
  foundationEntryMs: number | null;
  orderedMilestones: string[];
  progressionEvents: GameEvent[];
};

export async function runPhaseTimingProbe(): Promise<PhaseTimingProbeResult> {
  const scenario = await createTimingProbeScenario();
  const content = useContentStore.getState().raw;
  if (!content) {
    throw new Error('Timing probe requires loaded content.');
  }

  const contract = getProgressionContract(adaptProgressionAuthoredContent(content));
  const gate1Transition = getTransitionByFromRealm(contract, GATE_1_TRANSITION.fromRealmId);
  if (!gate1Transition) {
    throw new Error('Unable to resolve first gate transition for timing probe.');
  }

  const gate1Trial = useContentStore.getState().maps.trialsById[gate1Transition.trialId];
  if (!gate1Trial) {
    throw new Error('Unable to resolve first gate trial definition for timing probe.');
  }

  useInventoryStore.getState().addItem(gate1Transition.gateItemId, 3);
  if (gate1Trial.requiredItemId) {
    useInventoryStore.getState().addItem(gate1Trial.requiredItemId, 3);
  }

  const progressionEvents: GameEvent[] = [];
  progressionTimingTracker.resetForRun(useGameStore.getState().runStartTime);
  const onAny = (event: GameEvent) => {
    if (event.type.startsWith('progression/')) {
      progressionEvents.push(event);
    }
  };
  GameEvents.onAny(onAny);
  progressionTimingTracker.emitLifeStarted(useGameStore.getState().runStartTime);

  const stepMs = 5_000;
  const maxMs = 3 * 60 * 60 * 1000;
  let elapsedMs = 0;
  let gate1AvailableMs: number | null = null;
  let gate1Resolved = false;
  let foundationEntryMs: number | null = null;
  const orderedMilestones: string[] = [PROGRESSION_MILESTONE_IDS.LIFE_START];

  try {
    while (elapsedMs <= maxMs && foundationEntryMs === null) {
      useGameStore.getState().tick(stepMs);
      elapsedMs += stepMs;

      const game = useGameStore.getState();
      const trialProgress = useTrialStore.getState().getProgress(gate1Trial.id);
      const requiredItemSatisfied = gate1Trial.requiredItemId
        ? useInventoryStore.getState().getItemCount(gate1Trial.requiredItemId) > 0
        : true;
      const lifecycle = getTrialLifecycleSnapshot({
        content,
        trial: gate1Trial,
        progress: trialProgress,
        realm: game.realm,
        qi: game.qi,
        breakthroughRequirement: game.getBreakthroughRequirement(),
        requiredItemSatisfied,
      });

      if (gate1AvailableMs === null && lifecycle.canStart) {
        gate1AvailableMs = elapsedMs;
        orderedMilestones.push(PROGRESSION_MILESTONE_IDS.GATE_1_AVAILABLE);
      }

      if (!gate1Resolved && gate1AvailableMs !== null) {
        useTrialStore.getState().markCleared(gate1Trial.id);
        gate1Resolved = true;
        orderedMilestones.push('gate_1_resolved');
      }

      const currentRealm = REALMS[game.realm.index] ?? REALMS[0];
      const isMajorBreakthrough = game.realm.substage >= currentRealm.substages;
      const qiReady = Number(game.qi) >= Number(game.getBreakthroughRequirement());
      if (qiReady) {
        if (!isMajorBreakthrough || gate1Resolved) {
          useGameStore.getState().breakthrough();
        }
      }

      if (useGameStore.getState().realm.index >= 1) {
        foundationEntryMs = elapsedMs;
        orderedMilestones.push(PROGRESSION_MILESTONE_IDS.FOUNDATION_ENTRY);
      }
    }
  } finally {
    GameEvents.offAny(onAny);
  }

  return {
    representativePath: scenario.representativePath,
    representativePathQiMultiplier: scenario.representativePathQiMultiplier,
    lifeStartMs: useGameStore.getState().runStartTime,
    gate1AvailableMs,
    foundationEntryMs,
    orderedMilestones,
    progressionEvents,
  };
}
