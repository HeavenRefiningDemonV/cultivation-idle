import { validateLoadedContent } from '../../../src/content/index.js';
import { getActivityThroughputTargets } from '../../../src/systems/balance/activityThroughputTargets.js';
import { getGateCombatTarget } from '../../../src/systems/balance/gateCombatTargets.js';
import {
  getFirstLifeCapBandSeconds,
  getFoundationEntryWindowSeconds,
  getGate1AvailabilityWindowSeconds,
} from '../../../src/systems/balance/phaseTimingTargets.js';
import { PRESTIGE_TARGETS } from '../../../src/systems/balance/prestigeTargets.js';
import { getOfflineProgressionContract } from '../../../src/systems/progression/contract/index.js';
import { buildAllActivityThroughputSnapshots } from '../../../src/systems/economy/activityThroughputReadModel.js';
import { buildAllPrepVsBypassEconomyReports } from '../../../src/systems/economy/prepVsBypassReadModel.js';
import { buildAllSupportReservePacingReports } from '../../../src/systems/economy/supportReservePacingReadModel.js';
import { buildAllSupportThroughputCityReports } from '../../../src/systems/economy/supportThroughputReadModel.js';
import { buildBalanceTelemetryReport } from '../../../src/services/diagnostics/balanceTelemetryExport.js';
import { ECONOMY_SINK_KINDS, ECONOMY_SOURCE_KINDS } from '../../../src/services/diagnostics/balanceTelemetrySchema.js';
import { BALANCE_TELEMETRY_VALIDATION_REQUIRED_KINDS } from '../../../src/services/diagnostics/balanceTelemetryValidation.js';
import { loadRawProgressionContent } from '../../fixtures/progression/loadFixtureContext.js';
import { loadProgressionContract } from '../progression/index.js';
import { runBalanceTelemetryProbe } from '../telemetry/runBalanceTelemetryProbe.js';
import { createGateCombatProbeScenario } from './createGateCombatProbeScenario.js';
import { runActivityThroughputProbe } from './runActivityThroughputProbe.js';
import { runGateCombatProbe } from './runGateCombatProbe.js';
import { runPhaseTimingProbe } from './runPhaseTimingProbe.js';
import { runPrepRecoveryProbe } from './runPrepRecoveryProbe.js';
import { runPrestigeApHourProbe } from './runPrestigeApHourProbe.js';
import { runReclaimProbe } from './runReclaimProbe.js';

export interface BalanceRegressionCheck {
  metricId: string;
  run: () => void | Promise<void>;
}

export type BalanceRegressionSectionId = 'timing' | 'activities' | 'prep' | 'combat' | 'offline' | 'prestige' | 'telemetry';

export interface BalanceRegressionMetricResult {
  metricId: string;
  label: string;
  sectionId: BalanceRegressionSectionId;
  packetOwner?: string;
  comparator: 'between' | 'gte' | 'lte' | 'eq' | 'truthy';
  actual: number | boolean | string;
  target: number | boolean | string | { min: number; max: number } | { minSeconds: number; maxSeconds: number };
  passed: boolean;
  notes?: string;
  context?: {
    gateIndex?: number;
    cityId?: string;
    readinessBand?: string;
    scenarioId?: string;
    checkpointId?: string;
  };
}

export interface BalanceRegressionSuiteResult {
  suiteVersion: '6.9c';
  overallPass: boolean;
  hardFailureCount: number;
  warningCount: number;
  generatedAt: number;
  metrics: BalanceRegressionMetricResult[];
}

const between = (value: number, min: number, max: number) => value >= min && value <= max;

export async function runBalanceRegressionSuite(checks: readonly BalanceRegressionCheck[]): Promise<void> {
  for (const check of checks) {
    await check.run();
  }
}

function summarizeMetrics(metrics: BalanceRegressionMetricResult[]): BalanceRegressionSuiteResult {
  return {
    suiteVersion: '6.9c',
    overallPass: metrics.every((metric) => metric.passed),
    hardFailureCount: metrics.filter((metric) => !metric.passed).length,
    warningCount: 0,
    generatedAt: Date.now(),
    metrics,
  };
}

