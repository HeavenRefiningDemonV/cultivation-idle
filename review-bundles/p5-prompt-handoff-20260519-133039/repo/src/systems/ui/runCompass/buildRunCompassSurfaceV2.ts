import { REALMS } from '../../../constants/index.js';
import type { LiveWorldModuleKey } from '../../../content/index.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { usePrestigeStore } from '../../../stores/prestigeStore.js';
import { useCultivationStore } from '../../../stores/cultivationStore.js';
import { createDefaultTrialProgress, normalizeTrialProgress, useTrialStore } from '../../../stores/trialStore.js';
import { buildLiveEconomicRecommendationEngine } from '../../economy/economicRecommendationEngine.js';
import type { EconomicRecommendationCandidate, EconomicShortfall } from '../../economy/economicRecommendationTypes.js';
import { buildSupportEconomySurfaceModel } from '../../economy/supportEconomySurfaceModel.js';
import { buildGateTrialReadinessSurface, buildSection5StatusSurface } from '../../readiness/section5Adapters.js';
import type { FailureDiagnosisCode, FailureFixDestination } from '../../readiness/failureDiagnosisTypes.js';
import {
  getLiveRealmById,
  getLiveRealmByIndex,
  getNextLiveRealm,
  getTrialGateItemId,
  isAtSemesterCap,
  getTrialLifecycleSnapshot,
} from '../../progression/runtime/index.js';
import { normalizeCityModulesForLiveSlice } from '../../world/liveWorldSchema.js';
import { captureRunDeltaSnapshot } from '../../runDeltas/runDeltaStore.js';
import { formatNumber } from '../../../utils/numbers.js';
import {
  getDiagnosisLabel,
  getPrestigeRecommendationLabel,
  getReadinessBandLabel,
  getShellTabLabel,
  getWorldModuleLabel,
} from '../../../ui/text/playerFacingLabels.js';
import type {
  RunCompassActionTarget,
  RunCompassBlockerKindV2,
  RunCompassBlockerV2,
  RunCompassCityContextV2,
  RunCompassDeltaSummaryV2,
  RunCompassGateContextV2,
  RunCompassMilestoneStateV2,
  RunCompassMilestoneV2,
  RunCompassPrestigeHintV2,
  RunCompassReadinessV2,
  RunCompassRouteV2,
  RunCompassSafetyNetV2,
  RunCompassSurfaceV2,
  RunCompassTabTarget,
} from './types.js';

type RouteSource = RunCompassRouteV2['source'];

const PRESTIGE_TARGET: RunCompassActionTarget = { kind: 'tab', tab: 'prestige' };

function tabRoute(args: {
  id: string;
  label: string;
  actionLabel?: string;
  detail: string;
  tab: RunCompassTabTarget;
  expectedDeltaLabel?: string | null;
  source: RouteSource;
  priority: number;
  blocked?: boolean;
  blockedReason?: string | null;
}): RunCompassRouteV2 {
  const target: RunCompassActionTarget = { kind: 'tab', tab: args.tab };
  return {
    id: args.id,
    label: args.label,
    actionLabel: args.actionLabel ?? args.label,
    detail: args.detail,
    destinationLabel: getShellTabLabel(args.tab),
    target,
    blocked: args.blocked ?? false,
    blockedReason: args.blockedReason ?? null,
    expectedDeltaLabel: args.expectedDeltaLabel ?? null,
    source: args.source,
    priority: args.priority,
  };
}

function moduleRoute(args: {
  id: string;
  label: string;
  actionLabel?: string;
  detail: string;
  cityId: string | null;
  moduleKey: LiveWorldModuleKey;
  expectedDeltaLabel?: string | null;
  source: RouteSource;
  priority: number;
  blockedReason?: string | null;
}): RunCompassRouteV2 {
  const blocked = !args.cityId || Boolean(args.blockedReason);
  const target: RunCompassActionTarget | null = args.cityId
    ? { kind: 'world_module', cityId: args.cityId, moduleKey: args.moduleKey }
    : null;
  return {
    id: args.id,
    label: args.label,
    actionLabel: args.actionLabel ?? `Open ${getWorldModuleLabel(args.moduleKey)}`,
    detail: args.detail,
    destinationLabel: getWorldModuleLabel(args.moduleKey),
    target,
    blocked,
    blockedReason: args.blockedReason ?? (args.cityId ? null : 'No active city is available for this route.'),
    expectedDeltaLabel: args.expectedDeltaLabel ?? null,
    source: args.source,
    priority: args.priority,
  };
}

