import type { DoctrineSnapshot } from '../doctrine/index.js';
import type { TrialAttemptSummary } from '../../types/index.js';
import type { BuildAnalysis } from '../builds/buildAnalysisTypes.js';
import type { TrialId } from '../progression/contract/index.js';
import type { FailureDiagnosis, FailureDiagnosisCode } from './failureDiagnosisTypes.js';
import type { GateReadinessResult, ReadinessBand, ReadinessShortfallCode } from './readinessScoringTypes.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { createDefaultTrialProgress, normalizeTrialProgress, useTrialStore } from '../../stores/trialStore.js';
import { buildDoctrineSnapshot } from '../doctrine/doctrineSnapshot.js';
import { analyzeSelectedBuild } from '../builds/buildAnalysisService.js';
import { evaluateCurrentCombatPostureFit } from '../builds/combatPostureFit.js';
import { buildEconomicRecommendationEngineFromState } from '../economy/economicRecommendationEngine.js';
import { buildLiveEconomicRuntimeSnapshot } from '../economy/economicSnapshot.js';
import { getAllPrepBudgetRegistryEntries } from '../economy/prepBudgetRegistry.js';
import { getTrialLifecycleSnapshot } from '../progression/runtime/trialLifecycle.js';
import { adaptProgressionAuthoredContent } from '../progression/contract/contentAdapter.js';
import { getProgressionContract, getTransitionByTrialId } from '../progression/contract/progressionContract.js';
import { SEMESTER_SLICE_CONTRACT } from '../progression/contract/semesterSlice.js';
import { getGateBuildFloor } from './gateBuildFloorRegistry.js';
import { diagnoseTrialFailure } from './failureDiagnosis.js';
import { buildGateForgeTargetsFromPrepBudgetEntry, evaluateCurrentGateReadiness, getCurrentGateTrialId } from './readinessRuntime.js';
import { scoreGateReadiness } from './readinessScoringEngine.js';
import { getDiagnosisLabel, getReadinessBandLabel } from '../../ui/text/playerFacingLabels.js';
import { buildStatusTroubleshootingSurface, type StatusTroubleshootingSurface } from '../ui/status/statusTroubleshootingSurface.js';

export interface Section5ReadinessSurface {
  trialId: TrialId;
  readiness: GateReadinessResult | null;
  diagnosis: FailureDiagnosis | null;
  build: BuildAnalysis;
  lastAttemptSummary: TrialAttemptSummary | null;
  suggestions: string[];
  warnings: string[];
}

export interface Section5StatusSurface {
  currentGateTrialId: TrialId | null;
  overallBand: ReadinessBand | null;
  archetypeId: string | null;
  currentDiagnosis: FailureDiagnosis | null;
  topShortfallCodes: ReadinessShortfallCode[];
  warnings: string[];
}

export interface Section5ReadinessDisplay {
  band: ReadinessBand;
  label: string;
}

export interface Section5DiagnosisDisplay {
  code: FailureDiagnosisCode;
  label: string;
}

function asLiveTrialId(trialId: string): TrialId | null {
  return SEMESTER_SLICE_CONTRACT.liveTrialIds.includes(trialId as TrialId) ? trialId as TrialId : null;
}

function buildPatchedProgressByTrialId(trialId: TrialId): ReturnType<typeof useTrialStore.getState>['progressByTrialId'] | null {
  const liveProgress = useTrialStore.getState().progressByTrialId;
  const targetIndex = SEMESTER_SLICE_CONTRACT.liveTrialIds.indexOf(trialId);
  if (targetIndex < 0) return null;

  return Object.fromEntries(
    SEMESTER_SLICE_CONTRACT.liveTrialIds.map((currentTrialId, index) => {
      const existing = liveProgress[currentTrialId];
      const normalized = normalizeTrialProgress(existing ?? createDefaultTrialProgress());

      if (index < targetIndex) {
        return [currentTrialId, {
          ...normalized,
          resolution: 'bypassed',
          cleared: false,
          attemptStartAt: null,
          bypassedAt: normalized.bypassedAt ?? normalized.lastAttemptAt ?? 1,
        }];
      }

      if (index === targetIndex) {
        return [currentTrialId, {
          ...normalized,
          resolution: 'none',
          cleared: false,
          bypassedAt: null,
          attemptStartAt: null,
        }];
      }

      return [currentTrialId, normalized];
    }),
  ) as ReturnType<typeof useTrialStore.getState>['progressByTrialId'];
}

function buildBypassAvailability(trialId: TrialId): boolean {
  const trial = useContentStore.getState().maps.trialsById[trialId] ?? null;
  const content = useContentStore.getState().raw;
  const game = useGameStore.getState();
  const requiredItemSatisfied = !trial?.requiredItemId || useInventoryStore.getState().getItemCount(trial.requiredItemId) > 0;
  const lifecycle = getTrialLifecycleSnapshot({
    content,
    trial,
    progress: useTrialStore.getState().getProgress(trialId),
    realm: game.realm,
    qi: game.qi,
    breakthroughRequirement: game.getBreakthroughRequirement(),
    requiredItemSatisfied,
  });

  return lifecycle.failSafe.canPurchase;
}

export function getSection5ReadinessDisplay(band: ReadinessBand | null | undefined): Section5ReadinessDisplay | null {
  if (!band) return null;
  return { band, label: getReadinessBandLabel(band) };
}

export function getSection5DiagnosisDisplay(code: FailureDiagnosisCode | null | undefined): Section5DiagnosisDisplay | null {
  if (!code) return null;
  return { code, label: getDiagnosisLabel(code) };
}

