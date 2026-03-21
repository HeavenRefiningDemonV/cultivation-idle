import type {
  ActiveCultivationConsumable,
  CultivationConsumableFamily,
  CultivationConsumableModifiers,
} from '../../types/index.js';

export type {
  ActiveCultivationConsumable,
  CultivationConsumableFamily,
  CultivationConsumableModifiers,
};

export const BASE_CULTIVATION_CONSUMABLE_MODIFIERS: CultivationConsumableModifiers = Object.freeze({
  qiRateMult: 1,
  stabilityGainMult: 1,
  comprehensionGainMult: 1,
  insightFrequencyMult: 1,
  breakthroughQiCostMult: 1,
  breakthroughStabilityBonus: 0,
});

export function createBaseCultivationConsumableModifiers(): CultivationConsumableModifiers {
  return { ...BASE_CULTIVATION_CONSUMABLE_MODIFIERS };
}

export function cloneActiveCultivationConsumable(
  entry: ActiveCultivationConsumable,
): ActiveCultivationConsumable {
  return {
    ...entry,
    modifiers: { ...entry.modifiers },
  };
}

export function isCultivationConsumableFamily(value: unknown): value is CultivationConsumableFamily {
  return value === 'circulation' || value === 'warmth' || value === 'doctrine' || value === 'breakthrough';
}