function blockedRoute(args: {
  id: string;
  label: string;
  detail: string;
  destinationLabel: string;
  blockedReason: string;
  source: RouteSource;
  priority: number;
}): RunCompassRouteV2 {
  return {
    id: args.id,
    label: args.label,
    actionLabel: args.label,
    detail: args.detail,
    destinationLabel: args.destinationLabel,
    target: null,
    blocked: true,
    blockedReason: args.blockedReason,
    expectedDeltaLabel: null,
    source: args.source,
    priority: args.priority,
  };
}

function blocker(args: {
  kind: RunCompassBlockerKindV2;
  label: string;
  detail: string;
  severity?: RunCompassBlockerV2['severity'];
  source: RunCompassBlockerV2['source'];
  confidence?: RunCompassBlockerV2['confidence'];
}): RunCompassBlockerV2 {
  return {
    kind: args.kind,
    label: args.label,
    detail: args.detail,
    severity: args.severity ?? 'info',
    source: args.source,
    confidence: args.confidence ?? 'high',
  };
}

function mapActionKindLabel(actionKind: EconomicRecommendationCandidate['actionKind']): string {
  switch (actionKind) {
    case 'buy':
      return 'Restock Apothecary';
    case 'brew':
      return 'Brew Medicine';
    case 'farm_outskirts':
      return 'Stabilize Gold';
    case 'run_ruins':
      return 'Run Ruins';
    case 'launch_expedition':
      return 'Launch Expedition';
    case 'claim_bounty':
      return 'Work Bounties';
    case 'craft_forge':
      return 'Raise Forge Floor';
    case 'route_manual_pavilion':
      return 'Tune Manuals';
    case 'attempt_gate':
      return 'Attempt Gate';
    case 'hold_and_cultivate':
      return 'Cultivate Qi';
  }
}

function mapProblemKindToBlockerKind(problemKind: string | null | undefined): RunCompassBlockerKindV2 {
  const normalized = problemKind ?? '';
  if (normalized.includes('Forge')) return 'forge_floor_shortfall';
  if (normalized.includes('Prep') || normalized.includes('Consumable') || normalized.includes('Medicine')) return 'apothecary_prep_shortfall';
  if (normalized.includes('buildCorrection')) return 'build_correction_gap';
  if (normalized.includes('Manual')) return 'manual_pavilion_gap';
  if (normalized.includes('Merit')) return 'bounty_merit_shortfall';
  if (normalized.includes('Expedition')) return 'expedition_shortage_smoothing';
  return 'readiness_shortfall';
}

function routeFromCandidate(candidate: EconomicRecommendationCandidate, index: number): RunCompassRouteV2 {
  const label = mapActionKindLabel(candidate.actionKind);
  const priority = 60 + index;
  if (candidate.actionKind === 'hold_and_cultivate') {
    return tabRoute({
      id: `economy-${candidate.problemKind}-${index}`,
      label,
      detail: candidate.blockedReason ?? candidate.reasonSummary,
      tab: 'cultivation',
      expectedDeltaLabel: 'Qi moves toward the next threshold.',
      source: 'economy',
      priority,
    });
  }
  return moduleRoute({
    id: `economy-${candidate.problemKind}-${index}`,
    label,
    detail: candidate.blockedReason ?? candidate.reasonSummary,
    cityId: candidate.destinationCityId,
    moduleKey: candidate.destinationModuleKey,
    expectedDeltaLabel: candidate.expectedBenefitCategory
      ? `${candidate.expectedBenefitCategory.replace(/_/g, ' ')} improves.`
      : null,
    source: 'economy',
    priority,
    blockedReason: candidate.blockedReason,
  });
}

