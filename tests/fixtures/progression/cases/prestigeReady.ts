import { createPrestigeReadyScenario } from '../../../helpers/progression/index.js';
import type { ProgressionFixtureDefinition } from '../fixtureTypes.js';

export const prestigeReadyFixture: ProgressionFixtureDefinition = {
  metadata: {
    id: 'prestige-ready',
    name: 'Prestige Ready',
    description: 'Near-wall life with coherent permanent/per-life markers for later prestige/reset packet work.',
    kind: 'prestige_ready',
    sourceType: 'contract_derived',
    ownerPacket: '0.3B',
    intendedConsumerPackets: ['1.6', '1.7', '1.8'],
    isLegacy: false,
    expectedValidationStatus: 'clean',
    expectedIssueCategories: [],
    expectedWarningCategories: [],
    contractRealmIds: ['qi_condensation', 'foundation_establishment'],
    transitionIds: ['qi_condensation_to_foundation_establishment'],
    cityIds: ['city_pinewind_hamlet'],
    tags: ['prestige', 'reset'],
    adapterAvailability: { contractScenario: true, saveShape: true, migrationFixture: true },
    notes: ['Meant for later readiness UX and reset orchestration tests, not gameplay tuning.'],
  },
  build: ({ contract }) => ({ scenario: createPrestigeReadyScenario({ contract }) }),
};
