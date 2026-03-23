import type { ManualGrade, TechRarity } from '../../types/index.js';
import {
  getTechniqueGradePolicy,
  getTechniqueMaxRankForGrade,
  getTechniqueRuneSocketsForGrade,
  getTechniqueSecondaryPotencyBonusForGrade,
  getTechniqueTraitCapForGrade,
  normalizeManualGrade,
  type TechniqueGradePolicy,
} from './techniqueGradePolicy.js';

export type MasteryMilestoneLevel = 25 | 50 | 75 | 100;

export interface MasteryMilestoneEffect {
  highestUnlockedMilestone: 0 | MasteryMilestoneLevel;
  effectMult: number;
  cooldownMult: number;
  costMult: number;
  secondaryUnlocked: boolean;
  cosmeticTitle?: string;
}

export interface TechniqueTraitSlotBreakdown {
  raritySlots: number;
  gradeCap: number;
  effectiveSlots: number;
  rarity: TechRarity;
  grade: ManualGrade;
}

export interface TechniqueProgressionSource {
  manualGrade?: ManualGrade | null;
  rarity?: TechRarity | null;
  masteryXp?: number | null;
  rank?: number | null;
  traits?: Array<{ id: string; value?: number; valuePct?: number }> | null;
  runes?: Array<string | null> | null;
}

export interface TechniqueProgressionNormalizedState {
  manualGrade: ManualGrade;
  rarity: TechRarity;
  masteryXp: number;
  rank: number;
  traits: Array<{ id: string; value?: number; valuePct?: number }>;
  runes: Array<string | null>;
}

export interface TechniqueProgressionSnapshot {
  grade: ManualGrade;
  rarity: TechRarity;
  gradePolicy: TechniqueGradePolicy;
  masteryXp: number;
  masteryLevel: number;
  rank: number;
  rankCap: number;
  masteryMilestoneEffects: MasteryMilestoneEffect;
  nextMasteryMilestone: { level: MasteryMilestoneLevel; effectsSummary: string[] } | null;
  effectMultiplier: number;
  cooldownReductionPct: number;
  costReductionPct: number;
  secondaryPotencyMult: number;
  traitSlotBreakdown: TechniqueTraitSlotBreakdown;
  runeSockets: number;
  appliedTraitCount: number;
  appliedRuneCount: number;
}

const DEFAULT_RARITY: TechRarity = 'common';

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const sanitizeFiniteNonNegative = (value: number | null | undefined): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value ?? 0);
};

const MASTERY_SUMMARIES: Readonly<Record<MasteryMilestoneLevel, readonly string[]>> = Object.freeze({
  25: Object.freeze(['Cooldown 5%']),
  50: Object.freeze(['Cost 10%']),
  75: Object.freeze(['Secondary effect unlock']),
  100: Object.freeze(['Effect 10%', 'Title: Perfected']),
});

export const TECHNIQUE_RARITY_ORDER: readonly TechRarity[] = Object.freeze([
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
] as const);

export const TECHNIQUE_RARITY_TRAIT_SLOTS: Readonly<Record<TechRarity, number>> = Object.freeze({
  common: 1,
  uncommon: 1,
  rare: 2,
  epic: 2,
  legendary: 3,
});

export const MASTERY_MILESTONE_ORDER: readonly MasteryMilestoneLevel[] = Object.freeze([25, 50, 75, 100] as const);
export const MASTERY_XP_SCALE = 3;
export const MAX_TECHNIQUE_MASTERY_LEVEL = 100;
export const TECHNIQUE_MASTERY_EFFECT_MULTIPLIER_PER_LEVEL = 0.003;
export const TECHNIQUE_RANK_MULTIPLIER_PER_RANK = 0.1;

export function normalizeTechniqueRarity(input?: string | null): TechRarity {
  const normalized = (input ?? '').toLowerCase();
  return TECHNIQUE_RARITY_ORDER.includes(normalized as TechRarity)
    ? normalized as TechRarity
    : DEFAULT_RARITY;
}

export function isHigherTechniqueRarity(current: TechRarity, next: TechRarity): boolean {
  return TECHNIQUE_RARITY_ORDER.indexOf(next) > TECHNIQUE_RARITY_ORDER.indexOf(current);
}

export function xpNeededForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.max(0, (level - 1) ** 2 * MASTERY_XP_SCALE);
}

export function masteryLevelFromXp(xp: number): number {
  const normalized = Math.max(0, xp);
  const level = 1 + Math.floor(Math.sqrt(normalized / MASTERY_XP_SCALE));
  return Math.min(MAX_TECHNIQUE_MASTERY_LEVEL, Math.max(1, level));
}

