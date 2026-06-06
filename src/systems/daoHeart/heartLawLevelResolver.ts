import { heartLawXpToNextLevel } from './daoHeartProgressionResolver.js';
import { resolveCultivationMindAlignment } from '../cultivation/cultivationMindAlignmentResolver.js';

export type HeartLawTier = 'starter' | 'tier1' | 'tier2' | 'tier3';

export interface HeartLawChapterBand {
  id: string;
  index: number;
  levelStart: number;
  levelEnd: number;
  pressure: number;
  label: string;
}

export interface HeartLawLevelPreviewInput {
  currentLevel: number;
  currentXp: number;
  gainedXp: number;
  tier: HeartLawTier | string | null | undefined;
  cultivationEffectiveStage: number;
}

export interface HeartLawLevelPreview {
  currentLevel: number;
  nextLevel: number;
  nextXp: number;
  xpToNextLevel: number;
  rawXpGain: number;
  appliedXpGain: number;
  levelsGained: number;
  xpGainMultiplier: number;
  chapterBand: HeartLawChapterBand;
  efficiencyLabel: string | null;
}

export const HEART_LAW_MAX_LEVEL = 45;

export const HEART_LAW_TIER_MULTIPLIERS: Record<HeartLawTier, number> = {
  starter: 1,
  tier1: 1.12,
  tier2: 1.25,
  tier3: 1.42,
};

export const HEART_LAW_CHAPTER_BANDS: HeartLawChapterBand[] = [
  { id: 'chapter_1', index: 1, levelStart: 1, levelEnd: 6, pressure: 1, label: 'Chapter 1' },
  { id: 'chapter_2', index: 2, levelStart: 7, levelEnd: 12, pressure: 1.08, label: 'Chapter 2' },
  { id: 'chapter_3', index: 3, levelStart: 13, levelEnd: 18, pressure: 1.16, label: 'Chapter 3' },
  { id: 'chapter_4', index: 4, levelStart: 19, levelEnd: 27, pressure: 1.25, label: 'Chapter 4' },
  { id: 'chapter_5', index: 5, levelStart: 28, levelEnd: 33, pressure: 1.35, label: 'Chapter 5' },
  { id: 'chapter_6', index: 6, levelStart: 34, levelEnd: 39, pressure: 1.47, label: 'Chapter 6' },
  { id: 'chapter_7', index: 7, levelStart: 40, levelEnd: 45, pressure: 1.47, label: 'Chapter 7' },
];

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export function normalizeHeartLawTier(tier: HeartLawTier | string | null | undefined): HeartLawTier {
  return tier === 'tier1' || tier === 'tier2' || tier === 'tier3' || tier === 'starter' ? tier : 'starter';
}

export function heartLawTierMultiplier(tier: HeartLawTier | string | null | undefined): number {
  return HEART_LAW_TIER_MULTIPLIERS[normalizeHeartLawTier(tier)];
}

export function heartLawChapterBandForLevel(level: number): HeartLawChapterBand {
  const clamped = clamp(Math.floor(level), 1, HEART_LAW_MAX_LEVEL);
  return HEART_LAW_CHAPTER_BANDS.find((band) => clamped >= band.levelStart && clamped <= band.levelEnd)
    ?? HEART_LAW_CHAPTER_BANDS[0];
}

export function heartLawOverlevelEfficiency(params: {
  heartLawStage: number;
  cultivationEffectiveStage: number;
}): { multiplier: number; label: string | null } {
  const mindAlignment = resolveCultivationMindAlignment({
    heartLawLevel: params.heartLawStage,
    cultivationStageIndex: params.cultivationEffectiveStage,
  });
  if (mindAlignment.capState !== 'overexpressed') {
    return { multiplier: 1, label: null };
  }
  const overlevelGap = Math.max(0, mindAlignment.parityDelta - 2);
  const overlevelMultiplier = Math.max(0.35, mindAlignment.heartLawXpMultiplier - overlevelGap * 0.02);
  return {
    multiplier: overlevelMultiplier,
    label: mindAlignment.causeRows[0]?.explanation ?? 'Doctrine exceeds vessel; expression inefficient.',
  };
}

export function resolveHeartLawLevelPreview(input: HeartLawLevelPreviewInput): HeartLawLevelPreview {
  const currentLevel = clamp(Math.floor(input.currentLevel), 1, HEART_LAW_MAX_LEVEL);
  const currentXp = Math.max(0, Number.isFinite(input.currentXp) ? input.currentXp : 0);
  const rawXpGain = Math.max(0, Number.isFinite(input.gainedXp) ? input.gainedXp : 0);
  const efficiency = heartLawOverlevelEfficiency({
    heartLawStage: currentLevel,
    cultivationEffectiveStage: input.cultivationEffectiveStage,
  });
  let nextLevel = currentLevel;
  let nextXp = currentXp + rawXpGain * efficiency.multiplier;
  let levelsGained = 0;
  while (nextLevel < HEART_LAW_MAX_LEVEL) {
    const band = heartLawChapterBandForLevel(nextLevel);
    const requirement = heartLawXpToNextLevel({
      level: nextLevel,
      tierMultiplier: heartLawTierMultiplier(input.tier),
      chapterPressure: band.pressure,
    });
    if (nextXp < requirement) break;
    nextXp -= requirement;
    nextLevel += 1;
    levelsGained += 1;
  }
  if (nextLevel >= HEART_LAW_MAX_LEVEL) {
    nextXp = 0;
  }
  const nextBand = heartLawChapterBandForLevel(nextLevel);
  return {
    currentLevel,
    nextLevel,
    nextXp,
    xpToNextLevel: heartLawXpToNextLevel({
      level: nextLevel,
      tierMultiplier: heartLawTierMultiplier(input.tier),
      chapterPressure: nextBand.pressure,
    }),
    rawXpGain,
    appliedXpGain: rawXpGain * efficiency.multiplier,
    levelsGained,
    xpGainMultiplier: efficiency.multiplier,
    chapterBand: nextBand,
    efficiencyLabel: efficiency.label,
  };
}
