import type { DaoHeartActivityId } from '../../content/types.js';
import { resolveDaoHeartTurbulencePreview } from './daoHeartTurbulenceResolver.js';
import {
  type HeartLawTier,
  resolveHeartLawLevelPreview,
} from './heartLawLevelResolver.js';
import { resolveCultivationMindAlignment } from '../cultivation/cultivationMindAlignmentResolver.js';
import type { RootHeartFitResult } from '../spiritRoots/rootHeartFitResolver.js';

export function heartLawXpToNextLevel(params: {
  level: number;
  tierMultiplier: number;
  chapterPressure: number;
}): number {
  const { level, tierMultiplier, chapterPressure } = params;
  return Math.ceil((70 + 12 * level + 1.4 * level * level) * tierMultiplier * chapterPressure);
}

export interface DaoHeartPracticePreviewInput {
  practiceId: DaoHeartActivityId;
  elapsedMs: number;
  currentLevel: number;
  tier: HeartLawTier | string | null | undefined;
  cultivationEffectiveStage: number;
  clarity: number;
  turbulence: number;
  heartLawXpMultiplier?: number;
  rootHeartFit?: RootHeartFitResult | null;
}

export interface DaoHeartPracticePreview {
  heartLawXpGain: number;
  clarityGain: number;
  turbulenceGain: number;
  verseMasteryGain: number;
  rootResonanceGain: number;
  resourceDeltas: Array<{ kind: 'none'; id: string; amount: 0 }>;
  xpMultiplier: number;
  rootExpressionCap: number;
}

export type DaoHeartPracticeFailureReason =
  | 'heart_law_lag_too_high'
  | 'fractured_turbulence'
  | 'doctrine_trial_not_ready'
  | 'non_positive_elapsed';

export type DaoHeartPracticeTickResult =
  | {
      ok: true;
      preview: DaoHeartPracticePreview;
      levelPreview: ReturnType<typeof resolveHeartLawLevelPreview>;
    }
  | {
      ok: false;
      reason: DaoHeartPracticeFailureReason;
    };

