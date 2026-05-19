import {
  BALANCE_TELEMETRY_KINDS,
  ECONOMY_SINK_KINDS,
  ECONOMY_SOURCE_KINDS,
  type BalanceTelemetryEvent,
  type BalanceTelemetryFamily,
  type EconomySinkKind,
  type EconomySourceKind,
} from './balanceTelemetrySchema.js';
import { buildBalanceTelemetryReport, parseBalanceTelemetryInput } from './balanceTelemetryExport.js';

const REQUIRED_FAMILIES: readonly BalanceTelemetryFamily[] = [
  'progression',
  'trials',
  'readiness',
  'diagnosis',
  'economy',
  'support',
  'prestige',
  'reclaim',
  'offline',
] as const;

const REQUIRED_KINDS: readonly BalanceTelemetryEvent['kind'][] = [
  'progression/life_started',
  'progression/gate_available',
  'trials/attempt_resolved',
  'readiness/snapshot',
  'diagnosis/computed',
  'economy/currency_earned',
  'economy/currency_spent',
  'support/bounty_claimed',
  'support/expedition_started',
  'support/expedition_claimed',
  'prestige/performed',
  'reclaim/milestone_reached',
  'offline/applied',
] as const;

const REQUIRED_SOURCE_KINDS: readonly EconomySourceKind[] = ['trial_clear', 'expedition', 'bounty', 'eligible_defeat_merit'] as const;
const REQUIRED_SINK_KINDS: readonly EconomySinkKind[] = ['gate_fail_safe_purchase', 'alchemy_queue', 'prestige_purchase'] as const;

export interface BalanceTelemetryValidationResult {
  passed: boolean;
  eventCount: number;
  familyCoverage: Record<BalanceTelemetryFamily, boolean>;
  kindCoverage: Record<string, boolean>;
  taxonomyCoverage: {
    sourceKinds: Record<EconomySourceKind, boolean>;
    sinkKinds: Record<EconomySinkKind, boolean>;
  };
  reportCoverage: {
    hasGateRows: boolean;
    hasEconomyRows: boolean;
    hasOfflineTotals: boolean;
    hasPrestigeTotals: boolean;
  };
  errors: string[];
}

export function validateBalanceTelemetryEvents(events: BalanceTelemetryEvent[]): BalanceTelemetryValidationResult {
  const families = new Set(events.map((event) => event.family));
  const kinds = new Set(events.map((event) => event.kind));
  const report = buildBalanceTelemetryReport(events);

  const familyCoverage = Object.fromEntries(
    REQUIRED_FAMILIES.map((family) => [family, families.has(family)]),
  ) as Record<BalanceTelemetryFamily, boolean>;

  const kindCoverage = Object.fromEntries(
    REQUIRED_KINDS.map((kind) => [kind, kinds.has(kind)]),
  ) as Record<string, boolean>;

  const sourceKindsFromEvents = new Set(
    events
      .filter((event): event is Extract<BalanceTelemetryEvent, { kind: 'economy/currency_earned' }> => event.kind === 'economy/currency_earned')
      .map((event) => event.payload.sourceKind),
  );
  const sinkKindsFromEvents = new Set(
    events
      .filter((event): event is Extract<BalanceTelemetryEvent, { kind: 'economy/currency_spent' }> => event.kind === 'economy/currency_spent')
      .map((event) => event.payload.sinkKind),
  );

  const sourceKinds = Object.fromEntries(ECONOMY_SOURCE_KINDS.map((kind) => [kind, sourceKindsFromEvents.has(kind)])) as Record<EconomySourceKind, boolean>;
  const sinkKinds = Object.fromEntries(ECONOMY_SINK_KINDS.map((kind) => [kind, sinkKindsFromEvents.has(kind)])) as Record<EconomySinkKind, boolean>;

  const errors: string[] = [];
  for (const [family, covered] of Object.entries(familyCoverage)) {
    if (!covered) errors.push(`missing family: ${family}`);
  }
  for (const [kind, covered] of Object.entries(kindCoverage)) {
    if (!covered) errors.push(`missing kind: ${kind}`);
  }
  for (const kind of REQUIRED_SOURCE_KINDS) {
    if (!sourceKinds[kind]) errors.push(`missing required source kind: ${kind}`);
  }
  for (const kind of REQUIRED_SINK_KINDS) {
    if (!sinkKinds[kind]) errors.push(`missing required sink kind: ${kind}`);
  }

  const reportCoverage = {
    hasGateRows: report.gates.length > 0,
    hasEconomyRows: Object.values(report.economy.earnedBySource).some((row) => row.gold > 0 || row.merit > 0 || row.spiritStones > 0)
      && Object.values(report.economy.spentBySink).some((row) => row.gold > 0 || row.merit > 0 || row.spiritStones > 0),
    hasOfflineTotals: report.offline.totalOfflineSeconds > 0,
    hasPrestigeTotals: report.prestige.apGainedTotal > 0,
  };

  if (!reportCoverage.hasGateRows) errors.push('report coverage missing gate rows');
  if (!reportCoverage.hasEconomyRows) errors.push('report coverage missing economy totals');
  if (!reportCoverage.hasOfflineTotals) errors.push('report coverage missing offline totals');
  if (!reportCoverage.hasPrestigeTotals) errors.push('report coverage missing prestige totals');

  return {
    passed: errors.length === 0,
    eventCount: events.length,
    familyCoverage,
    kindCoverage,
    taxonomyCoverage: {
      sourceKinds,
      sinkKinds,
    },
    reportCoverage,
    errors,
  };
}

export function validateBalanceTelemetryInput(input: unknown): BalanceTelemetryValidationResult {
  const events = parseBalanceTelemetryInput(input);
  return validateBalanceTelemetryEvents(events);
}

export function renderBalanceTelemetryValidation(result: BalanceTelemetryValidationResult): string {
  const lines = [
    'Balance Telemetry Validation',
    `events=${result.eventCount} overall=${result.passed ? 'PASS' : 'FAIL'}`,
    `families=${Object.values(result.familyCoverage).filter(Boolean).length}/${REQUIRED_FAMILIES.length}`,
    `kinds=${Object.values(result.kindCoverage).filter(Boolean).length}/${REQUIRED_KINDS.length}`,
    `sourceKinds(required)=${REQUIRED_SOURCE_KINDS.filter((kind) => result.taxonomyCoverage.sourceKinds[kind]).length}/${REQUIRED_SOURCE_KINDS.length}`,
    `sinkKinds(required)=${REQUIRED_SINK_KINDS.filter((kind) => result.taxonomyCoverage.sinkKinds[kind]).length}/${REQUIRED_SINK_KINDS.length}`,
  ];

  if (result.errors.length > 0) {
    lines.push('Errors:');
    result.errors.forEach((error) => lines.push(`- ${error}`));
  }

  return lines.join('\n');
}

export function serializeBalanceTelemetryValidation(result: BalanceTelemetryValidationResult, options?: { pretty?: boolean }): string {
  return JSON.stringify(result, null, options?.pretty === false ? 0 : 2);
}

export const BALANCE_TELEMETRY_VALIDATION_REQUIRED_KINDS = REQUIRED_KINDS;
export const BALANCE_TELEMETRY_VALIDATION_REQUIRED_FAMILIES = REQUIRED_FAMILIES;
