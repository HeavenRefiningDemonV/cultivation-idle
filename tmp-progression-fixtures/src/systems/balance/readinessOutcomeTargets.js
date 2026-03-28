import { GATE_COMBAT_TARGETS, getGateCombatTarget } from './gateCombatTargets.js';
export const READINESS_LABEL_SEMANTICS = {
    bandToLabel: {
        below_minimum: 'Blocked',
        minimum_met_below_recommended: 'Risky',
        recommended_met: 'Ready',
    },
    closeLabel: 'Close',
};
export const READINESS_CLOSE_CALL_POLICY = {
    maxBossHpPct: 20,
    minCompetitiveTimeToDieSec: 8,
    maxImmediateMismatchSpikeRatio: 0.65,
    minMeaningfulFightDurationSec: 12,
};
export const READINESS_OUTCOME_TARGETS = GATE_COMBAT_TARGETS.map((target) => ({
    gateIndex: target.gateIndex,
    expectedWinRateByBand: {
        below_minimum: target.winRate.belowMinimum,
        minimum_met_below_recommended: target.winRate.minimum,
        recommended_met: target.winRate.recommended,
    },
}));
export function getReadinessOutcomeTarget(gateIndex) {
    const combatTarget = getGateCombatTarget(gateIndex);
    if (!combatTarget)
        return null;
    return READINESS_OUTCOME_TARGETS.find((entry) => entry.gateIndex === combatTarget.gateIndex) ?? null;
}
