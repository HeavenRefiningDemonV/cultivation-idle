import { runSaveMigrations } from './migrationRunner.js';
import type { MigrationRunReport } from './migrationTypes.js';

export interface LoadPathMigrationResult {
  migrated: Record<string, unknown>;
  report: MigrationRunReport;
}

export const migrateIncomingSaveForHydration = (
  raw: unknown,
  normalizeToCurrent: (save: Record<string, unknown>) => Record<string, unknown>,
): LoadPathMigrationResult => runSaveMigrations(raw, { mode: 'apply', normalizeToCurrent });
