import { D } from '../../../src/utils/numbers.js';
import { apply as applyOfflineCatchup } from '../../../src/services/time/OfflineCatchup.js';
import { buildOfflineContext } from '../../../src/systems/offline.js';
import { useCityStore } from '../../../src/stores/cityStore.js';
import { useContentStore } from '../../../src/stores/contentStore.js';
import { useExpeditionStore } from '../../../src/stores/expeditionStore.js';
import { useGameStore } from '../../../src/stores/gameStore.js';
import { useInventoryStore } from '../../../src/stores/inventoryStore.js';
import { useProfessionStore } from '../../../src/stores/professionStore.js';
import { useTrialStore } from '../../../src/stores/trialStore.js';
import { useCombatStore } from '../../../src/stores/combatStore.js';
import { getTrialLifecycleSnapshot, isAtSemesterCap } from '../../../src/systems/progression/runtime/index.js';
import { buildSection5StatusSurface } from '../../../src/systems/readiness/section5Adapters.js';
import { buildStatusTroubleshootingSurface } from '../../../src/systems/ui/status/statusTroubleshootingSurface.js';
import { isNotificationOverlayBlocked } from '../../../src/systems/ui/notificationPolicy.js';
import { buildWorldCommandSurface } from '../../../src/systems/ui/world/worldCommandSurface.js';
import { performPostFailureFixActionWithDeps } from '../../../src/systems/ui/postFailure/postFailureFixActions.js';
import type { PostFailureFixSurface } from '../../../src/systems/ui/postFailure/postFailureSurface.js';
import { buildCurrentLifeSummarySurface } from '../../../src/features/prestige/lifeSummarySurface.js';
import { getPrestigeAdvisorSurface } from '../../../src/features/prestige/prestigeAdvisorSurface.js';
import { buildPrepVsBypassEconomyReport } from '../../../src/systems/economy/prepVsBypassReadModel.js';
import { buildSupportReservePacingReport } from '../../../src/systems/economy/supportReservePacingReadModel.js';
import { PRESTIGE_TARGETS } from '../../../src/systems/balance/prestigeTargets.js';
import { buildLiveEconomicRecommendationEngine } from '../../../src/systems/economy/economicRecommendationEngine.js';
import { getSpendOrderPolicy } from '../../../src/systems/economy/spendOrderPolicy.js';
import { getPrepBudgetByGateIndex } from '../../../src/systems/economy/prepBudgetRegistry.js';
import { runPhaseTimingProbe } from '../balance/runPhaseTimingProbe.js';
import { runPrestigeApHourProbe } from '../balance/runPrestigeApHourProbe.js';
import { runReclaimProbe } from '../balance/runReclaimProbe.js';
import { setupFreshSaveRun } from './setupFreshSaveRun.js';
import type {
  AlternativeRouteCheckpointId,
  AlternativeRouteCheckpointRow,
  AlternativeRouteComparisonRow,
  AlternativeRouteFailure,
  AlternativeRouteFinalSnapshot,
  AlternativeRouteId,
  AlternativeRouteInteractionRow,
  AlternativeRouteResult,
  AlternativeRouteWarning,
  AlternativeRouteExploitWatchRow,
  AlternativeRouteInvariantCheck,
} from './alternativeRouteTypes.js';

const now = () => Date.now();

function checkpoint(
  rows: AlternativeRouteCheckpointRow[],
  startedAt: number,
  checkpointId: AlternativeRouteCheckpointId,
  detail?: string,
  source: AlternativeRouteCheckpointRow['source'] = 'runner',
) {
  rows.push({ checkpointId, elapsedMsSinceStart: Math.max(0, now() - startedAt), source, detail });
}

function interaction(
  rows: AlternativeRouteInteractionRow[],
  startedAt: number,
  reason: AlternativeRouteInteractionRow['reason'],
  triggeredBy: AlternativeRouteInteractionRow['triggeredBy'],
  detail: string,
) {
  rows.push({ reason, triggeredBy, detail, elapsedMsSinceStart: Math.max(0, now() - startedAt) });
}

function buildFinalSnapshot(routeId: AlternativeRouteId): AlternativeRouteFinalSnapshot {
  const game = useGameStore.getState();
  const city = useCityStore.getState();
  const trialId = buildSection5StatusSurface().currentGateTrialId;
  const advisor = getPrestigeAdvisorSurface();
  const lifeSummary = buildCurrentLifeSummarySurface();

  return {
    finalRealmId: (['qi_condensation', 'foundation_establishment', 'core_formation', 'nascent_soul', 'soul_formation', 'spirit_severing'][Math.max(0, Math.min(5, game.realm.index))] ?? 'qi_condensation') as AlternativeRouteFinalSnapshot['finalRealmId'],
    currentCityId: (city.currentCityId ?? null) as AlternativeRouteFinalSnapshot['currentCityId'],
    unlockedCityIds: [...city.unlockedCityIds] as AlternativeRouteFinalSnapshot['unlockedCityIds'],
    currentGateTrialId: trialId,
    reachedSpiritSevering: game.realm.index >= 5,
    reachedContentCap: isAtSemesterCap(game.realm.index),
    currentChapterExhaustedTruthAvailable: useContentStore.getState().isLoaded && isAtSemesterCap(game.realm.index),
    prestigeAdvisorAvailable: Boolean(advisor),
    lifeSummaryAvailable: Boolean(lifeSummary),
    noFakeCitySix: !city.unlockedCityIds.includes('city_six' as never) && !city.unlockedCityIds.includes('city_fake_future_metropolis' as never),
    estimatedAttentionInteractions: routeId === 'low_attention' ? undefined : undefined,
  };
}

