import { getTransitionByFromRealm } from '../../../src/systems/progression/contract/index.js';
import { createScenario } from './createScenario.js';
import { createGateEdgeScenario } from './createGateEdgeScenario.js';
import type { ScenarioBuildContext, ScenarioOverrides } from './scenarioTypes.js';

export const createPostFirstGateScenario = ({ contract }: ScenarioBuildContext, overrides?: ScenarioOverrides) => {
  const firstTransition = getTransitionByFromRealm(contract, 'qi_condensation');
  if (!firstTransition) throw new Error('Missing first transition in progression contract.');

  return createScenario(
    {
      ...createGateEdgeScenario({ contract }),
      kind: 'post_first_gate',
      description: 'First gate cleared; suited for city-2 unlock acknowledgement tests.',
      realmState: {
        currentRealm: 'foundation_establishment',
        enteredRealms: ['qi_condensation', 'foundation_establishment'],
      },
      gateState: {
        resolutionByTransitionId: { [firstTransition.id]: 'cleared' },
        resolvedTransitionIds: [firstTransition.id],
        inventoryGateItems: { [firstTransition.gateItemId]: 0 },
        pendingBreakthroughTo: null,
      },
      cityState: {
        unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
      },
      notes: ['Packet 1.5 will assert runtime city unlock timing against this fixture.'],
    },
    overrides,
  );
};
