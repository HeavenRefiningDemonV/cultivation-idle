import type { HeartLawDef } from '../../content/index.js';
import { getHeartLawProfile } from '../doctrine/heartLawCatalog.js';
import {
  LIVE_SPIRIT_ROOT_ELEMENTS,
  getNormalizedHeartLawAffinityRules,
} from '../doctrine/heartLawEffectReaders.js';
import { useContentStore } from '../../stores/contentStore.js';
import type { SpiritRoot, SpiritRootElement } from '../../types/index.js';

export type AffinityStatus = 'match' | 'mismatch' | 'none';

export type HeartLawBonuses = {
  cultivateRateMult: number;
  combatDamageMult: number;
  professionSpeedMult: number;
  professionYieldMult: number;
  breakthroughRequirementMult: number;

  offlineEfficiencyAdd: number;
  stabilityCostMult: number;
  maxQiMult: number;
  maxHpMult: number;
  defMult: number;
  regenMult: number;
  damageReductionAdd: number;
  bossDamageTakenMult: number;
  cooldownMult: number;
  ultimateCooldownMult: number;
  shieldStrengthMult: number;
  dodgeAddPctPoints: number;
  poisonResistAdd: number;
  bossUltimateDamageTakenMult: number;
  critChanceAddPctPoints: number;
  critDmgMult: number;
  hasteMult: number;
  techniqueMasteryGainMult: number;
  intentMaxAdd: number;
  forgeSpeedMult: number;
  herbYieldMult: number;
  alchemyYieldMult: number;
  cooldownRefundChance: number;
  cooldownRefundPct: number;
  bossUltimateWarningAddSec: number;
  lifestealMaxHpPct: number;
  tribulationResistAdd: number;

  affinityMultiplier: number;
  affinityStatus: AffinityStatus;
  notes: string[];
};

const LIVE_SPIRIT_ROOT_ELEMENT_SET = new Set<SpiritRootElement>(LIVE_SPIRIT_ROOT_ELEMENTS);
const MULTIPLIER_KEY_TO_FIELD = {
  cultivateQiMult: 'cultivateRateMult',
  combatDamageMult: 'combatDamageMult',
  breakthroughRequirementMult: 'breakthroughRequirementMult',
  stabilityCostMult: 'stabilityCostMult',
  maxQiMult: 'maxQiMult',
  maxHpMult: 'maxHpMult',
  defMult: 'defMult',
  regenMult: 'regenMult',
  bossDamageTakenMult: 'bossDamageTakenMult',
  cooldownMult: 'cooldownMult',
  ultimateCooldownMult: 'ultimateCooldownMult',
  shieldStrength: 'shieldStrengthMult',
  bossUltimateDamageTakenMult: 'bossUltimateDamageTakenMult',
  critDmgMult: 'critDmgMult',
  hasteMult: 'hasteMult',
  techniqueMasteryGainMult: 'techniqueMasteryGainMult',
  forgeSpeed: 'forgeSpeedMult',
  herbYieldMult: 'herbYieldMult',
  alchemyYieldMult: 'alchemyYieldMult',
} as const satisfies Record<string, keyof HeartLawBonuses>;
const ADDITIVE_KEY_TO_FIELD = {
  offlineEfficiencyAdd: 'offlineEfficiencyAdd',
  damageReduction: 'damageReductionAdd',
  dodgeAddPctPoints: 'dodgeAddPctPoints',
  poisonResist: 'poisonResistAdd',
  critChanceAddPctPoints: 'critChanceAddPctPoints',
  intentMaxAdd: 'intentMaxAdd',
  cooldownRefundChance: 'cooldownRefundChance',
  cooldownRefundPct: 'cooldownRefundPct',
  bossUltimateWarningAddSec: 'bossUltimateWarningAddSec',
  lifestealMaxHpPct: 'lifestealMaxHpPct',
  tribulationResist: 'tribulationResistAdd',
} as const satisfies Record<string, keyof HeartLawBonuses>;