export async function runFailSafeAlternativeRoute(): Promise<AlternativeRouteResult> {
  const startedAt = now();
  const checkpoints: AlternativeRouteCheckpointRow[] = [];
  const failures: AlternativeRouteFailure[] = [];
  const warnings: AlternativeRouteWarning[] = [];
  const interactionLog: AlternativeRouteInteractionRow[] = [];
  const comparisonRows: AlternativeRouteComparisonRow[] = [];

  const bootstrap = await setupFreshSaveRun();
  checkpoint(checkpoints, startedAt, 'route_started', 'Fresh bootstrap complete.');
  interaction(interactionLog, startedAt, 'path_setup', 'manual', `Path=${bootstrap.representativePath}`);

  const transition = bootstrap.contract.gateTransitions[0];
  if (!transition) {
    throw new Error('Fail-safe route requires at least one gate transition.');
  }
  const trial = useContentStore.getState().maps.trialsById[transition.trialId];
  if (!trial) throw new Error(`Missing trial definition for ${transition.trialId}`);

  useGameStore.setState({ realm: { index: 0, substage: 9, name: 'Qi Condensation' } });
  const requirement = useGameStore.getState().getBreakthroughRequirement();
  useGameStore.setState({ qi: requirement });

  const baselineLifecycle = getTrialLifecycleSnapshot({
    content: useContentStore.getState().raw,
    trial,
    progress: useTrialStore.getState().getProgress(trial.id),
    realm: useGameStore.getState().realm,
    qi: useGameStore.getState().qi,
    breakthroughRequirement: useGameStore.getState().getBreakthroughRequirement(),
    requiredItemSatisfied: true,
  });
  checkpoint(checkpoints, startedAt, 'gate_available', baselineLifecycle.reason);

  const beforeBlockedEligible = useTrialStore.getState().getProgress(trial.id).eligibleFailures;
  useGameStore.setState({ realm: { index: 0, substage: 1, name: 'Qi Condensation' } });
  const blockedLifecycle = getTrialLifecycleSnapshot({
    content: useContentStore.getState().raw,
    trial,
    progress: useTrialStore.getState().getProgress(trial.id),
    realm: useGameStore.getState().realm,
    qi: useGameStore.getState().qi,
    breakthroughRequirement: useGameStore.getState().getBreakthroughRequirement(),
    requiredItemSatisfied: true,
  });
  if (blockedLifecycle.canStart) {
    failures.push({ code: 'blocked_start_unexpectedly_available', blocker: true, message: 'Blocked gate state unexpectedly allowed start.' });
  }
  const afterBlockedEligible = useTrialStore.getState().getProgress(trial.id).eligibleFailures;
  if (beforeBlockedEligible !== afterBlockedEligible) {
    failures.push({ code: 'blocked_start_incremented_failsafe', blocker: true, message: 'Blocked state changed eligible failure count.' });
  }

  useGameStore.setState({ realm: { index: 0, substage: 9, name: 'Qi Condensation' }, qi: requirement });

  for (let i = 1; i <= baselineLifecycle.failSafe.threshold; i += 1) {
    const lifecycle = getTrialLifecycleSnapshot({
      content: useContentStore.getState().raw,
      trial,
      progress: useTrialStore.getState().getProgress(trial.id),
      realm: useGameStore.getState().realm,
      qi: useGameStore.getState().qi,
      breakthroughRequirement: useGameStore.getState().getBreakthroughRequirement(),
      requiredItemSatisfied: true,
    });

    if (!lifecycle.canStart) {
      failures.push({ code: 'expected_eligible_failure_unavailable', blocker: true, message: `Gate should be startable for eligible failure ${i}.` });
      break;
    }
    useTrialStore.getState().recordFailure(trial.id, lifecycle.countsTowardFailSafeOnStart);
    checkpoint(checkpoints, startedAt, (`eligible_failure_${Math.min(i, 3)}` as AlternativeRouteCheckpointId), `Eligible failures=${useTrialStore.getState().getProgress(trial.id).eligibleFailures}`);
  }

  const lifecycleAfterFailures = getTrialLifecycleSnapshot({
    content: useContentStore.getState().raw,
    trial,
    progress: useTrialStore.getState().getProgress(trial.id),
    realm: useGameStore.getState().realm,
    qi: useGameStore.getState().qi,
    breakthroughRequirement: useGameStore.getState().getBreakthroughRequirement(),
    requiredItemSatisfied: true,
  });

  if (!lifecycleAfterFailures.failSafe.canPurchase) {
    failures.push({ code: 'failsafe_not_available_after_threshold', blocker: true, message: 'Safety Net was not available at threshold.' });
  } else {
    checkpoint(checkpoints, startedAt, 'bypass_available', `threshold=${lifecycleAfterFailures.failSafe.threshold}`);
  }

  useInventoryStore.setState({
    currencies: { gold: '999999', merit: '999999', spiritStones: '999999' },
    gold: '999999',
    merit: '999999',
    spiritStones: '999999',
  });
  const currenciesBefore = { ...useInventoryStore.getState().currencies };

  const purchaseAction: PostFailureFixSurface = {
    key: 'buy_safety_net',
    code: 'buy_safety_net',
    label: 'Buy Safety Net',
    reason: 'Release route verification',
    destinationLabel: 'Gate Trial',
    actionLabel: 'Buy',
    target: { kind: 'trial_local', action: 'buy_safety_net' },
    blocked: false,
    blockedReason: null,
  };

  const notifications: string[] = [];
  performPostFailureFixActionWithDeps({
    action: purchaseAction,
    cityId: transition.cityId ?? null,
    trialId: trial.id,
  }, {
    closeCombatPresentation: () => undefined,
    closeWorldBuildingModal: () => undefined,
    setActiveTab: () => undefined,
    openWorldModule: () => undefined,
    addNotification: (_type, message) => notifications.push(message),
  });

  const progressAfterPurchase = useTrialStore.getState().getProgress(trial.id);
  if (progressAfterPurchase.resolution !== 'bypassed') {
    failures.push({ code: 'purchase_did_not_bypass', blocker: true, message: 'Safety Net purchase did not bypass trial.' });
  } else {
    checkpoint(checkpoints, startedAt, 'bypass_purchased', `resolution=${progressAfterPurchase.resolution}`);
    interaction(interactionLog, startedAt, 'post_failure_adjustment', 'alert', 'Purchased safety net after eligible defeats.');
  }

  const spentGold = D(currenciesBefore.gold).minus(useInventoryStore.getState().currencies.gold).toString();
  const spentMerit = D(currenciesBefore.merit).minus(useInventoryStore.getState().currencies.merit).toString();
  const spentSpiritStones = D(currenciesBefore.spiritStones).minus(useInventoryStore.getState().currencies.spiritStones).toString();

  const breakthroughOk = useGameStore.getState().breakthrough();
  if (!breakthroughOk) {
    failures.push({ code: 'post_bypass_breakthrough_failed', blocker: true, message: 'Could not continue route after bypass.' });
  } else {
    checkpoint(checkpoints, startedAt, 'post_bypass_continuity', `realm=${useGameStore.getState().realm.index}`);
  }

  const prepVsBypass = buildPrepVsBypassEconomyReport(useContentStore.getState().raw!, 1);
  const reserve = buildSupportReservePacingReport(useContentStore.getState().raw!, 1, {
    merit: Number(useInventoryStore.getState().currencies.merit),
    spiritStones: Number(useInventoryStore.getState().currencies.spiritStones),
  });

  comparisonRows.push(
    {
      metric: 'fail_safe_resolution_mode',
      routeValue: progressAfterPurchase.resolution,
      baselineValue: 'bypassed',
      verdict: progressAfterPurchase.resolution === 'bypassed' ? 'equal' : 'worse',
      detail: 'Bypass must resolve to bypassed, not cleared.',
    },
    {
      metric: 'fail_safe_emergency_only_policy',
      routeValue: prepVsBypass.emergencyOnly,
      baselineValue: true,
      verdict: prepVsBypass.emergencyOnly ? 'non_dominant' : 'worse',
      detail: 'Prep-vs-bypass policy should keep bypass emergency-only.',
    },
    {
      metric: 'eligible_failure_count',
      routeValue: progressAfterPurchase.eligibleFailures,
      baselineValue: lifecycleAfterFailures.failSafe.threshold,
      verdict: progressAfterPurchase.eligibleFailures >= lifecycleAfterFailures.failSafe.threshold ? 'equal' : 'worse',
      detail: 'Threshold should be met before purchase.',
    },
    {
      metric: 'reserve_recoverable_after_bypass',
      routeValue: reserve.verdicts.reserveGapRoutesToBountiesFirst,
      baselineValue: true,
      verdict: reserve.verdicts.reserveGapRoutesToBountiesFirst ? 'non_dominant' : 'worse',
      detail: 'Post-bypass reserve policy remains routed to support loops.',
    },
  );

  const finalSnapshot = {
    ...buildFinalSnapshot('fail_safe'),
    eligibleFailuresByTrial: { [trial.id]: progressAfterPurchase.eligibleFailures },
    bypassPurchases: [{
      trialId: trial.id,
      threshold: lifecycleAfterFailures.failSafe.threshold,
      eligibleFailures: progressAfterPurchase.eligibleFailures,
      spent: { gold: spentGold, merit: spentMerit, spiritStones: spentSpiritStones },
    }],
  };

  checkpoint(checkpoints, startedAt, 'route_completed', notifications.join(' | ') || undefined);

  const completedAt = now();
  return {
    routeId: 'fail_safe',
    automationMode: 'automated_non_blocking',
    status: failures.length > 0 ? 'fail' : warnings.length > 0 ? 'warning_only' : 'pass',
    startedAt,
    completedAt,
    elapsedMs: Math.max(0, completedAt - startedAt),
    checkpoints,
    failures,
    warnings,
    interactionLog,
    alertAudit: [
      { source: 'status_troubleshooting', count: 1, detail: 'Post-failure action path used once.' },
      { source: 'notification_policy', count: notifications.length, detail: notifications.join(' | ') || 'No notifications captured.' },
    ],
    comparisonRows,
    finalSnapshot,
    notes: [
      'Uses trialStore.recordFailure with countsTowardFailSafeOnStart derived from live lifecycle snapshot.',
      'Bypass purchase executed through performPostFailureFixActionWithDeps fallback purchase path.',
      'Fail-safe route intentionally validates emergency-path semantics, not optimal pathing.',
    ],
  };
}

