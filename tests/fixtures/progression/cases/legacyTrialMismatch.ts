import { loadMigrationFixture } from '../../../migrations/loadFixture.js';
import type { ProgressionFixtureDefinition } from '../fixtureTypes.js';

export const legacyTrialMismatchFixture: ProgressionFixtureDefinition = {
  metadata: {
    id: 'legacy-trial-mismatch',
    name: 'Legacy Trial Mismatch',
    description: 'Legacy save snapshot already past the first gate without matching clear/proof data; packet 1.4 normalizes it to bypassed resolution.',
    kind: 'legacy_save',
    sourceType: 'migrated_legacy',
    ownerPacket: '0.3B',
    intendedConsumerPackets: ['1.4'],
    isLegacy: true,
    expectedValidationStatus: 'clean',
    expectedIssueCategories: [],
    expectedWarningCategories: [],
    contractRealmIds: ['qi_condensation', 'foundation_establishment'],
    transitionIds: ['qi_condensation_to_foundation_establishment'],
    cityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
    tags: ['legacy', 'migration', 'gate'],
    adapterAvailability: { contractScenario: true, saveShape: true, migrationFixture: true },
    notes: ['Used to verify packet 1.4 can distinguish a legacy bypass from a true gate clear.'],
  },
  build: async () => ({ migrationFixture: { name: 'legacy-trial-mismatch', data: await loadMigrationFixture('legacy-trial-mismatch') } }),
};
