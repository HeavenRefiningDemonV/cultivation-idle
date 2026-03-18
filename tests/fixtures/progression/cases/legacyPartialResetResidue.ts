import { loadMigrationFixture } from '../../../migrations/loadFixture.js';
import type { ProgressionFixtureDefinition } from '../fixtureTypes.js';

export const legacyPartialResetResidueFixture: ProgressionFixtureDefinition = {
  metadata: {
    id: 'legacy-partial-reset-residue',
    name: 'Legacy Partial Reset Residue',
    description: 'Legacy save carrying clear post-reset residue across city, trial, ruins, equipment, and hybrid preference surfaces.',
    kind: 'legacy_save',
    sourceType: 'migrated_legacy',
    ownerPacket: '0.3B',
    intendedConsumerPackets: ['1.7'],
    isLegacy: true,
    expectedValidationStatus: 'warning',
    expectedIssueCategories: ['PARTIAL_PRESTIGE_RESET'],
    expectedWarningCategories: ['PARTIAL_PRESTIGE_RESET'],
    contractRealmIds: ['qi_condensation', 'foundation_establishment'],
    transitionIds: ['qi_condensation_to_foundation_establishment'],
    cityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
    tags: ['legacy', 'migration', 'reset'],
    adapterAvailability: { contractScenario: true, saveShape: true, migrationFixture: true },
    notes: ['Packet 1.7 normalizes this legacy residue on migration apply while preserving it as a regression input fixture.'],
  },
  build: async () => ({ migrationFixture: { name: 'legacy-partial-reset-residue', data: await loadMigrationFixture('legacy-partial-reset-residue') } }),
};
