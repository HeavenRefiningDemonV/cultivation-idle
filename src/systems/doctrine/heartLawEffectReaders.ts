import type { HeartLawAffinityRules, HeartLawEffectPayload } from '../../content/index.js';
import type { SpiritRootElement } from '../../types/index.js';
import type { NormalizedHeartLawEffect } from './heartLawTypes.js';

const DOMAIN_WEIGHTS = {
  cultivation: 1.5,
  profession: 1.25,
  economy: 1.0,
  breakthrough: 1.5,
  utility: 0.2,
  combat: 0.35,
} as const;

const RAW_KEY_DOMAIN: Readonly<Record<string, NormalizedHeartLawEffect['domain']>> = Object.freeze({
  cultivateQiMult: 'cultivation',
  offlineEfficiencyAdd: 'cultivation',
  stabilityCostMult: 'cultivation',
  maxQiMult: 'cultivation',
  heavenCostMult: 'cultivation',
  cultivationCharge: 'cultivation',
  emberCapAdd: 'cultivation',
  combatDamageMult: 'combat',
  combatOpenerBuff: 'combat',
  combatOpenerAtkMultAddPer10Charge: 'combat',
  combatOpenerDurationAddSec: 'combat',
  burnDamageMult: 'combat',
  critDmgMult: 'combat',
  martialDamageMult: 'combat',
  critChanceAddPctPoints: 'combat',
  combatFireDamageMult: 'combat',
  burnMaxStacksAdd: 'combat',
  poisonDamageMult: 'combat',
  soulDamageMult: 'combat',
  bossDamageMult: 'combat',
  voidWindow: 'combat',
  voidWindowIgnoreDefPct: 'combat',
  voidWindowDurationAddSec: 'combat',
  voidDamageMult: 'combat',
  ultimateDamageMult: 'combat',
  techniqueMasteryGainMult: 'profession',
  forgeSpeed: 'profession',
  herbYieldMult: 'profession',
  regenMult: 'profession',
  alchemyYieldMult: 'profession',
  refineEffectiveness: 'profession',
  runeDustYield: 'profession',
  heavenManualDropChance: 'economy',
  ruinsFragmentGainMult: 'economy',
  combatFirstBossKillBonus: 'economy',
  bossRespawnTimeMult: 'economy',
  bossKillLantern: 'economy',
  manualFragmentBonusPerLantern: 'economy',
  maxLanternBonus: 'economy',
  lanternCapAdd: 'economy',
  bossChestManualDropChanceAdd: 'economy',
  artifactShardGainMult: 'economy',
  ruinsDropRate: 'economy',
  breakthroughRequirementMult: 'breakthrough',
  tribulationResist: 'breakthrough',
  maxHpMult: 'utility',
  defMult: 'utility',
  damageReduction: 'utility',
  bossDamageTakenMult: 'utility',
  cooldownMult: 'utility',
  shieldStrength: 'utility',
  dodgeAddPctPoints: 'utility',
  poisonResist: 'utility',
  bossUltimateDamageTakenMult: 'utility',
  intentMaxAdd: 'utility',
  ultimateCooldownMult: 'utility',
  hasteMult: 'utility',
  lifestealMaxHpPct: 'utility',
  cooldownRefundChance: 'utility',
  cooldownRefundPct: 'utility',
  bossUltimateWarningAddSec: 'utility',
  note: 'utility',
  cap: 'utility',
});

export const LIVE_SPIRIT_ROOT_ELEMENTS: readonly SpiritRootElement[] = Object.freeze([
  'fire',
  'water',
  'earth',
  'metal',
  'wood',
]);

export const SUPPORTED_HEART_LAW_RAW_KEYS: readonly string[] = Object.freeze([
  'cultivateQiMult',
  'offlineEfficiencyAdd',
  'stabilityCostMult',
  'maxQiMult',
  'combatDamageMult',
  'techniqueMasteryGainMult',
  'maxHpMult',
  'defMult',
  'damageReduction',
  'forgeSpeed',
  'bossDamageTakenMult',
  'cultivationCharge',
  'combatOpenerBuff',
  'emberCapAdd',
  'combatOpenerAtkMultAddPer10Charge',
  'burnDamageMult',
  'heavenManualDropChance',
  'note',
  'combatOpenerDurationAddSec',
  'cooldownMult',
  'shieldStrength',
  'dodgeAddPctPoints',
  'poisonResist',
  'bossUltimateDamageTakenMult',
  'herbYieldMult',
  'regenMult',
  'alchemyYieldMult',
  'poisonDamageMult',
  'critDmgMult',
  'intentMaxAdd',
  'martialDamageMult',
  'critChanceAddPctPoints',
  'combatFireDamageMult',
  'heavenCostMult',
  'burnMaxStacksAdd',
  'ultimateCooldownMult',
  'ruinsFragmentGainMult',
  'cap',
  'hasteMult',
  'combatFirstBossKillBonus',
  'bossRespawnTimeMult',
  'bossKillLantern',
  'manualFragmentBonusPerLantern',
  'maxLanternBonus',
  'lanternCapAdd',
  'soulDamageMult',
  'bossChestManualDropChanceAdd',
  'lifestealMaxHpPct',
  'bossDamageMult',
  'voidWindow',
  'voidWindowIgnoreDefPct',
  'voidWindowDurationAddSec',
  'voidDamageMult',
  'cooldownRefundChance',
  'cooldownRefundPct',
  'bossUltimateWarningAddSec',
  'breakthroughRequirementMult',
  'ultimateDamageMult',
  'tribulationResist',
  'refineEffectiveness',
  'runeDustYield',
  'artifactShardGainMult',
  'ruinsDropRate',
]);

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asPrimitive(value: unknown): number | string | boolean | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }
  return null;
}

