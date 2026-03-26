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
import { getTrialLifecycleSnapshot, type TrialLifecycleSnapshot } from '../progression/runtime/trialLifecycle.js';
import { adaptProgressionAuthoredContent } from '../progression/contract/contentAdapter.js';
import { getProgressionContract, getTransitionByTrialId } from '../progression/contract/progressionContract.js';
import { SEMESTER_SLICE_CONTRACT } from '../progression/contract/semesterSlice.js';
import { getGateBuildFloor } from './gateBuildFloorRegistry.js';
import { diagnoseTrialFailure } from './failureDiagnosis.js';
import { buildGateForgeTargetsFromPrepBudgetEntry, evaluateCurrentGateReadiness, getCurrentGateTrialId } from './readinessRuntime.js';
import { scoreGateReadiness } from './readinessScoringEngine.js';
import { getDiagnosisLabel, getReadinessBandLabel } from '../../ui/text/playerFacingLabels.js';
import { buildStatusTroubleshootingSurface, type StatusTroubleshootingSurface } from '../ui/status/statusTroubleshootingSurface.js';
import { getTrialGateItemId } from '../progression/runtime/gateResolver.js';
import { buildPostFailureDiagnosisSurface, type PostFailureDiagnosisSurface } from '../ui/postFailure/index.js';

export type GateTrialReadinessLabel = 'Blocked' | 'Preparing' | 'Risky' | 'Close' | 'Ready';
export type GateTrialChecklistState = 'met' | 'open' | 'close';

export interface GateTrialChecklistLine {
  key: string;
  label: string;
  state: GateTrialChecklistState;
  detail: string;
}

export interface GateTrialReadinessSurface {
  trialId: TrialId;
  trialName: string;
  bossName: string | null;
  gateStateLabel: string;
  gateRewardLabel: string | null;
  requiredItemLabel: string | null;
  readinessLabel: GateTrialReadinessLabel;
  readinessDetail: string;
  minimumMetCount: number;
  minimumTotalCount: number;
  recommendedMetCount: number;
  recommendedTotalCount: number;
  minimumChecklist: GateTrialChecklistLine[];
  recommendedChecklist: GateTrialChecklistLine[];
  compactCompass: {
    milestoneLine: string;
    readinessLabel: string;
    blockerLine: string;
    actionLine: string;
  } | null;
  rawReadiness: GateReadinessResult | null;
  rawDiagnosis: FailureDiagnosis | null;
  lifecycle: TrialLifecycleSnapshot;
}

export type GateTrialAttemptState = 'not_ready' | 'attempt_gate' | 'attempt_anyway' | 'break_through';
export interface GateTrialAttemptPresentation {
  state: GateTrialAttemptState;
  primaryLabel: 'Not Ready' | 'Attempt Gate' | 'Attempt Anyway' | 'Break Through';
  primaryDisabled: boolean;
  detail: string;
  tone: 'blocked' | 'warning' | 'ready' | 'resolved';
  showBuySafetyNet: boolean;
  buySafetyNetEnabled: boolean;
}

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

export type Section5PostFailureSurface = PostFailureDiagnosisSurface;

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

export function buildSection5PostFailureSurface(trialId: string): Section5PostFailureSurface | null {
  const readinessSurface = buildSection5ReadinessSurface(trialId);
  if (!readinessSurface) return null;

  const trialDef = useContentStore.getState().maps.trialsById[readinessSurface.trialId] ?? null;
  const content = useContentStore.getState().raw;
  const game = useGameStore.getState();
  const progress = useTrialStore.getState().getProgress(readinessSurface.trialId);
  const requiredItemSatisfied = !trialDef?.requiredItemId || useInventoryStore.getState().getItemCount(trialDef.requiredItemId) > 0;
  const lifecycle = getTrialLifecycleSnapshot({
    content,
    trial: trialDef,
    progress,
    realm: game.realm,
    qi: game.qi,
    breakthroughRequirement: game.getBreakthroughRequirement(),
    requiredItemSatisfied,
  });

  return buildPostFailureDiagnosisSurface({
    diagnosis: readinessSurface.diagnosis,
    summary: readinessSurface.lastAttemptSummary,
    lifecycleResolved: lifecycle.isResolved,
    context: {
      cityId: trialDef?.cityId ?? null,
      canRetry: lifecycle.canStart,
      canBuySafetyNet: lifecycle.failSafe.canPurchase,
      gateLabel: trialDef?.name ?? 'Gate Trial',
    },
  });
}

function lifecycleStateLabel(state: TrialLifecycleSnapshot['state']): string {
  if (state === 'locked') return 'Locked';
  if (state === 'available') return 'Available';
  if (state === 'cleared') return 'Cleared';
  return 'Bypassed';
}

