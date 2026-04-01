export interface RerollGuidance {
  state: 'safe' | 'caution' | 'overspending';
  rerollCount: number;
  nextRerollNumber: number;
  goldCost: number;
  currentPhaseGoldBudget: number;
  spentSoFar: number;
  projectedSpentAfterNext: number;
  healthyMaxRerolls: number;
  reason: string;
}

function normalizeRerollCount(rerollCount: number): number {
  if (!Number.isFinite(rerollCount)) {
    return 0;
  }

  return Math.max(0, Math.floor(rerollCount));
}

function normalizeGoldValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

function getHealthyMaxRerolls(currentPhaseGoldBudget: number): number {
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

export function evaluateRerollGuidance(input: {
  rerollCount: number;
  rerollCost: number;
  currentPhaseGoldBudget: number;
}): RerollGuidance {
  const rerollCount = normalizeRerollCount(input.rerollCount);
  const goldCost = normalizeGoldValue(input.rerollCost);
  const currentPhaseGoldBudget = normalizeGoldValue(input.currentPhaseGoldBudget);
  const healthyMax = getHealthyMaxRerolls(currentPhaseGoldBudget);
  const nextRerollNumber = rerollCount + 1;
  const spendCeiling = currentPhaseGoldBudget * 0.05;

  const spentSoFar =
    rerollCount <= 0
      ? 0
      : (goldCost / (2 ** rerollCount)) * ((2 ** rerollCount) - 1);
  const projectedSpentAfterNext = spentSoFar + goldCost;

  if (projectedSpentAfterNext > spendCeiling || currentPhaseGoldBudget <= 0) {
    return {
      state: 'overspending',
      rerollCount,
      nextRerollNumber,
      goldCost,
      currentPhaseGoldBudget,
      spentSoFar,
      projectedSpentAfterNext,
      healthyMaxRerolls: healthyMax,
      reason: 'This reroll exceeds the 5% gate-prep Spirit Root budget ceiling and is an overspending trap right now.',
    };
  }

  if (nextRerollNumber <= healthyMax && projectedSpentAfterNext <= spendCeiling * 0.8) {
    return {
      state: 'safe',
      rerollCount,
      nextRerollNumber,
      goldCost,
      currentPhaseGoldBudget,
      spentSoFar,
      projectedSpentAfterNext,
      healthyMaxRerolls: healthyMax,
      reason: 'This reroll stays within the 5% gate-prep budget ceiling and healthy phase expectation.',
    };
  }

  return {
    state: 'caution',
    rerollCount,
    nextRerollNumber,
    goldCost,
    currentPhaseGoldBudget,
    spentSoFar,
    projectedSpentAfterNext,
    healthyMaxRerolls: healthyMax,
    reason:
      nextRerollNumber > healthyMax
        ? 'This reroll fits the 5% budget ceiling, but it exceeds the healthy reroll expectation for this gate phase.'
        : 'This reroll is still under the 5% budget ceiling, but you are approaching the Spirit Root spending cap for this phase.',
  };
}
