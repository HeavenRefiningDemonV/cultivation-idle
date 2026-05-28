import { useContentStore } from '../../stores/contentStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { useTrialStore } from '../../stores/trialStore.js';
import { adaptProgressionAuthoredContent } from '../../systems/progression/contract/contentAdapter.js';
import { getProgressionContract } from '../../systems/progression/contract/progressionContract.js';
import { PERF_LABELS, time } from '../performance/index.js';
import { progressionTimingTracker } from './progressionTimingTracker.js';

export function trackProgressionGateAvailabilityNow(timestamp = Date.now()): void {
  const contentStore = useContentStore.getState();
  const content = contentStore.raw;
  if (!content) return;

  time(PERF_LABELS.gameStoreTickProgressionDiagnostics, () => {
    try {
      const contract = getProgressionContract(adaptProgressionAuthoredContent(content));
      for (const transition of contract.gateTransitions) {
        const trial = contentStore.maps.trialsById[transition.trialId];
        const trialProgress = useTrialStore.getState().getProgress(transition.trialId);
        const requiredItemSatisfied = trial?.requiredItemId
          ? useInventoryStore.getState().getItemCount(trial.requiredItemId) > 0
          : true;
        const game = useGameStore.getState();

        progressionTimingTracker.trackGateAvailability({
          runStartTime: game.runStartTime,
          timestamp,
          content,
          trial,
          trialProgress,
          realm: game.realm,
          qi: game.qi,
          breakthroughRequirement: game.getBreakthroughRequirement(),
          requiredItemSatisfied,
          fromRealmId: transition.fromRealmId,
          toRealmId: transition.toRealmId,
          gateIndex: (contract.majorRealms[transition.fromRealmId]?.index ?? 0) + 1,
          cityId: transition.cityId ?? null,
        });
      }
    } catch (error) {
      if (import.meta.env?.DEV) {
        console.warn('[ProgressionDiagnostics] Failed to evaluate gate availability', error);
      }
    }
  });
}
