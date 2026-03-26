import { getLockedCityPhaseTargetDurations } from './phaseTimingTargets.js';
import { getAllPrepBudgetRegistryEntries } from '../economy/prepBudgetRegistry.js';
import type { EconomicGateIndex } from '../economy/economicConstants.js';

export type PrepPackageFitCategory =
  | 'directCoreCoverage'
  | 'supplementLaneCoverage'
  | 'forgeFit'
  | 'sourceRealism'
  | 'goldBudgetFit'
  | 'backgroundExpectationFit';

export type PrepRecoveryScenarioKind = 'consumables_only' | 'forge_floor_only' | 'build_correction_only';

const PHASE_TARGET_MINUTES_BY_GATE: Record<EconomicGateIndex, number> = {
  1: 55,
  2: 80,
  3: 120,
  4: 170,
  5: 250,
};

const RECOVERY_TARGET_MINUTES: Record<EconomicGateIndex, Record<PrepRecoveryScenarioKind, { targetMinutes: number; maxMinutes: number }>> = {
  1: {
    consumables_only: { targetMinutes: 12, maxMinutes: 20 },
    forge_floor_only: { targetMinutes: 18, maxMinutes: 26 },
    build_correction_only: { targetMinutes: 16, maxMinutes: 24 },
  },
  2: {
    consumables_only: { targetMinutes: 14, maxMinutes: 22 },
    forge_floor_only: { targetMinutes: 22, maxMinutes: 34 },
    build_correction_only: { targetMinutes: 20, maxMinutes: 32 },
  },
  3: {
    consumables_only: { targetMinutes: 18, maxMinutes: 30 },
    forge_floor_only: { targetMinutes: 30, maxMinutes: 46 },
    build_correction_only: { targetMinutes: 28, maxMinutes: 42 },
  },
  4: {
    consumables_only: { targetMinutes: 22, maxMinutes: 36 },
    forge_floor_only: { targetMinutes: 40, maxMinutes: 64 },
    build_correction_only: { targetMinutes: 36, maxMinutes: 58 },
  },
  5: {
    consumables_only: { targetMinutes: 28, maxMinutes: 48 },
    forge_floor_only: { targetMinutes: 55, maxMinutes: 84 },
    build_correction_only: { targetMinutes: 48, maxMinutes: 78 },
  },
};

export const PREP_ECONOMY_TARGETS = Object.freeze({
  ownerPacket: '6.4a_6.4b',
  packageFitCategories: [
    'directCoreCoverage',
    'supplementLaneCoverage',
    'forgeFit',
    'sourceRealism',
    'goldBudgetFit',
    'backgroundExpectationFit',
  ] as const satisfies readonly PrepPackageFitCategory[],
  isolatedRecoveryCategories: ['consumables_only', 'forge_floor_only', 'build_correction_only'] as const satisfies readonly PrepRecoveryScenarioKind[],
  packageFitPolicy: {
    supplementLaneSatisfiedByAnyHonestOption: true,
    directCoreCoverageModes: ['direct', 'brew', 'hybrid', 'unsupported'] as const,
    forbidNonLiveConsumables: true,
    forbidPostGateOnlySources: true,
    backgroundExpectationsMustMapToVisibleRoutes: true,
  },
  probeAssumptions: {
    apothecaryBuyMinutesPerUnit: 0.45,
    apothecaryBrewMinutesPerUnit: 1.2,
    forgeServiceMinutesPerAction: 3.5,
    manualPavilionMinutesPerAction: 4,
    routeSwitchOverheadMinutes: 2,
  },
  recoveryWindowsByGate: RECOVERY_TARGET_MINUTES,
  validation: {
    recoveryValidationToleranceMinutes: 6,
    recoveryValidationSlackRatio: 0.2,
  },
});

export function getPrepEconomyTargets() {
  return PREP_ECONOMY_TARGETS;
}

export function getPrepRecoveryWindowTarget(gateIndex: number, kind: PrepRecoveryScenarioKind) {
  const safe = Math.max(1, Math.min(5, Math.floor(gateIndex || 1))) as EconomicGateIndex;
  return PREP_ECONOMY_TARGETS.recoveryWindowsByGate[safe][kind];
}

export function validatePrepRecoveryWindowsAgainstPhaseTargets() {
  const phaseByGate = new Map(
    getLockedCityPhaseTargetDurations().map((entry) => [entry.realmIndex + 1, entry.targetSeconds / 60]),
  );

  return getAllPrepBudgetRegistryEntries().map((entry) => {
    const phaseMinutes = phaseByGate.get(entry.gateIndex) ?? PHASE_TARGET_MINUTES_BY_GATE[entry.gateIndex];
    const windows = PREP_ECONOMY_TARGETS.recoveryWindowsByGate[entry.gateIndex];
    return {
      gateIndex: entry.gateIndex,
      phaseMinutes,
      checks: {
        consumablesShortest: windows.consumables_only.targetMinutes < windows.forge_floor_only.targetMinutes
          && windows.consumables_only.targetMinutes < windows.build_correction_only.targetMinutes,
        allSubPhaseHalf: Object.values(windows).every((target) => target.maxMinutes <= phaseMinutes * 0.5),
      },
    };
  });
}
