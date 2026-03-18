import { createScenario } from './createScenario.js';
import { createGateEdgeScenario } from './createGateEdgeScenario.js';
import type { ScenarioBuildContext, ScenarioOverrides } from './scenarioTypes.js';

export const createPrestigeReadyScenario = ({ contract }: ScenarioBuildContext, overrides?: ScenarioOverrides) =>
  createScenario(
    {
      ...createGateEdgeScenario({ contract }),
      kind: 'prestige_ready',
      description: 'Near first meaningful prestige threshold for reset-contract tests.',
      pathState: { selectedPath: 'heaven', lifePathAlias: null },
      realmState: {
        currentRealm: 'foundation_establishment',
        enteredRealms: ['qi_condensation', 'foundation_establishment'],
      },
      prestigeState: { ready: true, projectedAP: 30 },
      notes: ['Packet 1.7 will activate runtime reset assertions against this scenario.'],
    },
    overrides,
  );
