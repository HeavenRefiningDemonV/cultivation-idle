import { loadMigrationFixture } from '../../../migrations/loadFixture.js';
import type { ProgressionFixtureDefinition } from '../fixtureTypes.js';

export const legacyOverCapFixture: ProgressionFixtureDefinition = {
  metadata: {
    id: 'legacy-over-cap',
    name: 'Legacy Over Cap',
    description: 'Legacy save progressed beyond the authored semester cap, retained for cap-clamp and quarantine regression checks.',
    kind: 'legacy_save',
    sourceType: 'migrated_legacy',
    ownerPacket: '0.3B',
    intendedConsumerPackets: ['1.1'],
    isLegacy: true,
    expectedValidationStatus: 'warning',
    expectedIssueCategories: ['CONTENT_CAP_BREACH'],
    expectedWarningCategories: ['CONTENT_CAP_BREACH'],
    contractRealmIds: ['spirit_severing'],
    transitionIds: ['soul_formation_to_spirit_severing'],
    cityIds: ['city_ironpeak_bastion'],
    tags: ['legacy', 'migration', 'cap'],
    adapterAvailability: { contractScenario: true, saveShape: true, migrationFixture: true },
    notes: ['Cleanup belongs to packet 1.1 cap handling, not fixture construction.'],
  },
  build: async () => ({ migrationFixture: { name: 'legacy-future-slice', data: await loadMigrationFixture('legacy-future-slice') } }),
};
