import type { DaoHeartActivityId, DaoHeartPracticeDef, HeartLawDef } from '../../content/types.js';
import type { ForegroundActivityType } from '../../types/activity.js';
import type { SpiritRoot } from '../../types/index.js';
import {
  daoHeartPracticeDisplayName,
  heartLawXpToNextLevel,
  resolveDaoHeartPracticePreview,
} from '../../systems/daoHeart/daoHeartProgressionResolver.js';
import {
  HEART_LAW_CHAPTER_BANDS,
  heartLawChapterBandForLevel,
  heartLawTierMultiplier,
} from '../../systems/daoHeart/heartLawLevelResolver.js';
import { resolveCultivationMindAlignment } from '../../systems/cultivation/cultivationMindAlignmentResolver.js';
import { resolveDaoHeartTurbulencePreview } from '../../systems/daoHeart/daoHeartTurbulenceResolver.js';
import {
  describeRootHeartFitEffect,
  resolveRootHeartFit,
} from '../../systems/spiritRoots/rootHeartFitResolver.js';
import type {
  DaoHeartSanctuaryCauseRowSurface,
  DaoHeartSanctuaryForecastSurface,
  DaoHeartSanctuaryMetricSurface,
  DaoHeartSanctuaryPracticeOutputSurface,
  DaoHeartSanctuaryRecommendationSurface,
  DaoHeartSanctuaryRootVariantHintSurface,
  DaoHeartSanctuarySurfaceV1,
  DaoHeartSanctuaryTone,
} from './daoHeartSanctuaryTypes.js';

export interface DaoHeartSanctuaryBuildInput {
  selectedHeartLawId: string | null;
  heartLaw: HeartLawDef | null;
  practices: DaoHeartPracticeDef[];
  levelById: Record<string, number>;
  xpById: Record<string, number>;
  verseMasteryByLawId: Record<string, number>;
  clarity: number;
  turbulence: number;
  activePracticeId: DaoHeartActivityId | null;
  cultivationEffectiveStage: number;
  spiritRoot?: SpiritRoot | null;
  currentRootResonance?: number | null;
  unlockedVariantIds?: readonly string[] | null;
  foregroundActivityType?: ForegroundActivityType | null;
  branchChoiceId?: string | null;
  prefersReducedMotion?: boolean;
}

const FORECAST_MINUTES = [10, 30, 60] as const;
const PRACTICE_OUTPUT_FALLBACKS: Record<DaoHeartActivityId, {
  heartLawXpMultiplier: number | 'milestone';
  clarityMultiplier: number | 'milestone';
  verseMultiplier: number | 'milestone';
  rootResonanceMultiplier: number | 'milestone';
  turbulencePerMinute: number | 'variable';
  futureUse: string;
}> = {
  silent_sitting: {
    heartLawXpMultiplier: 0.75,
    clarityMultiplier: 1.35,
    verseMultiplier: 0.35,
    rootResonanceMultiplier: 0.1,
    turbulencePerMinute: -0.12,
    futureUse: 'Long clarity training / pre-breakthrough safety.',
  },
  verse_recitation: {
    heartLawXpMultiplier: 1,
    clarityMultiplier: 0.85,
    verseMultiplier: 1.15,
    rootResonanceMultiplier: 0.2,
    turbulencePerMinute: 0.02,
    futureUse: 'Default Heart Law leveling.',
  },
  scripture_copying: {
    heartLawXpMultiplier: 0.82,
    clarityMultiplier: 0.7,
    verseMultiplier: 1.25,
    rootResonanceMultiplier: 1.2,
    turbulencePerMinute: 0.03,
    futureUse: 'Root resonance / seal prep / mismatch conversion.',
  },
  breath_harmonization: {
    heartLawXpMultiplier: 0.78,
    clarityMultiplier: 0.95,
    verseMultiplier: 0.55,
    rootResonanceMultiplier: 0.6,
    turbulencePerMinute: -0.1,
    futureUse: 'Pre-breakthrough stabilizer / Qi Purity trickle later.',
  },
  inner_demon_debate: {
    heartLawXpMultiplier: 1.45,
    clarityMultiplier: 1.25,
    verseMultiplier: 0.7,
    rootResonanceMultiplier: 0.3,
    turbulencePerMinute: 0.42,
    futureUse: 'Short active push.',
  },
  doctrine_trial: {
    heartLawXpMultiplier: 'milestone',
    clarityMultiplier: 'milestone',
    verseMultiplier: 'milestone',
    rootResonanceMultiplier: 'milestone',
    turbulencePerMinute: 'variable',
    futureUse: 'Chapter / seal gate; no resource cost.',
  },
};

