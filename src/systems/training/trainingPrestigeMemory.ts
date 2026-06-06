import { resolvePrestigeMemoryEffects } from '../prestige/prestigeMemory.js';

export interface TrainingPrestigeMemoryPreview {
  retainedRatingsByStatId: Record<string, number>;
  prestigeFloorBonus: number;
  oldSparringMasteryCatchupMultiplier: number;
  debug: { mode: 'mp5_prestige_memory' };
}

export function resolveTrainingPrestigeMemoryPreview(
  purchasesById: Record<string, number> = {},
): TrainingPrestigeMemoryPreview {
  const effects = resolvePrestigeMemoryEffects(purchasesById);
  return {
    retainedRatingsByStatId: {},
    prestigeFloorBonus: effects.formMemoryFloor,
    oldSparringMasteryCatchupMultiplier: effects.oldSparringMasteryCatchupMultiplier,
    debug: { mode: 'mp5_prestige_memory' },
  };
}
