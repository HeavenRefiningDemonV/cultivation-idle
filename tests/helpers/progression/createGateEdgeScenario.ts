import { getTransitionByFromRealm } from '../../../src/systems/progression/contract/index.js';
import { createScenario } from './createScenario.js';
import { createFreshLifeScenario } from './createFreshLifeScenario.js';
import type { ScenarioBuildContext, ScenarioOverrides } from './scenarioTypes.js';

export const createGateEdgeScenario = ({ contract }: ScenarioBuildContext, overrides?: ScenarioOverrides) => {
  const firstTransition = getTransitionByFromRealm(contract, 'qi_condensation');
  if (!firstTransition) throw new Error('Missing first transition in progression contract.');

  return createScenario(
    {
      ...createFreshLifeScenario({ contract }),
      kind: 'pre_first_gate',
      description: 'Right before first gate attempt with no pre-granted gate reward.',
      gateState: {
        resolvedTransitionIds: [],
        inventoryGateItems: { [firstTransition.gateItemId]: 0 },
        pendingBreakthroughTo: firstTransition.toRealmId,
      },
      notes: ['Used by gate-path packet tests (1.3).'],
    },
    overrides,
  );
};
