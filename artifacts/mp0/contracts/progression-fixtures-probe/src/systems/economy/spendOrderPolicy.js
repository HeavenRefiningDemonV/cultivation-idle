import { clampEconomicGateIndex, getCultivationPrepFloorTargetByGateIndex, getEconomicCultivationPrepItemId, getEconomicTransitionIdByGateIndex, getHealingFloorTargetByGateIndex, getSelectedPathBiasLabel, getSpecialtyFloorTargetByGateIndex, PAVILION_SPEND_CEILING_BY_GATE_INDEX, SPIRIT_ROOT_REROLL_SPEND_CEILING_BY_GATE_INDEX, } from './economicConstants.js';
import { getSupportReserveTargetsByGateIndex } from './supportCurrencyTargets.js';
import { getPrepBudgetByGateIndex, getPrepBudgetByTransitionId } from './prepBudgetRegistry.js';
export const SPEND_PRIORITY_ORDER = [
    { id: 'maintain_consumable_floor', order: 1, label: 'Maintain consumable floor' },
    { id: 'reach_minimum_forge_floor', order: 2, label: 'Reach minimal forge floor' },
    { id: 'build_merit_reserve', order: 3, label: 'Build Merit reserve' },
    { id: 'build_spirit_stone_reserve', order: 4, label: 'Build spirit-stone reserve' },
    { id: 'reach_recommended_forge_floor', order: 5, label: 'Reach recommended forge floor' },
    { id: 'buy_full_gate_prep_package', order: 6, label: 'Buy or brew full gate-prep package' },
    { id: 'build_correction_and_optional_runes', order: 7, label: 'Build correction and optional runes' },
];
export function buildEconomicStockFloorSnapshot(input) {
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
export function getSpendOrderPolicy(input) {
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
export function getAllSpendOrderPolicies() {
    return [1, 2, 3, 4, 5].map((gateIndex) => getSpendOrderPolicy({
        gateIndex,
        currentCityId: getPrepBudgetByGateIndex(gateIndex)?.cityId ?? null,
        currentGateResolved: false,
    }));
}
