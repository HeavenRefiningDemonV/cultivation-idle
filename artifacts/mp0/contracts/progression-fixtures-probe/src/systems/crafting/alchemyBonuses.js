const IDLE_MAX_YIELD_MULTIPLIER = 1.05;
const TIME_REDUCTION_THRESHOLD = 75;
const YIELD_THRESHOLD = 100;
const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value));
export function getAlchemyTimeMultiplier(mastery) {
    return mastery >= TIME_REDUCTION_THRESHOLD ? 0.9 : 1;
}
export function getIdleYieldMultiplierForMastery(mastery) {
    return mastery >= YIELD_THRESHOLD ? IDLE_MAX_YIELD_MULTIPLIER : 1;
}
export function buildAlchemyOutputs(outputs, qty, multiplier = 1) {
    const items = Object.entries(outputs ?? {})
        .map(([itemId, baseQty]) => {
        const perJob = Math.floor(Number(baseQty));
        if (!Number.isFinite(perJob) || perJob <= 0)
            return null;
        const adjusted = Math.floor(perJob * qty * multiplier);
        const ensureOne = multiplier >= 1 ? Math.max(1, adjusted) : adjusted;
        return { itemId, qty: clampNumber(ensureOne, 0, Number.MAX_SAFE_INTEGER) };
    })
        .filter((entry) => Boolean(entry));
    return items;
}
