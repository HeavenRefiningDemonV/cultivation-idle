import {
  DEFAULT_CULTIVATION_CONSUMABLE_MODIFIERS,
  type ActiveCultivationConsumable,
  type CultivationConsumableModifiers,
} from './cultivationConsumableTypes';

export function mergeCultivationConsumableModifiers(
  consumables: readonly ActiveCultivationConsumable[],
  now: number,
): CultivationConsumableModifiers {
  return consumables.reduce<CultivationConsumableModifiers>((acc, entry) => {
    if (entry.expiresAt <= now) return acc;
    const isSpentBreakthrough = entry.family === 'breakthrough' && entry.consumedOnMajorBreakthrough;
    acc.qiRateMult *= entry.modifiers.qiRateMult;
    acc.comprehensionGainMult *= entry.modifiers.comprehensionGainMult;
    acc.stabilityGainMult *= entry.modifiers.stabilityGainMult;
    acc.insightFrequencyMult *= entry.modifiers.insightFrequencyMult;
    if (!isSpentBreakthrough) {
      acc.majorBreakthroughQiCostMult *= entry.modifiers.majorBreakthroughQiCostMult;
      acc.majorBreakthroughStabilityBonus += entry.modifiers.majorBreakthroughStabilityBonus;
    }
    return acc;
  }, { ...DEFAULT_CULTIVATION_CONSUMABLE_MODIFIERS });
}

export function filterActiveCultivationConsumables(
  consumables: readonly ActiveCultivationConsumable[],
  now: number,
): ActiveCultivationConsumable[] {
  return consumables.filter((entry) => entry.expiresAt > now).map((entry) => ({ ...entry }));
}
