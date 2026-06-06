import type { BreakthroughRiskCauseRow, BreakthroughRiskSnapshot } from '../../content/types.js';
import {
  resolveCultivationMindAlignment,
  type CultivationMindAlignmentSnapshot,
} from '../cultivation/cultivationMindAlignmentResolver.js';
import { resolveDaoHeartTurbulencePreview } from '../daoHeart/daoHeartTurbulenceResolver.js';

export type GateResolutionForRisk = 'none' | 'cleared' | 'bypassed' | null | undefined;
export type RootResonanceForRisk = 'exact' | 'soft' | 'mismatch' | 'neutral' | null | undefined;

export interface BreakthroughStabilityInput {
  fromRealmIndex: number;
  toRealmIndex: number;
  currentQi: string | number;
  requiredQi: string | number;
  heartLawStage: number;
  cultivationEffectiveStage: number;
  clarity: number;
  turbulence: number;
  gateResolution?: GateResolutionForRisk;
  rootResonance?: RootResonanceForRisk;
  fatigueRiskDelta?: number;
  injuryRiskDelta?: number;
  safetyPrepRiskReduction?: number;
  qiPurityRiskReduction?: number;
  calmFirstBreathRiskReduction?: number;
  recklessConfirmation?: boolean;
  mindAlignment?: CultivationMindAlignmentSnapshot;
}

export interface BreakthroughTransitionRisk {
  baseRisk: number;
  minRisk: number;
  maxRisk: number;
  qiLossPct: number;
  turbulenceGain: number;
  minorInjuryPct: number;
  majorInjuryPct: number;
}

export type BreakthroughStabilitySnapshot = BreakthroughRiskSnapshot & {
  baseRisk: number;
  canAttempt: boolean;
  confirmationRequired: boolean;
  hardBlockers: string[];
  failureQiLossPct: number;
  failureTurbulenceGain: number;
  minorInjuryPct: number;
  majorInjuryPct: number;
};

const TRANSITION_RISK: Record<number, BreakthroughTransitionRisk> = {
  0: { baseRisk: 6, minRisk: 1, maxRisk: 45, qiLossPct: 15, turbulenceGain: 12, minorInjuryPct: 0, majorInjuryPct: 0 },
  1: { baseRisk: 8, minRisk: 2, maxRisk: 50, qiLossPct: 18, turbulenceGain: 16, minorInjuryPct: 5, majorInjuryPct: 0 },
  2: { baseRisk: 11, minRisk: 3, maxRisk: 55, qiLossPct: 22, turbulenceGain: 20, minorInjuryPct: 10, majorInjuryPct: 0 },
  3: { baseRisk: 14, minRisk: 4, maxRisk: 60, qiLossPct: 28, turbulenceGain: 24, minorInjuryPct: 15, majorInjuryPct: 3 },
  4: { baseRisk: 18, minRisk: 5, maxRisk: 65, qiLossPct: 35, turbulenceGain: 30, minorInjuryPct: 20, majorInjuryPct: 5 },
};

