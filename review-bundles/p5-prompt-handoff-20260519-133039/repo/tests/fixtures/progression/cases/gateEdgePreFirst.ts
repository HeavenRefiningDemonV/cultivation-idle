import { createGateEdgeScenario } from '../../../helpers/progression/index.js';
import type { ProgressionFixtureDefinition } from '../fixtureTypes.js';

export const gateEdgePreFirstFixture: ProgressionFixtureDefinition = {
  metadata: {
    id: 'gate-edge-pre-first',
    name: 'Gate Edge — Pre First Gate',
    description: 'Right before the first gate attempt, with no fake reward ownership or leaked city unlocks.',
    kind: 'gate_edge',
    sourceType: 'contract_derived',
    ownerPacket: '0.3B',
    intendedConsumerPackets: ['1.3', '1.4'],
    isLegacy: false,
    expectedValidationStatus: 'clean',
    expectedIssueCategories: [],
    expectedWarningCategories: [],
    contractRealmIds: ['qi_condensation', 'foundation_establishment'],
    transitionIds: ['qi_condensation_to_foundation_establishment'],
    cityIds: ['city_pinewind_hamlet'],
    tags: ['gate', 'baseline'],
    adapterAvailability: { contractScenario: true, saveShape: true, migrationFixture: true },
    notes: ['Useful for gate/trial lifecycle assertions without inventing pre-granted gate rewards.'],
  },
  build: ({ contract }) => ({ scenario: createGateEdgeScenario({ contract }) }),
};