function toChapter(source: 'signature' | `chapter:${number}`): number | null {
  if (source === 'signature') {
    return null;
  }

  const chapter = Number(source.split(':')[1] ?? '');
  return Number.isFinite(chapter) ? chapter : null;
}

function getBudgetWeight(domain: NormalizedHeartLawEffect['domain']): number {
  return DOMAIN_WEIGHTS[domain];
}

function buildEffect(
  source: 'signature' | `chapter:${number}`,
  rawKey: string,
  normalizedKey: string,
  value: number | string | boolean,
  domain: NormalizedHeartLawEffect['domain'],
  budgetWeight: number,
  appliesAffinityOverride?: boolean,
): NormalizedHeartLawEffect {
  return Object.freeze({
    source,
    chapter: toChapter(source),
    rawKey,
    normalizedKey,
    domain,
    value,
    appliesAffinity: appliesAffinityOverride ?? (source === 'signature'),
    budgetWeight,
  });
}

function pairCapKey(payload: Record<string, unknown>): string | null {
  const keys = Object.keys(payload).filter((key) => key !== 'note' && key !== 'cap');
  if (keys.length !== 1) {
    return null;
  }

  return keys[0] ?? null;
}

const HEART_LAW_CHAPTER_THRESHOLDS: readonly number[] = Object.freeze([0, 80, 220, 500, 1000]);

const HEART_LAW_CHAPTER_VALUE_DISTRIBUTION = Object.freeze([
  Object.freeze({ chapter: 1, weightPct: 32 }),
  Object.freeze({ chapter: 2, weightPct: 18 }),
  Object.freeze({ chapter: 3, weightPct: 18 }),
  Object.freeze({ chapter: 4, weightPct: 17 }),
  Object.freeze({ chapter: 5, weightPct: 15 }),
] as const);

export function getHeartLawChapterThresholds(): readonly number[] {
  return HEART_LAW_CHAPTER_THRESHOLDS;
}

export function getHeartLawChapterValueDistribution() {
  return HEART_LAW_CHAPTER_VALUE_DISTRIBUTION;
}

export function getNormalizedHeartLawAffinityRules(
  rules: HeartLawAffinityRules | null | undefined,
): Required<HeartLawAffinityRules> {
  const tierDefaults: Record<string, number> = {
    starter: 0.10,
    tier1: 0.14,
    tier2: 0.18,
    tier3: 0.22,
  };

  const matchBonusByTier: Record<string, number> = { ...tierDefaults };
  if (rules?.matchBonusByTier) {
    Object.entries(rules.matchBonusByTier).forEach(([tier, value]) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        matchBonusByTier[tier] = value;
      }
    });
  }

  return {
    matchBonusByTier,
    mismatchPenalty:
      typeof rules?.mismatchPenalty === 'number' && Number.isFinite(rules.mismatchPenalty)
        ? rules.mismatchPenalty
        : 0.05,
    appliesTo:
      typeof rules?.appliesTo === 'string' && rules.appliesTo.trim().length > 0
        ? rules.appliesTo.trim()
        : 'signatureOnly',
  };
}