const REALM_IDS = [
  'qi_condensation',
  'foundation_establishment',
  'core_formation',
  'nascent_soul',
  'soul_formation',
  'spirit_severing',
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function numberFrom(value: string | number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function breakthroughRiskBand(riskPercent: number): BreakthroughRiskSnapshot['band'] {
  if (riskPercent <= 4) return 'serene';
  if (riskPercent <= 9) return 'stable';
  if (riskPercent <= 19) return 'tense';
  if (riskPercent <= 34) return 'unstable';
  if (riskPercent <= 49) return 'dangerous';
  return 'reckless';
}

export function breakthroughTransitionRiskForRealm(fromRealmIndex: number): BreakthroughTransitionRisk {
  return TRANSITION_RISK[clamp(Math.floor(fromRealmIndex), 0, 4)] ?? TRANSITION_RISK[0];
}

function row(params: BreakthroughRiskCauseRow): BreakthroughRiskCauseRow {
  return params;
}

function rushRiskDelta(currentQi: number, requiredQi: number): number {
  if (requiredQi <= 0) return 0;
  const overPct = ((currentQi - requiredQi) / requiredQi) * 100;
  if (overPct <= 5) return 9;
  if (overPct <= 15) return 5;
  if (overPct <= 30) return 2;
  return 0;
}

function clarityRiskReduction(clarity: number): number {
  if (clarity >= 100) return 18;
  if (clarity >= 80) return 13;
  if (clarity >= 60) return 8;
  if (clarity >= 40) return 4;
  return 0;
}

function gateConfidenceDelta(resolution: GateResolutionForRisk): number {
  if (resolution === 'cleared') return -8;
  if (resolution === 'bypassed') return -3;
  return 0;
}

function rootResonanceDelta(root: RootResonanceForRisk): number {
  if (root === 'exact') return -4;
  if (root === 'soft') return -1;
  if (root === 'mismatch') return 6;
  return 0;
}

function severityFor(value: number): BreakthroughRiskCauseRow['severity'] {
  if (value < 0) return 'good';
  if (value === 0) return 'neutral';
  if (value >= 9) return 'danger';
  return 'warning';
}

function topFixRows(rows: BreakthroughRiskCauseRow[]): BreakthroughRiskCauseRow[] {
  return rows
    .filter((entry) => entry.value > 0 && entry.route)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
}

export function resolveBreakthroughStabilitySnapshot(input: BreakthroughStabilityInput): BreakthroughStabilitySnapshot {
  const transition = breakthroughTransitionRiskForRealm(input.fromRealmIndex);
  const currentQi = numberFrom(input.currentQi);
  const requiredQi = numberFrom(input.requiredQi);
  const rush = rushRiskDelta(currentQi, requiredQi);
  const mindAlignment = input.mindAlignment ?? resolveCultivationMindAlignment({
    heartLawLevel: input.heartLawStage,
    cultivationStageIndex: input.cultivationEffectiveStage,
    clarity: input.clarity,
    turbulence: input.turbulence,
  });
  const mindAlignmentRow = mindAlignment.causeRows[0];
  const turbulence = resolveDaoHeartTurbulencePreview({ turbulence: input.turbulence });
  const clarityReduction = clarityRiskReduction(input.clarity);
  const gateDelta = gateConfidenceDelta(input.gateResolution);
  const rootDelta = rootResonanceDelta(input.rootResonance);
  const fatigue = Math.max(0, input.fatigueRiskDelta ?? 0);
  const injury = Math.max(0, input.injuryRiskDelta ?? 0);
  const safetyPrep = Math.max(0, input.safetyPrepRiskReduction ?? 0);
  const qiPurity = Math.max(0, input.qiPurityRiskReduction ?? 0);
  const calmFirstBreath = Math.max(0, input.calmFirstBreathRiskReduction ?? 0);

  const rows = [
    row({
      id: 'base_transition',
      label: 'Realm transition',
      value: transition.baseRisk,
      severity: 'neutral',
      explanation: 'Each major realm has a fixed breakthrough risk floor before preparation.',
      sourceSystem: 'realm',
    }),
    row({
      id: 'rush_margin',
      label: 'Qi margin',
      value: rush,
      severity: severityFor(rush),
      explanation: rush > 0 ? 'Qi is close to the minimum requirement; wait for a wider reserve.' : 'Qi reserve is comfortably above the requirement.',
      route: rush > 0 ? { label: 'Cultivate more Qi', target: 'cultivation' } : undefined,
      sourceSystem: 'qi',
    }),
    row({
      id: 'heart_law_parity',
      label: 'Heart Law parity',
      value: mindAlignment.breakthroughRiskDelta,
      severity: severityFor(mindAlignment.breakthroughRiskDelta),
      explanation: mindAlignmentRow?.explanation ?? mindAlignment.summaryText,
      route: mindAlignment.breakthroughRiskDelta > 0
        ? { label: mindAlignmentRow?.route?.label ?? 'Train Dao Heart', target: 'daoHeart' }
        : undefined,
      sourceSystem: 'heartLaw',
    }),
    row({
      id: 'dao_heart_turbulence',
      label: 'Dao Heart turbulence',
      value: turbulence.riskDelta,
      severity: turbulence.breakthroughBlocked ? 'danger' : severityFor(turbulence.riskDelta),
      explanation: turbulence.breakthroughBlocked
        ? 'Turbulence is fractured; breakthrough requires explicit reckless confirmation.'
        : `Turbulence is ${turbulence.band}.`,
      route: turbulence.riskDelta > 0 || turbulence.breakthroughBlocked ? { label: 'Harmonize breath', target: 'daoHeart' } : undefined,
      sourceSystem: 'daoHeart',
    }),
    row({
      id: 'dao_heart_clarity',
      label: 'Dao Heart clarity',
      value: -clarityReduction,
      severity: clarityReduction > 0 ? 'good' : 'neutral',
      explanation: clarityReduction > 0 ? 'Clarity steadies the breakthrough.' : 'Clarity below 40 gives no risk reduction.',
      route: clarityReduction <= 0 ? { label: 'Raise clarity', target: 'daoHeart' } : undefined,
      sourceSystem: 'daoHeart',
    }),
    row({
      id: 'gate_confidence',
      label: 'Gate confidence',
      value: gateDelta,
      severity: severityFor(gateDelta),
      explanation: input.gateResolution === 'cleared'
        ? 'Clean gate clear strongly steadies the attempt.'
        : input.gateResolution === 'bypassed'
          ? 'Safety-net bypass gives partial confidence.'
          : 'No gate confidence has been recorded.',
      route: gateDelta === 0 ? { label: 'Check Gate Trial', target: 'gateTrial' } : undefined,
      sourceSystem: 'trial',
    }),
    row({
      id: 'root_resonance',
      label: 'Root resonance',
      value: rootDelta,
      severity: severityFor(rootDelta),
      explanation: input.rootResonance === 'mismatch'
        ? 'Spirit root and doctrine mismatch adds instability.'
        : input.rootResonance === 'exact'
          ? 'Spirit root and doctrine match cleanly.'
          : 'Root resonance is not adding a hard lock.',
      route: rootDelta > 0 ? { label: 'Review doctrine fit', target: 'daoHeart' } : undefined,
      sourceSystem: 'root',
    }),
  ];

  if (fatigue > 0) {
    rows.push(row({
      id: 'training_fatigue',
      label: 'Training fatigue',
      value: fatigue,
      severity: severityFor(fatigue),
      explanation: 'Training fatigue makes the breakthrough less steady.',
      route: { label: 'Rest', target: 'rest' },
      sourceSystem: 'training',
    }));
  }
  if (injury > 0) {
    rows.push(row({
      id: 'injury',
      label: 'Injury',
      value: injury,
      severity: severityFor(injury),
      explanation: 'Existing injuries raise breakthrough risk.',
      route: { label: 'Visit Apothecary', target: 'apothecary' },
      sourceSystem: 'injury',
    }));
  }
  if (safetyPrep > 0) {
    rows.push(row({
      id: 'safety_prep',
      label: 'Safety preparation',
      value: -safetyPrep,
      severity: 'good',
      explanation: 'Prepared medicine and gear reduce risk.',
      route: { label: 'Review preparation', target: 'forge' },
      sourceSystem: 'prep',
    }));
  }
  if (calmFirstBreath > 0) {
    rows.push(row({
      id: 'calm_first_breath',
      label: 'Calm First Breath',
      value: -calmFirstBreath,
      severity: 'good',
      explanation: 'Prestige memory steadies the first breath while Heart Law is at parity.',
      route: { label: 'Review Dao Heart', target: 'daoHeart' },
      sourceSystem: 'heartLaw',
    }));
  }

  const rawRisk = rows.reduce((total, entry) => total + entry.value, 0) - qiPurity;
  const riskPercent = clamp(Math.round(rawRisk), transition.minRisk, transition.maxRisk);
  const band = breakthroughRiskBand(riskPercent);
  const hardBlockers = turbulence.breakthroughBlocked && !input.recklessConfirmation ? ['fractured_turbulence'] : [];
  const confirmationRequired = mindAlignment.confirmationRequired || band === 'reckless' || turbulence.breakthroughBlocked;
  return {
    fromRealmId: REALM_IDS[input.fromRealmIndex] ?? `realm_${input.fromRealmIndex}`,
    toRealmId: REALM_IDS[input.toRealmIndex] ?? `realm_${input.toRealmIndex}`,
    riskPercent,
    band,
    minRisk: transition.minRisk,
    maxRisk: transition.maxRisk,
    rows,
    topFixes: topFixRows(rows),
    failureOutcomePreview: `${transition.qiLossPct}% Qi loss, +${transition.turbulenceGain} turbulence on failure.`,
    baseRisk: transition.baseRisk,
    canAttempt: hardBlockers.length === 0,
    confirmationRequired,
    hardBlockers,
    failureQiLossPct: transition.qiLossPct,
    failureTurbulenceGain: transition.turbulenceGain,
    minorInjuryPct: transition.minorInjuryPct,
    majorInjuryPct: transition.majorInjuryPct,
  };
}