export function buildTrialGateReadinessResult(
  trialId: string,
  snapshot?: DoctrineSnapshot,
): GateReadinessResult | null {
  try {
    const resolvedTrialId = asLiveTrialId(trialId);
    if (resolvedTrialId == null) return null;

    const resolvedSnapshot = snapshot ?? buildDoctrineSnapshot();
    const gateBuildFloor = getGateBuildFloor(resolvedTrialId);
    if (gateBuildFloor == null) return null;

    const content = useContentStore.getState().raw;
    if (!content) return null;

    const contract = getProgressionContract(adaptProgressionAuthoredContent(content));
    const transition = getTransitionByTrialId(contract, resolvedTrialId);
    if (transition == null) return null;

    const prepEntry = getAllPrepBudgetRegistryEntries().find((entry) => entry.contractTransitionId === transition.id) ?? null;
    if (prepEntry == null) return null;

    const forgeTargets = buildGateForgeTargetsFromPrepBudgetEntry(prepEntry);
    if (forgeTargets == null) return null;

    let liveSnapshot;
    try {
      liveSnapshot = buildLiveEconomicRuntimeSnapshot();
    } catch {
      return null;
    }

    const patchedProgressByTrialId = buildPatchedProgressByTrialId(resolvedTrialId);
    if (patchedProgressByTrialId == null) return null;

    const targetEconomic = buildEconomicRecommendationEngineFromState({
      content: liveSnapshot.content,
      currentCityId: liveSnapshot.currentCityId,
      unlockedCityIds: liveSnapshot.unlockedCityIds,
      selectedModuleByCity: liveSnapshot.currentModuleKey && liveSnapshot.currentCityId
        ? { [liveSnapshot.currentCityId]: liveSnapshot.currentModuleKey }
        : undefined,
      selectedPath: liveSnapshot.selectedPath,
      currentRealmIndex: liveSnapshot.currentRealmIndex,
      currencies: liveSnapshot.currencies,
      itemCountsById: liveSnapshot.ownedItemCountsById,
      purchasedTodayByStockId: liveSnapshot.currentCityShop.purchasedTodayByStockId,
      forgeFloor: liveSnapshot.forgeFloor,
      expeditionState: liveSnapshot.expeditionState,
      currentTrialProgressById: patchedProgressByTrialId,
    });

    const buildAnalysis = analyzeSelectedBuild(resolvedSnapshot);
    const postureFit = evaluateCurrentCombatPostureFit('trial');

    return scoreGateReadiness({
      trialId: resolvedTrialId,
      gateBuildFloor,
      buildAnalysis,
      forgeFloor: targetEconomic.snapshot.forgeFloor,
      forgeTargets,
      economicReadinessBand: targetEconomic.readinessBand,
      economicShortfalls: targetEconomic.orderedShortfalls,
      economicMajorShortfallCount: targetEconomic.majorShortfallCount,
      postureFit,
    });
  } catch {
    return null;
  }
}

export function buildSection5ReadinessSurface(
  trialId: string,
  snapshot?: DoctrineSnapshot,
): Section5ReadinessSurface | null {
  try {
    const resolvedTrialId = asLiveTrialId(trialId);
    if (resolvedTrialId == null) return null;

    const resolvedSnapshot = snapshot ?? buildDoctrineSnapshot();
    const build = analyzeSelectedBuild(resolvedSnapshot);
    const progress = useTrialStore.getState().getProgress(resolvedTrialId);
    const lastAttemptSummary = progress.lastAttemptSummary ?? null;
    const readiness = buildTrialGateReadinessResult(resolvedTrialId, resolvedSnapshot);
    const bypassAvailable = buildBypassAvailability(resolvedTrialId);

    const diagnosis = lastAttemptSummary && readiness
      ? diagnoseTrialFailure({
        trialId: resolvedTrialId,
        summary: lastAttemptSummary,
        readiness,
        build,
        bypassAvailable,
      })
      : null;

    return {
      trialId: resolvedTrialId,
      readiness,
      diagnosis,
      build,
      lastAttemptSummary,
      suggestions: lastAttemptSummary?.suggestions ?? [],
      warnings: readiness?.warnings ?? [],
    };
  } catch {
    return null;
  }
}

export function buildSection5StatusSurface(
  snapshot?: DoctrineSnapshot,
): Section5StatusSurface {
  try {
    const resolvedSnapshot = snapshot ?? buildDoctrineSnapshot();
    const build = analyzeSelectedBuild(resolvedSnapshot);
    const currentGateTrialId = getCurrentGateTrialId();
    const readiness = evaluateCurrentGateReadiness(resolvedSnapshot);

    let currentDiagnosis: FailureDiagnosis | null = null;
    if (currentGateTrialId && readiness) {
      const progress = useTrialStore.getState().getProgress(currentGateTrialId);
      if (progress.lastAttemptSummary) {
        currentDiagnosis = diagnoseTrialFailure({
          trialId: currentGateTrialId,
          summary: progress.lastAttemptSummary,
          readiness,
          build,
          bypassAvailable: buildBypassAvailability(currentGateTrialId),
        });
      }
    }

    return {
      currentGateTrialId,
      overallBand: readiness?.overallBand ?? null,
      archetypeId: build.archetypeId,
      currentDiagnosis,
      topShortfallCodes: readiness ? readiness.shortfalls.slice(0, 3).map((shortfall) => shortfall.code) : [],
      warnings: readiness ? [...readiness.warnings].slice(0, 3) : [],
    };
  } catch {
    return {
      currentGateTrialId: null,
      overallBand: null,
      archetypeId: null,
      currentDiagnosis: null,
      topShortfallCodes: [],
      warnings: [],
    };
  }
}

export function buildSection5StatusTroubleshootingSurface(): StatusTroubleshootingSurface {
  return buildStatusTroubleshootingSurface();
}
