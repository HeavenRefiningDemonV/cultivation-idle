import type { MigrationStep } from '../../migrationTypes.js';
import { v2_3_0_seed_three_treasures_from_legacy } from './seedThreeTreasuresFromLegacy.js';

export const v2_3_0MigrationPack: MigrationStep[] = [
  v2_3_0_seed_three_treasures_from_legacy,
];
