import { loadMigrationFixture } from '../../../migrations/loadFixture.js';
import type { ProgressionFixtureDefinition } from '../fixtureTypes.js';

export const legacyOfflineSplitFixture: ProgressionFixtureDefinition = {
  metadata: {
    id: 'legacy-offline-split',
    name: 'Legacy Offline Split',
    description: 'Legacy save with conflicting offline timestamps retained as a packet-1.8 regression input; apply-mode migration now normalizes it to canonical offline timestamp truth.',
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
    notes: ['Offline unification belongs to packet 1.8 and apply-mode migration now reconciles this fixture to one canonical timestamp.'],
  },
  build: async () => ({ migrationFixture: { name: 'legacy-offline-split', data: await loadMigrationFixture('legacy-offline-split') } }),
};