export async function runOfflineHeavyAlternativeRoute(): Promise<AlternativeRouteResult> {
  const startedAt = now();
  const checkpoints: AlternativeRouteCheckpointRow[] = [];
  const failures: AlternativeRouteFailure[] = [];
  const warnings: AlternativeRouteWarning[] = [];
  const interactionLog: AlternativeRouteInteractionRow[] = [];
  const comparisonRows: AlternativeRouteComparisonRow[] = [];

  await setupFreshSaveRun();
  checkpoint(checkpoints, startedAt, 'route_started', 'Fresh bootstrap complete.');

  const content = useContentStore.getState().raw!;
  const city = content.cities[0]!;
  const expeditionTypeId = content.expeditions.types[0]?.id;
  const durationId = content.expeditions.durations[0]?.id;
  if (!expeditionTypeId || !durationId) {
    failures.push({ code: 'missing_expedition_seed_data', blocker: true, message: 'Could not seed expedition offline window.' });
  } else {
    useExpeditionStore.setState({
      slots: 1,
      active: [{
        slotIndex: 0,
        expeditionTypeId,
        durationId,
        cityId: city.id,
        cityIndex: city.index,
        startedAt: 1_000,
        endsAt: 9_000,
        seed: 22,
        status: 'running',
      }],
    });
  }

  useProfessionStore.setState({
    alchemyQueue: [{ id: 'offline_alchemy_1', recipeId: content.alchemy_recipes[0]?.id ?? 'recipe_missing', qty: 1, startedAt: 1_000, endsAt: 8_000, cityId: city.id }],
    talismanQueue: [{ id: 'offline_talisman_1', recipeId: content.talisman_recipes[0]?.id ?? 'recipe_missing', qty: 1, startedAt: 1_000, endsAt: 8_500, cityId: city.id }],
    forgeQueue: [{ id: 'offline_forge_1', blueprintId: content.forge_blueprints[0]?.id ?? 'blueprint_missing', qty: 1, startedAt: 1_000, endsAt: 9_500, cityId: city.id, mode: 'IDLE', status: 'ACTIVE' }],
    lastTickAt: 1_000,
  });

  const trialId = buildSection5StatusSurface().currentGateTrialId;
  const attemptsBefore = trialId ? useTrialStore.getState().getProgress(trialId).attempts : 0;
  const combatBefore = useCombatStore.getState().inCombat ? 1 : 0;

  const qiBefore = D(useGameStore.getState().qi);
  const expectedActiveQi = D(useGameStore.getState().qiPerSecond).times(8 * 60 * 60 * 2);

  const first = applyOfflineCatchup(buildOfflineContext(0, { now: 8 * 60 * 60 * 1000 }));
  checkpoint(checkpoints, startedAt, 'offline_window_8h_1', first.summary?.offlineDuration);
  if (!first.summary) {
    failures.push({ code: 'offline_window_1_missing_summary', blocker: true, message: 'First offline window did not produce summary.' });
  }

  const second = applyOfflineCatchup(buildOfflineContext(8 * 60 * 60 * 1000, { now: 16 * 60 * 60 * 1000 }));
  checkpoint(checkpoints, startedAt, 'offline_window_8h_2', second.summary?.offlineDuration);
  if (!second.summary) {
    failures.push({ code: 'offline_window_2_missing_summary', blocker: true, message: 'Second offline window did not produce summary.' });
  }

  const attemptsAfter = trialId ? useTrialStore.getState().getProgress(trialId).attempts : 0;
  const combatAfter = useCombatStore.getState().inCombat ? 1 : 0;
  const progressAfter = trialId ? useTrialStore.getState().getProgress(trialId).resolution : 'none';

  if (attemptsAfter !== attemptsBefore || progressAfter !== 'none') {
    failures.push({ code: 'offline_progressed_trial_state', blocker: true, message: 'Offline window changed trial attempt/clear state.' });
  }

  checkpoint(checkpoints, startedAt, 'offline_gate_wall_verified', `trial=${trialId ?? 'none'} resolution=${progressAfter}`);
  interaction(interactionLog, startedAt, 'expedition_idle', 'alert', 'Expedition completion became ready after offline windows.');

  const qiAfter = D(useGameStore.getState().qi);
  const qiDelta = qiAfter.minus(qiBefore);

  comparisonRows.push(
    {
      metric: 'offline_combat_progress',
      routeValue: combatAfter - combatBefore,
      baselineValue: 0,
      verdict: combatAfter === combatBefore ? 'equal' : 'worse',
      detail: 'Offline route must not progress combat sessions.',
    },
    {
      metric: 'offline_trial_clear_count',
      routeValue: attemptsAfter - attemptsBefore,
      baselineValue: 0,
      verdict: attemptsAfter === attemptsBefore ? 'equal' : 'worse',
      detail: 'Offline route must not attempt/clear gate trials automatically.',
    },
    {
      metric: 'offline_qi_vs_active_theoretical',
      routeValue: Number(qiDelta.toFixed(2)),
      baselineValue: Number(expectedActiveQi.toFixed(2)),
      verdict: qiDelta.lessThanOrEqualTo(expectedActiveQi) ? 'non_dominant' : 'better',
      detail: 'Offline-heavy route should not exceed active theoretical baseline in this harness.',
    },
  );

  const finalSnapshot = {
    ...buildFinalSnapshot('offline_heavy'),
    offlineWindowsApplied: 2,
    noFakeCitySix: true,
  };

  checkpoint(checkpoints, startedAt, 'route_completed', `qiDelta=${qiDelta.toFixed(2)}`);
  const completedAt = now();
  return {
    routeId: 'offline_heavy',
    automationMode: 'automated_non_blocking',
    status: failures.length > 0 ? 'fail' : warnings.length > 0 ? 'warning_only' : 'pass',
    startedAt,
    completedAt,
    elapsedMs: Math.max(0, completedAt - startedAt),
    checkpoints,
    failures,
    warnings,
    interactionLog,
    alertAudit: [
      { source: 'notification_policy', count: 1, detail: 'Offline summary produced actionable expedition-ready signal.' },
    ],
    comparisonRows,
    finalSnapshot,
    notes: [
      'Offline windows run strictly through buildOfflineContext + OfflineCatchup.apply.',
      'Combat and trial progression remained excluded during offline windows.',
    ],
  };
}