function routeForFailureFix(destination: FailureFixDestination, cityId: string | null): RunCompassRouteV2 {
  switch (destination) {
    case 'cultivation':
      return tabRoute({
        id: 'failure-fix-cultivation',
        label: 'Cultivate Before Retry',
        detail: 'The last gate rejection points back to Qi and realm edge stability.',
        tab: 'cultivation',
        expectedDeltaLabel: 'Qi closes the breakthrough threshold.',
        source: 'readiness',
        priority: 40,
      });
    case 'forge':
      return moduleRoute({
        id: 'failure-fix-forge',
        label: 'Refine the Forge Floor',
        detail: 'The last gate rejection exposed an underforged weapon or floor.',
        cityId,
        moduleKey: 'forge',
        expectedDeltaLabel: 'Forge floor rises before the next attempt.',
        source: 'readiness',
        priority: 40,
      });
    case 'apothecary':
    case 'medicine_pouch':
      return moduleRoute({
        id: 'failure-fix-apothecary',
        label: 'Restock Medicine',
        detail: 'The last gate rejection points to medicine and pouch preparation.',
        cityId,
        moduleKey: 'apothecary',
        expectedDeltaLabel: 'Medicine reserve improves.',
        source: 'readiness',
        priority: 40,
      });
    case 'techniques':
      return tabRoute({
        id: 'failure-fix-techniques',
        label: 'Tune Techniques',
        detail: 'The last gate rejection points to loadout, manual, or technique posture.',
        tab: 'techniques',
        expectedDeltaLabel: 'Build posture improves.',
        source: 'readiness',
        priority: 40,
      });
    case 'trial':
      return moduleRoute({
        id: 'failure-fix-trial',
        label: 'Retry Gate Trial',
        detail: 'The last result was close enough to justify another threshold check.',
        cityId,
        moduleKey: 'gateTrial',
        expectedDeltaLabel: 'Gate result updates.',
        source: 'trial_lifecycle',
        priority: 40,
      });
  }
}

function blockerKindForDiagnosis(primary: FailureDiagnosisCode): RunCompassBlockerKindV2 {
  switch (primary) {
    case 'undercultivated':
      return 'breakthrough_qi_short';
    case 'underforged':
      return 'forge_floor_shortfall';
    case 'underprepared':
      return 'apothecary_prep_shortfall';
    case 'underbuilt':
      return 'build_correction_gap';
    case 'close':
      return 'gate_recent_failure';
    case 'bypassAvailable':
      return 'safety_net_available';
  }
}

function toDeltaSummary(delta: ReturnType<typeof captureRunDeltaSnapshot>[number]): RunCompassDeltaSummaryV2 {
  return {
    id: delta.id,
    source: delta.source,
    timestamp: delta.timestamp,
    tone: delta.tone,
    label: delta.label,
    detail: delta.detail,
    memoryLine: delta.memoryLine,
    rewardSummary: delta.rewardSummary ?? null,
    readinessDelta: delta.readinessDelta ?? null,
  };
}

function getShortfallLabel(shortfall: EconomicShortfall | null | undefined): string | null {
  if (!shortfall) return null;
  return `${shortfall.label} gap ${formatNumber(shortfall.gap)}`;
}

function selectSecondaryRoutes(primary: RunCompassRouteV2, candidates: RunCompassRouteV2[]): RunCompassRouteV2[] {
  const seen = new Set([primary.id]);
  const result: RunCompassRouteV2[] = [];
  for (const route of candidates.sort((left, right) => left.priority - right.priority)) {
    const key = `${route.target?.kind ?? 'none'}:${route.destinationLabel}:${route.label}`;
    if (seen.has(route.id) || seen.has(key)) continue;
    seen.add(route.id);
    seen.add(key);
    result.push(route);
    if (result.length >= 3) break;
  }
  return result;
}

