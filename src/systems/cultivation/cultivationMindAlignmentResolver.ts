import type { DaoHeartActivityId } from '../../content/types.js';

export type MindAlignmentCapState =
  | 'overexpressed'
  | 'aligned'
  | 'slightly_lagging'
  | 'lagging'
  | 'severe_lag'
  | 'reckless_lag';

export interface MindAlignmentCauseRow {
  id: 'heart_law_mind_alignment';
  label: 'Mind alignment';
  value: number;
  unit: 'risk';
  severity: 'good' | 'neutral' | 'warning' | 'danger';
  explanation: string;
  displayText: string;
  route?: { label: string; target: 'cultivation' | 'daoHeart' };
  sourceSystem: 'heartLaw';
}

export interface CultivationMindAlignmentInput {
  /**
   * One-based canonical cultivation stage number from
   * getCanonicalCultivationStageNumber. The MP3 prompt calls this an index in
   * places, but current Heart Law parity compares level 1 to stage number 1.
   */
  cultivationStageIndex: number;
  heartLawLevel: number;
  clarity?: number;
  turbulence?: number;
  rootHeartFitQiMultiplier?: number;
  rootHeartFitRiskDelta?: number;
  rootHeartFitLabel?: string;
}

export interface CultivationMindAlignmentSnapshot {
  cultivationStageIndex: number;
  heartLawLevel: number;
  parityDelta: number;
  qiRateMultiplier: number;
  heartLawXpMultiplier: number;
  breakthroughRiskDelta: number;
  turbulenceDeltaPerMinute: number;
  capState: MindAlignmentCapState;
  confirmationRequired: boolean;
  innerDemonDebateAvailable: boolean;
  overlevelExpressionMultiplier: number;
  speedDeltaPct: number;
  summaryText: string;
  causeRows: MindAlignmentCauseRow[];
  recommendedPracticeId: DaoHeartActivityId | null;
}

interface MindAlignmentBand {
  qiRateMultiplier: number;
  breakthroughRiskDelta: number;
  heartLawXpMultiplier: number;
  turbulenceDeltaPerMinute: number;
  capState: MindAlignmentCapState;
  confirmationRequired: boolean;
  innerDemonDebateAvailable: boolean;
  overlevelExpressionMultiplier: number;
  explanation: string;
  recommendedPracticeId: DaoHeartActivityId | null;
}

