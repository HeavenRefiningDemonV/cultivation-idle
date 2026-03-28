const DEFAULT_FAIL_SAFE_THRESHOLD = 3;
const COST_REF_PREFIX = 'economy.manualSystem.gateTrials.failSafe.purchaseCostByCityIndex[';
const normalizeCostValue = (value) => {
    if (value == null)
        return undefined;
    return typeof value === 'number' ? String(value) : value;
};
const normalizeCost = (cost) => {
    if (!cost)
        return undefined;
    const normalized = {
        gold: normalizeCostValue(cost.gold),
        spiritStones: normalizeCostValue(cost.spiritStones),
        merit: normalizeCostValue(cost.merit),
    };
    if (!normalized.gold && !normalized.spiritStones && !normalized.merit) {
        return undefined;
    }
    return normalized;
};
const readCityIndexFromCostRef = (costRef) => {
    if (!costRef || !costRef.startsWith(COST_REF_PREFIX) || !costRef.endsWith(']'))
        return null;
    const value = Number.parseInt(costRef.slice(COST_REF_PREFIX.length, -1), 10);
    return Number.isFinite(value) ? value : null;
};
const readEconomyCostByCityIndex = (economy, cityIndex) => {
    if (cityIndex == null)
        return undefined;
    const manualSystem = economy?.manualSystem;
    if (!manualSystem || typeof manualSystem !== 'object')
        return undefined;
    const gateTrials = 'gateTrials' in manualSystem ? manualSystem.gateTrials : undefined;
    if (!gateTrials || typeof gateTrials !== 'object')
        return undefined;
    const failSafe = 'failSafe' in gateTrials ? gateTrials.failSafe : undefined;
    if (!failSafe || typeof failSafe !== 'object')
        return undefined;
    const purchaseCostByCityIndex = 'purchaseCostByCityIndex' in failSafe ? failSafe.purchaseCostByCityIndex : undefined;
    if (!purchaseCostByCityIndex || typeof purchaseCostByCityIndex !== 'object')
        return undefined;
    const rawCost = Array.isArray(purchaseCostByCityIndex)
        ? purchaseCostByCityIndex[cityIndex]
        : purchaseCostByCityIndex[String(cityIndex)];
    if (!rawCost || typeof rawCost !== 'object')
        return undefined;
    const costRecord = rawCost;
    return normalizeCost({
        gold: normalizeCostValue(typeof costRecord.gold === 'string' || typeof costRecord.gold === 'number' ? costRecord.gold : undefined),
        spiritStones: normalizeCostValue(typeof costRecord.spiritStones === 'string' || typeof costRecord.spiritStones === 'number'
            ? costRecord.spiritStones
            : undefined),
        merit: normalizeCostValue(typeof costRecord.merit === 'string' || typeof costRecord.merit === 'number'
            ? costRecord.merit
            : undefined),
    });
};
export const resolveCanonicalTrialFailSafe = (trial, economy) => {
    const alias = trial.failSafePurchase;
    const thresholdAttempts = trial.failSafe?.thresholdAttempts ??
        alias?.afterEligibleFails ??
        DEFAULT_FAIL_SAFE_THRESHOLD;
    const aliasCityIndex = readCityIndexFromCostRef(alias?.costRef);
    const fallbackCityIndex = aliasCityIndex ?? trial.cityIndex ?? null;
    const authoredCost = trial.failSafe?.cost
        ? {
            gold: normalizeCostValue(trial.failSafe.cost.gold),
            spiritStones: normalizeCostValue(trial.failSafe.cost.spiritStones),
            merit: normalizeCostValue(trial.failSafe.cost.merit),
        }
        : undefined;
    const cost = normalizeCost(authoredCost) ??
        readEconomyCostByCityIndex(economy, fallbackCityIndex);
    return {
        thresholdAttempts: Math.max(1, Math.floor(thresholdAttempts)),
        ...(cost ? { cost } : {}),
    };
};
export const normalizeTrialFailSafeDefinition = (trial, economy) => ({
    ...trial,
    failSafe: resolveCanonicalTrialFailSafe(trial, economy),
});