export function masteryMilestones(level: number): {
  at25: boolean;
  at50: boolean;
  at75: boolean;
  at100: boolean;
} {
  const clampedLevel = clamp(Math.floor(Number.isFinite(level) ? level : 1), 1, MAX_TECHNIQUE_MASTERY_LEVEL);
  return {
    at25: clampedLevel >= 25,
    at50: clampedLevel >= 50,
    at75: clampedLevel >= 75,
    at100: clampedLevel >= 100,
  };
}

export function rankMultiplier(rank: number): number {
  const clampedRank = clamp(Math.floor(Number.isFinite(rank) ? rank : 1), 1, 10);
  return 1 + TECHNIQUE_RANK_MULTIPLIER_PER_RANK * (clampedRank - 1);
}

export function masteryMultiplier(level: number): number {
  const clampedLevel = clamp(Math.floor(Number.isFinite(level) ? level : 1), 1, MAX_TECHNIQUE_MASTERY_LEVEL);
  const base = 1 + TECHNIQUE_MASTERY_EFFECT_MULTIPLIER_PER_LEVEL * clampedLevel;
  return base * getMasteryMilestoneContract(clampedLevel).effectMult;
}

export function getMasteryMilestoneContract(level: number): MasteryMilestoneEffect {
  const clampedLevel = clamp(Math.floor(Number.isFinite(level) ? level : 1), 1, MAX_TECHNIQUE_MASTERY_LEVEL);

  if (clampedLevel >= 100) {
    return {
      highestUnlockedMilestone: 100,
      effectMult: 1.1,
      cooldownMult: 0.95,
      costMult: 0.9,
      secondaryUnlocked: true,
      cosmeticTitle: 'Perfected',
    };
  }

  if (clampedLevel >= 75) {
    return {
      highestUnlockedMilestone: 75,
      effectMult: 1,
      cooldownMult: 0.95,
      costMult: 0.9,
      secondaryUnlocked: true,
    };
  }

  if (clampedLevel >= 50) {
    return {
      highestUnlockedMilestone: 50,
      effectMult: 1,
      cooldownMult: 0.95,
      costMult: 0.9,
      secondaryUnlocked: false,
    };
  }

  if (clampedLevel >= 25) {
    return {
      highestUnlockedMilestone: 25,
      effectMult: 1,
      cooldownMult: 0.95,
      costMult: 1,
      secondaryUnlocked: false,
    };
  }

  return {
    highestUnlockedMilestone: 0,
    effectMult: 1,
    cooldownMult: 1,
    costMult: 1,
    secondaryUnlocked: false,
  };
}

export function getNextMasteryMilestoneContract(level: number): {
  level: MasteryMilestoneLevel;
  effectsSummary: string[];
} | null {
  const clampedLevel = clamp(Math.floor(Number.isFinite(level) ? level : 1), 1, MAX_TECHNIQUE_MASTERY_LEVEL);
  const nextLevel = MASTERY_MILESTONE_ORDER.find((milestone) => clampedLevel < milestone);
  return nextLevel
    ? { level: nextLevel, effectsSummary: [...MASTERY_SUMMARIES[nextLevel]] }
    : null;
}

export function getTechniqueRarityTraitSlots(rarity: TechRarity | null | undefined): number {
  return TECHNIQUE_RARITY_TRAIT_SLOTS[normalizeTechniqueRarity(rarity)];
}

export function getTechniqueTraitSlotBreakdown(input: {
  grade: ManualGrade | null | undefined;
  rarity: TechRarity | null | undefined;
}): TechniqueTraitSlotBreakdown {
  const grade = normalizeManualGrade(input.grade);
  const rarity = normalizeTechniqueRarity(input.rarity);
  const raritySlots = getTechniqueRarityTraitSlots(rarity);
  const gradeCap = getTechniqueTraitCapForGrade(grade);
  return {
    raritySlots,
    gradeCap,
    effectiveSlots: Math.min(raritySlots, gradeCap),
    rarity,
    grade,
  };
}

export function getTechniqueEffectiveTraitSlots(input: {
  grade: ManualGrade | null | undefined;
  rarity: TechRarity | null | undefined;
}): number {
  return getTechniqueTraitSlotBreakdown(input).effectiveSlots;
}

export function getTechniqueEffectiveRuneSockets(
  grade: ManualGrade | null | undefined,
): number {
  return getTechniqueRuneSocketsForGrade(grade);
}

