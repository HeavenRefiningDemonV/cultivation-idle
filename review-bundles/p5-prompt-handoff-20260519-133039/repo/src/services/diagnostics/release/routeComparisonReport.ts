import {
  getAlternativeRouteSpec,
} from '../../../../tests/helpers/release/alternativeRouteCatalog.js';
import {
  runAlternativeRoute,
} from '../../../../tests/helpers/release/runAlternativeRoute.js';
import type {
  AlternativeRouteExploitWatchRow,
  AlternativeRouteId,
  AlternativeRouteResult,
} from '../../../../tests/helpers/release/alternativeRouteTypes.js';

const ROUTE_IDS: readonly AlternativeRouteId[] = ['fail_safe', 'offline_heavy', 'low_attention', 'high_skill', 'reclaim'];

export type RouteComparisonSummary = {
  routeId: AlternativeRouteId;
  title: string;
  status: AlternativeRouteResult['status'];
  automationMode: AlternativeRouteResult['automationMode'];
  whatItProves: string[];
  elapsedMs: number;
  finalRealmId: string;
  finalCityId: string | null;
  unlockedCityIds: string[];
  reachedSpiritSevering: boolean;
  reachedContentCap: boolean;
  blockerCount: number;
  warningCount: number;
};

export type RouteComparisonRow = {
  metric: string;
  category: 'viability' | 'checkpoint_pace' | 'reserve_bypass' | 'attention' | 'offline' | 'reclaim' | 'exploit';
  valuesByRoute: Partial<Record<AlternativeRouteId, number | string | boolean>>;
  baseline: string;
  detail: string;
};

export type RouteExploitWatchEntry = AlternativeRouteExploitWatchRow & {
  routeId: AlternativeRouteId;
};

export type RouteComparisonFinalTruthSummary = {
  failSafeEmergencyOnly: boolean;
  offlineMeaningfulButBounded: boolean;
  lowAttentionViable: boolean;
  highSkillRewardedWithoutDominance: boolean;
  reclaimMateriallyFaster: boolean;
  noFakeCitySixAcrossRoutes: boolean;
};

export type RouteComparisonReport = {
  schemaVersion: '7.3f';
  generatedAt: number;
  baselineKind: string;
  overallPass: boolean;
  routeSummaries: RouteComparisonSummary[];
  comparisonRows: RouteComparisonRow[];
  blockers: string[];
  warnings: string[];
  exploitWatchlist: RouteExploitWatchEntry[];
  notes: string[];
  finalTruthSummary: RouteComparisonFinalTruthSummary;
};

function asNumber(value: number | string | boolean | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  return value ? 1 : 0;
}

function toSummary(result: AlternativeRouteResult): RouteComparisonSummary {
  const spec = getAlternativeRouteSpec(result.routeId);
  return {
    routeId: result.routeId,
    title: spec?.title ?? result.routeId,
    status: result.status,
    automationMode: result.automationMode,
    whatItProves: spec?.proves ?? [],
    elapsedMs: result.elapsedMs,
    finalRealmId: result.finalSnapshot.finalRealmId,
    finalCityId: result.finalSnapshot.currentCityId ?? null,
    unlockedCityIds: [...result.finalSnapshot.unlockedCityIds],
    reachedSpiritSevering: result.finalSnapshot.reachedSpiritSevering,
    reachedContentCap: result.finalSnapshot.reachedContentCap,
    blockerCount: result.failures.filter((entry) => entry.blocker).length,
    warningCount: result.warnings.length,
  };
}

