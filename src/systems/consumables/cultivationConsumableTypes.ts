export type CultivationConsumableFamily = 'circulation' | 'warmth' | 'doctrine' | 'breakthrough';

export interface CultivationConsumableFamilyDefinition {
  family: CultivationConsumableFamily;
  label: string;
  shortLabel: string;
  description: string;
  sortOrder: number;
}

export const CULTIVATION_CONSUMABLE_FAMILY_REGISTRY: Record<CultivationConsumableFamily, CultivationConsumableFamilyDefinition> = {
  circulation: {
    family: 'circulation',
    label: 'Circulation',
    shortLabel: 'Qi flow',
    description: 'Improves raw qi circulation and passive qi income.',
    sortOrder: 0,
  },
  warmth: {
    family: 'warmth',
    label: 'Meridian Warmth',
    shortLabel: 'Warmth',
    description: 'Steadies the meridians for mixed qi and stability gains.',
    sortOrder: 1,
  },
  doctrine: {
    family: 'doctrine',
    label: 'Doctrine',
    shortLabel: 'Insight',
    description: 'Sharpens study, comprehension, and insight cadence.',
    sortOrder: 2,
  },
  breakthrough: {
    family: 'breakthrough',
    label: 'Breakthrough',
    shortLabel: 'Breakthrough',
    description: 'Reduces major breakthrough cost and stores one stability surge.',
    sortOrder: 3,
  },
};

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

export interface CultivationConsumableReadModelEntry {
  itemId: string;
  family: CultivationConsumableFamily;
  familyLabel: string;
  shortLabel: string;
  description: string;
  activatedAt: number;
  expiresAt: number;
  remainingMs: number;
  modifiers: CultivationConsumableModifiers;
  consumedOnMajorBreakthrough: boolean;
}

export interface CultivationConsumableReadModel {
  now: number;
  entries: CultivationConsumableReadModelEntry[];
  activeByFamily: Partial<Record<CultivationConsumableFamily, CultivationConsumableReadModelEntry>>;
  modifiers: CultivationConsumableModifiers;
}

export interface CultivationConsumableCarryoverWindow {
  startedAt: number;
  endedAt: number;
  elapsedMs: number;
  modifiers: CultivationConsumableModifiers;
  activeFamilies: CultivationConsumableFamily[];
}

export const DEFAULT_CULTIVATION_CONSUMABLE_MODIFIERS: CultivationConsumableModifiers = {
  qiRateMult: 1,
  comprehensionGainMult: 1,
  stabilityGainMult: 1,
  insightFrequencyMult: 1,
  majorBreakthroughQiCostMult: 1,
  majorBreakthroughStabilityBonus: 0,
};
