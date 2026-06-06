import { getOfflineProgressionContract } from '../../../src/systems/progression/contract/index.js';
import { createScenario } from './createScenario.js';
export const createFreshLifeScenario = ({ contract }, overrides) => {
    const offline = getOfflineProgressionContract(contract);
    return createScenario({
        kind: 'fresh_life',
        description: 'New-life baseline with no gate resolved.',
        pathState: { selectedPath: null, lifePathAlias: null },
        realmState: { currentRealm: 'qi_condensation', enteredRealms: ['qi_condensation'] },
        gateState: { resolutionByTransitionId: {}, resolvedTransitionIds: [], inventoryGateItems: {}, pendingBreakthroughTo: null },
        cityState: {
            currentCityId: 'city_pinewind_hamlet',
            unlockedCityIds: ['city_pinewind_hamlet'],
            selectedModuleByCity: { city_pinewind_hamlet: 'outskirts' },
        },
        prestigeState: { ready: false, projectedAP: 0 },
        offlineState: {
            pipelineId: offline.pipelineId,
            maxCatchupSeconds: offline.maxCatchupSeconds,
            cultivationPolicy: { ...offline.cultivationPolicy },
            timerAdvancedSystems: [...offline.timerAdvancedSystems],
            summaryParts: [...offline.summaryParts],
        },
        notes: ['Packet 0.1 harness fixture; does not imply runtime fixes.'],
    }, overrides);
};
