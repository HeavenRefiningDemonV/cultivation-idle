import type { DoctrineSnapshot } from '../doctrine/index.js';
import type { EconomicPrepBudgetRegistryEntry } from '../economy/index.js';
import type { TrialId } from '../progression/contract/index.js';
import type { GateForgeTargets, GateReadinessInput, GateReadinessResult } from './readinessScoringTypes.js';
import { buildDoctrineSnapshot } from '../doctrine/doctrineSnapshot.js';
import { buildLiveEconomicRecommendationEngine } from '../economy/economicRecommendationEngine.js';
import { getPrepBudgetByGateIndex, getPrepBudgetByTransitionId } from '../economy/prepBudgetRegistry.js';
import { analyzeSelectedBuild } from '../builds/buildAnalysisService.js';
import { evaluateCurrentCombatPostureFit } from '../builds/combatPostureFit.js';
import { getGateBuildFloor } from './gateBuildFloorRegistry.js';
import { scoreGateReadiness } from './readinessScoringEngine.js';

function getRecommendedRuneCount(entry: EconomicPrepBudgetRegistryEntry): number {
  const runeRecommendation = entry.recommendedPrepPackage.forgeFloor.runeRecommendation;
  return runeRecommendation.recommendedHigh ?? runeRecommendation.recommendedLow ?? runeRecommendation.minimum;
}

export function buildGateForgeTargetsFromPrepBudgetEntry(
  entry: EconomicPrepBudgetRegistryEntry | null | undefined,
): GateForgeTargets | null {
  if (entry == null) return null;

  return {
    minimum: {
      weaponRefine: entry.minimumPrepPackage.forgeFloor.weaponRefine,
      accessoryRefine: entry.minimumPrepPackage.forgeFloor.accessoryRefine,
      temperSuccesses: entry.minimumPrepPackage.forgeFloor.temperSuccesses,
      runeCount: entry.minimumPrepPackage.forgeFloor.runeRecommendation.minimum,
    },
    recommended: {
      weaponRefine: entry.recommendedPrepPackage.forgeFloor.weaponRefine,
      accessoryRefine: entry.recommendedPrepPackage.forgeFloor.accessoryRefine,
      temperSuccesses: entry.recommendedPrepPackage.forgeFloor.temperSuccesses,
      runeCount: getRecommendedRuneCount(entry),
    },
  };
}

export function getCurrentGateTrialId(): TrialId | null {
  try {
    const engine = buildLiveEconomicRecommendationEngine();
    return engine.snapshot.phase.nextUnresolvedGateTransition?.trialId ?? null;
  } catch {
    return null;
  }
}

export function buildCurrentGateReadinessInput(
  snapshot?: DoctrineSnapshot,
): GateReadinessInput | null {
  try {
    const resolvedSnapshot = snapshot ?? buildDoctrineSnapshot();

    let economic;
    try {
      economic = buildLiveEconomicRecommendationEngine();
    } catch {
      return null;
    }

    const targetTransition = economic.snapshot.phase.nextUnresolvedGateTransition;
    const targetTrialId = targetTransition?.trialId ?? null;
    if (targetTrialId == null) return null;

    const gateBuildFloor = getGateBuildFloor(targetTrialId);
    if (gateBuildFloor == null) return null;

    const prepEntry = economic.snapshot.phase.nextUnresolvedTransitionId
      ? getPrepBudgetByTransitionId(economic.snapshot.phase.nextUnresolvedTransitionId)
      : null;
    const fallbackPrepEntry = prepEntry ?? getPrepBudgetByGateIndex(economic.snapshot.currentGateIndex);
    if (fallbackPrepEntry == null) return null;

    const forgeTargets = buildGateForgeTargetsFromPrepBudgetEntry(fallbackPrepEntry);
    if (forgeTargets == null) return null;

    const buildAnalysis = analyzeSelectedBuild(resolvedSnapshot);
    const postureFit = evaluateCurrentCombatPostureFit('trial');

    return {
      trialId: targetTrialId,
      gateBuildFloor,
      buildAnalysis,
      forgeFloor: economic.snapshot.forgeFloor,
      forgeTargets,
      economicReadinessBand: economic.readinessBand,
      economicShortfalls: economic.orderedShortfalls,
      economicMajorShortfallCount: economic.majorShortfallCount,
      postureFit,
    };
  } catch {
    return null;
  }
}

export function evaluateCurrentGateReadiness(
  snapshot?: DoctrineSnapshot,
): GateReadinessResult | null {
  const input = buildCurrentGateReadinessInput(snapshot);
  return input ? scoreGateReadiness(input) : null;
}