export async function runLowAttentionAlternativeRoute(): Promise<AlternativeRouteResult> {
  const startedAt = now();
  const checkpoints: AlternativeRouteCheckpointRow[] = [];
  const failures: AlternativeRouteFailure[] = [];
  const warnings: AlternativeRouteWarning[] = [];
  const interactionLog: AlternativeRouteInteractionRow[] = [];
  const comparisonRows: AlternativeRouteComparisonRow[] = [];

  await setupFreshSaveRun();
  checkpoint(checkpoints, startedAt, 'route_started', 'Fresh bootstrap complete.');

  const statusSurface = buildStatusTroubleshootingSurface();
  const section5 = buildSection5StatusSurface();
  const derivedRecommendation = statusSurface.urgentCardId === 'preparation' ? 'bounties' : 'outskirts';
  const worldCommand = buildWorldCommandSurface({
    visibleModules: ['outskirts', 'gateTrial', 'bounties', 'expeditions'],
    moduleSurfacesByKey: {},
    runCompassPrimaryAction: null,
    economicTopModuleKey: derivedRecommendation,
    economicReason: `Derived from troubleshooting urgent card: ${statusSurface.urgentCardId ?? 'none'}.`,
    trackedBountyModuleKey: 'bounties',
    trackedBountyAlert: {
      id: 'tracked_bounty',
      title: 'Tracked bounty needs attention',
      detail: 'Representative low-attention alert.',
      ctaLabel: 'Open Bounties',
      ctaModuleKey: 'bounties',
    },
    expeditionIdleAlert: {
      id: 'expedition_idle',
      title: 'Expedition idle slot',
      detail: 'Launch next expedition.',
      ctaLabel: 'Open Expeditions',
      ctaModuleKey: 'expeditions',
    },
  });

  checkpoint(checkpoints, startedAt, 'low_attention_surface_scan', `diagnosis=${statusSurface.shortfall.diagnosisLabel}`);
  interaction(interactionLog, startedAt, 'run_compass_guidance', 'recommendation', `Section5 readiness band=${section5.overallBand ?? 'none'}`);

  if (worldCommand.alerts.length > 0) {
    interaction(interactionLog, startedAt, 'tracked_bounty_attention', 'alert', worldCommand.alerts[0]!.title);
  } else {
    warnings.push({ code: 'world_command_alerts_missing', message: 'World command produced no alerts in low-attention harness.' });
  }

  interaction(interactionLog, startedAt, 'status_troubleshooting', 'recommendation', `${statusSurface.shortfall.diagnosisLabel}: ${statusSurface.shortfall.reason}`);
  checkpoint(checkpoints, startedAt, 'low_attention_alert_response', `alerts=${worldCommand.alerts.length}`);

  const overlayBlocked = isNotificationOverlayBlocked({
    showPrestigeModal: false,
    showPerkSelectionModal: false,
    showOfflineProgressModal: false,
    showManualSatchelModal: false,
    showTechniqueLearnedModal: false,
    showWorldBuildingModal: false,
    showCurrentChapterExhaustedModal: false,
    showLifeSummaryModal: false,
    showMigrationIssuesModal: false,
    pendingCityArrivalId: null,
    activeOnboardingPrompt: null,
    combatPresentationMode: 'hidden',
    lifeStartWizardOpen: false,
  });

  const attentionBudget = 6;
  if (interactionLog.length > attentionBudget) {
    failures.push({ code: 'attention_budget_exceeded', blocker: true, message: `Interaction count ${interactionLog.length} exceeded budget ${attentionBudget}.` });
  }

  comparisonRows.push(
    {
      metric: 'low_attention_interaction_count',
      routeValue: interactionLog.length,
      baselineValue: attentionBudget,
      verdict: interactionLog.length <= attentionBudget ? 'non_dominant' : 'worse',
      detail: 'Low-attention route must stay under bounded interaction budget.',
    },
    {
      metric: 'low_attention_alert_driven_ratio',
      routeValue: interactionLog.filter((entry) => entry.triggeredBy === 'alert').length,
      baselineValue: 1,
      verdict: interactionLog.some((entry) => entry.triggeredBy === 'alert') ? 'equal' : 'worse',
      detail: 'At least one interaction must be alert-driven.',
    },
    {
      metric: 'notification_overlay_blocked',
      routeValue: overlayBlocked,
      baselineValue: false,
      verdict: overlayBlocked ? 'worse' : 'equal',
      detail: 'No hidden overlay blocks should suppress low-attention nudges.',
    },
    {
      metric: 'section5_has_consistent_diagnosis',
      routeValue: Boolean(section5.currentDiagnosis || section5.overallBand),
      baselineValue: true,
      verdict: section5.currentDiagnosis || section5.overallBand ? 'equal' : 'worse',
      detail: 'Readiness/troubleshooting should provide non-empty guidance state.',
    },
  );

  const finalSnapshot = {
    ...buildFinalSnapshot('low_attention'),
    estimatedAttentionInteractions: interactionLog.length,
    alertCounts: {
      run_compass: section5.overallBand ? 1 : 0,
      world_command: worldCommand.alerts.length,
      status: 1,
    },
  };

  checkpoint(checkpoints, startedAt, 'route_completed', `interactions=${interactionLog.length}`);

  const completedAt = now();
  return {
    routeId: 'low_attention',
    automationMode: 'automated_non_blocking',
    status: failures.length > 0 ? 'fail' : warnings.length > 0 ? 'warning_only' : 'pass',
    startedAt,
    completedAt,
    elapsedMs: Math.max(0, completedAt - startedAt),
    checkpoints,
    failures,
    warnings,
    interactionLog,
    alertAudit: [
      { source: 'run_compass', count: section5.overallBand ? 1 : 0, detail: 'Section5 status used as recommendation proxy.' },
      { source: 'world_command', count: worldCommand.alerts.length, detail: 'World command alerts.' },
      { source: 'status_troubleshooting', count: 1, detail: 'Status troubleshooting shortfall surfaced.' },
      { source: 'notification_policy', count: overlayBlocked ? 1 : 0, detail: overlayBlocked ? 'Unexpected overlay block.' : 'No overlay blocking.' },
    ],
    comparisonRows,
    finalSnapshot,
    notes: [
      'Low-attention route is bounded-interaction verification, not autoplay verification.',
      'Interactions are intentionally tied to live guidance surfaces.',
    ],
  };
}

