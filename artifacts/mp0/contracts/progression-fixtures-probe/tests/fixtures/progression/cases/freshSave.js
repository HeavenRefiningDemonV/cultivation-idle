import { createFreshLifeScenario } from '../../../helpers/progression/index.js';
export const freshSaveFixture = {
    metadata: {
        id: 'fresh-save',
        name: 'Fresh Save',
        description: 'Clean new-life baseline with the first city unlocked and no resolved gates.',
        kind: 'fresh_save',
        sourceType: 'contract_derived',
        ownerPacket: '0.3B',
        intendedConsumerPackets: ['1.1', '1.2'],
        isLegacy: false,
        expectedValidationStatus: 'clean',
        expectedIssueCategories: [],
        expectedWarningCategories: [],
        contractRealmIds: ['qi_condensation'],
        transitionIds: [],
        cityIds: ['city_pinewind_hamlet'],
        tags: ['baseline', 'city'],
        adapterAvailability: { contractScenario: true, saveShape: true, migrationFixture: true },
        notes: ['Default baseline for later packet tests that need coherent starting-state truth.'],
    },
    build: ({ contract }) => ({ scenario: createFreshLifeScenario({ contract }) }),
};
