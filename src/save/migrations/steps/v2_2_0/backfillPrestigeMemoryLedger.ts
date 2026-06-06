import type { MigrationStep } from '../../migrationTypes.js';
import { CURRENT_SAVE_VERSION, compareSaveVersions } from '../../saveVersion.js';
import { createDefaultPrestigeMemoryLedger, sanitizePrestigeMemoryLedger } from '../../../../systems/prestige/prestigeMemory.js';
import { cloneSave, createStepResult, isRecord, touch } from '../v2_0_0/shared.js';

const hasPrestigeMemoryLedger = (save: Record<string, unknown>): boolean =>
  isRecord(save.prestigeState) && isRecord(save.prestigeState.memoryLedger);

export const v2_2_0_backfill_prestige_memory_ledger: MigrationStep = {
  id: 'v2_2_0_backfill_prestige_memory_ledger',
  title: 'Backfill MP5 prestige memory ledger',
  description: 'Adds a bounded prestige memory ledger for MP5 reincarnation memory without retaining raw life state.',
  kind: 'transform',
  ownerPacket: 'mp5-prestige-memory',
  fromVersionRange: { maxExclusive: CURRENT_SAVE_VERSION },
  toVersion: CURRENT_SAVE_VERSION,
  priority: 110,
  appliesTo: (save, ctx) =>
    compareSaveVersions(ctx.sourceVersion, CURRENT_SAVE_VERSION) < 0 || !hasPrestigeMemoryLedger(save),
  run: (save) => {
    const next = cloneSave(save);
    const prestigeState = isRecord(next.prestigeState) ? next.prestigeState : {};
    next.prestigeState = {
      ...prestigeState,
      memoryLedger: hasPrestigeMemoryLedger(next)
        ? sanitizePrestigeMemoryLedger(prestigeState.memoryLedger)
        : createDefaultPrestigeMemoryLedger(),
    };

    return createStepResult(
      v2_2_0_backfill_prestige_memory_ledger,
      next,
      'Backfilled bounded MP5 prestige memory ledger.',
      {
        didMutate: true,
        touchedFieldPaths: [
          touch('prestigeState.memoryLedger', 'set', 'Backfilled safe empty or sanitized prestige memory ledger.'),
        ],
      },
    );
  },
};
