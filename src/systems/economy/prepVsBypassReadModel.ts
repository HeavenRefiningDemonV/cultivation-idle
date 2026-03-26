import type { ValidatedContent } from '../../content/index.js';
import { resolveTrialFailSafeConfig } from '../progression/runtime/trialLifecycle.js';
import { getPrepEconomyTargets } from '../balance/prepEconomyTargets.js';
import { getAllPrepBudgetRegistryEntries } from './prepBudgetRegistry.js';

export interface PrepVsBypassEconomyReport {
  gateIndex: number;
  transitionId: string;
  cityId: string;
  minimumPrepGoldRange: { minimum: number; recommended: number };
  recommendedPrepGoldRange: { minimum: number; recommended: number };
  failSafeGoldCost: number;
  minimumPrepToFailSafeGoldRatioLow: number;
  minimumPrepToFailSafeGoldRatioHigh: number;
  recommendedPrepToFailSafeGoldRatioLow: number;
  recommendedPrepToFailSafeGoldRatioHigh: number;
  minimumRatioWithinBand: boolean;
  recommendedRatioWithinBand: boolean;
  failSafeExceedsMinimumUpper: boolean;
  failSafeExceedsRecommendedUpper: boolean;
  minimumVsBypassGoldDelta: number;
  recommendedVsBypassGoldDelta: number;
  emergencyOnly: boolean;
  notes: string[];
}

export function buildPrepVsBypassEconomyReport(content: ValidatedContent, gateIndex: number): PrepVsBypassEconomyReport {
  const entry = getAllPrepBudgetRegistryEntries().find((candidate) => candidate.gateIndex === gateIndex);
  if (!entry) throw new Error(`[PrepVsBypassReadModel] Missing prep budget for gate ${gateIndex}`);

  const trial = content.trials.find((candidate) => candidate.cityId === entry.cityId) ?? null;
  const failSafe = resolveTrialFailSafeConfig(trial);
  const failSafeGoldCost = Number(failSafe.cost?.gold ?? 0);
  const ratios = getPrepEconomyTargets().prepVsBypassRatioBands;

  const minimumPrepToFailSafeGoldRatioLow = entry.minimumPrepPackage.goldSpendRange.minimum / Math.max(1, failSafeGoldCost);
  const minimumPrepToFailSafeGoldRatioHigh = entry.minimumPrepPackage.goldSpendRange.recommended / Math.max(1, failSafeGoldCost);
  const recommendedPrepToFailSafeGoldRatioLow = entry.recommendedPrepPackage.goldSpendRange.minimum / Math.max(1, failSafeGoldCost);
  const recommendedPrepToFailSafeGoldRatioHigh = entry.recommendedPrepPackage.goldSpendRange.recommended / Math.max(1, failSafeGoldCost);

  const minimumRatioWithinBand = minimumPrepToFailSafeGoldRatioLow >= ratios.minimumPrepToFailSafeGoldRatio.min
    && minimumPrepToFailSafeGoldRatioHigh <= ratios.minimumPrepToFailSafeGoldRatio.max;
  const recommendedRatioWithinBand = recommendedPrepToFailSafeGoldRatioLow >= ratios.recommendedPrepToFailSafeGoldRatio.min
    && recommendedPrepToFailSafeGoldRatioHigh <= ratios.recommendedPrepToFailSafeGoldRatio.max;

  const failSafeExceedsMinimumUpper = failSafeGoldCost > entry.minimumPrepPackage.goldSpendRange.recommended;
  const failSafeExceedsRecommendedUpper = failSafeGoldCost > entry.recommendedPrepPackage.goldSpendRange.recommended;
  const emergencyOnly = minimumRatioWithinBand && recommendedRatioWithinBand && failSafeExceedsMinimumUpper && failSafeExceedsRecommendedUpper;

  return {
    gateIndex,
    transitionId: entry.transitionId,
    cityId: entry.cityId,
    minimumPrepGoldRange: entry.minimumPrepPackage.goldSpendRange,
    recommendedPrepGoldRange: entry.recommendedPrepPackage.goldSpendRange,
    failSafeGoldCost,
    minimumPrepToFailSafeGoldRatioLow,
    minimumPrepToFailSafeGoldRatioHigh,
    recommendedPrepToFailSafeGoldRatioLow,
    recommendedPrepToFailSafeGoldRatioHigh,
    minimumRatioWithinBand,
    recommendedRatioWithinBand,
    failSafeExceedsMinimumUpper,
    failSafeExceedsRecommendedUpper,
    minimumVsBypassGoldDelta: failSafeGoldCost - entry.minimumPrepPackage.goldSpendRange.recommended,
    recommendedVsBypassGoldDelta: failSafeGoldCost - entry.recommendedPrepPackage.goldSpendRange.recommended,
    emergencyOnly,
    notes: emergencyOnly ? [] : ['bypass_cost_relationship_drift'],
  };
}

export function buildAllPrepVsBypassEconomyReports(content: ValidatedContent) {
  return getAllPrepBudgetRegistryEntries().map((entry) => buildPrepVsBypassEconomyReport(content, entry.gateIndex));
}
