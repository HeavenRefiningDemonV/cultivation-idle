import { loadMigrationFixture } from '../../../migrations/loadFixture.js';
export const legacyPathConflictFixture = {
    metadata: {
        id: 'legacy-path-conflict',
        name: 'Legacy Path Conflict',
        description: 'Legacy save where canonical selectedPath and legacy lifePath disagree, preserving path-truth drift for packet 1.2.',
        kind: 'legacy_save',
        sourceType: 'migrated_legacy',
        ownerPacket: '0.3B',
        intendedConsumerPackets: ['1.2'],
        isLegacy: true,
        expectedValidationStatus: 'warning',
        expectedIssueCategories: ['PATH_TRUTH_SPLIT'],
        expectedWarningCategories: ['PATH_TRUTH_SPLIT'],
        contractRealmIds: ['qi_condensation'],
        transitionIds: [],
        cityIds: ['city_pinewind_hamlet'],
        tags: ['legacy', 'migration', 'path'],
        adapterAvailability: { contractScenario: true, saveShape: true, migrationFixture: true },
        notes: ['Semantic cleanup belongs to packet 1.2, not this fixture packet.'],
    },
    build: async () => ({ migrationFixture: { name: 'legacy-path-conflict', data: await loadMigrationFixture('legacy-path-conflict') } }),
};
