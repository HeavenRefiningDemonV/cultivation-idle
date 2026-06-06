import { loadMigrationFixture } from '../../../migrations/loadFixture.js';
export const legacyGateAliasFixture = {
    metadata: {
        id: 'legacy-gate-alias',
        name: 'Legacy Gate Alias',
        description: 'Legacy save snapshot carrying pre-contract gate item aliases for migration and gate truth regression tests.',
        kind: 'legacy_save',
        sourceType: 'migrated_legacy',
        ownerPacket: '0.3B',
        intendedConsumerPackets: ['1.3'],
        isLegacy: true,
        expectedValidationStatus: 'warning',
        expectedIssueCategories: ['MIGRATION_ALIAS_PRESENT'],
        expectedWarningCategories: [],
        contractRealmIds: ['foundation_establishment'],
        transitionIds: ['qi_condensation_to_foundation_establishment'],
        cityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
        tags: ['legacy', 'migration', 'gate'],
        adapterAvailability: { contractScenario: true, saveShape: true, migrationFixture: true },
        notes: ['Legacy gate ids remain valid migration-input coverage, but canonical save-shape outputs should normalize them during packet 1.3.'],
    },
    build: async () => ({ migrationFixture: { name: 'legacy-gate-item-ids', data: await loadMigrationFixture('legacy-gate-item-ids') } }),
};
