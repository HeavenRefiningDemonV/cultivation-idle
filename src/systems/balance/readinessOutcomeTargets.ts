import { GATE_COMBAT_TARGETS, getGateCombatTarget } from './gateCombatTargets.js';

export type ReadinessCalibrationBand = 'below_minimum' | 'minimum_met_below_recommended' | 'recommended_met';

export interface ReadinessLabelSemantics {
  bandToLabel: Record<ReadinessCalibrationBand, 'Blocked' | 'Risky' | 'Ready'>;
  closeLabel: 'Close';
}

export interface CloseCallPolicy {
  maxBossHpPct: number;
  minCompetitiveTimeToDieSec: number;
  maxImmediateMismatchSpikeRatio: number;
  minMeaningfulFightDurationSec: number;
}

export interface ReadinessOutcomeTarget {
  gateIndex: 1 | 2 | 3 | 4 | 5;
  expectedWinRateByBand: Record<ReadinessCalibrationBand, readonly [number, number]>;
}

export const READINESS_LABEL_SEMANTICS: ReadinessLabelSemantics = {
  bandToLabel: {
    below_minimum: 'Blocked',
    minimum_met_below_recommended: 'Risky',
    recommended_met: 'Ready',
  },
  closeLabel: 'Close',
};

export const READINESS_CLOSE_CALL_POLICY: CloseCallPolicy = {
  maxBossHpPct: 20,
  minCompetitiveTimeToDieSec: 8,
  maxImmediateMismatchSpikeRatio: 0.65,
  minMeaningfulFightDurationSec: 12,
};

export const READINESS_OUTCOME_TARGETS: readonly ReadinessOutcomeTarget[] = GATE_COMBAT_TARGETS.map((target) => ({
  gateIndex: target.gateIndex,
  expectedWinRateByBand: {
    below_minimum: target.winRate.belowMinimum,
    minimum_met_below_recommended: target.winRate.minimum,
    recommended_met: target.winRate.recommended,
  },
}));

export function getReadinessOutcomeTarget(gateIndex: number): ReadinessOutcomeTarget | null {
  const combatTarget = getGateCombatTarget(gateIndex);
  if (!combatTarget) return null;
  return READINESS_OUTCOME_TARGETS.find((entry) => entry.gateIndex === combatTarget.gateIndex) ?? null;
}
