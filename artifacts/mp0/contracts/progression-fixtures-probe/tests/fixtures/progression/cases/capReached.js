import { createCapReachedScenario } from '../../../helpers/progression/index.js';
export const capReachedFixture = {
    metadata: {
        id: 'cap-reached',
        name: 'Cap Reached',
        description: 'Current semester cap boundary at Spirit Severing with no implied future city or realm unlock.',
        kind: 'cap_reached',
        sourceType: 'contract_derived',
        ownerPacket: '0.3B',
        intendedConsumerPackets: ['1.1', '1.5'],
        isLegacy: false,
        expectedValidationStatus: 'clean',
        expectedIssueCategories: [],
        expectedWarningCategories: [],
        contractRealmIds: ['qi_condensation', 'foundation_establishment', 'core_formation', 'nascent_soul', 'soul_formation', 'spirit_severing'],
        transitionIds: [
            'qi_condensation_to_foundation_establishment',
            'foundation_establishment_to_core_formation',
            'core_formation_to_nascent_soul',
            'nascent_soul_to_soul_formation',
            'soul_formation_to_spirit_severing',
        ],
        cityIds: ['city_pinewind_hamlet', 'city_stonecrag_town', 'city_spirit_cavern_city', 'city_lotusford', 'city_ironpeak_bastion'],
        tags: ['cap', 'city'],
        adapterAvailability: { contractScenario: true, saveShape: true, migrationFixture: true },
        notes: ['Baseline for cap/quarantine packet work and release QA.'],
    },
    build: ({ contract }) => ({ scenario: createCapReachedScenario({ contract }) }),
};