function summarizeBuildReadiness(readiness: GateReadinessResult | null, target: 'minimum' | 'recommended'): GateTrialChecklistLine {
  if (!readiness) {
    return { key: `build_${target}`, label: 'Build Floor', state: 'open', detail: 'Build analysis unavailable.' };
  }
  const met = target === 'minimum' ? readiness.build.minimumMet : readiness.build.recommendedMet;
  const state: GateTrialChecklistState = met
    ? 'met'
    : readiness.build.shortfalls.some((entry) => entry.severity === 'low' || entry.severity === 'medium') ? 'close' : 'open';
  const top = readiness.build.shortfalls.slice(0, 2).map((entry) => entry.label).join(', ');
  return {
    key: `build_${target}`,
    label: 'Build Floor',
    state,
    detail: met ? `Build floor ${target} target met.` : top || 'Build floor still below gate target.',
  };
}

function summarizeForgeReadiness(readiness: GateReadinessResult | null, target: 'minimum' | 'recommended'): GateTrialChecklistLine {
  if (!readiness) {
    return { key: `forge_${target}`, label: 'Forge Floor', state: 'open', detail: 'Forge floor unavailable.' };
  }
  const met = target === 'minimum' ? readiness.forge.minimumMet : readiness.forge.recommendedMet;
  const top = readiness.forge.shortfalls[0];
  return {
    key: `forge_${target}`,
    label: 'Forge Floor',
    state: met ? 'met' : top?.severity === 'low' ? 'close' : 'open',
    detail: met ? `Forge floor ${target} target met.` : top?.reason ?? 'Forge floor under target.',
  };
}

function summarizePreparationReadiness(readiness: GateReadinessResult | null, target: 'minimum' | 'recommended'): GateTrialChecklistLine {
  if (!readiness) {
    return { key: `prep_${target}`, label: 'Preparation', state: 'open', detail: 'Preparation data unavailable.' };
  }
  const met = target === 'minimum' ? readiness.economic.minimumMet : readiness.economic.recommendedMet;
  return {
    key: `prep_${target}`,
    label: 'Preparation',
    state: met ? 'met' : readiness.economic.majorShortfallCount <= 1 ? 'close' : 'open',
    detail: met ? `Consumable and reserve ${target} floor met.` : readiness.economic.shortfalls[0]?.reason ?? 'Preparation shortfalls remain.',
  };
}

function summarizePostureReadiness(readiness: GateReadinessResult | null, target: 'minimum' | 'recommended'): GateTrialChecklistLine {
  if (!readiness) {
    return { key: `posture_${target}`, label: 'Combat Posture', state: 'open', detail: 'Posture fit unavailable.' };
  }
  const met = target === 'minimum' ? readiness.posture.minimumMet : readiness.posture.recommendedMet;
  return {
    key: `posture_${target}`,
    label: 'Combat Posture',
    state: met ? 'met' : readiness.posture.warnings.length <= 1 ? 'close' : 'open',
    detail: met ? `Posture ${target} fit met.` : readiness.posture.warnings[0] ?? 'Posture fit still unstable.',
  };
}

