import type { MigrationContext } from './migrationTypes.js';
import { CURRENT_SAVE_VERSION, parseSaveVersion, type SaveVersionString } from './saveVersion.js';

export interface CreateMigrationContextParams {
  mode: 'dry-run' | 'apply';
  save: Record<string, unknown>;
  targetVersion?: SaveVersionString;
  normalizeToCurrent?: (save: Record<string, unknown>) => Record<string, unknown>;
  nowMs?: number;
}

export const createMigrationContext = ({
  mode,
  save,
  targetVersion = CURRENT_SAVE_VERSION,
  normalizeToCurrent,
  nowMs = Date.now(),
}: CreateMigrationContextParams): MigrationContext => {
  const parsed = parseSaveVersion(save.version);
  return {
    mode,
    sourceVersion: parsed.normalized,
    sourceVersionKind: parsed.kind,
    targetVersion,
    nowMs,
    normalizeToCurrent,
  };
};