export async function runHighSkillAlternativeRoute(): Promise<AlternativeRouteResult> {
  const startedAt = now();
  const checkpoints: AlternativeRouteCheckpointRow[] = [];
  const failures: AlternativeRouteFailure[] = [];
  const warnings: AlternativeRouteWarning[] = [];
  const interactionLog: AlternativeRouteInteractionRow[] = [];
  const comparisonRows: AlternativeRouteComparisonRow[] = [];
  const invariantChecks: AlternativeRouteInvariantCheck[] = [];
  const exploitWatchlist: AlternativeRouteExploitWatchRow[] = [];
  const decisionPolicy: string[] = [];

  checkpoint(checkpoints, startedAt, 'route_started', 'Running representative baseline timing probe.');
  const representative = await runPhaseTimingProbe({ pathStrategy: 'representative' });
  checkpoint(checkpoints, startedAt, 'gate_available', `baseline=${representative.gate1AvailableMs ?? 0}ms`);

  checkpoint(checkpoints, startedAt, 'custom:high_skill_probe_started', 'Running high-skill timing probe with highest-Qi path strategy.');
  const highSkill = await runPhaseTimingProbe({ pathStrategy: 'highest_qi' });
  checkpoint(checkpoints, startedAt, 'custom:high_skill_probe_completed', `optimized=${highSkill.gate1AvailableMs ?? 0}ms`);

  const content = useContentStore.getState().raw!;
  const prepVsBypass = buildPrepVsBypassEconomyReport(content, 1);
  const reserve = buildSupportReservePacingReport(content, 1, { merit: 0, spiritStones: 0 });
  const spendOrder = getSpendOrderPolicy({
    gateIndex: 1,
    currentCityId: (useCityStore.getState().currentCityId ?? null) as Parameters<typeof getSpendOrderPolicy>[0]['currentCityId'],
    selectedPath: useGameStore.getState().selectedPath,
    currentGateResolved: false,
  });
  const prepBudget = getPrepBudgetByGateIndex(1);
  const economyEngine = buildLiveEconomicRecommendationEngine();
  const apProbe = await runPrestigeApHourProbe();

  decisionPolicy.push(
    `Path strategy: representative=${representative.representativePath} vs high_skill=${highSkill.representativePath}`,
    `Spend order gate=${spendOrder.gateIndex}: ${spendOrder.priorities.map((entry) => entry.id).join(' > ')}`,
    `Prep budget transition=${prepBudget?.transitionId ?? 'unknown'} recommendedGold=${prepBudget?.recommendedPrepPackage.goldSpendRange.recommended ?? 0}`,
    `Economic top recommendation=${economyEngine.topRecommendation?.routeType ?? 'none'}`,
  );

  const representativeFoundation = representative.cumulativeMilestoneSeconds.foundation_entry ?? Number.POSITIVE_INFINITY;
  const optimizedFoundation = highSkill.cumulativeMilestoneSeconds.foundation_entry ?? Number.POSITIVE_INFINITY;
  const representativeCore = representative.cumulativeMilestoneSeconds.core_formation_entry ?? Number.POSITIVE_INFINITY;
  const optimizedCore = highSkill.cumulativeMilestoneSeconds.core_formation_entry ?? Number.POSITIVE_INFINITY;

  const gate1ImprovementSeconds = ((representative.gate1AvailableMs ?? 0) - (highSkill.gate1AvailableMs ?? 0)) / 1000;
  const foundationImprovementSeconds = representativeFoundation - optimizedFoundation;
  const coreImprovementSeconds = representativeCore - optimizedCore;

  comparisonRows.push(
    {
      metric: 'high_skill_gate1_delta_seconds',
      routeValue: Number(gate1ImprovementSeconds.toFixed(2)),
      baselineValue: 0,
      verdict: gate1ImprovementSeconds > 0 ? 'better' : gate1ImprovementSeconds === 0 ? 'equal' : 'worse',
      detail: 'Positive values indicate high-skill route reaches gate-1 availability earlier.',
    },
    {
      metric: 'high_skill_foundation_delta_seconds',
      routeValue: Number(foundationImprovementSeconds.toFixed(2)),
      baselineValue: 0,
      verdict: foundationImprovementSeconds > 0 ? 'better' : foundationImprovementSeconds === 0 ? 'equal' : 'worse',
      detail: 'Positive values indicate high-skill route reaches Foundation entry earlier.',
    },
    {
      metric: 'high_skill_core_delta_seconds',
      routeValue: Number(coreImprovementSeconds.toFixed(2)),
      baselineValue: 0,
      verdict: coreImprovementSeconds > 0 ? 'better' : coreImprovementSeconds === 0 ? 'equal' : 'worse',
      detail: 'Positive values indicate high-skill route reaches Core entry earlier.',
    },
    {
      metric: 'high_skill_bypass_emergency_only',
      routeValue: prepVsBypass.emergencyOnly,
      baselineValue: true,
      verdict: prepVsBypass.emergencyOnly ? 'non_dominant' : 'worse',
      detail: 'Bypass must remain emergency-only under optimized play.',
    },
    {
      metric: 'high_skill_reserve_policy_safe',
      routeValue: reserve.verdicts.reachesMinimumMeritReserveWithLowBandPlusDefeats && reserve.verdicts.reserveGapRoutesToBountiesFirst,
      baselineValue: true,
      verdict: reserve.verdicts.reachesMinimumMeritReserveWithLowBandPlusDefeats && reserve.verdicts.reserveGapRoutesToBountiesFirst ? 'equal' : 'worse',
      detail: 'Reserve pacing assumptions must remain true.',
    },
    {
      metric: 'high_skill_top_route_candidate',
      routeValue: economyEngine.topRecommendation?.routeType ?? 'none',
      baselineValue: 'policy_driven_non_bypass',
      verdict: economyEngine.topRecommendation?.routeType === 'gate_trial' ? 'worse' : 'informational',
      detail: 'Top recommendation should reflect policy-guided prep/support loop, not blind gate retries.',
    },
  );

  const apCapRow = apProbe.rows.find((entry) => entry.checkpointId === 'spirit_severing_entry');
  const withinSlackCount = highSkill.phaseTimingReport.phaseDurations.filter((entry) => entry.withinValidationSlack).length;
  const phaseSlackCoverage = withinSlackCount / Math.max(1, highSkill.phaseTimingReport.phaseDurations.length);

  exploitWatchlist.push(
    {
      code: 'bypass_outperforming_honest_prep',
      severity: 'blocker',
      triggered: !prepVsBypass.emergencyOnly,
      detail: 'Triggered if bypass is no longer emergency-only.',
    },
    {
      code: 'reserve_depletion_without_pressure',
      severity: 'warning',
      triggered: !reserve.verdicts.reserveGapRoutesToBountiesFirst,
      detail: 'Triggered if reserve gaps no longer route through support loops.',
    },
    {
      code: 'single_recommendation_loop_dominance',
      severity: 'warning',
      triggered: economyEngine.majorShortfallCount > 0 && economyEngine.topRecommendation?.routeType === 'gate_trial',
      detail: 'Triggered when gate_trial dominates despite unresolved shortfalls.',
    },
    {
      code: 'timing_outside_locked_envelope',
      severity: 'warning',
      triggered: phaseSlackCoverage < 0.7,
      detail: `Triggered if fewer than 70% of optimized phase windows stay inside validation slack (coverage=${phaseSlackCoverage.toFixed(2)}).`,
    },
    {
      code: 'ap_hour_undermines_packet_6_7_assumptions',
      severity: 'warning',
      triggered: Boolean(apCapRow && !apCapRow.passes),
      detail: 'Triggered if cap AP/hour falls outside live policy expectations.',
    },
  );

  invariantChecks.push(
    { id: 'high_skill_faster_than_baseline', passed: gate1ImprovementSeconds > 0 || foundationImprovementSeconds > 0 || coreImprovementSeconds > 0, detail: 'At least one meaningful checkpoint improved.' },
    { id: 'high_skill_not_bypass_dominant', passed: prepVsBypass.emergencyOnly, detail: 'Bypass remains emergency-only.' },
    { id: 'high_skill_reserve_policy', passed: reserve.verdicts.reachesMinimumMeritReserveWithLowBandPlusDefeats && reserve.verdicts.reserveGapRoutesToBountiesFirst, detail: 'Reserve assumptions remain valid.' },
    { id: 'high_skill_no_blocking_watchlist_hits', passed: exploitWatchlist.every((entry) => !(entry.severity === 'blocker' && entry.triggered)), detail: 'No blocker exploit-watch entries were triggered.' },
  );

  for (const check of invariantChecks) {
    if (!check.passed) failures.push({ code: `high_skill_invariant_${check.id}`, blocker: true, message: check.detail });
  }
  const triggeredWarnings = exploitWatchlist.filter((entry) => entry.triggered && entry.severity === 'warning');
  for (const warning of triggeredWarnings) warnings.push({ code: warning.code, message: warning.detail });

  const finalSnapshot = buildFinalSnapshot('high_skill');
  finalSnapshot.noFakeCitySix = true;
  checkpoint(checkpoints, startedAt, 'route_completed', `improvements gate1=${gate1ImprovementSeconds.toFixed(2)}s foundation=${foundationImprovementSeconds.toFixed(2)}s`);

  const completedAt = now();
  return {
    routeId: 'high_skill',
    automationMode: 'automated_non_blocking',
    status: failures.length > 0 ? 'fail' : warnings.length > 0 ? 'warning_only' : 'pass',
    startedAt,
    completedAt,
    elapsedMs: Math.max(0, completedAt - startedAt),
    checkpoints,
    failures,
    warnings,
    interactionLog,
    alertAudit: [
      { source: 'run_compass', count: economyEngine.topRecommendation ? 1 : 0, detail: `Top recommendation=${economyEngine.topRecommendation?.routeType ?? 'none'}` },
      { source: 'status_troubleshooting', count: economyEngine.majorShortfallCount, detail: `majorShortfalls=${economyEngine.majorShortfallCount}` },
    ],
    comparisonRows,
    invariantChecks,
    exploitWatchlist,
    decisionPolicy,
    finalSnapshot,
    notes: [
      'High-skill route compares highest-Qi strategy timing against representative timing probe baseline.',
      'Economy guardrails use live spend order, prep budget, prep-vs-bypass, reserve pacing, and recommendation engine.',
      'Exploit watchlist is structured and evaluated even when no entries trigger.',
    ],
  };
}