export function buildGateTrialReadinessSurface(trialId: string): GateTrialReadinessSurface | null {
  const readinessSurface = buildSection5ReadinessSurface(trialId);
  const content = useContentStore.getState().raw;
  const maps = useContentStore.getState().maps;
  const resolvedTrialId = asLiveTrialId(trialId);
  if (!readinessSurface || !content || !resolvedTrialId) return null;

  const game = useGameStore.getState();
  const trialDef = maps.trialsById[resolvedTrialId] ?? null;
  if (!trialDef) return null;
  const progress = useTrialStore.getState().getProgress(resolvedTrialId);
  const requiredItemCount = trialDef.requiredItemId ? useInventoryStore.getState().getItemCount(trialDef.requiredItemId) : 0;
  const requiredItemSatisfied = !trialDef.requiredItemId || requiredItemCount > 0;
  const lifecycle = getTrialLifecycleSnapshot({
    content,
    trial: trialDef,
    progress,
    realm: game.realm,
    qi: game.qi,
    breakthroughRequirement: game.getBreakthroughRequirement(),
    requiredItemSatisfied,
  });

  const requiredItemLabel = trialDef.requiredItemId
    ? maps.itemsById[trialDef.requiredItemId]?.name ?? trialDef.requiredItemId
    : null;
  const gateItemId = getTrialGateItemId(content, trialDef);
  const gateRewardLabel = gateItemId ? maps.itemsById[gateItemId]?.name ?? gateItemId : null;
  const bossName = maps.enemiesById[trialDef.bossId]?.name ?? null;

  const readiness = readinessSurface.readiness;
  const diagnosis = readinessSurface.diagnosis;
  const minimumChecklist: GateTrialChecklistLine[] = [
    {
      key: 'entry_state_minimum',
      label: 'Entry State',
      state: lifecycle.canStart ? 'met' : (lifecycle.reasonCode === 'insufficient_qi' || lifecycle.reasonCode === 'not_final_substage') ? 'close' : 'open',
      detail: lifecycle.canStart
        ? 'Final substage reached, Qi ready.'
        : lifecycle.reasonCode === 'missing_required_item'
          ? `Missing required item — ${requiredItemLabel ?? 'Unknown item'}.`
          : lifecycle.reason,
    },
    summarizeBuildReadiness(readiness, 'minimum'),
    summarizeForgeReadiness(readiness, 'minimum'),
    summarizePreparationReadiness(readiness, 'minimum'),
    summarizePostureReadiness(readiness, 'minimum'),
  ];
  const recommendedChecklist: GateTrialChecklistLine[] = [
    {
      key: 'entry_state_recommended',
      label: 'Entry State',
      state: lifecycle.canStart ? 'met' : 'open',
      detail: lifecycle.canStart ? 'Entry gate is open for attempts.' : lifecycle.reason,
    },
    summarizeBuildReadiness(readiness, 'recommended'),
    summarizeForgeReadiness(readiness, 'recommended'),
    summarizePreparationReadiness(readiness, 'recommended'),
    summarizePostureReadiness(readiness, 'recommended'),
  ];

  const minimumMetCount = minimumChecklist.filter((entry) => entry.state === 'met').length;
  const recommendedMetCount = recommendedChecklist.filter((entry) => entry.state === 'met').length;

  let readinessLabel: GateTrialReadinessLabel = 'Preparing';
  let readinessDetail = lifecycle.reason;
  if (lifecycle.reasonCode === 'not_final_substage' || lifecycle.reasonCode === 'insufficient_qi') {
    readinessLabel = 'Preparing';
  } else if (lifecycle.canStart && diagnosis?.primary === 'close') {
    readinessLabel = 'Close';
    readinessDetail = diagnosis.reasons[0] ?? 'This gate is close; one focused fix should clear it.';
  } else if (readiness?.overallBand === 'recommended_met' && lifecycle.state === 'available') {
    readinessLabel = 'Ready';
    readinessDetail = 'Minimum and recommended gate floors are met.';
  } else if (readiness?.overallBand === 'minimum_met_below_recommended') {
    readinessLabel = 'Risky';
    readinessDetail = 'Minimum floor is met, but recommended safety is still short.';
  } else if (!lifecycle.canStart || readiness?.overallBand === 'below_minimum') {
    readinessLabel = 'Blocked';
    readinessDetail = lifecycle.canStart ? 'Minimum readiness floor is not met yet.' : lifecycle.reason;
  }

  return {
    trialId: resolvedTrialId,
    trialName: trialDef.name ?? resolvedTrialId,
    bossName,
    gateStateLabel: lifecycleStateLabel(lifecycle.state),
    gateRewardLabel,
    requiredItemLabel,
    readinessLabel,
    readinessDetail,
    minimumMetCount,
    minimumTotalCount: minimumChecklist.length,
    recommendedMetCount,
    recommendedTotalCount: recommendedChecklist.length,
    minimumChecklist,
    recommendedChecklist,
    compactCompass: null,
    rawReadiness: readiness,
    rawDiagnosis: diagnosis,
    lifecycle,
  };
}

export function buildGateTrialAttemptPresentation(surface: GateTrialReadinessSurface): GateTrialAttemptPresentation {
  if (surface.lifecycle.isResolved) {
    return {
      state: 'break_through',
      primaryLabel: 'Break Through',
      primaryDisabled: false,
      detail: 'Gate resolved. Return to Cultivation and complete your breakthrough.',
      tone: 'resolved',
      showBuySafetyNet: false,
      buySafetyNetEnabled: false,
    };
  }
  if (!surface.lifecycle.canStart) {
    return {
      state: 'not_ready',
      primaryLabel: 'Not Ready',
      primaryDisabled: true,
      detail: surface.lifecycle.reason,
      tone: 'blocked',
      showBuySafetyNet: surface.lifecycle.failSafe.status !== 'resolved',
      buySafetyNetEnabled: surface.lifecycle.failSafe.canPurchase,
    };
  }
  if (surface.readinessLabel === 'Ready') {
    return {
      state: 'attempt_gate',
      primaryLabel: 'Attempt Gate',
      primaryDisabled: false,
      detail: 'Gate is ready for a clean attempt.',
      tone: 'ready',
      showBuySafetyNet: true,
      buySafetyNetEnabled: surface.lifecycle.failSafe.canPurchase,
    };
  }
  return {
    state: 'attempt_anyway',
    primaryLabel: 'Attempt Anyway',
    primaryDisabled: false,
    detail: 'Gate is startable, but risk is still elevated.',
    tone: 'warning',
    showBuySafetyNet: true,
    buySafetyNetEnabled: surface.lifecycle.failSafe.canPurchase,
  };
}
