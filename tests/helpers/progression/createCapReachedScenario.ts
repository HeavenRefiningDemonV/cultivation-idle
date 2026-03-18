import { getContentCapRealm } from '../../../src/systems/progression/contract/index.js';
import { createScenario } from './createScenario.js';
import { createPrestigeReadyScenario } from './createPrestigeReadyScenario.js';
import type { ScenarioBuildContext, ScenarioOverrides } from './scenarioTypes.js';

export const createCapReachedScenario = ({ contract }: ScenarioBuildContext, overrides?: ScenarioOverrides) => {
  const capRealm = getContentCapRealm(contract);
  return createScenario(
    {
      ...createPrestigeReadyScenario({ contract }),
      kind: 'cap_reached',
      description: 'Spirit Severing reached; chapter cap state with no implied future-city unlocks.',
      realmState: {
        currentRealm: capRealm,
        enteredRealms: ['qi_condensation', 'foundation_establishment', 'core_formation', 'nascent_soul', 'soul_formation', capRealm],
      },
      gateState: {
        resolvedTransitionIds: contract.gateTransitions.map((transition) => transition.id),
        inventoryGateItems: {},
        pendingBreakthroughTo: null,
      },
      cityState: {
        unlockedCityIds: contract.cityUnlocks.map((unlock) => unlock.cityId),
      },
      notes: ['Deferred systems remain deferred after cap reached.'],
    },
    overrides,
  );
};