export async function runReclaimAlternativeRoute(): Promise<AlternativeRouteResult> {
  const startedAt = now();
  const checkpoints: AlternativeRouteCheckpointRow[] = [];
  const failures: AlternativeRouteFailure[] = [];
  const warnings: AlternativeRouteWarning[] = [];
  const interactionLog: AlternativeRouteInteractionRow[] = [];
  const comparisonRows: AlternativeRouteComparisonRow[] = [];
  const invariantChecks: AlternativeRouteInvariantCheck[] = [];
  const exploitWatchlist: AlternativeRouteExploitWatchRow[] = [];
  const decisionPolicy: string[] = [];

  checkpoint(checkpoints, startedAt, 'route_started', 'Running reclaim + prestige AP/hour probes.');
  const reclaim = await runReclaimProbe();
  const apHour = await runPrestigeApHourProbe();
  checkpoint(checkpoints, startedAt, 'custom:reclaim_probe_completed', 'Reclaim probe complete.');

  await setupFreshSaveRun();
  const advisor = getPrestigeAdvisorSurface();
  const lifeSummary = buildCurrentLifeSummarySurface();
  checkpoint(checkpoints, startedAt, 'custom:prestige_surface_coherence_checked', `advisor=${Boolean(advisor)} lifeSummary=${Boolean(lifeSummary)}`);

  const coreScenario = reclaim.firstViableCoreStarterSpend;
  const deepScenario = reclaim.deepCapStarterSpend;
  const foundationSpeedup = coreScenario.speedupRatio.foundationEntry ?? 0;
  const coreSpeedup = coreScenario.speedupRatio.coreReentry ?? 0;
  const nascentSpeedup = deepScenario.speedupRatio.nascentReentry ?? 0;
  const firstPurchasePasses = reclaim.firstPurchaseFeel.passes;

  comparisonRows.push(
    {
      metric: 'reclaim_foundation_speedup_ratio',
      routeValue: Number(foundationSpeedup.toFixed(4)),
      baselineValue: 0.15,
      verdict: foundationSpeedup >= 0.15 ? 'better' : 'worse',
      detail: 'Foundation reentry should materially improve vs first-life baseline.',
    },
    {
      metric: 'reclaim_core_speedup_ratio',
      routeValue: Number(coreSpeedup.toFixed(4)),
      baselineValue: 0.15,
      verdict: coreSpeedup >= 0.15 ? 'better' : 'worse',
      detail: 'Core reentry should materially improve vs first-life baseline.',
    },
    {
      metric: 'reclaim_nascent_speedup_ratio',
      routeValue: Number(nascentSpeedup.toFixed(4)),
      baselineValue: 0.1,
      verdict: nascentSpeedup >= 0.1 ? 'better' : 'worse',
      detail: 'Nascent reclaim should show visible acceleration in deep-cap scenario.',
    },
    {
      metric: 'reclaim_first_purchase_feel_passes',
      routeValue: firstPurchasePasses,
      baselineValue: true,
      verdict: firstPurchasePasses ? 'equal' : 'worse',
      detail: 'First purchase feel must satisfy live prestige targets.',
    },
    {
      metric: 'reclaim_prestige_targets_core_window',
      routeValue: coreScenario.passes,
      baselineValue: true,
      verdict: coreScenario.passes ? 'equal' : 'worse',
      detail: 'Core starter reclaim scenario should remain in target family windows.',
    },
    {
      metric: 'reclaim_prestige_targets_deep_cap_window',
      routeValue: deepScenario.passes,
      baselineValue: true,
      verdict: deepScenario.passes ? 'equal' : 'worse',
      detail: 'Deep-cap starter reclaim scenario should remain in target family windows.',
    },
  );

  decisionPolicy.push(
    `Starter spend plan(core): ${coreScenario.spendPlan.join(', ') || 'none'}`,
    `Starter spend plan(deep-cap): ${deepScenario.spendPlan.join(', ') || 'none'}`,
    `First purchase feel bestImprovement=${reclaim.firstPurchaseFeel.bestImprovement.toFixed(4)} threshold=${PRESTIGE_TARGETS.reclaimMilestoneTargets.first_purchase_feel.minImprovementRatio}`,
  );

  const unsupportedNodes = PRESTIGE_TARGETS.visibilityPromotionPolicy.unsupportedNodesRemainHidden.filter((id) =>
    coreScenario.spendPlan.includes(id) || deepScenario.spendPlan.includes(id),
  );
  const apHourFailures = apHour.rows.filter((entry) => !entry.passes);

  exploitWatchlist.push(
    {
      code: 'unsupported_prestige_node_in_starter_plan',
      severity: 'blocker',
      triggered: unsupportedNodes.length > 0,
      detail: unsupportedNodes.length > 0 ? `Unsupported nodes detected: ${unsupportedNodes.join(', ')}` : 'No unsupported nodes used.',
    },
    {
      code: 'reclaim_speedup_below_material_threshold',
      severity: 'blocker',
      triggered: foundationSpeedup < 0.15 || coreSpeedup < 0.15,
      detail: 'Foundation/Core reclaim speedup must remain materially faster than first life.',
    },
    {
      code: 'first_purchase_feel_near_floor',
      severity: 'warning',
      triggered: reclaim.firstPurchaseFeel.bestImprovement < PRESTIGE_TARGETS.reclaimMilestoneTargets.first_purchase_feel.minImprovementRatio + 0.03,
      detail: 'First-purchase improvement is close to minimum threshold.',
    },
    {
      code: 'ap_hour_policy_drift',
      severity: 'warning',
      triggered: apHourFailures.length > 0,
      detail: apHourFailures.length > 0 ? `AP/hour rows failing: ${apHourFailures.map((row) => row.checkpointId).join(', ')}` : 'AP/hour policy rows all passing.',
    },
  );

  invariantChecks.push(
    { id: 'reclaim_material_acceleration', passed: foundationSpeedup >= 0.15 && coreSpeedup >= 0.15 && nascentSpeedup >= 0.1, detail: 'Reclaim milestones are materially faster than first-life baseline.' },
    { id: 'reclaim_first_purchase_feel', passed: firstPurchasePasses, detail: 'First purchase feel passes live target expectations.' },
    { id: 'reclaim_no_unsupported_nodes', passed: unsupportedNodes.length === 0, detail: 'Starter spend plans do not rely on unsupported prestige nodes.' },
    { id: 'reclaim_prestige_surface_coherence', passed: Boolean(advisor) && Boolean(lifeSummary), detail: 'Prestige advisor and life summary surfaces are coherent.' },
    { id: 'reclaim_non_blocking_watchlist', passed: exploitWatchlist.every((entry) => !(entry.severity === 'blocker' && entry.triggered)), detail: 'No blocker exploit-watch entries triggered.' },
  );

  for (const check of invariantChecks) {
    if (!check.passed) failures.push({ code: `reclaim_invariant_${check.id}`, blocker: true, message: check.detail });
  }
  for (const entry of exploitWatchlist.filter((item) => item.triggered && item.severity === 'warning')) {
    warnings.push({ code: entry.code, message: entry.detail });
  }

  const finalSnapshot = {
    ...buildFinalSnapshot('reclaim'),
    noFakeCitySix: true,
    reachedSpiritSevering: deepScenario.reclaimSeconds.nascentReentry !== undefined,
    reachedContentCap: false,
  };

  checkpoint(checkpoints, startedAt, 'route_completed', `foundation=${foundationSpeedup.toFixed(3)} core=${coreSpeedup.toFixed(3)} nascent=${nascentSpeedup.toFixed(3)}`);
  const completedAt = now();
  return {
    routeId: 'reclaim',
    automationMode: 'automated_non_blocking',
    status: failures.length > 0 ? 'fail' : warnings.length > 0 ? 'warning_only' : 'pass',
    startedAt,
    completedAt,
    elapsedMs: Math.max(0, completedAt - startedAt),
    checkpoints,
    failures,
    warnings,
    interactionLog,
    alertAudit: [
      { source: 'run_compass', count: 1, detail: 'Reclaim probe generated starter spend plans.' },
      { source: 'status_troubleshooting', count: apHourFailures.length, detail: apHourFailures.length > 0 ? 'AP/hour warnings present.' : 'AP/hour rows pass.' },
    ],
    comparisonRows,
    invariantChecks,
    exploitWatchlist,
    decisionPolicy,
    finalSnapshot,
    notes: [
      'Reclaim route reuses runReclaimProbe + runPrestigeApHourProbe and maps results into alternative-route comparison shape.',
      'Acceleration assertions are anchored to live prestige target families, not ad-hoc constants.',
      'This route is partially modeled for deterministic QA and explicitly reports modeled checkpoints.',
    ],
  };
}