export async function runCanonicalBalanceRegressionSuite(): Promise<BalanceRegressionSuiteResult> {
  const metrics: BalanceRegressionMetricResult[] = [];

  const phaseProbe = await runPhaseTimingProbe();
  const gate1Seconds = (phaseProbe.gate1AvailableMs ?? 0) / 1000;
  const gate1Window = getGate1AvailabilityWindowSeconds();
  metrics.push({
    metricId: 'timing.gate_1_available',
    label: 'Gate 1 availability window',
    sectionId: 'timing',
    packetOwner: 'phaseTimingTargets',
    comparator: 'between',
    actual: gate1Seconds,
    target: gate1Window,
    passed: between(gate1Seconds, gate1Window.minSeconds, gate1Window.maxSeconds),
  });

  const foundationSeconds = (phaseProbe.foundationEntryMs ?? 0) / 1000;
  const foundationWindow = getFoundationEntryWindowSeconds();
  metrics.push({
    metricId: 'timing.foundation_entry',
    label: 'Foundation entry window',
    sectionId: 'timing',
    packetOwner: 'phaseTimingTargets',
    comparator: 'between',
    actual: foundationSeconds,
    target: foundationWindow,
    passed: between(foundationSeconds, foundationWindow.minSeconds, foundationWindow.maxSeconds),
  });

  for (const phase of phaseProbe.phaseTimingReport.phaseDurations) {
    metrics.push({
      metricId: `timing.phase.${phase.phaseId}`,
      label: `Phase duration ${phase.phaseId}`,
      sectionId: 'timing',
      packetOwner: 'phaseTimingTargets',
      comparator: 'truthy',
      actual: phase.withinValidationSlack,
      target: true,
      passed: phase.withinValidationSlack,
      notes: `actual=${phase.actualSeconds ?? 'n/a'} target=${phase.targetSeconds}`,
    });
  }

  const capBand = getFirstLifeCapBandSeconds();
  const capSeconds = phaseProbe.phaseTimingReport.capSecondsFromLifeStart ?? 0;
  metrics.push({
    metricId: 'timing.cap_time',
    label: 'Cap time band',
    sectionId: 'timing',
    comparator: 'between',
    actual: capSeconds,
    target: capBand,
    passed: between(capSeconds, capBand.minSeconds, capBand.maxSeconds),
  });

  const activityProbe = await runActivityThroughputProbe();
  for (const city of activityProbe.snapshots) {
    metrics.push({
      metricId: `activities.${city.cityId}.gold_common_dominance`,
      label: `${city.cityId} gold/common dominance`,
      sectionId: 'activities',
      comparator: 'truthy',
      actual: city.roleChecks.outskirtsGoldDominance && city.roleChecks.outskirtsCommonDominance,
      target: true,
      passed: city.roleChecks.outskirtsGoldDominance && city.roleChecks.outskirtsCommonDominance,
      context: { cityId: city.cityId },
    });
    metrics.push({
      metricId: `activities.${city.cityId}.targeted_anchor_dominance`,
      label: `${city.cityId} targeted/anchor dominance`,
      sectionId: 'activities',
      comparator: 'truthy',
      actual: city.roleChecks.ruinsTargetedDominance && city.roleChecks.ruinsAnchorGuaranteed,
      target: true,
      passed: city.roleChecks.ruinsTargetedDominance && city.roleChecks.ruinsAnchorGuaranteed,
      context: { cityId: city.cityId },
    });
  }

  const validated = validateLoadedContent((await loadRawProgressionContent()) as never);
  const supportReports = buildAllSupportThroughputCityReports(validated);
  const throughputTargets = getActivityThroughputTargets();
  const tolerance = throughputTargets.expeditionEquivalenceTargets.validationTolerance.absoluteRatioTolerance;
  for (const report of supportReports) {
    metrics.push({
      metricId: `activities.${report.cityId}.bounty_reserve_pacing`,
      label: `${report.cityId} bounty reserve pacing`,
      sectionId: 'activities',
      comparator: 'gte',
      actual: report.bounty.reserveContribution.meritCoverageAtMinClaims,
      target: 0.6,
      passed: report.bounty.reserveContribution.meritCoverageAtMinClaims >= 0.6,
      context: { cityId: report.cityId },
    });

    for (const expedition of report.expeditions) {
      for (const duration of expedition.durations) {
        const target = duration.durationId === 'short' ? 0.35 : duration.durationId === 'medium' ? 0.75 : 1.25;
        metrics.push({
          metricId: `activities.${report.cityId}.${expedition.expeditionTypeId}.${duration.durationId}_ratio`,
          label: `${report.cityId} ${expedition.expeditionTypeId} ${duration.durationId} equivalence`,
          sectionId: 'activities',
          comparator: 'between',
          actual: duration.equivalenceRatioVsRuin,
          target: { min: target - tolerance, max: target + tolerance },
          passed: Math.abs(duration.equivalenceRatioVsRuin - target) <= tolerance,
          context: { cityId: report.cityId },
        });
      }
    }
  }

  const prepVsBypass = buildAllPrepVsBypassEconomyReports(validated);
  for (const row of prepVsBypass) {
    metrics.push({
      metricId: `prep.gate_${row.gateIndex}.minimum_ratio`,
      label: `Gate ${row.gateIndex} minimum prep/bypass ratio`,
      sectionId: 'prep',
      comparator: 'truthy',
      actual: row.minimumRatioWithinBand,
      target: true,
      passed: row.minimumRatioWithinBand,
      context: { gateIndex: row.gateIndex },
    });
    metrics.push({
      metricId: `prep.gate_${row.gateIndex}.recommended_ratio`,
      label: `Gate ${row.gateIndex} recommended prep/bypass ratio`,
      sectionId: 'prep',
      comparator: 'truthy',
      actual: row.recommendedRatioWithinBand,
      target: true,
      passed: row.recommendedRatioWithinBand,
      context: { gateIndex: row.gateIndex },
    });
  }

  for (let gateIndex = 1; gateIndex <= 5; gateIndex += 1) {
    for (const scenarioId of ['consumables_only', 'forge_floor_only', 'build_correction_only'] as const) {
      const probe = runPrepRecoveryProbe(validated, gateIndex, scenarioId);
      metrics.push({
        metricId: `prep.gate_${gateIndex}.${scenarioId}.window`,
        label: `Gate ${gateIndex} ${scenarioId} recovery window`,
        sectionId: 'prep',
        comparator: 'truthy',
        actual: probe.report.passesWindow,
        target: true,
        passed: probe.report.passesWindow,
        context: { gateIndex, scenarioId },
      });
    }
  }

  const reserveReports = buildAllSupportReservePacingReports(validated, { merit: 0, spiritStones: 0 });
  for (const report of reserveReports) {
    metrics.push({
      metricId: `prep.gate_${report.gateIndex}.reserve_reachability`,
      label: `Gate ${report.gateIndex} reserve reachability`,
      sectionId: 'prep',
      comparator: 'truthy',
      actual: report.verdicts.reachesMinimumMeritReserveWithLowBandPlusDefeats && report.verdicts.failSafeAffordableAfterHighBandPlusDefeats,
      target: true,
      passed: report.verdicts.reachesMinimumMeritReserveWithLowBandPlusDefeats && report.verdicts.failSafeAffordableAfterHighBandPlusDefeats,
      context: { gateIndex: report.gateIndex },
    });
  }

  for (const gateIndex of [1, 2, 3, 4, 5] as const) {
    const target = getGateCombatTarget(gateIndex)!;
    for (const readinessBand of ['belowMinimum', 'minimum', 'recommended'] as const) {
      const result = runGateCombatProbe(createGateCombatProbeScenario(gateIndex, readinessBand));
      const [min, max] = target.winRate[readinessBand];
      metrics.push({
        metricId: `combat.gate_${gateIndex}.${readinessBand}.win_rate`,
        label: `Gate ${gateIndex} ${readinessBand} win-rate`,
        sectionId: 'combat',
        comparator: 'between',
        actual: result.winRate,
        target: { min, max },
        passed: between(result.winRate, min, max),
        context: { gateIndex, readinessBand },
      });
    }

    const minimumResult = runGateCombatProbe(createGateCombatProbeScenario(gateIndex, 'minimum'));
    const recommendedResult = runGateCombatProbe(createGateCombatProbeScenario(gateIndex, 'recommended'));
    metrics.push({
      metricId: `combat.gate_${gateIndex}.minimum_duration`,
      label: `Gate ${gateIndex} minimum median clear duration`,
      sectionId: 'combat',
      comparator: 'eq',
      actual: minimumResult.medianDurationSec,
      target: target.duration.minimumMedianSec,
      passed: minimumResult.medianDurationSec === target.duration.minimumMedianSec,
      context: { gateIndex, readinessBand: 'minimum' },
    });
    metrics.push({
      metricId: `combat.gate_${gateIndex}.recommended_duration`,
      label: `Gate ${gateIndex} recommended median clear duration`,
      sectionId: 'combat',
      comparator: 'eq',
      actual: recommendedResult.medianDurationSec,
      target: target.duration.recommendedMedianSec,
      passed: recommendedResult.medianDurationSec === target.duration.recommendedMedianSec,
      context: { gateIndex, readinessBand: 'recommended' },
    });
  }

  const progressionContract = await loadProgressionContract();
  const offline = getOfflineProgressionContract(progressionContract);
  metrics.push({
    metricId: 'offline.base_efficiency',
    label: 'Offline base efficiency',
    sectionId: 'offline',
    comparator: 'eq',
    actual: offline.cultivationPolicy.baseEfficiency,
    target: 0.5,
    passed: offline.cultivationPolicy.baseEfficiency === 0.5,
  });
  metrics.push({
    metricId: 'offline.max_efficiency',
    label: 'Offline max efficiency',
    sectionId: 'offline',
    comparator: 'eq',
    actual: offline.cultivationPolicy.maxEfficiency,
    target: 0.9,
    passed: offline.cultivationPolicy.maxEfficiency === 0.9,
  });
  metrics.push({
    metricId: 'offline.cap_behavior',
    label: 'Offline cap seconds',
    sectionId: 'offline',
    comparator: 'eq',
    actual: offline.maxCatchupSeconds,
    target: 43_200,
    passed: offline.maxCatchupSeconds === 43_200,
  });
  metrics.push({
    metricId: 'offline.no_combat_progress',
    label: 'Offline excludes combat progression',
    sectionId: 'offline',
    comparator: 'truthy',
    actual: offline.excludes.includes('combat'),
    target: true,
    passed: offline.excludes.includes('combat'),
  });

  const prestigeProbe = await runPrestigeApHourProbe();
  for (const row of prestigeProbe.rows) {
    const target = PRESTIGE_TARGETS.checkpointApTargets[row.checkpointId];
    metrics.push({
      metricId: `prestige.${row.checkpointId}.ap_gain`,
      label: `${row.checkpointId} AP gain`,
      sectionId: 'prestige',
      comparator: 'between',
      actual: row.apGain,
      target: { min: target.minAp, max: target.maxAp },
      passed: between(row.apGain, target.minAp, target.maxAp),
      context: { checkpointId: row.checkpointId },
    });
    if (row.checkpointId === 'core_entry') {
      metrics.push({
        metricId: 'prestige.ap_hour.core_floor',
        label: 'Core AP/hour floor',
        sectionId: 'prestige',
        comparator: 'gte',
        actual: row.apPerHour,
        target: PRESTIGE_TARGETS.apPerHourPolicy.coreFormationApPerHourFloor,
        passed: row.apPerHour >= PRESTIGE_TARGETS.apPerHourPolicy.coreFormationApPerHourFloor,
      });
    }
  }

  const reclaim = await runReclaimProbe();
  metrics.push({
    metricId: 'prestige.reclaim.first_viable',
    label: 'First viable reclaim scenario passes',
    sectionId: 'prestige',
    comparator: 'truthy',
    actual: reclaim.firstViableCoreStarterSpend.passes,
    target: true,
    passed: reclaim.firstViableCoreStarterSpend.passes,
    context: { scenarioId: 'first_viable_core_reset_starter_spend' },
  });
  metrics.push({
    metricId: 'prestige.reclaim.deep_cap',
    label: 'Deep cap reclaim scenario passes',
    sectionId: 'prestige',
    comparator: 'truthy',
    actual: reclaim.deepCapStarterSpend.passes,
    target: true,
    passed: reclaim.deepCapStarterSpend.passes,
    context: { scenarioId: 'deep_cap_reset_starter_spend' },
  });
  metrics.push({
    metricId: 'prestige.reclaim.first_purchase_feel',
    label: 'First purchase feel delta',
    sectionId: 'prestige',
    comparator: 'gte',
    actual: reclaim.firstPurchaseFeel.bestImprovement,
    target: PRESTIGE_TARGETS.reclaimMilestoneTargets.first_purchase_feel.minImprovementRatio,
    passed: reclaim.firstPurchaseFeel.bestImprovement >= PRESTIGE_TARGETS.reclaimMilestoneTargets.first_purchase_feel.minImprovementRatio,
  });

  const telemetryProbe = runBalanceTelemetryProbe();
  const telemetryEvents = telemetryProbe.balanceEvents;
  const telemetryReport = buildBalanceTelemetryReport(telemetryEvents);
  const families = new Set(telemetryEvents.map((event) => event.family));
  for (const family of ['progression', 'trials', 'economy', 'support', 'prestige', 'offline'] as const) {
    metrics.push({
      metricId: `telemetry.family.${family}`,
      label: `Telemetry family ${family} coverage`,
      sectionId: 'telemetry',
      comparator: 'truthy',
      actual: families.has(family),
      target: true,
      passed: families.has(family),
    });
  }

  metrics.push({
    metricId: 'telemetry.kind.coverage',
    label: 'Telemetry kind coverage includes schema kinds used by report',
    sectionId: 'telemetry',
    comparator: 'gte',
    actual: BALANCE_TELEMETRY_VALIDATION_REQUIRED_KINDS.filter((kind) => telemetryEvents.some((event) => event.kind === kind)).length,
    target: BALANCE_TELEMETRY_VALIDATION_REQUIRED_KINDS.length,
    passed: BALANCE_TELEMETRY_VALIDATION_REQUIRED_KINDS.every((kind) => telemetryEvents.some((event) => event.kind === kind)),
  });

  metrics.push({
    metricId: 'telemetry.kpi.time_to_gate_available',
    label: 'Telemetry report reconstructs gate attempts',
    sectionId: 'telemetry',
    comparator: 'truthy',
    actual: telemetryReport.gates.length > 0 && telemetryReport.gates[0]!.attempts > 0,
    target: true,
    passed: telemetryReport.gates.length > 0 && telemetryReport.gates[0]!.attempts > 0,
  });
  metrics.push({
    metricId: 'telemetry.kpi.attempts_per_gate',
    label: 'Telemetry report reconstructs attempts per gate',
    sectionId: 'telemetry',
    comparator: 'truthy',
    actual: telemetryReport.gates.every((gate) => gate.attempts >= gate.clears),
    target: true,
    passed: telemetryReport.gates.every((gate) => gate.attempts >= gate.clears),
  });

  metrics.push({
    metricId: 'telemetry.taxonomy.sources',
    label: 'Telemetry source taxonomy coverage',
    sectionId: 'telemetry',
    comparator: 'truthy',
    actual: ECONOMY_SOURCE_KINDS.every((kind) => telemetryReport.economy.earnedBySource[kind] != null),
    target: true,
    passed: ECONOMY_SOURCE_KINDS.every((kind) => telemetryReport.economy.earnedBySource[kind] != null),
  });
  metrics.push({
    metricId: 'telemetry.taxonomy.sinks',
    label: 'Telemetry sink taxonomy coverage',
    sectionId: 'telemetry',
    comparator: 'truthy',
    actual: ECONOMY_SINK_KINDS.every((kind) => telemetryReport.economy.spentBySink[kind] != null),
    target: true,
    passed: ECONOMY_SINK_KINDS.every((kind) => telemetryReport.economy.spentBySink[kind] != null),
  });

  return summarizeMetrics(metrics);
}
