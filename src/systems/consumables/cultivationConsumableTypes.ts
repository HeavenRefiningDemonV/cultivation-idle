export type CultivationConsumableFamily = 'circulation' | 'warmth' | 'doctrine' | 'breakthrough';

export interface CultivationConsumableModifiers {
  qiRateMult: number;
  comprehensionGainMult: number;
  stabilityGainMult: number;
  insightFrequencyMult: number;
  majorBreakthroughQiCostMult: number;
  majorBreakthroughStabilityBonus: number;
}

export interface ActiveCultivationConsumable {
  itemId: string;
  family: CultivationConsumableFamily;
  activatedAt: number;
  expiresAt: number;
  modifiers: CultivationConsumableModifiers;
  consumedOnMajorBreakthrough?: boolean;
}

export const DEFAULT_CULTIVATION_CONSUMABLE_MODIFIERS: CultivationConsumableModifiers = {
  qiRateMult: 1,
  comprehensionGainMult: 1,
  stabilityGainMult: 1,
  insightFrequencyMult: 1,
  majorBreakthroughQiCostMult: 1,
  majorBreakthroughStabilityBonus: 0,
};
