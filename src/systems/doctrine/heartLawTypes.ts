import type { HeartLawDef, HeartLawAffinityRules } from '../../content/index.js';
import type { SpiritRootElement } from '../../types/index.js';

export type HeartLawFamily =
  | 'circulation'
  | 'stability'
  | 'insight'
  | 'endurance'
  | 'burst'
  | 'breakthrough';

export type HeartLawEffectDomain =
  | 'cultivation'
  | 'combat'
  | 'profession'
  | 'economy'
  | 'breakthrough'
  | 'utility';

export type NormalizedHeartLawEffectSource = 'signature' | `chapter:${number}`;

export interface NormalizedHeartLawEffect {
  source: NormalizedHeartLawEffectSource;
  chapter: number | null;
  rawKey: string;
  normalizedKey: string;
  domain: HeartLawEffectDomain;
  value: number | string | boolean;
  appliesAffinity: boolean;
  budgetWeight: number;
}

export type NormalizedHeartLawAffinityRules = Required<HeartLawAffinityRules>;

export type HeartLawChapterValueDistributionEntry = {
  chapter: 1 | 2 | 3 | 4 | 5;
  weightPct: number;
};

export interface HeartLawProfile {
  id: string;
  name: string;
  tier: string | null;
  family: HeartLawFamily;
  playerFacingFamilyLabel: string;
  archetype: string | null;
  daoTags: string[];
  spiritRootAffinities: string[];
  liveSpiritRootAffinities: SpiritRootElement[];
  affinityRules: NormalizedHeartLawAffinityRules;
  chapterThresholds: readonly number[];
  chapterValueDistribution: readonly HeartLawChapterValueDistributionEntry[];
  signatureEffects: readonly NormalizedHeartLawEffect[];
  chapterEffectsByChapter: Readonly<Record<number, readonly NormalizedHeartLawEffect[]>>;
  normalizedEffects: readonly NormalizedHeartLawEffect[];
  notes: readonly string[];
  spilloverBudgetPct: number;
  combatBudgetPct: number;
}

export interface HeartLawAuditLawReport {
  lawId: string;
  family: HeartLawFamily;
  supportedRawKeys: string[];
  derivedNormalizedKeys: string[];
  ignoredRawKeys: string[];
  spilloverBudgetPct: number;
  combatBudgetPct: number;
}

export interface HeartLawAuditReport {
  supportedKeys: string[];
  derivedKeys: string[];
  ignoredKeys: string[];
  budgetViolations: Array<{ lawId: string; spilloverBudgetPct: number; combatBudgetPct: number }>;
  lawReports: HeartLawAuditLawReport[];
}