function buildComparisonRows(resultsById: Record<AlternativeRouteId, AlternativeRouteResult>): RouteComparisonRow[] {
  return [
    {
      metric: 'route_viability_status',
      category: 'viability',
      valuesByRoute: Object.fromEntries(ROUTE_IDS.map((id) => [id, resultsById[id].status])),
      baseline: 'all routes pass or warning_only',
      detail: 'Top-level route viability per packet-7.3 route class.',
    },
    {
      metric: 'checkpoint_pace_delta_foundation_seconds',
      category: 'checkpoint_pace',
      valuesByRoute: {
        high_skill: resultsById.high_skill.comparisonRows.find((row) => row.metric === 'high_skill_foundation_delta_seconds')?.routeValue,
      },
      baseline: '>= 0 (representative baseline)',
      detail: 'High-skill route should not regress foundation pace.',
    },
    {
      metric: 'reserve_bypass_guardrail',
      category: 'reserve_bypass',
      valuesByRoute: {
        fail_safe: resultsById.fail_safe.comparisonRows.find((row) => row.metric === 'fail_safe_emergency_only_policy')?.routeValue,
        high_skill: resultsById.high_skill.comparisonRows.find((row) => row.metric === 'high_skill_bypass_emergency_only')?.routeValue,
      },
      baseline: 'true',
      detail: 'Fail-safe and high-skill must keep bypass emergency-only.',
    },
    {
      metric: 'low_attention_interaction_count',
      category: 'attention',
      valuesByRoute: {
        low_attention: resultsById.low_attention.comparisonRows.find((row) => row.metric === 'low_attention_interaction_count')?.routeValue,
      },
      baseline: '<= 6',
      detail: 'Low-attention budget remains bounded.',
    },
    {
      metric: 'offline_trial_clear_count',
      category: 'offline',
      valuesByRoute: {
        offline_heavy: resultsById.offline_heavy.comparisonRows.find((row) => row.metric === 'offline_trial_clear_count')?.routeValue,
      },
      baseline: '0',
      detail: 'Offline-heavy route must not clear trials.',
    },
    {
      metric: 'reclaim_speedup_ratios',
      category: 'reclaim',
      valuesByRoute: {
        reclaim: [
          resultsById.reclaim.comparisonRows.find((row) => row.metric === 'reclaim_foundation_speedup_ratio')?.routeValue,
          resultsById.reclaim.comparisonRows.find((row) => row.metric === 'reclaim_core_speedup_ratio')?.routeValue,
          resultsById.reclaim.comparisonRows.find((row) => row.metric === 'reclaim_nascent_speedup_ratio')?.routeValue,
        ].join('/'),
      },
      baseline: '>= 0.15 / >= 0.15 / >= 0.10',
      detail: 'Reclaim route should show material milestone acceleration.',
    },
    {
      metric: 'exploit_watchlist_trigger_count',
      category: 'exploit',
      valuesByRoute: Object.fromEntries(
        ROUTE_IDS.map((id) => [id, (resultsById[id].exploitWatchlist ?? []).filter((row) => row.triggered).length]),
      ),
      baseline: '0 blocker triggers',
      detail: 'Structured exploit-watchlist rollup for each route.',
    },
  ];
}

function buildFinalTruthSummary(resultsById: Record<AlternativeRouteId, AlternativeRouteResult>): RouteComparisonFinalTruthSummary {
  const failSafeEmergencyOnly = resultsById.fail_safe.comparisonRows.some((row) =>
    row.metric === 'fail_safe_emergency_only_policy' && row.routeValue === true,
  );
  const offlineMeaningfulButBounded = resultsById.offline_heavy.comparisonRows.some((row) =>
    row.metric === 'offline_qi_vs_active_theoretical' && row.verdict === 'non_dominant',
  ) && resultsById.offline_heavy.comparisonRows.some((row) => row.metric === 'offline_trial_clear_count' && row.routeValue === 0);
  const lowAttentionCount = asNumber(resultsById.low_attention.comparisonRows.find((row) => row.metric === 'low_attention_interaction_count')?.routeValue);
  const lowAttentionViable = lowAttentionCount > 0 && lowAttentionCount <= 6 && resultsById.low_attention.failures.length === 0;

  const highSkillImproved = asNumber(resultsById.high_skill.comparisonRows.find((row) => row.metric === 'high_skill_foundation_delta_seconds')?.routeValue) > 0
    || asNumber(resultsById.high_skill.comparisonRows.find((row) => row.metric === 'high_skill_gate1_delta_seconds')?.routeValue) > 0;
  const highSkillNoBlockerExploit = (resultsById.high_skill.exploitWatchlist ?? []).every((entry) => !(entry.severity === 'blocker' && entry.triggered));
  const highSkillRewardedWithoutDominance = highSkillImproved && highSkillNoBlockerExploit;

  const reclaimFoundation = asNumber(resultsById.reclaim.comparisonRows.find((row) => row.metric === 'reclaim_foundation_speedup_ratio')?.routeValue);
  const reclaimCore = asNumber(resultsById.reclaim.comparisonRows.find((row) => row.metric === 'reclaim_core_speedup_ratio')?.routeValue);
  const reclaimMateriallyFaster = reclaimFoundation >= 0.15 && reclaimCore >= 0.15;

  const noFakeCitySixAcrossRoutes = ROUTE_IDS.every((id) => resultsById[id].finalSnapshot.noFakeCitySix);

  return {
    failSafeEmergencyOnly,
    offlineMeaningfulButBounded,
    lowAttentionViable,
    highSkillRewardedWithoutDominance,
    reclaimMateriallyFaster,
    noFakeCitySixAcrossRoutes,
  };
}

