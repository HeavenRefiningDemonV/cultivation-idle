import type { AiProfile } from '../../stores/techniqueStore';
import type { TechniqueDef } from '../../content';
import type { NormalizedEffect } from '../techniques/effects';
import { classifyTechnique } from '../techniques/effects';

export type TechniqueAiTags = {
  isHeal: boolean;
  isShield: boolean;
  isCleanse: boolean;
  isAoe: boolean;
  isBurstDamage: boolean;
};

const CLEANSE_HINTS = ['cleanse', 'purify', 'dispel'];
const AOE_HINTS = ['nova', 'storm', 'wave', 'blast', 'field'];
const BURST_HINTS = ['burst', 'ultimate', 'obliterate', 'annihilate'];

export const AI_PROFILE_OPTIONS: { value: AiProfile; label: string; description: string }[] = [
  { value: 'balanced', label: 'Balanced', description: 'Even mix of offense/defense.' },
  { value: 'survivor', label: 'Survivor', description: 'Prioritize shields/heals/cleanse when threatened.' },
  { value: 'burst', label: 'Burst', description: 'Prioritize big cooldown damage, especially on bosses.' },
  { value: 'farmer', label: 'Farmer', description: 'Prioritize fast clears and AoE; accepts more risk.' },
];

/**
 * Temporary heuristic to infer AI-relevant tags when explicit tags are missing.
 * Prefer explicit fields in technique definitions; fall back to safe name checks.
 */
export function getTechniqueAiTags(def: TechniqueDef, effects?: NormalizedEffect[]): TechniqueAiTags {
  const tags = (def.tags ?? []).map((tag) => tag.toLowerCase());
  const maybeEffect = (def as { effect?: unknown }).effect;
  const fallbackEffects = Array.isArray(maybeEffect) ? (maybeEffect as NormalizedEffect[]) : [];
  const effectList = effects ?? fallbackEffects;

  const name = (def.name ?? '').toLowerCase();

  const isHeal = tags.includes('heal') || effectList.some((effect) => effect.type === 'heal');
  const isShield = tags.includes('shield') || effectList.some((effect) => effect.type === 'shield');
  const isCleanse =
    tags.some((tag) => CLEANSE_HINTS.includes(tag)) ||
    effectList.some((effect) => effect.type === 'cleanse' || effect.type === 'purify');

  const isAoe =
    tags.includes('aoe') ||
    effectList.some((effect) => 'aoe' in effect || effect.type === 'area') ||
    AOE_HINTS.some((hint) => name.includes(hint));

  const classification = classifyTechnique(def);
  const isBurstDamage =
    classification.isUltimate ||
    classification.isBurst ||
    tags.some((tag) => BURST_HINTS.includes(tag)) ||
    BURST_HINTS.some((hint) => name.includes(hint));

  return { isHeal, isShield, isCleanse, isAoe, isBurstDamage };
}

export type AiScoringContext = {
  profile: AiProfile;
  hpPct: number;
  enemyHpPct: number;
  enemyIsBoss: boolean;
  isPlayerDebuffed?: boolean;
};

export function applyAiProfileBias(
  baseScore: number,
  tags: TechniqueAiTags,
  classification: ReturnType<typeof classifyTechnique>,
  context: AiScoringContext,
): number {
  const { profile, hpPct, enemyHpPct, enemyIsBoss, isPlayerDebuffed } = context;
  let score = baseScore;

  if (profile === 'balanced') {
    if (hpPct > 0.9 && (tags.isHeal || tags.isShield)) {
      score -= 1.5;
    }
    if (hpPct < 0.5 && (tags.isHeal || tags.isShield)) {
      score += 0.5;
    }
    return score;
  }

  if (profile === 'survivor') {
    if (hpPct < 0.5) {
      if (tags.isHeal) score += 6;
      if (tags.isShield) score += 5;
      if (tags.isCleanse && isPlayerDebuffed) score += 4;
      if (classification.isUltimate || tags.isBurstDamage) score -= 2;
    }
    if (hpPct < 0.3 && (tags.isHeal || tags.isShield)) score += 2;
    if (tags.isHeal || tags.isShield) score += 1;
    if (classification.isBurst && hpPct < 0.55) score -= 1.5;
    return score;
  }

  if (profile === 'burst') {
    if (enemyIsBoss || enemyHpPct > 0.4) {
      if (tags.isBurstDamage || classification.isUltimate || classification.isBurst) score += 4;
      if (tags.isAoe && !enemyIsBoss) score += 1;
      if (tags.isHeal && hpPct > 0.75) score -= 1;
    } else {
      // Late fight: stay close to balanced but keep slight aggression
      if (classification.isBurst || tags.isBurstDamage) score += 1.5;
    }
    return score;
  }

  // farmer
  if (!enemyIsBoss) {
    if (tags.isAoe) score += 4;
    if (tags.isBurstDamage) score += 1.5;
    if (classification.isUltimate && enemyHpPct < 0.3) score -= 1;
    if (tags.isHeal || tags.isShield) score -= 1.5;
  } else {
    // Against bosses, stay aggressive but do not over-value defenses
    if (tags.isBurstDamage || classification.isUltimate) score += 1;
    if (tags.isHeal && hpPct > 0.7) score -= 0.5;
  }

  return score;
}

export function buildAiReason(
  techniqueName: string,
  tags: TechniqueAiTags,
  context: AiScoringContext,
): string {
  const { profile, hpPct, enemyIsBoss } = context;
  const lowHp = hpPct < 0.45;

  if (profile === 'survivor' && lowHp && (tags.isHeal || tags.isShield)) {
    return `Survivor: used ${techniqueName} for protection at low HP.`;
  }

  if (profile === 'burst' && (tags.isBurstDamage || tags.isAoe)) {
    return `Burst: used ${techniqueName} to push damage${enemyIsBoss ? ' on the boss' : ''}.`;
  }

  if (profile === 'farmer' && tags.isAoe) {
    return `Farmer: used ${techniqueName} to clear faster with AoE.`;
  }

  if (profile === 'balanced' && tags.isHeal && lowHp) {
    return `Balanced: used ${techniqueName} to stay healthy.`;
  }

  if (profile === 'survivor' && tags.isCleanse) {
    return `Survivor: used ${techniqueName} to stay safe from debuffs.`;
  }

  return `${profile[0].toUpperCase()}${profile.slice(1)}: used ${techniqueName} based on current state.`;
}