export function getTechniqueSecondaryPotencyMultiplier(input: {
  grade: ManualGrade | null | undefined;
  masteryLevel: number;
}): number {
  const grade = normalizeManualGrade(input.grade);
  const masteryLevel = clamp(Math.floor(Number.isFinite(input.masteryLevel) ? input.masteryLevel : 1), 1, MAX_TECHNIQUE_MASTERY_LEVEL);
  if (grade !== 'heaven' || masteryLevel < 75) return 1;
  return 1 + getTechniqueSecondaryPotencyBonusForGrade(grade);
}

export function normalizeTechniqueProgressionState(
  source: TechniqueProgressionSource,
): TechniqueProgressionNormalizedState {
  const manualGrade = normalizeManualGrade(source.manualGrade);
  const rarity = normalizeTechniqueRarity(source.rarity);
  const masteryXp = sanitizeFiniteNonNegative(source.masteryXp);
  const rankCap = getTechniqueMaxRankForGrade(manualGrade);
  const rank = clamp(
    Math.floor(Number.isFinite(source.rank) ? source.rank ?? 1 : 1),
    1,
    rankCap,
  );
  const effectiveTraitSlots = getTechniqueEffectiveTraitSlots({ grade: manualGrade, rarity });
  const runeSockets = getTechniqueEffectiveRuneSockets(manualGrade);

  const traits = Array.isArray(source.traits)
    ? source.traits
      .filter((trait): trait is { id: string; value?: number; valuePct?: number } => {
        return !!trait && typeof trait === 'object' && typeof trait.id === 'string';
      })
      .slice(0, effectiveTraitSlots)
      .map((trait) => ({ ...trait }))
    : [];

  const normalizedRunes = Array.isArray(source.runes)
    ? source.runes.slice(0, runeSockets).map((rune) => rune ?? null)
    : [];
  while (normalizedRunes.length < runeSockets) {
    normalizedRunes.push(null);
  }

  return {
    manualGrade,
    rarity,
    masteryXp,
    rank,
    traits,
    runes: normalizedRunes,
  };
}

export function buildTechniqueProgressionSnapshot(
  source: TechniqueProgressionSource,
): TechniqueProgressionSnapshot {
  const normalized = normalizeTechniqueProgressionState(source);
  const masteryLevel = masteryLevelFromXp(normalized.masteryXp);
  const gradePolicy = getTechniqueGradePolicy(normalized.manualGrade);
  const masteryMilestoneEffects = getMasteryMilestoneContract(masteryLevel);
  const nextMasteryMilestone = getNextMasteryMilestoneContract(masteryLevel);
  const effectMultiplier = masteryMultiplier(masteryLevel) * rankMultiplier(normalized.rank);
  const cooldownReductionPct = clamp(1 - masteryMilestoneEffects.cooldownMult, 0, 1);
  const costReductionPct = clamp(1 - masteryMilestoneEffects.costMult, 0, 1);
  const secondaryPotencyMult = getTechniqueSecondaryPotencyMultiplier({
    grade: normalized.manualGrade,
    masteryLevel,
  });
  const traitSlotBreakdown = getTechniqueTraitSlotBreakdown({
    grade: normalized.manualGrade,
    rarity: normalized.rarity,
  });
  const runeSockets = getTechniqueEffectiveRuneSockets(normalized.manualGrade);

  return {
    grade: normalized.manualGrade,
    rarity: normalized.rarity,
    gradePolicy,
    masteryXp: normalized.masteryXp,
    masteryLevel,
    rank: normalized.rank,
    rankCap: getTechniqueMaxRankForGrade(normalized.manualGrade),
    masteryMilestoneEffects,
    nextMasteryMilestone,
    effectMultiplier,
    cooldownReductionPct,
    costReductionPct,
    secondaryPotencyMult,
    traitSlotBreakdown,
    runeSockets,
    appliedTraitCount: normalized.traits.length,
    appliedRuneCount: normalized.runes.filter((runeId) => Boolean(runeId)).length,
  };
}

export function getRetainedMasteryXp(
  masteryXp: number,
  retentionRatio: number,
): number {
  const sanitizedXp = sanitizeFiniteNonNegative(masteryXp);
  const sanitizedRatio = clamp(Number.isFinite(retentionRatio) ? retentionRatio : 0, 0, 1);
  return Math.min(
    xpNeededForLevel(MAX_TECHNIQUE_MASTERY_LEVEL),
    sanitizedXp * sanitizedRatio,
  );
}
