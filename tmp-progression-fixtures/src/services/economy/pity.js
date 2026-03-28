import { randFloat } from '../../utils/rng.js';
function clamp(value, min, max) {
    if (Number.isNaN(value))
        return min;
    return Math.min(max, Math.max(min, value));
}
export function rollWithPity(rule, failuresSoFar, seed) {
    const baseChance = clamp(rule.baseChance ?? 0, 0, 1);
    const pityIncrement = Math.max(0, rule.pityIncrement ?? 0);
    const pityCap = rule.pityCap ?? Number.POSITIVE_INFINITY;
    const cappedFailures = Math.max(0, failuresSoFar);
    const guaranteed = Number.isFinite(pityCap) && cappedFailures >= pityCap - 1;
    const chanceUsed = guaranteed
        ? 1
        : clamp(baseChance + cappedFailures * pityIncrement, 0, 1);
    if (guaranteed) {
        return {
            hit: true,
            chanceUsed,
            nextFailures: 0,
            nextSeed: seed,
            guaranteed: true,
        };
    }
    const roll = randFloat(seed);
    const hit = roll.value < chanceUsed;
    const maxFailures = Number.isFinite(pityCap) ? Math.max(0, pityCap - 1) : Number.POSITIVE_INFINITY;
    const nextFailures = hit ? 0 : Math.min(cappedFailures + 1, maxFailures);
    return {
        hit,
        chanceUsed,
        nextFailures,
        nextSeed: roll.seed,
        guaranteed: false,
    };
}
export function pityProgressPercent(failuresSoFar, pityCap) {
    if (!Number.isFinite(pityCap) || pityCap <= 1) {
        return 1;
    }
    const ratio = failuresSoFar / (pityCap - 1);
    return clamp(ratio, 0, 1);
}
