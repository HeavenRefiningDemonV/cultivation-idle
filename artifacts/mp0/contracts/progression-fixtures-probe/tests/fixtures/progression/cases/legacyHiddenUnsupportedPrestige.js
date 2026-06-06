import { loadMigrationFixture } from '../../../migrations/loadFixture.js';
export const legacyHiddenUnsupportedPrestigeFixture = {
    metadata: {
        id: 'legacy-hidden-unsupported-prestige',
        name: 'Legacy Hidden Unsupported Prestige',
        description: 'Legacy save containing hidden unsupported prestige purchases that packet 1.6 refunds and clears on migration apply.',
        kind: 'legacy_save',
        sourceType: 'migrated_legacy',
        ownerPacket: '0.3B',
        intendedConsumerPackets: ['1.6'],
        isLegacy: true,
        expectedValidationStatus: 'warning',
        expectedIssueCategories: ['HIDDEN_PRESTIGE_RUNTIME_CONSUMER'],
        expectedWarningCategories: ['HIDDEN_PRESTIGE_RUNTIME_CONSUMER'],
        contractRealmIds: ['core_formation'],
        transitionIds: ['foundation_establishment_to_core_formation'],
        cityIds: ['city_stonecrag_town'],
        tags: ['legacy', 'migration', 'prestige'],
        adapterAvailability: { contractScenario: true, saveShape: true, migrationFixture: true },
        notes: ['Packet 1.6 keeps this as a legacy regression input while migration apply refunds hidden unsupported prestige purchases.'],
    },
    build: async () => ({
        migrationFixture: { name: 'legacy-hidden-unsupported-prestige', data: await loadMigrationFixture('legacy-hidden-unsupported-prestige') },
    }),
};
