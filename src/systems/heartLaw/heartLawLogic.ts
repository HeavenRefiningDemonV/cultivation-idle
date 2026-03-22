import type { HeartLawDef } from '../../content/index.js';
import type { SpiritRoot } from '../../types/index.js';

export type AffinityStatus = 'match' | 'mismatch' | 'none';

export type HeartLawBonuses = {
  cultivateRateMult: number;
  combatDamageMult: number;
  professionSpeedMult?: number;
  professionYieldMult?: number;
  affinityMultiplier: number;
  affinityStatus: AffinityStatus;
  notes?: string[];
};

function normalizeTier(tier?: string): number {
  if (!tier) return 0;
  if (tier === 'starter') return 0;
  if (tier === 'tier1') return 1;
  if (tier === 'tier2') return 2;
  if (tier === 'tier3') return 3;
  const match = tier.match(/\d+/);
  if (match) return Number(match[0]);
  return 0;
}

function hasDaoMatch(heartLawDef: HeartLawDef, spiritRoot: SpiritRoot | null): boolean {
  const element = spiritRoot?.element?.toLowerCase();
  if (!element) return false;
  const tags = (heartLawDef.daoTags ?? []).map((tag) => tag.toLowerCase());
  return tags.includes(element);
}

export function computeAffinityMultiplier(heartLawDef: HeartLawDef | null, spiritRoot: SpiritRoot | null): number {
  if (!heartLawDef || !spiritRoot || !heartLawDef.daoTags || heartLawDef.daoTags.length === 0) return 1;
  const match = hasDaoMatch(heartLawDef, spiritRoot);
  if (!match) return 0.95;
  const tier = normalizeTier(heartLawDef.tier);
  if (tier <= 0) return 1.1;
  if (tier === 1) return 1.15;
  return 1.2;
}

export function getAffinityStatus(heartLawDef: HeartLawDef | null, spiritRoot: SpiritRoot | null): {
  status: AffinityStatus;
  percent: number;
} {
  if (!heartLawDef || !spiritRoot || !heartLawDef.daoTags || heartLawDef.daoTags.length === 0) {
    return { status: 'none', percent: 0 };
  }
  const match = hasDaoMatch(heartLawDef, spiritRoot);
  if (!match) return { status: 'mismatch', percent: 5 };
  const multiplier = computeAffinityMultiplier(heartLawDef, spiritRoot);
  return { status: 'match', percent: Math.round((multiplier - 1) * 100) };
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}

function applyEffectBonuses(
  effects: Record<string, unknown>,
  target: { cultivate: number; combat: number },
): void {
  const cultivate = readNumber(effects.cultivateQiMult);
  if (cultivate !== null) target.cultivate += cultivate;
  const combat = readNumber(effects.combatDamageMult);
  if (combat !== null) target.combat += combat;
}

export function getHeartLawBonuses(options: {
  heartLawDef: HeartLawDef | null;
  chapter: number;
  spiritRoot: SpiritRoot | null;
}): HeartLawBonuses {
  const { heartLawDef, chapter, spiritRoot } = options;
  const base: HeartLawBonuses = {
    cultivateRateMult: 1,
    combatDamageMult: 1,
    professionSpeedMult: 1,
    professionYieldMult: 1,
    affinityMultiplier: 1,
    affinityStatus: 'none',
    notes: [],
  };

  if (!heartLawDef) return base;

  const affinityMultiplier = computeAffinityMultiplier(heartLawDef, spiritRoot);
  const affinityStatus = getAffinityStatus(heartLawDef, spiritRoot).status;

  const signatureBonuses = { cultivate: 0, combat: 0 };
  const chapterBonuses = { cultivate: 0, combat: 0 };
  let signatureFound = false;
  let chapterFound = false;

  if (heartLawDef.signature && typeof heartLawDef.signature === 'object') {
    applyEffectBonuses(heartLawDef.signature as Record<string, unknown>, signatureBonuses);
    signatureFound = signatureBonuses.cultivate !== 0 || signatureBonuses.combat !== 0;
  }

  const chapters = heartLawDef.chapters ?? [];
  chapters.forEach((entry) => {
    if (entry.chapter > chapter) return;
    if (entry.effects && typeof entry.effects === 'object') {
      const before = { ...chapterBonuses };
      applyEffectBonuses(entry.effects as Record<string, unknown>, chapterBonuses);
      if (before.cultivate !== chapterBonuses.cultivate || before.combat !== chapterBonuses.combat) {
        chapterFound = true;
      }
    }
  });

  if (!signatureFound) {
    switch (heartLawDef.archetype) {
      case 'steady':
        signatureBonuses.cultivate += 0.1;
        signatureBonuses.combat += 0;
        break;
      case 'burst':
        signatureBonuses.cultivate += 0.05;
        signatureBonuses.combat += 0.05;
        break;
      case 'artisan':
        signatureBonuses.cultivate += 0;
        signatureBonuses.combat += -0.03;
        base.professionYieldMult = 1.1;
        break;
      case 'mystic':
        signatureBonuses.cultivate += 0.05;
        signatureBonuses.combat += 0.02;
        break;
      case 'risk':
        signatureBonuses.cultivate += 0.15;
        signatureBonuses.combat += -0.05;
        break;
      default:
        signatureBonuses.cultivate += 0.1;
        break;
    }
  }

  if (!chapterFound && chapter >= 2) {
    chapterBonuses.cultivate += 0.02;
    chapterBonuses.combat += 0.02;
  }

  const adjustedSignatureCultivate = signatureBonuses.cultivate * affinityMultiplier;
  const adjustedSignatureCombat = signatureBonuses.combat * affinityMultiplier;

  return {
    cultivateRateMult: 1 + adjustedSignatureCultivate + chapterBonuses.cultivate,
    combatDamageMult: 1 + adjustedSignatureCombat + chapterBonuses.combat,
    professionSpeedMult: base.professionSpeedMult,
    professionYieldMult: base.professionYieldMult,
    affinityMultiplier,
    affinityStatus,
    notes: base.notes,
  };
}