export function normalizeHeartLawEffectEntries(
  source: 'signature' | `chapter:${number}`,
  payload: HeartLawEffectPayload | null | undefined,
): NormalizedHeartLawEffect[] {
  if (!isObjectLike(payload)) {
    return [];
  }

  const entries: NormalizedHeartLawEffect[] = [];
  const pairedCapKey = pairCapKey(payload);

  Object.entries(payload).forEach(([rawKey, rawValue]) => {
    if (!SUPPORTED_HEART_LAW_RAW_KEYS.includes(rawKey)) {
      return;
    }

    if (rawKey === 'note') {
      if (typeof rawValue === 'string' && rawValue.trim().length > 0) {
        entries.push(buildEffect(source, 'note', 'note', rawValue.trim(), 'utility', 0, false));
      }
      return;
    }

    if (rawKey === 'cap') {
      if (!pairedCapKey) {
        return;
      }
      const primitive = asPrimitive(rawValue);
      if (primitive !== null) {
        entries.push(buildEffect(source, 'cap', `${pairedCapKey}.cap`, primitive, 'utility', 0, false));
      }
      return;
    }

    if (rawKey === 'cultivationCharge' && isObjectLike(rawValue)) {
      const primitiveEntries: Array<[string, unknown, number]> = [
        ['cultivationCharge.resourceId', rawValue.resourceId, 0],
        ['cultivationCharge.gainPerCultivateMinute', rawValue.gainPerCultivateMinute, getBudgetWeight('cultivation')],
        ['cultivationCharge.cap', rawValue.cap, 0],
      ];
      primitiveEntries.forEach(([normalizedKey, value, budgetWeight]) => {
        const primitive = asPrimitive(value);
        if (primitive !== null) {
          entries.push(buildEffect(source, rawKey, normalizedKey, primitive, 'cultivation', budgetWeight));
        }
      });
      return;
    }

    if (rawKey === 'combatOpenerBuff' && isObjectLike(rawValue)) {
      const potencyPriority: Array<[string, unknown]> = [
        ['combatOpenerBuff.atkMult', rawValue.atkMult],
        ['combatOpenerBuff.atkMultPer10Charge', rawValue.atkMultPer10Charge],
        ['combatOpenerBuff.burnChanceAdd', rawValue.burnChanceAdd],
        ['combatOpenerBuff.burnStacksOnHit', rawValue.burnStacksOnHit],
      ];
      const weightedKey = potencyPriority.find(([, value]) => asPrimitive(value) !== null)?.[0] ?? null;
      const primitiveEntries: Array<[string, unknown]> = [
        ['combatOpenerBuff.durationSec', rawValue.durationSec],
        ...potencyPriority,
      ];
      primitiveEntries.forEach(([normalizedKey, value]) => {
        const primitive = asPrimitive(value);
        if (primitive !== null) {
          entries.push(
            buildEffect(
              source,
              rawKey,
              normalizedKey,
              primitive,
              'combat',
              normalizedKey === weightedKey ? getBudgetWeight('combat') : 0,
            ),
          );
        }
      });
      return;
    }

    if (rawKey === 'combatFirstBossKillBonus' && isObjectLike(rawValue)) {
      const primitiveEntries: Array<[string, unknown, number]> = [
        ['combatFirstBossKillBonus.type', rawValue.type, 0],
        ['combatFirstBossKillBonus.chance', rawValue.chance, getBudgetWeight('economy')],
        ['combatFirstBossKillBonus.capPerHour', rawValue.capPerHour, 0],
      ];
      primitiveEntries.forEach(([normalizedKey, value, budgetWeight]) => {
        const primitive = asPrimitive(value);
        if (primitive !== null) {
          entries.push(buildEffect(source, rawKey, normalizedKey, primitive, 'economy', budgetWeight));
        }
      });
      return;
    }

    if (rawKey === 'bossKillLantern' && isObjectLike(rawValue)) {
      const primitiveEntries: Array<[string, unknown, number]> = [
        ['bossKillLantern.resourceId', rawValue.resourceId, 0],
        ['bossKillLantern.gainPerBossKill', rawValue.gainPerBossKill, getBudgetWeight('economy')],
        ['bossKillLantern.cap', rawValue.cap, 0],
      ];
      primitiveEntries.forEach(([normalizedKey, value, budgetWeight]) => {
        const primitive = asPrimitive(value);
        if (primitive !== null) {
          entries.push(buildEffect(source, rawKey, normalizedKey, primitive, 'economy', budgetWeight));
        }
      });
      return;
    }

    if (rawKey === 'voidWindow' && isObjectLike(rawValue)) {
      const primitiveEntries: Array<[string, unknown, number]> = [
        ['voidWindow.everySec', rawValue.everySec, 0.05],
        ['voidWindow.durationSec', rawValue.durationSec, 0.05],
        ['voidWindow.ignoreDefPct', rawValue.ignoreDefPct, getBudgetWeight('combat')],
      ];
      primitiveEntries.forEach(([normalizedKey, value, budgetWeight]) => {
        const primitive = asPrimitive(value);
        if (primitive !== null) {
          entries.push(buildEffect(source, rawKey, normalizedKey, primitive, 'combat', budgetWeight));
        }
      });
      return;
    }

    const primitive = asPrimitive(rawValue);
    if (primitive === null) {
      return;
    }

    const domain = RAW_KEY_DOMAIN[rawKey];
    entries.push(buildEffect(source, rawKey, rawKey, primitive, domain, getBudgetWeight(domain)));
  });

  return entries;
}
