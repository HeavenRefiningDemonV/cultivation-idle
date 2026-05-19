import { createPostFirstGateScenario } from '../../../helpers/progression/index.js';
import type { ProgressionFixtureDefinition } from '../fixtureTypes.js';

export const gateEdgePostFirstFixture: ProgressionFixtureDefinition = {
  metadata: {
    id: 'gate-edge-post-first',
    name: 'Gate Edge — Post First Gate',
    description: 'First gate cleared with the second city unlocked and no speculative future-city leakage.',
    kind: 'gate_edge',
    sourceType: 'contract_derived',
    ownerPacket: '0.3B',
    intendedConsumerPackets: ['1.4', '1.5'],
    isLegacy: false,
    expectedValidationStatus: 'clean',
    expectedIssueCategories: [],
    expectedWarningCategories: [],
    contractRealmIds: ['qi_condensation', 'foundation_establishment'],
    transitionIds: ['qi_condensation_to_foundation_establishment'],
    cityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
    tags: ['gate', 'city'],
    adapterAvailability: { contractScenario: true, saveShape: true, migrationFixture: true },
    notes: ['Primary packet 1.5 city unlock fixture.'],
  },
  build: ({ contract }) => ({ scenario: createPostFirstGateScenario({ contract }) }),
};
