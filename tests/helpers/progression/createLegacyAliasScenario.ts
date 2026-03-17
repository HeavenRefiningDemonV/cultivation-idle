import { createScenario } from './createScenario.js';
import { createFreshLifeScenario } from './createFreshLifeScenario.js';
import type { ScenarioBuildContext, ScenarioOverrides } from './scenarioTypes.js';

export const createLegacyAliasScenario = ({ contract }: ScenarioBuildContext, overrides?: ScenarioOverrides) =>
  createScenario(
    {
      ...createFreshLifeScenario({ contract }),
      kind: 'legacy_alias',
      description: 'Fixture intentionally carries legacy alias fields for migration and drift tests.',
      pathState: { lifePath: 'earth', selectedPathAlias: 'martial' },
      gateState: {
        resolvedTransitionIds: [],
        inventoryGateItems: {
          foundation_pill: 1,
          core_catalyst: 0,
          core_stabilizer: 0,
          soul_condensate: 0,
        },
        pendingBreakthroughTo: 'foundation_establishment',
      },
      notes: ['Intended for packet 0.2 and packet 1.8 alias migration activation tests.'],
    },
    overrides,
  );
