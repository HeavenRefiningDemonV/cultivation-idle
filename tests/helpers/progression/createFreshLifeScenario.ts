import { getOfflineProgressionContract } from '../../../src/systems/progression/contract/index.js';
import { createScenario } from './createScenario.js';
import type { ScenarioBuildContext, ScenarioOverrides } from './scenarioTypes.js';

export const createFreshLifeScenario = ({ contract }: ScenarioBuildContext, overrides?: ScenarioOverrides) => {
  const offline = getOfflineProgressionContract(contract);
  return createScenario(
    {
      kind: 'fresh_life',
      description: 'New-life baseline with no gate resolved.',
      pathState: { selectedPath: null, lifePathAlias: null },
      realmState: { currentRealm: 'qi_condensation', enteredRealms: ['qi_condensation'] },
      gateState: { resolvedTransitionIds: [], inventoryGateItems: {}, pendingBreakthroughTo: null },
      cityState: { unlockedCityIds: ['city_pinewind_hamlet'] },
      prestigeState: { ready: false, projectedAP: 0 },
      offlineState: {
        pipelineId: offline.pipelineId,
        maxCatchupSeconds: offline.maxCatchupSeconds,
        efficiencyModel: offline.efficiencyModel,
      },
      notes: ['Packet 0.1 harness fixture; does not imply runtime fixes.'],
    },
    overrides,
  );
};