export async function buildRouteComparisonReport(): Promise<RouteComparisonReport> {
  const routeResults: AlternativeRouteResult[] = [];
  for (const routeId of ROUTE_IDS) {
    routeResults.push(await runAlternativeRoute(routeId));
  }
  const resultsById = Object.fromEntries(routeResults.map((result) => [result.routeId, result])) as Record<AlternativeRouteId, AlternativeRouteResult>;

  const routeSummaries = routeResults.map(toSummary);
  const exploitWatchlist = routeResults.flatMap((result) =>
    (result.exploitWatchlist ?? []).map((entry) => ({ ...entry, routeId: result.routeId })),
  );

  const blockers = routeResults.flatMap((result) => result.failures.filter((entry) => entry.blocker).map((entry) => `${result.routeId}:${entry.code}:${entry.message}`));
  const warnings = routeResults.flatMap((result) => result.warnings.map((entry) => `${result.routeId}:${entry.code}:${entry.message}`));

  const finalTruthSummary = buildFinalTruthSummary(resultsById);
  const overallPass = blockers.length === 0
    && finalTruthSummary.failSafeEmergencyOnly
    && finalTruthSummary.offlineMeaningfulButBounded
    && finalTruthSummary.lowAttentionViable
    && finalTruthSummary.highSkillRewardedWithoutDominance
    && finalTruthSummary.reclaimMateriallyFaster
    && finalTruthSummary.noFakeCitySixAcrossRoutes;

  return {
    schemaVersion: '7.3f',
    generatedAt: Date.now(),
    baselineKind: 'representative_phase_timing_probe',
    overallPass,
    routeSummaries,
    comparisonRows: buildComparisonRows(resultsById),
    blockers,
    warnings,
    exploitWatchlist,
    notes: [
      'Baseline anchor uses representative phase-timing probe where packet-7.1 normal-route export is not directly available.',
      'High-skill and reclaim rows combine runtime-hydrated and target-model evidence; see route notes for boundaries.',
    ],
    finalTruthSummary,
  };
}

export function renderRouteComparisonReport(report: RouteComparisonReport): string {
  const lines: string[] = [];
  lines.push('=== Route Comparison Report (Packet 7.3f) ===');
  lines.push(`generatedAt: ${new Date(report.generatedAt).toISOString()}`);
  lines.push(`schemaVersion: ${report.schemaVersion}`);
  lines.push(`baselineKind: ${report.baselineKind}`);
  lines.push(`overallPass: ${report.overallPass ? 'PASS' : 'FAIL'}`);
  lines.push('');
  lines.push('Route Summaries:');
  for (const summary of report.routeSummaries) {
    lines.push(`- ${summary.routeId} (${summary.title}) status=${summary.status} elapsedMs=${summary.elapsedMs} blockers=${summary.blockerCount} warnings=${summary.warningCount}`);
  }

  lines.push('');
  lines.push('Comparison Rows:');
  for (const row of report.comparisonRows) {
    lines.push(`- [${row.category}] ${row.metric}: baseline=${row.baseline} values=${JSON.stringify(row.valuesByRoute)}`);
  }

  lines.push('');
  lines.push('Final Truth Summary:');
  for (const [key, value] of Object.entries(report.finalTruthSummary)) {
    lines.push(`- ${key}: ${value}`);
  }

  if (report.blockers.length > 0) {
    lines.push('');
    lines.push('Blockers:');
    report.blockers.forEach((entry) => lines.push(`- ${entry}`));
  }

  if (report.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    report.warnings.forEach((entry) => lines.push(`- ${entry}`));
  }

  return lines.join('\n');
}

export function serializeRouteComparisonReport(report: RouteComparisonReport): string {
  return JSON.stringify(report, null, 2);
}
