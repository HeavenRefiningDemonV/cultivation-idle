import type { MigrationStep } from '../../migrationTypes.js';
import { v2_2_0_backfill_prestige_memory_ledger } from './backfillPrestigeMemoryLedger.js';

export const v2_2_0MigrationPack: MigrationStep[] = [
  v2_2_0_backfill_prestige_memory_ledger,
];