export function buildLiveRunCompassSurfaceV2(): RunCompassSurfaceV2 | null {
  const contentStore = useContentStore.getState();
  const content = contentStore.raw;
  if (!content) return null;

  const debugNotes: string[] = [];

  try {
    const generatedAt = Date.now();
    const game = useGameStore.getState();
    const cultivation = useCultivationStore.getState();
    const inventory = useInventoryStore.getState();
    const prestige = usePrestigeStore.getState();
    const trials = useTrialStore.getState();
    const economic = buildLiveEconomicRecommendationEngine();
    const section5 = buildSection5StatusSurface();
    const currentRealmIndex = economic.snapshot.currentRealmIndex;
    const currentRealm = getLiveRealmByIndex(currentRealmIndex);
    const nextRealm = getNextLiveRealm(currentRealmIndex);
    const activeTransition = economic.snapshot.phase.currentGateTransition;
    const activeTrial = activeTransition ? contentStore.maps.trialsById[activeTransition.trialId] ?? null : null;
    const activeProgress = activeTrial
      ? normalizeTrialProgress(trials.progressByTrialId[activeTrial.id] ?? createDefaultTrialProgress())
      : null;
    const gateItemId = activeTrial ? getTrialGateItemId(content, activeTrial) : null;
    const gateItemDef = gateItemId ? contentStore.maps.itemsById[gateItemId] ?? null : null;
    const gateItemCount = gateItemId ? inventory.getItemCount(gateItemId) : 0;
    const breakthroughRequirement = game.getBreakthroughRequirement();
    const qiGap = Math.max(0, Number(breakthroughRequirement) - Number(game.qi));
    const qiReady = qiGap <= 0;
    const currentRealmDef = REALMS[currentRealmIndex] ?? REALMS[0];
    const atRealmEdge = game.realm.substage >= currentRealmDef.substages;
    const atCap = economic.snapshot.atContentCap || economic.snapshot.phase.atContentCap || isAtSemesterCap(currentRealmIndex);
    const gateResolved = Boolean(economic.snapshot.currentGateResolved || activeProgress?.resolution === 'cleared' || activeProgress?.resolution === 'bypassed');
    const requiredItemSatisfied = activeTrial?.requiredItemId
      ? inventory.getItemCount(activeTrial.requiredItemId) > 0
      : true;
    const lifecycle = activeTrial
      ? getTrialLifecycleSnapshot({
        content,
        trial: activeTrial,
        progress: activeProgress,
        realm: game.realm,
        qi: game.qi,
        breakthroughRequirement,
        requiredItemSatisfied,
      })
      : null;
    const gateReadiness = activeTrial ? buildGateTrialReadinessSurface(activeTrial.id) : null;
    const support = buildSupportEconomySurfaceModel({
      content,
      currencies: inventory.currencies,
      cityId: economic.snapshot.currentCityId,
    });
    const currentCityDef = economic.snapshot.currentCityId
      ? contentStore.maps.citiesById[economic.snapshot.currentCityId] ?? null
      : null;
    const visibleModuleKeys = normalizeCityModulesForLiveSlice(currentCityDef?.modules ?? []);
    const recentDeltas = captureRunDeltaSnapshot().map(toDeltaSummary);
    const canPrestige = prestige.canPrestige();
    const prestigeTarget = canPrestige || atCap ? PRESTIGE_TARGET : null;
    const prestigeHint: RunCompassPrestigeHintV2 | null = atCap
      ? {
        state: canPrestige ? 'cap_recommended' : 'blocked',
        label: canPrestige ? 'Review Reincarnation' : 'Current chapter cap reached',
        detail: canPrestige
          ? 'Current authored chapter complete. Reincarnation is the next durable route.'
          : 'No future gate is exposed beyond the live slice, and Reincarnation is not unlocked yet.',
        target: prestigeTarget,
      }
      : canPrestige
        ? {
          state: 'available',
          label: getPrestigeRecommendationLabel('viable'),
          detail: 'Reincarnation is available, but the current milestone may still improve this life.',
          target: PRESTIGE_TARGET,
        }
        : null;
    const currentCity: RunCompassCityContextV2 | null = currentCityDef
      ? {
        cityId: currentCityDef.id,
        cityName: currentCityDef.name,
        visibleModuleKeys,
        recommendedModuleKey: economic.topRecommendation?.destinationModuleKey ?? null,
      }
      : null;
    const currentGate: RunCompassGateContextV2 | null = activeTrial && activeTransition && lifecycle
      ? {
        trialId: activeTrial.id,
        gateLabel: activeTrial.name ?? activeTrial.id,
        fromRealmLabel: getLiveRealmById(activeTransition.fromRealmId).name,
        toRealmLabel: getLiveRealmById(activeTransition.toRealmId).name,
        gateProofItemId: gateItemId,
        gateProofItemName: gateItemDef?.name ?? null,
        lifecycleState: lifecycle.state,
        resolved: lifecycle.isResolved,
        canAttempt: lifecycle.canStart,
        canBreakthrough: lifecycle.isResolved && qiReady && (!gateItemId || gateItemCount > 0),
        failSafeAvailable: lifecycle.failSafe.canPurchase,
      }
      : null;

    const readinessRows = [
      {
        id: 'realm-edge',
        label: 'Realm edge',
        detail: atRealmEdge ? 'Final substage reached.' : `Substage ${game.realm.substage} of ${currentRealmDef.substages}.`,
        tone: atRealmEdge ? 'success' as const : 'default' as const,
      },
      {
        id: 'qi',
        label: 'Qi threshold',
        detail: qiReady ? 'Qi is ready for the next threshold.' : `Need ${formatNumber(qiGap)} more Qi.`,
        tone: qiReady ? 'success' as const : 'warning' as const,
      },
      {
        id: 'readiness-band',
        label: 'Gate readiness',
        detail: gateReadiness?.readinessDetail ?? (section5.overallBand ? getReadinessBandLabel(section5.overallBand) : 'No active gate readiness score.'),
        tone: gateReadiness?.readinessLabel === 'Ready' ? 'success' as const : 'default' as const,
      },
    ];
    const readiness: RunCompassReadinessV2 = {
      score: gateReadiness?.readinessScore ?? null,
      label: atCap
        ? 'Cap reached'
        : gateReadiness?.readinessLabel ?? (section5.overallBand ? getReadinessBandLabel(section5.overallBand) : 'Preparing'),
      band: section5.overallBand,
      diagnosisLabel: section5.currentDiagnosis ? getDiagnosisLabel(section5.currentDiagnosis.primary) : null,
      primaryShortfallLabel: getShortfallLabel(economic.orderedShortfalls[0]),
      rows: readinessRows,
    };
    const safetyNet: RunCompassSafetyNetV2 | null = lifecycle
      ? {
        state: lifecycle.failSafe.canPurchase ? 'available' : lifecycle.failSafe.status === 'resolved' ? 'hidden' : 'progressing',
        label: lifecycle.failSafe.canPurchase ? 'Safety Net available' : 'Safety Net reserve',
        detail: lifecycle.failSafe.canPurchase
          ? 'Repeated eligible defeats can resolve the gate through city Merit support.'
          : lifecycle.failSafe.blockedReason ?? support.reserveGapLine,
        progressLine: `Eligible defeats ${lifecycle.failSafe.eligibleFailures}/${lifecycle.failSafe.threshold}`,
        target: currentCityDef ? { kind: 'world_module', cityId: currentCityDef.id, moduleKey: 'gateTrial' } : null,
      }
      : null;

    const nextRealmName = nextRealm?.name ?? null;
    let milestoneState: RunCompassMilestoneStateV2 = 'preparing';
    let milestoneLabel = nextRealmName ? `Prepare for ${nextRealmName}` : 'Current authored chapter complete';
    let milestoneDetail = activeTrial
      ? `${activeTrial.name} is the next threshold.`
      : 'Follow the next available cultivation threshold.';

    let primaryBlocker: RunCompassBlockerV2;
    let primaryRoute: RunCompassRouteV2;
    const candidateRoutes = economic.topRouteCandidates.map(routeFromCandidate);

    if (!game.selectedPath) {
      milestoneState = 'life_setup';
      milestoneLabel = 'Choose your Path';
      milestoneDetail = 'A cultivation path anchors the first life.';
      primaryBlocker = blocker({
        kind: 'life_setup_missing_path',
        label: 'Path is not selected',
        detail: 'Choose a cultivation path before pushing the first gate.',
        severity: 'warning',
        source: 'progression',
      });
      primaryRoute = tabRoute({
        id: 'setup-path',
        label: 'Choose Path',
        detail: 'Open Cultivation and set the life path.',
        tab: 'cultivation',
        expectedDeltaLabel: 'Life identity becomes stable.',
        source: 'progression',
        priority: 1,
      });
    } else if (!cultivation.selectedHeartLawId) {
      milestoneState = 'life_setup';
      milestoneLabel = 'Choose your Heart Law';
      milestoneDetail = 'Heart Law doctrine gives cultivation a readable foundation.';
      primaryBlocker = blocker({
        kind: 'life_setup_missing_heart_law',
        label: 'Heart Law is not selected',
        detail: 'Choose a Heart Law before treating gate preparation as stable.',
        severity: 'warning',
        source: 'progression',
      });
      primaryRoute = tabRoute({
        id: 'setup-heart-law',
        label: 'Choose Heart Law',
        detail: 'Open Cultivation and set the doctrine foundation.',
        tab: 'cultivation',
        expectedDeltaLabel: 'Doctrine refinement can begin.',
        source: 'progression',
        priority: 2,
      });
    } else if (prestige.postResetReclaimObjective) {
      const reclaimAction = prestige.postResetReclaimObjective.firstActions.find((action) => action.id !== 'choose_next_life_identity')
        ?? prestige.postResetReclaimObjective.firstActions[0]
        ?? null;
      milestoneState = 'cultivating';
      milestoneLabel = prestige.postResetReclaimObjective.headline;
      milestoneDetail = reclaimAction?.detail ?? prestige.postResetReclaimObjective.detail;
      primaryBlocker = blocker({
        kind: 'none',
        label: reclaimAction?.label ?? 'Previous life memory',
        detail: milestoneDetail,
        severity: 'success',
        source: 'prestige',
      });
      primaryRoute = tabRoute({
        id: 'post-reset-reclaim',
        label: reclaimAction?.label ?? 'Review Reclaim Objective',
        detail: milestoneDetail,
        tab: reclaimAction?.route?.kind === 'tab' && reclaimAction.route.tabId === 'prestige' ? 'prestige' : 'cultivation',
        expectedDeltaLabel: 'New life reclaim route updates from previous-life memory.',
        source: 'prestige',
        priority: 4,
      });
    } else if (atCap) {
      milestoneState = canPrestige ? 'prestige_recommended' : 'content_cap';
      milestoneLabel = 'Current authored chapter complete';
      milestoneDetail = 'No future gate is exposed beyond the live slice.';
      primaryBlocker = blocker({
        kind: canPrestige ? 'prestige_recommended' : 'content_cap',
        label: canPrestige ? 'Reincarnation is the next durable route' : 'Content cap reached',
        detail: canPrestige
          ? 'Review Reincarnation to turn this life into permanent progress.'
          : 'Hold the current life; Reincarnation is not available yet.',
        severity: canPrestige ? 'success' : 'info',
        source: canPrestige ? 'prestige' : 'content_cap',
      });
      primaryRoute = canPrestige
        ? tabRoute({
          id: 'cap-prestige',
          label: 'Review Reincarnation',
          detail: 'Current authored chapter complete. Reincarnation is the next durable route.',
          tab: 'prestige',
          expectedDeltaLabel: 'Life converts into permanent progress.',
          source: 'prestige',
          priority: 5,
        })
        : blockedRoute({
          id: 'cap-hold',
          label: 'Hold at Chapter Cap',
          detail: 'No future gate is exposed beyond the live slice.',
          destinationLabel: 'Current chapter',
          blockedReason: 'Reincarnation is not unlocked yet.',
          source: 'fallback',
          priority: 5,
        });
    } else if (gateResolved) {
      milestoneState = 'breakthrough_pending';
      milestoneLabel = nextRealmName ? `Break through to ${nextRealmName}` : 'Breakthrough pending';
      milestoneDetail = 'Gate proof is resolved. Breakthrough is next.';
      if (!qiReady) {
        primaryBlocker = blocker({
          kind: 'breakthrough_qi_short',
          label: 'Qi is short for breakthrough',
          detail: `Need ${formatNumber(qiGap)} more Qi before the breakthrough.`,
          severity: 'warning',
          source: 'progression',
        });
        primaryRoute = tabRoute({
          id: 'breakthrough-qi',
          label: 'Cultivate Qi',
          detail: 'The gate is resolved; gather the last Qi for breakthrough.',
          tab: 'cultivation',
          expectedDeltaLabel: 'Qi closes the breakthrough gap.',
          source: 'progression',
          priority: 10,
        });
      } else {
        primaryBlocker = blocker({
          kind: 'none',
          label: 'Gate proof resolved',
          detail: 'Return to Cultivation and begin the breakthrough.',
          severity: 'success',
          source: 'progression',
        });
        primaryRoute = tabRoute({
          id: 'breakthrough-ready',
          label: 'Break Through',
          actionLabel: 'Begin Breakthrough',
          detail: 'Gate proof and Qi are ready.',
          tab: 'cultivation',
          expectedDeltaLabel: nextRealmName ? `Enter ${nextRealmName}.` : 'Advance the realm.',
          source: 'progression',
          priority: 10,
        });
      }
    } else if (!atRealmEdge || !qiReady) {
      milestoneState = 'cultivating';
      milestoneLabel = nextRealmName ? `Reach ${nextRealmName}` : 'Reach the next threshold';
      milestoneDetail = !atRealmEdge
        ? `Advance to substage ${currentRealmDef.substages} before the gate opens.`
        : `Need ${formatNumber(qiGap)} more Qi for the gate threshold.`;
      primaryBlocker = blocker({
        kind: !atRealmEdge ? 'gate_not_at_realm_edge' : 'breakthrough_qi_short',
        label: !atRealmEdge ? 'Realm edge not reached' : 'Qi is short',
        detail: milestoneDetail,
        severity: 'warning',
        source: 'progression',
      });
      primaryRoute = tabRoute({
        id: 'cultivate-to-edge',
        label: 'Cultivate Qi',
        detail: 'Refine Qi until the next gate threshold opens.',
        tab: 'cultivation',
        expectedDeltaLabel: 'Qi and substage progress increase.',
        source: 'progression',
        priority: 20,
      });
    } else if (section5.currentDiagnosis) {
      const diagnosis = section5.currentDiagnosis;
      const topFix = diagnosis.topFixes[0] ?? null;
      milestoneState = diagnosis.primary === 'bypassAvailable' ? 'attemptable' : 'gate_failed';
      milestoneLabel = activeTrial ? `Recover for ${activeTrial.name}` : 'Recover from gate rejection';
      milestoneDetail = diagnosis.reasons[0] ?? getDiagnosisLabel(diagnosis.primary);
      primaryBlocker = blocker({
        kind: blockerKindForDiagnosis(diagnosis.primary),
        label: diagnosis.primary === 'bypassAvailable' ? 'Safety Net is available' : getDiagnosisLabel(diagnosis.primary),
        detail: milestoneDetail,
        severity: diagnosis.primary === 'close' || diagnosis.primary === 'bypassAvailable' ? 'info' : 'warning',
        source: 'readiness',
      });
      primaryRoute = topFix
        ? routeForFailureFix(topFix.destination, currentCityDef?.id ?? null)
        : diagnosis.primary === 'bypassAvailable'
          ? moduleRoute({
            id: 'failure-safety-net',
            label: 'Use Safety Net',
            detail: 'Resolve the gate through city Merit support.',
            cityId: currentCityDef?.id ?? null,
            moduleKey: 'gateTrial',
            expectedDeltaLabel: 'Gate bypass resolves proof.',
            source: 'trial_lifecycle',
            priority: 30,
          })
          : moduleRoute({
            id: 'failure-gate-review',
            label: 'Review Gate Trial',
            detail: 'Review the last gate rejection and apply the top fix.',
            cityId: currentCityDef?.id ?? null,
            moduleKey: 'gateTrial',
            source: 'readiness',
            priority: 30,
          });
    } else if (lifecycle?.failSafe.canPurchase) {
      milestoneState = 'attemptable';
      milestoneLabel = activeTrial ? `Resolve ${activeTrial.name}` : 'Resolve the gate';
      milestoneDetail = 'Safety Net is available after repeated eligible defeats.';
      primaryBlocker = blocker({
        kind: 'safety_net_available',
        label: 'Safety Net available',
        detail: 'Resolve the gate through city Merit support or keep refining for a clean clear.',
        severity: 'success',
        source: 'trial_lifecycle',
      });
      primaryRoute = moduleRoute({
        id: 'safety-net',
        label: 'Use Safety Net',
        detail: 'Resolve the gate through city Merit support.',
        cityId: currentCityDef?.id ?? null,
        moduleKey: 'gateTrial',
        expectedDeltaLabel: 'Gate bypass resolves proof.',
        source: 'trial_lifecycle',
        priority: 35,
      });
    } else if (economic.orderedShortfalls.length > 0 && candidateRoutes.length > 0) {
      const topShortfall = economic.orderedShortfalls[0];
      milestoneState = economic.readinessBand === 'recommended_met' ? 'attemptable' : 'preparing';
      milestoneLabel = activeTrial ? `Prepare for ${activeTrial.name}` : 'Prepare the next gate';
      milestoneDetail = topShortfall.label;
      primaryBlocker = blocker({
        kind: mapProblemKindToBlockerKind(topShortfall.problemKind),
        label: topShortfall.label,
        detail: `Gap ${formatNumber(topShortfall.gap)} before the next gate floor.`,
        severity: topShortfall.severity === 'critical' || topShortfall.severity === 'high' ? 'warning' : 'info',
        source: topShortfall.benefitCategory === 'build_correction' ? 'build' : 'economy',
      });
      primaryRoute = candidateRoutes[0];
    } else if (lifecycle?.canStart) {
      milestoneState = 'attemptable';
      milestoneLabel = activeTrial ? `Resolve ${activeTrial.name}` : 'Resolve the gate';
      milestoneDetail = 'Minimum gate requirements are met.';
      primaryBlocker = blocker({
        kind: 'attempt_gate_now',
        label: 'Gate can be attempted',
        detail: 'Minimum gate conditions are satisfied. Challenge the threshold.',
        severity: 'success',
        source: 'trial_lifecycle',
      });
      primaryRoute = moduleRoute({
        id: 'attempt-gate',
        label: 'Attempt Gate Trial',
        detail: 'Challenge the gate now.',
        cityId: currentCityDef?.id ?? null,
        moduleKey: 'gateTrial',
        expectedDeltaLabel: 'Gate result updates.',
        source: 'trial_lifecycle',
        priority: 80,
      });
    } else {
      debugNotes.push('No deterministic route branch matched; returned blocked fallback.');
      milestoneState = 'preparing';
      milestoneLabel = activeTrial ? `Prepare for ${activeTrial.name}` : 'Prepare the next threshold';
      milestoneDetail = lifecycle?.reason ?? 'The next route is unavailable from current source truth.';
      primaryBlocker = blocker({
        kind: lifecycle?.reasonCode === 'missing_required_item' ? 'breakthrough_gate_proof_missing' : 'unknown',
        label: 'Route needs review',
        detail: milestoneDetail,
        severity: 'warning',
        source: 'fallback',
        confidence: 'medium',
      });
      primaryRoute = blockedRoute({
        id: 'fallback-route-blocked',
        label: 'Review Status',
        detail: milestoneDetail,
        destinationLabel: getShellTabLabel('status'),
        blockedReason: milestoneDetail,
        source: 'fallback',
        priority: 99,
      });
    }

    const milestone: RunCompassMilestoneV2 = {
      id: `${milestoneState}:${currentRealm.id}:${activeTrial?.id ?? 'no-trial'}`,
      label: milestoneLabel,
      detail: milestoneDetail,
      state: milestoneState,
      currentRealmLabel: currentRealm.name,
      nextRealmLabel: nextRealmName,
      contextLine: atCap
        ? 'No future city or gate is exposed beyond the live slice.'
        : `${currentRealm.name} -> ${nextRealmName ?? 'chapter cap'}`,
      chapterLine: currentCityDef ? `Current city: ${currentCityDef.name}` : null,
    };

    const secondaryRoutes = selectSecondaryRoutes(primaryRoute, [
      ...candidateRoutes,
      ...(primaryRoute.target?.kind === 'tab' && primaryRoute.target.tab === 'cultivation'
        ? []
        : [tabRoute({
          id: 'secondary-cultivation',
          label: 'Cultivation',
          detail: 'Return to the cultivation threshold view.',
          tab: 'cultivation',
          source: 'progression',
          priority: 90,
        })]),
      ...(currentCityDef
        ? [moduleRoute({
          id: 'secondary-gate-trial',
          label: 'Gate Trial',
          detail: 'Inspect the active gate threshold.',
          cityId: currentCityDef.id,
          moduleKey: 'gateTrial',
          source: 'trial_lifecycle',
          priority: 91,
        })]
        : []),
    ]);

    return {
      version: 2,
      generatedAt,
      mode: 'live',
      milestone,
      primaryBlocker,
      primaryRoute,
      secondaryRoutes,
      readiness,
      currentCity,
      currentGate,
      safetyNet,
      prestigeHint,
      recentDeltas,
      debugNotes,
    };
  } catch (error) {
    console.warn('[RunCompassV2] Failed to build live surface', error);
    return null;
  }
}
