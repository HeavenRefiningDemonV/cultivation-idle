import type { NormalizedForgeBlueprint } from '../content/forge';
import type { TemperAffix, EquipmentSlot } from '../stores/equipmentStore';
import { useEquipmentStore } from '../stores/equipmentStore';
import { useGameStore } from '../stores/gameStore';
import type { PlayerStats } from '../types';
import { selectTemperAffix } from '../content/temperAffixes';
import { randFloat, nextSeed } from '../utils/rng.js';

export interface ForgeServiceResult {
  type: 'refine' | 'temper';
  slot: EquipmentSlot;
  applied?: number;
  capped?: boolean;
  success?: boolean;
  affix?: TemperAffix | null;
  beforeStats: PlayerStats;
  afterStats: PlayerStats;
  procChancePct?: number;
  roll?: number;
}

function cloneStats(stats: PlayerStats): PlayerStats {
  return { ...stats };
}

function deriveToolBonus(): number {
  const tools = useEquipmentStore.getState().forgeToolTiers;
  const hammerBonus = Math.max(0, (tools.hammer - 1) * 0.5);
  const bellowsBonus = Math.max(0, (tools.bellows - 1) * 0.25);
  return hammerBonus + bellowsBonus;
}

export function applyRefineService(options: {
  blueprint: NormalizedForgeBlueprint;
  slot: EquipmentSlot;
  qty: number;
}): ForgeServiceResult {
  const equipmentStore = useEquipmentStore.getState();
  const gameStore = useGameStore.getState();
  const before = cloneStats(gameStore.stats);
  const effect = (options.blueprint.effect as Record<string, unknown>) ?? {};
  const addLevel = typeof effect.addLevel === 'number' ? effect.addLevel : 1;
  const maxLevelCap = typeof effect.maxLevelCap === 'number' ? effect.maxLevelCap : undefined;
  const result = equipmentStore.applyRefineFromForge(options.slot, options.qty, { addLevel, maxLevelCap });
  gameStore.calculatePlayerStats();
  const after = cloneStats(gameStore.stats);

  return {
    type: 'refine',
    slot: options.slot,
    applied: result.ok ? result.applied : 0,
    capped: result.ok ? result.capped : false,
    success: result.ok,
    beforeStats: before,
    afterStats: after,
  };
}

export function applyTemperService(options: {
  blueprint: NormalizedForgeBlueprint;
  slot: EquipmentSlot;
  qty: number;
  seed: number;
  bonusChancePct?: number;
}): ForgeServiceResult {
  const equipmentStore = useEquipmentStore.getState();
  const gameStore = useGameStore.getState();
  const before = cloneStats(gameStore.stats);
  const effect = (options.blueprint.effect as Record<string, unknown>) ?? {};
  const baseChance = typeof effect.baseProcChancePct === 'number' ? effect.baseProcChancePct : 25;
  const allowedAffixes = Array.isArray(effect.affixPool)
    ? (effect.affixPool as string[]).filter((id) => typeof id === 'string')
    : undefined;
  let chancePct = baseChance + (options.bonusChancePct ?? 0) + deriveToolBonus();
  chancePct = Math.max(0, Math.min(100, chancePct));

  let currentSeed = options.seed;
  let success = false;
  let appliedAffix: TemperAffix | null = null;
  for (let i = 0; i < Math.max(1, options.qty); i += 1) {
    const roll = randFloat(currentSeed);
    currentSeed = roll.seed ?? nextSeed(currentSeed);
    const rollValue = roll.value * 100;
    if (rollValue <= chancePct) {
      success = true;
      appliedAffix = selectTemperAffix(currentSeed, allowedAffixes);
      equipmentStore.applyTemperAffix(options.slot, appliedAffix);
      currentSeed = nextSeed(currentSeed);
      break;
    }
  }

  if (success) {
    gameStore.calculatePlayerStats();
  }
  const after = cloneStats(gameStore.stats);

  return {
    type: 'temper',
    slot: options.slot,
    success,
    affix: appliedAffix,
    beforeStats: before,
    afterStats: after,
    procChancePct: chancePct,
  };
}