function finiteFloor(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.floor(value) : fallback;
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function pluralStage(count: number): string {
  return Math.abs(count) === 1 ? 'stage' : 'stages';
}

function bandForParity(parityDelta: number): MindAlignmentBand {
  if (parityDelta >= 2) {
    return {
      qiRateMultiplier: 0.94,
      breakthroughRiskDelta: -8,
      heartLawXpMultiplier: 0.65,
      turbulenceDeltaPerMinute: 0,
      capState: 'overexpressed',
      confirmationRequired: false,
      innerDemonDebateAvailable: true,
      overlevelExpressionMultiplier: 0.94,
      explanation: 'doctrine exceeds vessel; expression inefficient.',
      recommendedPracticeId: null,
    };
  }
  if (parityDelta === 1) {
    return {
      qiRateMultiplier: 1.06,
      breakthroughRiskDelta: -12,
      heartLawXpMultiplier: 1,
      turbulenceDeltaPerMinute: 0,
      capState: 'aligned',
      confirmationRequired: false,
      innerDemonDebateAvailable: true,
      overlevelExpressionMultiplier: 1,
      explanation: 'Heart Law leads vessel',
      recommendedPracticeId: null,
    };
  }
  if (parityDelta === 0) {
    return {
      qiRateMultiplier: 1.03,
      breakthroughRiskDelta: -10,
      heartLawXpMultiplier: 1,
      turbulenceDeltaPerMinute: 0,
      capState: 'aligned',
      confirmationRequired: false,
      innerDemonDebateAvailable: true,
      overlevelExpressionMultiplier: 1,
      explanation: 'Heart Law matches vessel',
      recommendedPracticeId: null,
    };
  }
  if (parityDelta === -1) {
    return {
      qiRateMultiplier: 0.96,
      breakthroughRiskDelta: -4,
      heartLawXpMultiplier: 1.05,
      turbulenceDeltaPerMinute: 0.02,
      capState: 'slightly_lagging',
      confirmationRequired: false,
      innerDemonDebateAvailable: true,
      overlevelExpressionMultiplier: 1,
      explanation: 'Heart Law lags behind vessel',
      recommendedPracticeId: 'verse_recitation',
    };
  }
  if (parityDelta === -2) {
    return {
      qiRateMultiplier: 0.88,
      breakthroughRiskDelta: 8,
      heartLawXpMultiplier: 1.1,
      turbulenceDeltaPerMinute: 0.08,
      capState: 'lagging',
      confirmationRequired: false,
      innerDemonDebateAvailable: true,
      overlevelExpressionMultiplier: 1,
      explanation: 'Heart Law lags behind vessel',
      recommendedPracticeId: 'verse_recitation',
    };
  }
  if (parityDelta === -3) {
    return {
      qiRateMultiplier: 0.74,
      breakthroughRiskDelta: 18,
      heartLawXpMultiplier: 0.85,
      turbulenceDeltaPerMinute: 0.18,
      capState: 'severe_lag',
      confirmationRequired: false,
      innerDemonDebateAvailable: false,
      overlevelExpressionMultiplier: 1,
      explanation: 'Heart Law lags behind vessel',
      recommendedPracticeId: 'verse_recitation',
    };
  }
  return {
    qiRateMultiplier: 0.6,
    breakthroughRiskDelta: 30,
    heartLawXpMultiplier: 0.75,
    turbulenceDeltaPerMinute: 0.32,
    capState: 'reckless_lag',
    confirmationRequired: true,
    innerDemonDebateAvailable: false,
    overlevelExpressionMultiplier: 1,
    explanation: 'The gate rejects a hollow doctrine.',
    recommendedPracticeId: 'verse_recitation',
  };
}

function summaryForParity(parityDelta: number, band: MindAlignmentBand, speedDeltaPct: number): string {
  const speed = signed(speedDeltaPct);
  const risk = signed(band.breakthroughRiskDelta);
  if (parityDelta >= 2) {
    return `Doctrine exceeds vessel: cultivation speed ${speed}%, breakthrough risk ${risk}. Heart Law XP is inefficient until cultivation catches up.`;
  }
  if (parityDelta === 1) {
    return `Heart Law leads cultivation by 1 stage: cultivation speed ${speed}%, breakthrough risk ${risk}.`;
  }
  if (parityDelta === 0) {
    return `Heart Law and realm are aligned: cultivation speed ${speed}%, breakthrough risk ${risk}.`;
  }
  if (parityDelta === -1) {
    return `Heart Law trails cultivation by 1 stage: cultivation speed ${speed}%, breakthrough risk ${risk}.`;
  }
  if (parityDelta === -2) {
    return `Heart Law trails cultivation by 2 stages: cultivation speed ${speed}%, breakthrough risk ${risk}.`;
  }
  if (parityDelta === -3) {
    return `Heart Law lags badly: cultivation speed ${speed}%, breakthrough risk ${risk}. Inner Demon Debate unavailable.`;
  }
  return `Heart Law lags catastrophically: cultivation speed ${speed}%, breakthrough risk ${risk}. Reckless confirmation required.`;
}

function severityForBand(band: MindAlignmentBand): MindAlignmentCauseRow['severity'] {
  if (band.capState === 'overexpressed') return 'warning';
  if (band.breakthroughRiskDelta < 0) return 'good';
  if (band.breakthroughRiskDelta >= 18) return 'danger';
  if (band.breakthroughRiskDelta > 0) return 'warning';
  return 'neutral';
}

function routeForBand(parityDelta: number, band: MindAlignmentBand): MindAlignmentCauseRow['route'] {
  if (band.capState === 'overexpressed') {
    return { label: 'Cultivate / Break Through', target: 'cultivation' };
  }
  if (parityDelta <= -3) {
    return { label: 'Practice Verse Recitation', target: 'daoHeart' };
  }
  if (parityDelta <= -1) {
    return { label: 'Open Dao Heart Sanctuary', target: 'daoHeart' };
  }
  return undefined;
}

export function resolveCultivationMindAlignment(
  input: CultivationMindAlignmentInput,
): CultivationMindAlignmentSnapshot {
  const cultivationStageIndex = Math.max(1, finiteFloor(input.cultivationStageIndex, 1));
  const heartLawLevel = Math.max(1, finiteFloor(input.heartLawLevel, 1));
  const parityDelta = heartLawLevel - cultivationStageIndex;
  const band = bandForParity(parityDelta);
  const speedDeltaPct = Math.round((band.qiRateMultiplier - 1) * 100);
  const summaryText = summaryForParity(parityDelta, band, speedDeltaPct);
  const causeRow: MindAlignmentCauseRow = {
    id: 'heart_law_mind_alignment',
    label: 'Mind alignment',
    value: band.breakthroughRiskDelta,
    unit: 'risk',
    severity: severityForBand(band),
    explanation: band.explanation,
    displayText: summaryText,
    route: routeForBand(parityDelta, band),
    sourceSystem: 'heartLaw',
  };

  return {
    cultivationStageIndex,
    heartLawLevel,
    parityDelta,
    qiRateMultiplier: band.qiRateMultiplier,
    heartLawXpMultiplier: band.heartLawXpMultiplier,
    breakthroughRiskDelta: band.breakthroughRiskDelta,
    turbulenceDeltaPerMinute: band.turbulenceDeltaPerMinute,
    capState: band.capState,
    confirmationRequired: band.confirmationRequired,
    innerDemonDebateAvailable: band.innerDemonDebateAvailable,
    overlevelExpressionMultiplier: band.overlevelExpressionMultiplier,
    speedDeltaPct,
    summaryText,
    causeRows: [causeRow],
    recommendedPracticeId: band.recommendedPracticeId,
  };
}

export function formatMindAlignmentDelta(value: number): string {
  return signed(Math.round(value));
}
