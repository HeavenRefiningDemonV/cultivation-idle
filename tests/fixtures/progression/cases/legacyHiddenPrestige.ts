import { loadMigrationFixture } from '../../../migrations/loadFixture.js';
import type { ProgressionFixtureDefinition } from '../fixtureTypes.js';

export const legacyHiddenPrestigeFixture: ProgressionFixtureDefinition = {
  metadata: {
    id: 'legacy-hidden-prestige',
    name: 'Legacy Hidden Prestige',
    description: 'Legacy save containing deferred prestige purchases that later packets must reconcile through contract-backed prestige truth.',
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
    notes: ['Deferred prestige cleanup belongs to packet 1.6.'],
  },
  build: async () => ({ migrationFixture: { name: 'legacy-hidden-prestige', data: await loadMigrationFixture('legacy-hidden-prestige') } }),
};