function toneForMetric(value: number, kind: 'clarity' | 'turbulence' | 'parity'): DaoHeartSanctuaryMetricSurface['tone'] {
  if (kind === 'clarity') {
    if (value >= 80) return 'good';
    if (value >= 40) return 'neutral';
    return 'warning';
  }
  if (kind === 'turbulence') {
    if (value >= 86) return 'danger';
    if (value >= 36) return 'warning';
    return 'good';
  }
  if (value > 0) return 'warning';
  if (value < 0) return 'good';
  return 'neutral';
}

function clarityState(value: number): DaoHeartSanctuarySurfaceV1['visual']['clarityState'] {
  if (value >= 80) return 'steady';
  if (value >= 40) return 'thin';
  return 'frayed';
}

function sealState(input: {
  selectedId: string | null;
  activePracticeId: DaoHeartActivityId | null;
  turbulenceBlocked: boolean;
  parityRiskDelta: number;
}): DaoHeartSanctuarySurfaceV1['visual']['sealState'] {
  if (!input.selectedId) return 'unselected';
  if (input.turbulenceBlocked) return 'fractured';
  if (input.parityRiskDelta > 0) return 'lagging';
  if (input.activePracticeId) return 'active';
  return 'steady';
}

function buildScreenshotStates(input: {
  activePracticeId: DaoHeartActivityId | null;
  turbulenceBand: string;
  sealState: string;
  reducedMotion: boolean;
  capState: string;
  nextSealState: string;
}): string[] {
  const states = [input.activePracticeId ? 'dao-heart-active' : 'dao-heart-idle'];
  if (input.turbulenceBand === 'disturbed' || input.turbulenceBand === 'fractured') {
    states.push('dao-heart-high-turbulence');
  }
  if (input.sealState === 'lagging') states.push('dao-heart-lag');
  if (input.capState === 'severe_lag' || input.capState === 'reckless_lag') states.push('dao-heart-severe-lag');
  if (input.capState === 'overexpressed') states.push('dao-heart-overleveled');
  if (input.nextSealState === 'ready') states.push('dao-heart-seal-ready');
  if (input.reducedMotion) states.push('dao-heart-reduced-motion');
  return [...new Set(states)];
}

function buildMindAlignmentRecommendations(input: {
  summaryText: string;
  parityDelta: number;
  capState: string;
  recommendedPracticeId: DaoHeartActivityId | null;
}): DaoHeartSanctuaryRecommendationSurface[] {
  if (input.capState === 'overexpressed') {
    return [{
      id: 'mind-alignment-fix',
      label: 'Let cultivation catch up',
      detail: input.summaryText,
      tone: 'warning',
      targetPracticeId: null,
      actionLabel: 'Cultivate / Break Through',
    }];
  }
  if (input.parityDelta <= -1) {
    const severe = input.parityDelta <= -3;
    return [{
      id: 'mind-alignment-fix',
      label: severe ? 'Repair doctrine lag' : 'Train the Heart Law',
      detail: input.summaryText,
      tone: severe ? 'danger' : 'warning',
      targetPracticeId: input.recommendedPracticeId ?? 'verse_recitation',
      actionLabel: severe ? 'Practice Verse Recitation' : 'Open Dao Heart Sanctuary',
    }];
  }
  return [{
    id: 'mind-alignment-fix',
    label: 'Mind and vessel support the gate',
    detail: input.summaryText,
    tone: 'good',
    targetPracticeId: null,
    actionLabel: 'Continue cultivation',
  }];
}

