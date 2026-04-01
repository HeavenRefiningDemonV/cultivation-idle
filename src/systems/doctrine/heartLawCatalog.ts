import type { HeartLawAffinityRules, HeartLawDef } from '../../content/index.js';
import { useContentStore } from '../../stores/contentStore.js';
import type { SpiritRootElement } from '../../types/index.js';
import { getHeartLawFamily, getHeartLawFamilyLabel } from './heartLawFamilyRegistry.js';
import {
  LIVE_SPIRIT_ROOT_ELEMENTS,
  getHeartLawChapterThresholds,
  getHeartLawChapterValueDistribution,
  getNormalizedHeartLawAffinityRules,
  normalizeHeartLawEffectEntries,
} from './heartLawEffectReaders.js';
import type {
  HeartLawProfile,
  NormalizedHeartLawAffinityRules,
  NormalizedHeartLawEffect,
} from './heartLawTypes.js';

function normalizeStringList(values: readonly string[] | undefined): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalized = values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);

  return Array.from(new Set(normalized));
}

function getLiveSpiritRootAffinities(values: readonly string[]): SpiritRootElement[] {
  const liveSet = new Set<SpiritRootElement>(LIVE_SPIRIT_ROOT_ELEMENTS);
  return values.filter((value): value is SpiritRootElement => liveSet.has(value as SpiritRootElement));
}

function freezeEffectList(effects: NormalizedHeartLawEffect[]): readonly NormalizedHeartLawEffect[] {
  return Object.freeze([...effects]);
}

const SPILLOVER_NORMALIZED_KEYS = new Set<string>([
  'combatDamageMult',
  'bossDamageMult',
  'voidDamageMult',
  'ultimateDamageMult',
  'burnDamageMult',
  'poisonDamageMult',
  'soulDamageMult',
  'combatFireDamageMult',
  'critDmgMult',
  'critChanceAddPctPoints',
  'martialDamageMult',
  'combatOpenerAtkMultAddPer10Charge',
  'combatOpenerBuff.atkMult',
  'combatOpenerBuff.atkMultPer10Charge',
  'combatOpenerBuff.burnChanceAdd',
  'combatOpenerBuff.burnStacksOnHit',
]);

function isSpilloverEffect(effect: NormalizedHeartLawEffect): boolean {
  return SPILLOVER_NORMALIZED_KEYS.has(effect.normalizedKey);
}


function getEffectMagnitude(effect: NormalizedHeartLawEffect): number {
  const { value, normalizedKey } = effect;
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (normalizedKey.includes('PctPoints')) {
      return Math.abs(value) / 100;
    }
    if (normalizedKey.endsWith('AddSec') || normalizedKey.endsWith('durationSec') || normalizedKey.endsWith('everySec')) {
      return Math.abs(value) / 10;
    }

    return Math.abs(value);
  }

  return 1;
}

function computeSpilloverBudgetPct(effects: readonly NormalizedHeartLawEffect[]): number {
  let spilloverWeight = 0;
  let innerWeight = 0;

  effects.forEach((effect) => {
    if (effect.budgetWeight <= 0) {
      return;
    }

    const weightedMagnitude = effect.budgetWeight * getEffectMagnitude(effect);

    if (isSpilloverEffect(effect)) {
      spilloverWeight += weightedMagnitude;
      return;
    }

    innerWeight += weightedMagnitude;
  });

  const total = spilloverWeight + innerWeight;
  if (total <= 0) {
    return 0;
  }

  return Math.round((spilloverWeight / total) * 100);
}

function buildHeartLawProfile(
  law: HeartLawDef,
  affinityRules: NormalizedHeartLawAffinityRules,
): HeartLawProfile {

  const family = getHeartLawFamily(law.id);
  if (!family) {
    throw new Error(`[HeartLawCatalog] Missing explicit family registry entry for live heart law '${law.id}'.`);
  }

  const daoTags = normalizeStringList(law.daoTags);
  const spiritRootAffinities = normalizeStringList(law.spiritRootAffinities);
  const liveSpiritRootAffinities = Object.freeze(getLiveSpiritRootAffinities(spiritRootAffinities)) as SpiritRootElement[];
  const chapterThresholds = getHeartLawChapterThresholds();
  const chapterValueDistribution = getHeartLawChapterValueDistribution();
  const signatureEffects = freezeEffectList(normalizeHeartLawEffectEntries('signature', law.signature ?? null));
  const sortedChapters = [...(law.chapters ?? [])].sort((a, b) => a.chapter - b.chapter);

  const chapterEffectsByChapterEntries = Array.from({ length: 5 }, (_, index) => {
    const chapter = index + 1;
    const chapterEffects = sortedChapters
      .filter((entry) => entry.chapter === chapter)
      .flatMap((entry) => normalizeHeartLawEffectEntries(`chapter:${chapter}`, entry.effects ?? null));

    return [chapter, freezeEffectList(chapterEffects)] as const;
  });

  const chapterEffectsByChapter = Object.freeze(
    Object.fromEntries(chapterEffectsByChapterEntries) as Record<number, readonly NormalizedHeartLawEffect[]>,
  );

  const normalizedEffects = freezeEffectList([
    ...signatureEffects,
    ...chapterEffectsByChapterEntries.flatMap(([, effects]) => effects),
  ]);

  const notes = Object.freeze(
    normalizedEffects
      .filter((effect) => effect.normalizedKey === 'note' && typeof effect.value === 'string')
      .map((effect) => effect.value as string),
  );

  const spilloverBudgetPct = computeSpilloverBudgetPct(normalizedEffects);

  return Object.freeze({
    id: law.id,
    name: law.name,
    tier: typeof law.tier === 'string' ? law.tier : null,
    family,
    archetype: typeof law.archetype === 'string' ? law.archetype : null,
    playerFacingFamilyLabel: getHeartLawFamilyLabel(family),
    daoTags,
    spiritRootAffinities,
    liveSpiritRootAffinities,
    affinityRules,
    chapterThresholds,
    chapterValueDistribution,
    signatureEffects,
    chapterEffectsByChapter,
    normalizedEffects,
    notes,
    spilloverBudgetPct,
    combatBudgetPct: spilloverBudgetPct,
  });
}

export function buildHeartLawCatalogFromDefinitions(
  laws: readonly HeartLawDef[],
  affinityRules?: HeartLawAffinityRules | null,
): Record<string, HeartLawProfile> {
  const catalog: Record<string, HeartLawProfile> = {};
  const normalizedAffinityRules = getNormalizedHeartLawAffinityRules(affinityRules);

  laws.forEach((law) => {
    catalog[law.id] = buildHeartLawProfile(law, normalizedAffinityRules);
  });

  return Object.freeze(catalog);
}

export function buildHeartLawCatalog(): Record<string, HeartLawProfile> {
  const content = useContentStore.getState();
  if (!content.isLoaded || !content.raw) {
    return {};
  }

  return buildHeartLawCatalogFromDefinitions(
    content.raw.heart_laws,
    content.raw.heart_law_affinity_rules,
  );
}

export function getHeartLawProfile(id: string | null): HeartLawProfile | null {
  if (id === null) {
    return null;
  }

  const catalog = buildHeartLawCatalog();
  return catalog[id] ?? null;
}
