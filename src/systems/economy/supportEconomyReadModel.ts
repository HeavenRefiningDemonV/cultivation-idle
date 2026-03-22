import type { TrialDef, TrialFailSafeCost } from '../../content/types.js';
import type { ValidatedContent } from '../../content/index.js';
import { useCityStore } from '../../stores/cityStore.js';
import { type CurrencyKey, useInventoryStore } from '../../stores/inventoryStore.js';
import { greaterThanOrEqualTo, subtract } from '../../utils/numbers.js';
import { getGateFailureMeritPolicyByGateIndex, projectMeritAfterEligibleDefeats } from './gateFailureMeritPolicy.js';
import { resolveTrialFailSafeConfig } from '../progression/runtime/trialLifecycle.js';
import { getSupportReserveTargetsByCityIndex, type SupportReserveTargets } from './supportCurrencyTargets.js';

export type SupportReserveStatus = 'below_minimum' | 'between_minimum_and_ideal' | 'at_ideal';

export interface SupportEconomyReadModel {
  currentCityId: string | null;
  currentCityIndex: number;
  nextGateIndex: number;
  currentMerit: string;
  currentSpiritStones: string;
  nextGateTrialId: string | null;
  nextGateFailSafeCost: TrialFailSafeCost | null;
  meritMinimumReserveLow: string;
  meritMinimumReserveHigh: string;
  targetMeritReserve: string;
  spiritStoneMinimumReserve: string;
  spiritStoneIdealReserve: string;
  meritReserveGap: string;
  spiritStoneMinimumGap: string;
  spiritStoneIdealGap: string;
  meritReserveStatus: SupportReserveStatus;
  reserveStatus: SupportReserveStatus;
  eligibleDefeatMeritReward: string;
  expectedMeritAfterThreeEligibleDefeats: string;
  failSafeAffordableNow: boolean;
}

function clampGap(current: string, target: string): string {
  if (greaterThanOrEqualTo(current, target)) return '0';
  return subtract(target, current).toString();
}

function canAffordCost(current: Partial<Record<CurrencyKey, string>>, cost: TrialFailSafeCost | null) {
  if (!cost) return false;
  return (['gold', 'spiritStones', 'merit'] as const).every((key) => {
    const amount = cost[key];
    if (!amount) return true;
    return greaterThanOrEqualTo(current[key] ?? '0', amount);
  });
}

function getCurrentCity(content: ValidatedContent | null | undefined) {
  const currentCityId = useCityStore.getState().currentCityId;
  const unlockedCityIds = useCityStore.getState().unlockedCityIds;
  const fallbackCityId = currentCityId ?? unlockedCityIds[0] ?? content?.cities[0]?.id ?? null;
  const city = fallbackCityId ? content?.cities.find((entry) => entry.id === fallbackCityId) ?? null : null;
  return {
    cityId: city?.id ?? fallbackCityId ?? null,
    cityIndex: city?.index ?? 0,
  };
}

export function getNextGateTrialForCity(content: ValidatedContent | null | undefined, cityId: string | null): TrialDef | null {
  if (!content || !cityId) return null;
  return content.trials.find((trial) => trial.cityId === cityId) ?? null;
}

export function buildSupportEconomyReadModel(content: ValidatedContent | null | undefined): SupportEconomyReadModel {
  const currencies = useInventoryStore.getState().currencies;
  return buildSupportEconomyReadModelFromState({ content, currencies });
}

export function buildSupportEconomyReadModelFromState(input: {
  content: ValidatedContent | null | undefined;
  currencies: Partial<Record<CurrencyKey, string>>;
  cityId?: string | null;
}): SupportEconomyReadModel {
  const { content, currencies, cityId } = input;
  const cityState = cityId ? { cityId, cityIndex: content?.cities.find((entry) => entry.id === cityId)?.index ?? 0 } : getCurrentCity(content);
  const currentCityId = cityState.cityId;
  const currentCityIndex = cityState.cityIndex;
  const targets: SupportReserveTargets = getSupportReserveTargetsByCityIndex(currentCityIndex);
  const nextGateTrial = getNextGateTrialForCity(content, currentCityId);
  const nextGateFailSafeCost = resolveTrialFailSafeConfig(nextGateTrial).cost;
  const currentMerit = currencies.merit ?? '0';
  const currentSpiritStones = currencies.spiritStones ?? '0';
  const gateFailurePolicy = getGateFailureMeritPolicyByGateIndex(targets.gateIndex);
  const meritTarget = String(targets.meritIdealReserve);
  const meritMinimumReserveLow = String(gateFailurePolicy.minimumMeritReserveLow);
  const meritMinimumReserveHigh = String(gateFailurePolicy.minimumMeritReserveHigh);
  const spiritMinimum = String(targets.spiritStoneMinimumReserve);
  const spiritIdeal = String(targets.spiritStoneIdealReserve);
  const meritReserveGap = clampGap(currentMerit, meritTarget);
  const spiritStoneMinimumGap = clampGap(currentSpiritStones, spiritMinimum);
  const spiritStoneIdealGap = clampGap(currentSpiritStones, spiritIdeal);
  const meritReserveStatus: SupportReserveStatus = !greaterThanOrEqualTo(currentMerit, meritMinimumReserveLow)
    ? 'below_minimum'
    : greaterThanOrEqualTo(currentMerit, meritTarget)
      ? 'at_ideal'
      : 'between_minimum_and_ideal';
  const reserveStatus: SupportReserveStatus = meritReserveStatus === 'below_minimum' || !greaterThanOrEqualTo(currentSpiritStones, spiritMinimum)
    ? 'below_minimum'
    : greaterThanOrEqualTo(currentSpiritStones, spiritIdeal) && meritReserveStatus === 'at_ideal'
      ? 'at_ideal'
      : 'between_minimum_and_ideal';

  return {
    currentCityId,
    currentCityIndex,
    nextGateIndex: targets.gateIndex,
    currentMerit,
    currentSpiritStones,
    nextGateTrialId: nextGateTrial?.id ?? null,
    nextGateFailSafeCost,
    meritMinimumReserveLow,
    meritMinimumReserveHigh,
    targetMeritReserve: meritTarget,
    spiritStoneMinimumReserve: spiritMinimum,
    spiritStoneIdealReserve: spiritIdeal,
    meritReserveGap,
    spiritStoneMinimumGap,
    spiritStoneIdealGap,
    meritReserveStatus,
    reserveStatus,
    eligibleDefeatMeritReward: String(gateFailurePolicy.eligibleDefeatMerit),
    expectedMeritAfterThreeEligibleDefeats: projectMeritAfterEligibleDefeats(currentMerit, targets.gateIndex, 3),
    failSafeAffordableNow: canAffordCost(currencies, nextGateFailSafeCost),
  };
}
