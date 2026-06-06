import { getContentCapRealm } from '../../../src/systems/progression/contract/index.js';
import { createScenario } from './createScenario.js';
import { createPrestigeReadyScenario } from './createPrestigeReadyScenario.js';
export const createCapReachedScenario = ({ contract }, overrides) => {
    const capRealm = getContentCapRealm(contract);
    return createScenario({
        ...createPrestigeReadyScenario({ contract }),
        kind: 'cap_reached',
        description: 'Spirit Severing reached; chapter cap state with no implied future-city unlocks.',
        realmState: {
            currentRealm: capRealm,
            enteredRealms: ['qi_condensation', 'foundation_establishment', 'core_formation', 'nascent_soul', 'soul_formation', capRealm],
        },
        gateState: {
            resolutionByTransitionId: Object.fromEntries(contract.gateTransitions.map((transition) => [transition.id, 'cleared'])),
            resolvedTransitionIds: contract.gateTransitions.map((transition) => transition.id),
            inventoryGateItems: {},
            pendingBreakthroughTo: null,
        },
        cityState: {
            currentCityId: contract.cityUnlocks.at(-1)?.cityId ?? 'city_ironpeak_bastion',
            unlockedCityIds: contract.cityUnlocks.map((unlock) => unlock.cityId),
            selectedModuleByCity: Object.fromEntries(contract.cityUnlocks.map((unlock) => [unlock.cityId, 'outskirts'])),
        },
        notes: ['Deferred systems remain deferred after cap reached.'],
    }, overrides);
};