function createNeutralHeartLawBonuses(): HeartLawBonuses {
  return {
    cultivateRateMult: 1,
    combatDamageMult: 1,
    professionSpeedMult: 1,
    professionYieldMult: 1,
    breakthroughRequirementMult: 1,

    offlineEfficiencyAdd: 0,
    stabilityCostMult: 1,
    maxQiMult: 1,
    maxHpMult: 1,
    defMult: 1,
    regenMult: 1,
    damageReductionAdd: 0,
    bossDamageTakenMult: 1,
    cooldownMult: 1,
    ultimateCooldownMult: 1,
    shieldStrengthMult: 1,
    dodgeAddPctPoints: 0,
    poisonResistAdd: 0,
    bossUltimateDamageTakenMult: 1,
    critChanceAddPctPoints: 0,
    critDmgMult: 1,
    hasteMult: 1,
    techniqueMasteryGainMult: 1,
    intentMaxAdd: 0,
    forgeSpeedMult: 1,
    herbYieldMult: 1,
    alchemyYieldMult: 1,
    cooldownRefundChance: 0,
    cooldownRefundPct: 0,
    bossUltimateWarningAddSec: 0,
    lifestealMaxHpPct: 0,
    tribulationResistAdd: 0,

    affinityMultiplier: 1,
    affinityStatus: 'none',
    notes: [],
  };
}

function normalizeRequestedChapter(chapter: number): number {
  if (!Number.isFinite(chapter)) {
    return 1;
  }

  return Math.max(1, Math.floor(chapter));
}

function getResolvedAffinityCandidates(heartLawDef: HeartLawDef | null):
  | { kind: 'none' }
  | { kind: 'any' }
  | { kind: 'matchable'; values: readonly SpiritRootElement[] } {
  const profile = getHeartLawProfile(heartLawDef?.id ?? null);
  if (!profile) {
    return { kind: 'none' };
  }

  if (profile.spiritRootAffinities.includes('any')) {
    return { kind: 'any' };
  }

  if (profile.spiritRootAffinities.length > 0) {
    if (profile.liveSpiritRootAffinities.length === 0) {
      return { kind: 'none' };
    }

    return { kind: 'matchable', values: profile.liveSpiritRootAffinities };
  }

  const liveDaoTagAffinities = profile.daoTags.filter(
    (tag): tag is SpiritRootElement => LIVE_SPIRIT_ROOT_ELEMENT_SET.has(tag as SpiritRootElement),
  );

  if (liveDaoTagAffinities.length === 0) {
    return { kind: 'none' };
  }

  return { kind: 'matchable', values: liveDaoTagAffinities };
}

function getNormalizedRuntimeAffinityRules() {
  return getNormalizedHeartLawAffinityRules(useContentStore.getState().raw?.heart_law_affinity_rules);
}

function getMatchBonusForTier(tier: string | null | undefined): number {
  const normalizedRules = getNormalizedRuntimeAffinityRules();
  const tierKey = typeof tier === 'string' && tier.trim().length > 0 ? tier : 'starter';
  return normalizedRules.matchBonusByTier[tierKey] ?? normalizedRules.matchBonusByTier.starter ?? 0;
}

function shouldApplyAffinityScaling(appliesTo: string | undefined, source: 'signature' | `chapter:${number}`): boolean {
  const normalizedAppliesTo = appliesTo === 'signatureOnly' ? appliesTo : 'signatureOnly';
  return normalizedAppliesTo === 'signatureOnly' && source === 'signature';
}

export function computeAffinityMultiplier(heartLawDef: HeartLawDef | null, spiritRoot: SpiritRoot | null): number {
  const profile = getHeartLawProfile(heartLawDef?.id ?? null);
  if (!profile || !spiritRoot) {
    return 1;
  }

  const resolvedCandidates = getResolvedAffinityCandidates(heartLawDef);
  if (resolvedCandidates.kind === 'none' || resolvedCandidates.kind === 'any') {
    return 1;
  }

  const isMatch = resolvedCandidates.values.includes(spiritRoot.element);
  if (!isMatch) {
    return 1 - getNormalizedRuntimeAffinityRules().mismatchPenalty;
  }

  return 1 + getMatchBonusForTier(profile.tier);
}

