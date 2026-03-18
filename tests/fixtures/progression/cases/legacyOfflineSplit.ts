import { loadMigrationFixture } from '../../../migrations/loadFixture.js';
import type { ProgressionFixtureDefinition } from '../fixtureTypes.js';

export const legacyOfflineSplitFixture: ProgressionFixtureDefinition = {
  metadata: {
    id: 'legacy-offline-split',
    name: 'Legacy Offline Split',
    description: 'Legacy save with conflicting offline timestamps retained for packet 1.8 offline-pipeline regression work.',
    kind: 'legacy_save',
    sourceType: 'migrated_legacy',
    ownerPacket: '0.3B',
    intendedConsumerPackets: ['1.8'],
    isLegacy: true,
    expectedValidationStatus: 'warning',
    expectedIssueCategories: ['OFFLINE_PIPELINE_SPLIT'],
    expectedWarningCategories: ['OFFLINE_PIPELINE_SPLIT'],
    contractRealmIds: ['qi_condensation'],
    transitionIds: [],
    cityIds: ['city_pinewind_hamlet'],
    tags: ['legacy', 'migration', 'offline'],
    adapterAvailability: { contractScenario: true, saveShape: true, migrationFixture: true },
    notes: ['Offline unification belongs to packet 1.8 in this fixture map.'],
  },
  build: async () => ({ migrationFixture: { name: 'legacy-offline-split', data: await loadMigrationFixture('legacy-offline-split') } }),
};
