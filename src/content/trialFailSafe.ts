import type {
  EconomyConfig,
  TrialDef,
  TrialFailSafe,
  TrialFailSafeCost,
  TrialFailSafePurchase,
} from './types.js';

export interface TrialFailSafeSource {
  cityIndex?: number;
  failSafe?: {
    thresholdAttempts?: number;
    cost?: { gold?: string | number; spiritStones?: string | number; merit?: string | number };
  };
  failSafePurchase?: TrialFailSafePurchase;
}

const DEFAULT_FAIL_SAFE_THRESHOLD = 3;
const COST_REF_PREFIX = 'economy.manualSystem.gateTrials.failSafe.purchaseCostByCityIndex[';

const normalizeCostValue = (value: string | number | undefined): string | undefined => {
  if (value == null) return undefined;
  return typeof value === 'number' ? String(value) : value;
};

const normalizeCost = (cost: TrialFailSafeCost | null | undefined): TrialFailSafeCost | undefined => {
  if (!cost) return undefined;

  const normalized: TrialFailSafeCost = {
    gold: normalizeCostValue(cost.gold),
    spiritStones: normalizeCostValue(cost.spiritStones),
    merit: normalizeCostValue(cost.merit),
  };

  if (!normalized.gold && !normalized.spiritStones && !normalized.merit) {
    return undefined;
  }

  return normalized;
};

const readCityIndexFromCostRef = (costRef: string | undefined): number | null => {
  if (!costRef || !costRef.startsWith(COST_REF_PREFIX) || !costRef.endsWith(']')) return null;
  const value = Number.parseInt(costRef.slice(COST_REF_PREFIX.length, -1), 10);
  return Number.isFinite(value) ? value : null;
};

const readEconomyCostByCityIndex = (
  economy: EconomyConfig | null | undefined,
  cityIndex: number | null | undefined,
): TrialFailSafeCost | undefined => {
  if (cityIndex == null) return undefined;

  const manualSystem = economy?.manualSystem;
  if (!manualSystem || typeof manualSystem !== 'object') return undefined;

  const gateTrials = 'gateTrials' in manualSystem ? manualSystem.gateTrials : undefined;
  if (!gateTrials || typeof gateTrials !== 'object') return undefined;

  const failSafe = 'failSafe' in gateTrials ? gateTrials.failSafe : undefined;
  if (!failSafe || typeof failSafe !== 'object') return undefined;

  const purchaseCostByCityIndex =
    'purchaseCostByCityIndex' in failSafe ? failSafe.purchaseCostByCityIndex : undefined;
  if (!purchaseCostByCityIndex || typeof purchaseCostByCityIndex !== 'object') return undefined;

  const rawCost = Array.isArray(purchaseCostByCityIndex)
    ? purchaseCostByCityIndex[cityIndex]
    : (purchaseCostByCityIndex as Record<string, unknown>)[String(cityIndex)];
  if (!rawCost || typeof rawCost !== 'object') return undefined;

  const costRecord = rawCost as Record<string, unknown>;
  return normalizeCost({
    gold: normalizeCostValue(
      typeof costRecord.gold === 'string' || typeof costRecord.gold === 'number' ? costRecord.gold : undefined,
    ),
    spiritStones: normalizeCostValue(
      typeof costRecord.spiritStones === 'string' || typeof costRecord.spiritStones === 'number'
        ? costRecord.spiritStones
        : undefined,
    ),
    merit: normalizeCostValue(
      typeof costRecord.merit === 'string' || typeof costRecord.merit === 'number'
        ? costRecord.merit
        : undefined,
    ),
  });
};

export const resolveCanonicalTrialFailSafe = (
  trial: TrialFailSafeSource,
  economy: EconomyConfig | null | undefined,
): TrialFailSafe => {
  const alias = trial.failSafePurchase;
  const thresholdAttempts =
    trial.failSafe?.thresholdAttempts ??
    alias?.afterEligibleFails ??
    DEFAULT_FAIL_SAFE_THRESHOLD;
  const aliasCityIndex = readCityIndexFromCostRef(alias?.costRef);
  const fallbackCityIndex = aliasCityIndex ?? trial.cityIndex ?? null;
  const cost =
    normalizeCost(trial.failSafe?.cost) ??
    readEconomyCostByCityIndex(economy, fallbackCityIndex);

  return {
    thresholdAttempts: Math.max(1, Math.floor(thresholdAttempts)),
    ...(cost ? { cost } : {}),
  };
};

export const normalizeTrialFailSafeDefinition = (
  trial: TrialDef,
  economy: EconomyConfig | null | undefined,
): TrialDef => ({
  ...trial,
  failSafe: resolveCanonicalTrialFailSafe(trial, economy),
});
