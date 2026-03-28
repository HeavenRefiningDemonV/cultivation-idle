export const BREATH_MODE_MULTIPLIERS = {
    balanced: { qiRateMult: 1, comprehensionMult: 1, stabilityMult: 1 },
    safe: { qiRateMult: 0.85, comprehensionMult: 1.1, stabilityMult: 1.15 },
    fast: { qiRateMult: 1.15, comprehensionMult: 0.9, stabilityMult: 0.85 },
};
export const COMPREHENSION_PER_MINUTE_BASE = 5;
export const STUDY_MASTERY_PER_MINUTE_BASE = 1;
export const COMPREHENSION_EVENT_BONUSES = {
    outskirtsBoss: 10,
    trialClear: 15,
    ruinsClear: 8,
};
export const VERSE_COMPREHENSION_THRESHOLD = 100;
export const INSIGHT_INTERVAL_RANGE_MS = { min: 12 * 60 * 1000, max: 18 * 60 * 1000 };
export const INSIGHT_DURATION_MS = 60 * 1000;
export const INSIGHT_BURSTS = {
    comprehension: 15,
    qiSecondsWorth: 30,
    stability: 10,
};
export function getBreathModeMultipliers(mode) {
    return BREATH_MODE_MULTIPLIERS[mode] ?? BREATH_MODE_MULTIPLIERS.balanced;
}