const PRACTICE_MULTIPLIERS: Record<DaoHeartActivityId, {
  xp: number;
  clarity: number;
  verse: number;
  root: number;
  turbulencePerMinute: number;
}> = {
  silent_sitting: { xp: 0.75, clarity: 1.35, verse: 0.35, root: 0.1, turbulencePerMinute: -0.12 },
  verse_recitation: { xp: 1, clarity: 0.85, verse: 1.15, root: 0.2, turbulencePerMinute: 0.02 },
  scripture_copying: { xp: 0.82, clarity: 0.7, verse: 1.25, root: 1.2, turbulencePerMinute: 0.03 },
  breath_harmonization: { xp: 0.78, clarity: 0.95, verse: 0.55, root: 0.6, turbulencePerMinute: -0.1 },
  inner_demon_debate: { xp: 1.45, clarity: 1.25, verse: 0.7, root: 0.3, turbulencePerMinute: 0.42 },
  doctrine_trial: { xp: 1.75, clarity: 1.45, verse: 1.2, root: 0.8, turbulencePerMinute: 0.65 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function resolveDaoHeartPracticePreview(input: DaoHeartPracticePreviewInput): DaoHeartPracticePreview {
  const minutes = Math.max(0, input.elapsedMs / 60_000);
  const multipliers = PRACTICE_MULTIPLIERS[input.practiceId];
  const turbulence = resolveDaoHeartTurbulencePreview({ turbulence: input.turbulence });
  const mindAlignment = resolveCultivationMindAlignment({
    heartLawLevel: input.currentLevel,
    cultivationStageIndex: input.cultivationEffectiveStage,
    clarity: input.clarity,
    turbulence: input.turbulence,
  });
  const levelPreview = resolveHeartLawLevelPreview({
    currentLevel: input.currentLevel,
    currentXp: 0,
    gainedXp: 0,
    tier: input.tier,
    cultivationEffectiveStage: input.cultivationEffectiveStage,
  });
  const baseXpPerMinute = Math.max(1, levelPreview.xpToNextLevel * 0.08);
  const prestigeMemoryMultiplier = Number.isFinite(input.heartLawXpMultiplier)
    ? Math.max(1, input.heartLawXpMultiplier ?? 1)
    : 1;
  const rootFit = input.rootHeartFit ?? null;
  const rootHeartLawXpMultiplier = rootFit?.effects.heartLawXpMult ?? 1;
  const rootResonanceMultiplier = rootFit?.effects.rootResonanceGainMult ?? 1;
  const rootTurbulenceDelta = rootFit?.effects.turbulenceDeltaPerMinute ?? 0;
  const heartLawXpGain = baseXpPerMinute
    * multipliers.xp
    * minutes
    * turbulence.heartLawXpMultiplier
    * prestigeMemoryMultiplier
    * mindAlignment.heartLawXpMultiplier
    * rootHeartLawXpMultiplier;
  const clarityGain = Math.max(0, (1.2 * multipliers.clarity * minutes) * (input.clarity >= 100 ? 0 : 1));
  const turbulenceGain = (multipliers.turbulencePerMinute + mindAlignment.turbulenceDeltaPerMinute + rootTurbulenceDelta) * minutes;
  const verseMasteryGain = Math.max(0, 0.9 * multipliers.verse * minutes * turbulence.verseMasteryMultiplier);
  const rootResonanceGain = Math.max(0, 0.5 * multipliers.root * minutes * rootResonanceMultiplier);
  return {
    heartLawXpGain,
    clarityGain,
    turbulenceGain,
    verseMasteryGain,
    rootResonanceGain,
    resourceDeltas: [],
    xpMultiplier: multipliers.xp
      * turbulence.heartLawXpMultiplier
      * prestigeMemoryMultiplier
      * mindAlignment.heartLawXpMultiplier
      * rootHeartLawXpMultiplier,
    rootExpressionCap: rootFit?.effects.expressionCap ?? 100,
  };
}

export function resolveHeartLawPracticeTick(input: DaoHeartPracticePreviewInput & {
  currentXp: number;
}): DaoHeartPracticeTickResult {
  if (input.elapsedMs <= 0) return { ok: false, reason: 'non_positive_elapsed' };
  const turbulence = resolveDaoHeartTurbulencePreview({ turbulence: input.turbulence });
  if (turbulence.breakthroughBlocked && input.practiceId === 'doctrine_trial') {
    return { ok: false, reason: 'fractured_turbulence' };
  }
  const mindAlignment = resolveCultivationMindAlignment({
    heartLawLevel: input.currentLevel,
    cultivationStageIndex: input.cultivationEffectiveStage,
    clarity: input.clarity,
    turbulence: input.turbulence,
  });
  if (input.practiceId === 'inner_demon_debate' && !mindAlignment.innerDemonDebateAvailable) {
    return { ok: false, reason: 'heart_law_lag_too_high' };
  }
  if (input.practiceId === 'doctrine_trial' && (input.clarity < 80 || input.turbulence > 35)) {
    return { ok: false, reason: 'doctrine_trial_not_ready' };
  }
  const preview = resolveDaoHeartPracticePreview(input);
  const levelPreview = resolveHeartLawLevelPreview({
    currentLevel: input.currentLevel,
    currentXp: input.currentXp,
    gainedXp: preview.heartLawXpGain,
    tier: input.tier,
    cultivationEffectiveStage: input.cultivationEffectiveStage,
  });
  return { ok: true, preview, levelPreview };
}

export function applyDaoHeartProgressNumbers(params: {
  value: number;
  delta: number;
  min?: number;
  max?: number;
}): number {
  return clamp(params.value + params.delta, params.min ?? 0, params.max ?? 100);
}

export const OFFLINE_DAO_HEART_PRACTICES: readonly DaoHeartActivityId[] = [
  'silent_sitting',
  'verse_recitation',
  'scripture_copying',
  'breath_harmonization',
];

export function isDaoHeartPracticeOfflineAllowed(practiceId: DaoHeartActivityId): boolean {
  return (OFFLINE_DAO_HEART_PRACTICES as readonly string[]).includes(practiceId);
}

export function isDaoHeartActivityId(value: unknown): value is DaoHeartActivityId {
  return typeof value === 'string'
    && [
      'silent_sitting',
      'verse_recitation',
      'scripture_copying',
      'breath_harmonization',
      'inner_demon_debate',
      'doctrine_trial',
    ].includes(value);
}

export function daoHeartPracticeDisplayName(practiceId: DaoHeartActivityId): string {
  switch (practiceId) {
    case 'silent_sitting': return 'Silent Sitting';
    case 'verse_recitation': return 'Verse Recitation';
    case 'scripture_copying': return 'Scripture Copying';
    case 'breath_harmonization': return 'Breath Harmonization';
    case 'inner_demon_debate': return 'Inner Demon Debate';
    case 'doctrine_trial': return 'Doctrine Trial';
  }
}
