import type { TechniqueDef } from '../../content';
import type { CastingPolicy, AiProfile } from '../../stores/techniqueStore';
import type { NormalizedEffect } from '../techniques/effects';

export type TechniqueAiTags = {
  isHeal: boolean;
  isShield: boolean;
  isCleanse: boolean;
  isAoe: boolean;
  isBurstDamage: boolean;
};

const NAME_HINTS = {
  heal: ['heal', 'mend', 'renew', 'rejuvenate', 'recovery'],
  shield: ['shield', 'barrier', 'ward', 'aegis', 'guard'],
  cleanse: ['cleanse', 'purge', 'dispel', 'clean'],
  aoe: ['nova', 'storm', 'wave', 'burst', 'arc', 'whirl'],
  burst: ['strike', 'smash', 'blast', 'impact', 'rupture'],
};

const matchNameHints = (name: string, hints: string[]) =>
  hints.some((hint) => name.includes(hint));

export function getTechniqueAiTags(
  def: TechniqueDef | undefined,
  effects: NormalizedEffect[] = [],
): TechniqueAiTags {
  const name = (def?.name ?? '').toLowerCase();
  const tags = Array.isArray(def?.tags) ? def.tags.map((t) => t.toLowerCase()) : [];

  const isHeal = effects.some((effect) => effect.type === 'heal') || matchNameHints(name, NAME_HINTS.heal);
  const isShield =
    effects.some((effect) => effect.type === 'shield') || matchNameHints(name, NAME_HINTS.shield);
  const isCleanse = matchNameHints(name, NAME_HINTS.cleanse);
  const isAoe =
    tags.includes('aoe') ||
    effects.some((effect) => (effect as { radius?: unknown }).radius != null) ||
    matchNameHints(name, [...NAME_HINTS.aoe, 'rain']);
  const isBurstDamage =
    effects.some((effect) => effect.type === 'damage' && Number(effect.mult ?? 0) >= 3) ||
    matchNameHints(name, NAME_HINTS.burst);

  return { isHeal, isShield, isCleanse, isAoe, isBurstDamage };
}

export function mapAiProfileToCastingPolicy(profile: AiProfile | undefined): CastingPolicy {
  switch (profile) {
    case 'survivor':
      return 'defensive';
    case 'burst':
      return 'aggressive';
    case 'farmer':
      return 'balanced';
    default:
      return 'balanced';
  }
}

export function buildAiHint(
  profile: AiProfile,
  tags: TechniqueAiTags,
  context: { hpPct: number; enemyHpPct: number; enemyIsBoss: boolean },
): string {
  const { hpPct, enemyHpPct, enemyIsBoss } = context;

  if (profile === 'survivor' && (tags.isHeal || tags.isShield)) {
    return 'Survivor: used sustain because HP was low.';
  }

  if (profile === 'burst' && (tags.isBurstDamage || enemyIsBoss || enemyHpPct > 0.4)) {
    return 'Burst: prioritizing high-damage cast for boss pressure.';
  }

  if (profile === 'farmer' && !enemyIsBoss && tags.isAoe) {
    return 'Farmer: using AoE to clear faster.';
  }

  if (tags.isCleanse) {
    return `${profile === 'survivor' ? 'Survivor' : 'Balanced'}: cleansing to stay safe.`;
  }

  if (hpPct < 0.5 && (tags.isHeal || tags.isShield)) {
    return 'AI: defensive cast due to low HP.';
  }

  if (tags.isBurstDamage) {
    return enemyIsBoss
      ? 'AI: burst cast to push the boss.'
      : 'AI: burst cast to finish the fight quickly.';
  }

  return 'AI: standard cast for steady damage.';
}