export function getAffinityStatus(heartLawDef: HeartLawDef | null, spiritRoot: SpiritRoot | null): {
  status: AffinityStatus;
  percent: number;
} {
  const profile = getHeartLawProfile(heartLawDef?.id ?? null);
  if (!profile || !spiritRoot) {
    return { status: 'none', percent: 0 };
  }

  const resolvedCandidates = getResolvedAffinityCandidates(heartLawDef);
  if (resolvedCandidates.kind === 'none' || resolvedCandidates.kind === 'any') {
    return { status: 'none', percent: 0 };
  }

  if (!resolvedCandidates.values.includes(spiritRoot.element)) {
    return {
      status: 'mismatch',
      percent: Math.round(getNormalizedRuntimeAffinityRules().mismatchPenalty * 100),
    };
  }

  return {
    status: 'match',
    percent: Math.round(getMatchBonusForTier(profile.tier) * 100),
  };
}

export function getHeartLawBonuses(options: {
  heartLawDef: HeartLawDef | null;
  chapter: number;
  spiritRoot: SpiritRoot | null;
}): HeartLawBonuses {
  const { heartLawDef, chapter, spiritRoot } = options;
  const bonuses = createNeutralHeartLawBonuses();
  const profile = getHeartLawProfile(heartLawDef?.id ?? null);

  if (!heartLawDef || !profile) {
    return bonuses;
  }

  const requestedChapter = normalizeRequestedChapter(chapter);
  const affinityMultiplier = computeAffinityMultiplier(heartLawDef, spiritRoot);
  const affinityStatus = getAffinityStatus(heartLawDef, spiritRoot).status;
  const appliesTo = getNormalizedRuntimeAffinityRules().appliesTo;

  bonuses.affinityMultiplier = affinityMultiplier;
  bonuses.affinityStatus = affinityStatus;

  const activeEffects = [
    ...profile.signatureEffects,
    ...Object.entries(profile.chapterEffectsByChapter)
      .filter(([chapterKey]) => Number(chapterKey) <= requestedChapter)
      .flatMap(([, effects]) => effects),
  ];

  const multiplierDeltas: Partial<Record<(typeof MULTIPLIER_KEY_TO_FIELD)[keyof typeof MULTIPLIER_KEY_TO_FIELD], number>> = {};

  activeEffects.forEach((effect) => {
    if (typeof effect.value !== 'number') {
      return;
    }

    const scaledValue =
      effect.appliesAffinity && shouldApplyAffinityScaling(appliesTo, effect.source)
        ? effect.value * affinityMultiplier
        : effect.value;

    const multiplierField = MULTIPLIER_KEY_TO_FIELD[effect.normalizedKey as keyof typeof MULTIPLIER_KEY_TO_FIELD];
    if (multiplierField) {
      multiplierDeltas[multiplierField] = (multiplierDeltas[multiplierField] ?? 0) + scaledValue;
      return;
    }

    const additiveField = ADDITIVE_KEY_TO_FIELD[effect.normalizedKey as keyof typeof ADDITIVE_KEY_TO_FIELD];
    if (additiveField) {
      bonuses[additiveField] += scaledValue;
    }
  });

  (Object.values(MULTIPLIER_KEY_TO_FIELD) as Array<(typeof MULTIPLIER_KEY_TO_FIELD)[keyof typeof MULTIPLIER_KEY_TO_FIELD]>).forEach((field) => {
    bonuses[field] = 1 + (multiplierDeltas[field] ?? 0);
  });

  bonuses.professionSpeedMult = bonuses.forgeSpeedMult;
  bonuses.professionYieldMult = Math.max(0, 1 + ((bonuses.herbYieldMult - 1) + (bonuses.alchemyYieldMult - 1)));

  const seenNotes = new Set<string>();
  bonuses.notes = profile.notes.filter((note) => {
    if (seenNotes.has(note)) {
      return false;
    }
    seenNotes.add(note);
    return true;
  });

  return bonuses;
}