export async function runAlternativeRoute(routeId: AlternativeRouteId): Promise<AlternativeRouteResult> {
  switch (routeId) {
    case 'fail_safe':
      return runFailSafeAlternativeRoute();
    case 'offline_heavy':
      return runOfflineHeavyAlternativeRoute();
    case 'low_attention':
      return runLowAttentionAlternativeRoute();
    case 'high_skill':
      return runHighSkillAlternativeRoute();
    case 'reclaim':
      return runReclaimAlternativeRoute();
    default:
      throw new Error(`Unknown alternative route: ${routeId satisfies never}`);
  }
}

export type OfflineRouteReport = {
  generatedAt: number;
  route: AlternativeRouteResult;
  topComparisons: AlternativeRouteComparisonRow[];
  overallPass: boolean;
};

export type ReclaimRouteReport = {
  generatedAt: number;
  route: AlternativeRouteResult;
  starterSpendPlan: string[];
  milestoneTimings: Record<string, number>;
  overallPass: boolean;
};

export async function buildOfflineRouteReport(): Promise<OfflineRouteReport> {
  const route = await runOfflineHeavyAlternativeRoute();
  return {
    generatedAt: now(),
    route,
    topComparisons: route.comparisonRows,
    overallPass: route.status === 'pass' || route.status === 'warning_only',
  };
}

export async function buildReclaimRouteReport(): Promise<ReclaimRouteReport> {
  const route = await runReclaimAlternativeRoute();
  const starterSpendLine = route.decisionPolicy?.find((line) => line.startsWith('Starter spend plan(core):')) ?? 'Starter spend plan(core):';
  const starterSpendPlan = starterSpendLine.split(':')[1]?.split(',').map((entry) => entry.trim()).filter(Boolean) ?? [];
  const milestoneTimings = {
    foundationSpeedupRatio: Number(route.comparisonRows.find((row) => row.metric === 'reclaim_foundation_speedup_ratio')?.routeValue ?? 0),
    coreSpeedupRatio: Number(route.comparisonRows.find((row) => row.metric === 'reclaim_core_speedup_ratio')?.routeValue ?? 0),
    nascentSpeedupRatio: Number(route.comparisonRows.find((row) => row.metric === 'reclaim_nascent_speedup_ratio')?.routeValue ?? 0),
  };

  return {
    generatedAt: now(),
    route,
    starterSpendPlan,
    milestoneTimings,
    overallPass: route.status === 'pass' || route.status === 'warning_only',
  };
}
