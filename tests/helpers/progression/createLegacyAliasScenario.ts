import { createScenario } from './createScenario.js';
import { createFreshLifeScenario } from './createFreshLifeScenario.js';
import type { ScenarioBuildContext, ScenarioOverrides } from './scenarioTypes.js';

export const createLegacyAliasScenario = ({ contract }: ScenarioBuildContext, overrides?: ScenarioOverrides) =>
  createScenario(
    {
      ...createFreshLifeScenario({ contract }),
      kind: 'legacy_alias',
      description: 'Fixture intentionally carries canonical selectedPath plus a contradictory legacy lifePath alias for migration/drift tests.',
      pathState: { selectedPath: 'martial', lifePathAlias: 'earth' },
      gateState: {
        resolutionByTransitionId: {},
        resolvedTransitionIds: [],
        inventoryGateItems: {
          foundation_pill: 1,
          core_catalyst: 0,
          core_stabilizer: 0,
          soul_condensate: 0,
        },
        pendingBreakthroughTo: 'foundation_establishment',
      },
      notes: ['Intended for packet 1.2 path-truth drift and packet 1.3 gate-alias migration tests.'],
    },
    overrides,
  );