function signedNumber(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function signedFixed(value: number, digits = 1): string {
  return value > 0 ? `+${value.toFixed(digits)}` : value.toFixed(digits);
}

function multiplierLabel(value: number | 'milestone'): string {
  return value === 'milestone' ? 'milestone' : `${value.toFixed(2)}x`;
}

function turbulenceLabel(value: number | 'variable'): string {
  return value === 'variable' ? 'variable' : `${signedFixed(value, 2)}/min`;
}

function roundGain(value: number): number {
  return Math.round(value * 10) / 10;
}

function forecastSummary(forecast: DaoHeartSanctuaryForecastSurface): string {
  return `${forecast.label}: +${forecast.heartLawXpGain.toFixed(1)} Heart Law XP, +${forecast.verseMasteryGain.toFixed(1)} verse, ${signedFixed(forecast.turbulenceDelta)} turbulence.`;
}

function buildForecasts(input: {
  practiceId: DaoHeartActivityId;
  level: number;
  tier: string | null | undefined;
  cultivationEffectiveStage: number;
  clarity: number;
  turbulence: number;
  rootHeartFit: ReturnType<typeof resolveRootHeartFit>;
}): DaoHeartSanctuaryForecastSurface[] {
  return FORECAST_MINUTES.map((minutes) => {
    const preview = resolveDaoHeartPracticePreview({
      practiceId: input.practiceId,
      elapsedMs: minutes * 60_000,
      currentLevel: input.level,
      tier: input.tier,
      cultivationEffectiveStage: input.cultivationEffectiveStage,
      clarity: input.clarity,
      turbulence: input.turbulence,
      rootHeartFit: input.rootHeartFit,
    });
    const forecast: DaoHeartSanctuaryForecastSurface = {
      minutes,
      label: `${minutes} min`,
      heartLawXpGain: roundGain(preview.heartLawXpGain),
      clarityGain: roundGain(preview.clarityGain),
      verseMasteryGain: roundGain(preview.verseMasteryGain),
      rootResonanceGain: roundGain(preview.rootResonanceGain),
      turbulenceDelta: roundGain(preview.turbulenceGain),
      summary: '',
    };
    return { ...forecast, summary: forecastSummary(forecast) };
  });
}

function buildPracticeOutputs(practice: DaoHeartPracticeDef): DaoHeartSanctuaryPracticeOutputSurface {
  const fallback = PRACTICE_OUTPUT_FALLBACKS[practice.id];
  return {
    heartLawXpMultiplierLabel: multiplierLabel(practice.heartLawXpMultiplier ?? fallback.heartLawXpMultiplier),
    clarityMultiplierLabel: multiplierLabel(practice.clarityMultiplier ?? fallback.clarityMultiplier),
    verseMultiplierLabel: multiplierLabel(practice.verseMultiplier ?? fallback.verseMultiplier),
    rootMultiplierLabel: multiplierLabel(practice.rootResonanceMultiplier ?? fallback.rootResonanceMultiplier),
    turbulencePerMinuteLabel: turbulenceLabel(practice.turbulencePerMinute ?? fallback.turbulencePerMinute),
    bestUse: practice.futureUse ?? fallback.futureUse ?? practice.description,
  };
}

function foregroundTypeLabel(type: ForegroundActivityType): string {
  switch (type) {
    case 'meditate': return 'Cultivation';
    case 'path_training': return 'Path Training';
    case 'dao_heart_practice': return 'Dao Heart practice';
    case 'outskirts': return 'Outskirts combat';
    case 'trial': return 'Gate Trial';
    case 'ruins': return 'Ruins expedition';
    case 'forge': return 'Forge work';
  }
}

function rootTone(tier: ReturnType<typeof resolveRootHeartFit>['tier']): DaoHeartSanctuaryTone {
  if (tier === 'opposed') return 'danger';
  if (tier === 'strained') return 'warning';
  if (tier === 'resonant' || tier === 'compatible') return 'good';
  return 'neutral';
}

function severityRank(tone: DaoHeartSanctuaryTone): number {
  if (tone === 'danger') return 0;
  if (tone === 'warning') return 1;
  if (tone === 'neutral') return 2;
  return 3;
}

function buildNextSeal(input: {
  selectedId: string | null;
  chapterLabel: string;
  clarity: number;
  turbulence: number;
  verseMastery: number;
  turbulenceBlocked: boolean;
}): DaoHeartSanctuarySurfaceV1['centerMandala']['nextSeal'] {
  if (!input.selectedId) {
    return {
      label: 'No seal selected',
      state: 'locked',
      detail: 'Choose a Heart Law before attempting chapter seals.',
    };
  }
  if (input.turbulenceBlocked) {
    return {
      label: `${input.chapterLabel} seal fractured`,
      state: 'blocked',
      detail: 'Turbulence is fractured; calm the Dao Heart before Doctrine Trial.',
    };
  }
  if (input.clarity >= 80 && input.turbulence <= 35 && input.verseMastery >= 60) {
    return {
      label: `${input.chapterLabel} seal ready`,
      state: 'ready',
      detail: 'Doctrine Trial can test the chapter seal when you are ready.',
    };
  }
  return {
    label: `${input.chapterLabel} seal preparing`,
    state: 'preparing',
    detail: 'Raise clarity, verse mastery, and calm turbulence before Doctrine Trial.',
  };
}

function buildChapterNodes(level: number): DaoHeartSanctuarySurfaceV1['centerMandala']['chapterNodes'] {
  return HEART_LAW_CHAPTER_BANDS.map((band) => ({
    id: band.id,
    label: band.label,
    state: level > band.levelEnd ? 'completed' : level >= band.levelStart && level <= band.levelEnd ? 'current' : 'locked',
    detail: `Levels ${band.levelStart}-${band.levelEnd}`,
  }));
}

function buildRootVariantHint(rootHeartFit: ReturnType<typeof resolveRootHeartFit>): DaoHeartSanctuaryRootVariantHintSurface | null {
  if (!rootHeartFit.recoveryRoute) return null;
  return {
    label: rootHeartFit.recoveryRoute.label,
    detail: rootHeartFit.recoveryRoute.detail,
    practiceIds: [...rootHeartFit.recoveryRoute.practiceIds],
    unlockResonance: rootHeartFit.recoveryRoute.unlockResonance,
    unlocked: rootHeartFit.recoveryRoute.unlocked,
  };
}

function buildCauseRows(input: {
  mindAlignment: ReturnType<typeof resolveCultivationMindAlignment>;
  turbulence: ReturnType<typeof resolveDaoHeartTurbulencePreview>;
  clarity: number;
  rootHeartFit: ReturnType<typeof resolveRootHeartFit>;
  rootVariantHint: DaoHeartSanctuaryRootVariantHintSurface | null;
  nextSeal: DaoHeartSanctuarySurfaceV1['centerMandala']['nextSeal'];
}): DaoHeartSanctuaryCauseRowSurface[] {
  const rows: DaoHeartSanctuaryCauseRowSurface[] = [
    {
      id: 'mind-alignment',
      label: 'Mind alignment',
      value: `${input.mindAlignment.qiRateMultiplier.toFixed(2)}x / ${signedNumber(input.mindAlignment.breakthroughRiskDelta)} risk`,
      detail: input.mindAlignment.summaryText,
      severity: input.mindAlignment.causeRows[0]?.severity ?? 'neutral',
      targetPracticeId: input.mindAlignment.recommendedPracticeId,
      actionLabel: input.mindAlignment.recommendedPracticeId
        ? `Practice ${daoHeartPracticeDisplayName(input.mindAlignment.recommendedPracticeId)}`
        : null,
      sourceSystem: 'heartLaw',
    },
    {
      id: 'root-heart-fit',
      label: 'Root / Heart fit',
      value: input.rootHeartFit.label,
      detail: input.rootVariantHint
        ? `${input.rootHeartFit.summary} Route: ${input.rootVariantHint.label} through Scripture Copying and Breath Harmonization.`
        : input.rootHeartFit.summary,
      severity: rootTone(input.rootHeartFit.tier),
      targetPracticeId: input.rootVariantHint?.practiceIds[0] ?? null,
      actionLabel: input.rootVariantHint ? 'Practice Scripture Copying' : 'Observe Spirit Root',
      sourceSystem: 'spiritRoot',
    },
    {
      id: 'turbulence',
      label: 'Turbulence',
      value: input.turbulence.band,
      detail: input.turbulence.breakthroughBlocked
        ? 'Fractured turbulence blocks Doctrine Trial and dangerous seal work.'
        : `Current turbulence adds ${signedNumber(input.turbulence.riskDelta)} breakthrough risk.`,
      severity: input.turbulence.breakthroughBlocked ? 'danger' : toneForMetric(input.turbulence.riskDelta, 'parity'),
      targetPracticeId: input.turbulence.breakthroughBlocked || input.turbulence.riskDelta > 0 ? 'silent_sitting' : null,
      actionLabel: input.turbulence.breakthroughBlocked || input.turbulence.riskDelta > 0 ? 'Practice Silent Sitting' : null,
      sourceSystem: 'daoHeart',
    },
    {
      id: 'clarity',
      label: 'Clarity',
      value: `${Math.round(input.clarity)}/100`,
      detail: input.clarity >= 80
        ? 'Clarity can support Doctrine Trial and breakthrough safety.'
        : 'Silent Sitting and Breath Harmonization improve pre-breakthrough safety.',
      severity: toneForMetric(input.clarity, 'clarity'),
      targetPracticeId: input.clarity >= 80 ? null : 'silent_sitting',
      actionLabel: input.clarity >= 80 ? null : 'Practice Silent Sitting',
      sourceSystem: 'daoHeart',
    },
    {
      id: 'next-seal',
      label: 'Next seal',
      value: input.nextSeal.state,
      detail: input.nextSeal.detail,
      severity: input.nextSeal.state === 'blocked'
        ? 'danger'
        : input.nextSeal.state === 'ready'
          ? 'good'
          : input.nextSeal.state === 'preparing'
            ? 'warning'
            : 'neutral',
      targetPracticeId: input.nextSeal.state === 'ready' ? 'doctrine_trial' : null,
      actionLabel: input.nextSeal.state === 'ready' ? 'Start Doctrine Trial' : null,
      sourceSystem: 'branch',
    },
  ];
  return rows.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
}

export function buildDaoHeartSanctuarySurface(input: DaoHeartSanctuaryBuildInput): DaoHeartSanctuarySurfaceV1 {
  const selectedId = input.selectedHeartLawId;
  const level = selectedId ? input.levelById[selectedId] ?? 1 : 1;
  const xp = selectedId ? input.xpById[selectedId] ?? 0 : 0;
  const verseMastery = selectedId ? input.verseMasteryByLawId[selectedId] ?? 0 : 0;
  const chapter = heartLawChapterBandForLevel(level);
  const xpToNext = heartLawXpToNextLevel({
    level,
    tierMultiplier: heartLawTierMultiplier(input.heartLaw?.tier),
    chapterPressure: chapter.pressure,
  });
  const rootHeartFit = resolveRootHeartFit({
    root: input.spiritRoot ?? null,
    heartLaw: input.heartLaw,
    currentRootResonance: input.currentRootResonance ?? 0,
    unlockedVariantIds: input.unlockedVariantIds ?? [],
  });
  const mindAlignment = resolveCultivationMindAlignment({
    heartLawLevel: level,
    cultivationStageIndex: input.cultivationEffectiveStage,
    clarity: input.clarity,
    turbulence: input.turbulence,
    rootHeartFitQiMultiplier: rootHeartFit.effects.cultivationSpeedMult,
    rootHeartFitRiskDelta: rootHeartFit.tier === 'opposed' ? 8 : rootHeartFit.tier === 'strained' ? 4 : 0,
    rootHeartFitLabel: rootHeartFit.label,
  });
  const turbulence = resolveDaoHeartTurbulencePreview({ turbulence: input.turbulence });
  const reducedMotion = Boolean(input.prefersReducedMotion);
  const nextSeal = buildNextSeal({
    selectedId,
    chapterLabel: chapter.label,
    clarity: input.clarity,
    turbulence: input.turbulence,
    verseMastery,
    turbulenceBlocked: turbulence.breakthroughBlocked,
  });
  const nextSealState = sealState({
    selectedId,
    activePracticeId: input.activePracticeId,
    turbulenceBlocked: turbulence.breakthroughBlocked,
    parityRiskDelta: mindAlignment.breakthroughRiskDelta,
  });
  const rootVariantHint = buildRootVariantHint(rootHeartFit);
  const metrics: DaoHeartSanctuaryMetricSurface[] = [
    {
      id: 'clarity',
      label: 'Clarity',
      value: `${Math.round(input.clarity)}/100`,
      detail: input.clarity >= 40 ? 'Steadies major breakthroughs.' : 'Raise clarity before forcing a gate.',
      tone: toneForMetric(input.clarity, 'clarity'),
    },
    {
      id: 'turbulence',
      label: 'Turbulence',
      value: `${Math.round(input.turbulence)}/100`,
      detail: turbulence.breakthroughBlocked ? 'Fractured; reckless confirmation required.' : `State: ${turbulence.band}.`,
      tone: toneForMetric(input.turbulence, 'turbulence'),
    },
    {
      id: 'parity',
      label: 'Doctrine parity',
      value: mindAlignment.parityDelta >= 0 ? `+${mindAlignment.parityDelta}` : `${mindAlignment.parityDelta}`,
      detail: mindAlignment.causeRows[0]?.explanation ?? mindAlignment.summaryText,
      tone: toneForMetric(mindAlignment.breakthroughRiskDelta, 'parity'),
    },
    {
      id: 'mind_alignment',
      label: 'Mind alignment',
      value: `${mindAlignment.qiRateMultiplier.toFixed(2)}x / ${mindAlignment.breakthroughRiskDelta >= 0 ? `+${mindAlignment.breakthroughRiskDelta}` : mindAlignment.breakthroughRiskDelta} risk`,
      detail: mindAlignment.summaryText,
      tone: mindAlignment.capState === 'overexpressed'
        ? 'warning'
        : mindAlignment.breakthroughRiskDelta >= 18
          ? 'danger'
          : mindAlignment.breakthroughRiskDelta > 0
            ? 'warning'
            : 'good',
    },
    {
      id: 'verse',
      label: 'Verse mastery',
      value: `${Math.round(verseMastery)}%`,
      detail: 'Supports chapter seals and doctrine trial readiness.',
      tone: verseMastery >= 60 ? 'good' : 'neutral',
    },
    {
      id: 'root_fit',
      label: 'Root resonance',
      value: `${rootHeartFit.label} / ${Math.round(input.currentRootResonance ?? 0)}%`,
      detail: rootHeartFit.summary,
      tone: rootTone(rootHeartFit.tier),
    },
  ];
  const practices = input.practices.map((practice) => {
    const id = practice.id;
    const blockedByLag = id === 'inner_demon_debate' && !mindAlignment.innerDemonDebateAvailable;
    const doctrineTrialBlocked = id === 'doctrine_trial' && (input.clarity < 80 || input.turbulence > 35);
    const disabled = !selectedId || blockedByLag || doctrineTrialBlocked;
    const active = input.activePracticeId === id;
    return {
      id,
      label: practice.displayName || daoHeartPracticeDisplayName(id),
      description: practice.description,
      offlineAllowed: practice.offlineAllowed,
      unlockState: !selectedId ? 'no_law' as const : active ? 'active' as const : disabled ? 'blocked' as const : 'available' as const,
      active,
      disabled,
      disabledReason: !selectedId
        ? 'Choose a Heart Law first.'
        : blockedByLag
          ? `Inner Demon Debate unavailable: ${mindAlignment.causeRows[0]?.explanation ?? 'Heart Law lags too far behind the vessel.'}`
          : doctrineTrialBlocked
            ? 'Requires 80 clarity and calm turbulence.'
            : null,
      outputs: buildPracticeOutputs(practice),
      forecasts: buildForecasts({
        practiceId: id,
        level,
        tier: input.heartLaw?.tier,
        cultivationEffectiveStage: input.cultivationEffectiveStage,
        clarity: input.clarity,
        turbulence: input.turbulence,
        rootHeartFit,
      }),
    };
  });
  const selectedPractice = practices.find((practice) => practice.id === input.activePracticeId)
    ?? practices.find((practice) => practice.id === mindAlignment.recommendedPracticeId)
    ?? practices.find((practice) => practice.id === 'verse_recitation')
    ?? practices[0]
    ?? null;
  const causeRows = buildCauseRows({
    mindAlignment,
    turbulence,
    clarity: input.clarity,
    rootHeartFit,
    rootVariantHint,
    nextSeal,
  });
  const foregroundConflictText = input.foregroundActivityType && input.foregroundActivityType !== 'dao_heart_practice'
    ? `${foregroundTypeLabel(input.foregroundActivityType)} is the current foreground activity. Starting a Dao Heart practice will claim foreground if allowed.`
    : null;

  return {
    version: 1,
    header: {
      pathIdentity: input.heartLaw?.archetype ? `${input.heartLaw.archetype} doctrine` : 'Inner cultivation doctrine',
      heartLawLevel: `Level ${level}`,
      verseChapter: `${chapter.label} / ${Math.round(verseMastery)}% verse mastery`,
      parityLabel: mindAlignment.causeRows[0]?.explanation ?? mindAlignment.capState,
      qiSpeedImpact: `${mindAlignment.qiRateMultiplier.toFixed(2)}x (${signedNumber(mindAlignment.speedDeltaPct)}%)`,
      breakthroughRiskImpact: `${signedNumber(mindAlignment.breakthroughRiskDelta)} risk`,
      currentBonus: `Heart Law XP ${mindAlignment.heartLawXpMultiplier.toFixed(2)}x; root ${describeRootHeartFitEffect(rootHeartFit.effects.heartLawXpMult)} law XP; root expression cap ${rootHeartFit.effects.expressionCap}.`,
      rootResonance: `${rootHeartFit.label} fit at ${Math.round(input.currentRootResonance ?? 0)}% resonance`,
    },
    identity: {
      heartLawId: selectedId,
      heartLawName: input.heartLaw?.name ?? 'No Heart Law selected',
      tier: input.heartLaw?.tier ?? 'starter',
      chapter: chapter.label,
    },
    progression: {
      level,
      xp,
      xpToNext,
      verseMastery,
    },
    metrics,
    recommendations: buildMindAlignmentRecommendations({
      summaryText: mindAlignment.summaryText,
      parityDelta: mindAlignment.parityDelta,
      capState: mindAlignment.capState,
      recommendedPracticeId: mindAlignment.recommendedPracticeId,
    }),
    practices,
    centerMandala: {
      chapterNodes: buildChapterNodes(level),
      verseRing: {
        masteryLabel: `${Math.round(verseMastery)}% verse mastery`,
        detail: `${Math.floor(xp)} / ${xpToNext} Heart Law XP toward the next chapter step.`,
      },
      nextSeal,
      rootResonanceLine: `${rootHeartFit.label} root line: ${Math.round(input.currentRootResonance ?? 0)}% resonance, ${rootHeartFit.effects.expressionCap}% expression cap.`,
      turbulenceCracks: turbulence.breakthroughBlocked
        ? 'Fractured turbulence cracks the mandala and blocks Doctrine Trial.'
        : turbulence.riskDelta > 0
          ? `Turbulence is ${turbulence.band}; breakthrough risk ${signedNumber(turbulence.riskDelta)}.`
          : `Turbulence is ${turbulence.band}; no added risk.`,
      overlevelHaze: mindAlignment.capState === 'overexpressed'
        ? 'Doctrine exceeds vessel; Heart Law expression is inefficient until cultivation catches up.'
        : null,
      scrollText: input.heartLaw?.daoTags?.length
        ? `Tags: ${input.heartLaw.daoTags.join(', ')}.`
        : 'The inner scroll reflects Heart Law level, verse mastery, seal pressure, and root resonance.',
    },
    rightRail: {
      causeRows,
    },
    rootFit: {
      tier: rootHeartFit.tier,
      label: rootHeartFit.label,
      summary: rootHeartFit.summary,
      cultivationSpeedLabel: describeRootHeartFitEffect(rootHeartFit.effects.cultivationSpeedMult),
      heartLawXpLabel: describeRootHeartFitEffect(rootHeartFit.effects.heartLawXpMult),
      rootResonanceGainLabel: describeRootHeartFitEffect(rootHeartFit.effects.rootResonanceGainMult),
      expressionCapLabel: `${rootHeartFit.effects.expressionCap}% cap`,
    },
    rootVariantHint,
    branchChoices: [
      {
        id: 'chapter-seal',
        label: 'Doctrine Trial Seal',
        state: nextSeal.state === 'ready' ? 'available' : input.branchChoiceId === 'chapter-seal' ? 'selected' : 'locked',
        detail: nextSeal.detail,
      },
      ...(rootVariantHint ? [{
        id: `root-variant-${rootVariantHint.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        label: rootVariantHint.label,
        state: rootVariantHint.unlocked ? 'selected' as const : (input.currentRootResonance ?? 0) >= rootVariantHint.unlockResonance ? 'available' as const : 'locked' as const,
        detail: `${rootVariantHint.detail} Practice route: ${rootVariantHint.practiceIds.map(daoHeartPracticeDisplayName).join(' / ')}.`,
      }] : []),
    ],
    activePracticeId: input.activePracticeId,
    visual: {
      surface: 'dao-heart-sanctuary-mp6',
      motionMode: reducedMotion ? 'static' : 'animated',
      turbulenceBand: turbulence.band,
      clarityState: clarityState(input.clarity),
      sealState: nextSealState,
      practiceState: !selectedId ? 'no_law' : input.activePracticeId ? 'active' : 'idle',
      fxBudget: {
        maxParticles: 48,
        activeParticles: reducedMotion ? 0 : input.activePracticeId ? 18 : 10,
        opacityOverTextMax: 0.18,
      },
      screenshotStates: buildScreenshotStates({
        activePracticeId: input.activePracticeId,
        turbulenceBand: turbulence.band,
        sealState: nextSealState,
        reducedMotion,
        capState: mindAlignment.capState,
        nextSealState: nextSeal.state,
      }),
    },
    bottomActions: {
      canStop: input.activePracticeId !== null,
      activeLabel: input.activePracticeId ? daoHeartPracticeDisplayName(input.activePracticeId) : 'No active practice',
      hint: input.activePracticeId
        ? 'Practice advances while it remains the foreground activity.'
        : 'Choose one practice to make it the foreground activity.',
      selectedPracticeId: selectedPractice?.id ?? null,
      startLabel: selectedPractice ? `Start ${selectedPractice.label}` : 'Choose a Heart Law first',
      forecastWindows: selectedPractice?.forecasts ?? [],
      offlineEligibilityText: selectedPractice
        ? selectedPractice.offlineAllowed
          ? `${selectedPractice.label} can continue offline while it is the active foreground practice.`
          : `${selectedPractice.label} is active-only and will not progress offline.`
        : 'No Dao Heart practice is selected.',
      foregroundConflictText,
      observeSpiritRoot: {
        label: 'Observe Spirit Root',
        activeTab: 'fit',
      },
    },
  };
}
