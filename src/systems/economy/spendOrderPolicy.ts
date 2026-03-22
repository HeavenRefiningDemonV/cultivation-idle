import type { CityId } from '../progression/contract/contractTypes.js';
import type { CultivationPath } from '../../types/index.js';
import {
  clampEconomicGateIndex,
  getCultivationPrepFloorTargetByGateIndex,
  getEconomicCultivationPrepItemId,
  getEconomicTransitionIdByGateIndex,
  getHealingFloorTargetByGateIndex,
  getSelectedPathBiasLabel,
  getSpecialtyFloorTargetByGateIndex,
  PAVILION_SPEND_CEILING_BY_GATE_INDEX,
  SPIRIT_ROOT_REROLL_SPEND_CEILING_BY_GATE_INDEX,
  type EconomicGateIndex,
  type EconomicTransitionId,
} from './economicConstants.js';
import { getSupportReserveTargetsByGateIndex } from './supportCurrencyTargets.js';
import { getPrepBudgetByGateIndex, getPrepBudgetByTransitionId } from './prepBudgetRegistry.js';

export type SpendPriorityId =
  | 'maintain_consumable_floor'
  | 'reach_minimum_forge_floor'
  | 'build_merit_reserve'
  | 'build_spirit_stone_reserve'
  | 'reach_recommended_forge_floor'
  | 'buy_full_gate_prep_package'
  | 'build_correction_and_optional_runes';

export interface SpendPriorityRule {
  id: SpendPriorityId;
  order: number;
  label: string;
}

export interface EconomicStockFloorSnapshot {
  gateIndex: EconomicGateIndex;
  cityId: CityId | null;
  healingFloor: number;
  specialtyFloor: number;
  cultivationPrepFloor: number;
  cultivationPrepItemId: string | null;
}

export interface SpendOrderPolicySnapshot {
  gateIndex: EconomicGateIndex;
  transitionId: EconomicTransitionId;
  cityId: CityId | null;
  selectedPath: CultivationPath | null;
  currentGateResolved: boolean;
  priorities: readonly SpendPriorityRule[];
  consumableFloor: EconomicStockFloorSnapshot;
  meritReserveTarget: number;
  spiritStoneReserve: { minimum: number; ideal: number };
  pavilionSpendCeilingBeforeResolve: number;
  spiritRootRerollSpendCeilingBeforeResolve: number;
  pathBiasHint: string | null;
}

export const SPEND_PRIORITY_ORDER: readonly SpendPriorityRule[] = [
  { id: 'maintain_consumable_floor', order: 1, label: 'Maintain consumable floor' },
  { id: 'reach_minimum_forge_floor', order: 2, label: 'Reach minimal forge floor' },
  { id: 'build_merit_reserve', order: 3, label: 'Build Merit reserve' },
  { id: 'build_spirit_stone_reserve', order: 4, label: 'Build spirit-stone reserve' },
  { id: 'reach_recommended_forge_floor', order: 5, label: 'Reach recommended forge floor' },
  { id: 'buy_full_gate_prep_package', order: 6, label: 'Buy or brew full gate-prep package' },
  { id: 'build_correction_and_optional_runes', order: 7, label: 'Build correction and optional runes' },
] as const;

export function buildEconomicStockFloorSnapshot(input: { gateIndex: number; cityId?: CityId | null }): EconomicStockFloorSnapshot {
  const gateIndex = clampEconomicGateIndex(input.gateIndex);
  return {
    gateIndex,
    cityId: input.cityId ?? null,
    healingFloor: getHealingFloorTargetByGateIndex(gateIndex),
    specialtyFloor: getSpecialtyFloorTargetByGateIndex(gateIndex),
    cultivationPrepFloor: getCultivationPrepFloorTargetByGateIndex(gateIndex),
    cultivationPrepItemId: getEconomicCultivationPrepItemId(input.cityId),
  };
}

export function getSpendOrderPolicy(input: {
  gateIndex?: number;
  transitionId?: EconomicTransitionId | null;
  currentCityId?: CityId | null;
  selectedPath?: CultivationPath | null;
  currentGateResolved?: boolean;
}): SpendOrderPolicySnapshot {
  const derivedGateIndex = input.transitionId
    ? (getPrepBudgetByTransitionId(input.transitionId)?.gateIndex ?? input.gateIndex ?? 1)
    : input.gateIndex ?? 1;
  const gateIndex = clampEconomicGateIndex(derivedGateIndex);
  const transitionId = input.transitionId ?? getEconomicTransitionIdByGateIndex(gateIndex);
  const reserveTargets = getSupportReserveTargetsByGateIndex(gateIndex);

  return {
    gateIndex,
    transitionId,
    cityId: input.currentCityId ?? null,
    selectedPath: input.selectedPath ?? null,
    currentGateResolved: Boolean(input.currentGateResolved),
    priorities: SPEND_PRIORITY_ORDER,
    consumableFloor: buildEconomicStockFloorSnapshot({ gateIndex, cityId: input.currentCityId }),
    meritReserveTarget: reserveTargets.meritIdealReserve,
    spiritStoneReserve: {
      minimum: reserveTargets.spiritStoneMinimumReserve,
      ideal: reserveTargets.spiritStoneIdealReserve,
    },
    pavilionSpendCeilingBeforeResolve: PAVILION_SPEND_CEILING_BY_GATE_INDEX[gateIndex],
    spiritRootRerollSpendCeilingBeforeResolve: SPIRIT_ROOT_REROLL_SPEND_CEILING_BY_GATE_INDEX[gateIndex],
    pathBiasHint: getSelectedPathBiasLabel(input.selectedPath),
  };
}

export function getAllSpendOrderPolicies(): SpendOrderPolicySnapshot[] {
  return ([1, 2, 3, 4, 5] as const).map((gateIndex) =>
    getSpendOrderPolicy({
      gateIndex,
      currentCityId: getPrepBudgetByGateIndex(gateIndex)?.cityId ?? null,
      currentGateResolved: false,
    }),
  );
}
