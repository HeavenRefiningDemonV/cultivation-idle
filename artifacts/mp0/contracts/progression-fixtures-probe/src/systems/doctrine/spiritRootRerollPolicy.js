function normalizeRerollCount(rerollCount) {
    if (!Number.isFinite(rerollCount)) {
        return 0;
    }
    return Math.max(0, Math.floor(rerollCount));
}
function normalizeGoldValue(value) {
    if (!Number.isFinite(value)) {
        return 0;
    }
    return Math.max(0, value);
}
function getHealthyMaxRerolls(currentPhaseGoldBudget) {
    if (currentPhaseGoldBudget <= 0) {
        return 0;
    }
    if (currentPhaseGoldBudget <= 600) {
        return 2;
    }
    if (currentPhaseGoldBudget <= 3000) {
        return 3;
    }
    if (currentPhaseGoldBudget <= 12000) {
        return 4;
    }
    if (currentPhaseGoldBudget <= 47500) {
        return 5;
    }
    return 6;
}
export function evaluateRerollGuidance(input) {
    const rerollCount = normalizeRerollCount(input.rerollCount);
    const goldCost = normalizeGoldValue(input.rerollCost);
    const currentPhaseGoldBudget = normalizeGoldValue(input.currentPhaseGoldBudget);
    const healthyMax = getHealthyMaxRerolls(currentPhaseGoldBudget);
    const nextRerollNumber = rerollCount + 1;
    const spentSoFar = rerollCount <= 0
        ? 0
        : (goldCost / (2 ** rerollCount)) * ((2 ** rerollCount) - 1);
    const projectedSpentAfterNext = spentSoFar + goldCost;
    if (projectedSpentAfterNext <= currentPhaseGoldBudget * 0.5 &&
        nextRerollNumber <= healthyMax) {
        return {
            state: 'safe',
            rerollCount,
            goldCost,
            reason: 'This reroll remains comfortably inside the current gate-phase Spirit Root budget.',
        };
    }
    if (projectedSpentAfterNext > currentPhaseGoldBudget) {
        return {
            state: 'overspending',
            rerollCount,
            goldCost,
            reason: 'This reroll would exceed the current gate-phase Spirit Root budget and risks cannibalizing prep.',
        };
    }
    return {
        state: 'caution',
        rerollCount,
        goldCost,
        reason: nextRerollNumber > healthyMax
            ? 'This reroll stays inside budget, but it exceeds the healthy reroll expectation for this gate phase.'
            : 'This reroll stays inside budget, but Spirit Root spending is becoming expensive relative to current prep.',
    };
}
