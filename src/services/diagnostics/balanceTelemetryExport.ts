import type {
  BalanceTelemetryEvent,
  BalanceTelemetryEvent as Event,
  BalanceTelemetryKind,
  BalanceSessionKind,
  EconomySinkKind,
  EconomySourceKind,
} from './balanceTelemetrySchema.js';

export interface BalanceTelemetryReport {
  global: {
    eventCount: number;
    lifeCount: number;
    reclaimLifeCount: number;
    prestigeCount: number;
    offlineAppliedCount: number;
  };
  lives: Array<{
    lifeId: string;
    lifeOrdinal: number | null;
    sessionKind: BalanceSessionKind | null;
    startedAt: number | null;
    gatesAvailableAtByGate: Record<string, number>;
    majorRealmEntriesByRealm: Record<string, number>;
    cityEnteredAtByCity: Record<string, number>;
    contentCapAt: number | null;
    prestigeApGained: number;
    reclaimMilestones: Record<string, number>;
  }>;
  gates: Array<{
    gateIndex: number;
    attempts: number;
    clears: number;
    defeats: number;
    bypasses: number;
    attemptsByReadinessBand: Record<string, number>;
    winRateByReadinessBand: Record<string, number>;
    medianClearDurationSec: number | null;
    medianDefeatDurationSec: number | null;
    avgBossHpPctRemainingOnDefeat: number | null;
  }>;
  economy: {
    spentBySink: Record<EconomySinkKind, { gold: number; merit: number; spiritStones: number }>;
    earnedBySource: Record<EconomySourceKind, { gold: number; merit: number; spiritStones: number }>;
  };
  support: {
    bountyClaimsByCityDifficultyKind: Record<string, number>;
    expeditionStartsByCityTypeDuration: Record<string, number>;
    expeditionClaimsByCityTypeDuration: Record<string, number>;
    expeditionCadenceSecMedian: number | null;
  };
  prestige: {
    apGainedTotal: number;
    apSpentOnUpgradesTotal: number;
    reclaimMilestones: Record<string, number[]>;
  };
  offline: {
    totalOfflineSeconds: number;
    totalCappedOfflineSeconds: number;
    averageEffectiveEfficiency: number;
    totalQiGained: number;
    queuedActionsReadyTotal: number;
    expeditionsReadyTotal: number;
  };
}

export interface BalanceTelemetryExportEnvelope {
  schemaVersion: 1;
  exportedAt: number;
  app?: { name: string; version?: string; mode?: string };
  capture: { balanceCaptureEnabled: boolean; maxBalanceEvents: number };
  eventCount: number;
  balanceEvents: BalanceTelemetryEvent[];
  summary: BalanceTelemetryReport;
}

function toNumber(value: string | number | undefined | null): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

function toCsv(rows: Array<Record<string, string | number | null | undefined>>, columns: string[]): string {
  const header = columns.join(',');
  const lines = rows.map((row) => columns.map((column) => {
    const raw = row[column];
    const value = raw == null ? '' : String(raw);
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replaceAll('"', '""')}"`;
    }
    return value;
  }).join(','));
  return [header, ...lines].join('\n');
}

function createCurrencyMap<T extends string>(keys: readonly T[]): Record<T, { gold: number; merit: number; spiritStones: number }> {
  return keys.reduce((acc, key) => {
    acc[key] = { gold: 0, merit: 0, spiritStones: 0 };
    return acc;
  }, {} as Record<T, { gold: number; merit: number; spiritStones: number }>);
}

export function buildBalanceTelemetryReport(events: BalanceTelemetryEvent[]): BalanceTelemetryReport {
  const sorted = [...events].sort((a, b) => a.emittedAt - b.emittedAt);
  const lifeById = new Map<string, BalanceTelemetryReport['lives'][number]>();
  const gateStats = new Map<number, {
    attempts: number;
    clears: number;
    defeats: number;
    bypasses: number;
    readinessAttempts: Record<string, number>;
    readinessWins: Record<string, number>;
    clearDurations: number[];
    defeatDurations: number[];
    bossHpDefeats: number[];
  }>();
  const readinessByAttemptId = new Map<string, string>();
  const expeditionDurations: number[] = [];

  const sourceKeys: EconomySourceKind[] = ['outskirts','ruins_room','ruins_chest','ruins_rare','bounty','expedition','trial_clear','eligible_defeat_merit','manual_pavilion','craft_completion','debug','other'];
  const sinkKeys: EconomySinkKind[] = ['apothecary_shop','apothecary_bundle','alchemy_queue','talisman_queue','forge_service','craft_session','gate_fail_safe_purchase','prestige_purchase','heart_law_change','breakthrough_gate_item','other'];
  const earnedBySource = createCurrencyMap(sourceKeys);
  const spentBySink = createCurrencyMap(sinkKeys);

  const support = {
    bountyClaimsByCityDifficultyKind: {} as Record<string, number>,
    expeditionStartsByCityTypeDuration: {} as Record<string, number>,
    expeditionClaimsByCityTypeDuration: {} as Record<string, number>,
    expeditionCadenceSecMedian: null as number | null,
  };

  const prestige = {
    apGainedTotal: 0,
    apSpentOnUpgradesTotal: 0,
    reclaimMilestones: {} as Record<string, number[]>,
  };

  const offline = {
    totalOfflineSeconds: 0,
    totalCappedOfflineSeconds: 0,
    averageEffectiveEfficiency: 0,
    totalQiGained: 0,
    queuedActionsReadyTotal: 0,
    expeditionsReadyTotal: 0,
  };

  const getLife = (event: BalanceTelemetryEvent) => {
    const lifeId = event.lifeId ?? 'unknown';
    const existing = lifeById.get(lifeId);
    if (existing) return existing;
    const created = {
      lifeId,
      lifeOrdinal: event.lifeOrdinal ?? null,
      sessionKind: event.sessionKind ?? null,
      startedAt: null,
      gatesAvailableAtByGate: {} as Record<string, number>,
      majorRealmEntriesByRealm: {} as Record<string, number>,
      cityEnteredAtByCity: {} as Record<string, number>,
      contentCapAt: null,
      prestigeApGained: 0,
      reclaimMilestones: {} as Record<string, number>,
    };
    lifeById.set(lifeId, created);
    return created;
  };

  for (const event of sorted) {
    const life = getLife(event);
    switch (event.kind) {
      case 'progression/life_started':
        life.startedAt = event.emittedAt;
        break;
      case 'progression/gate_available':
        life.gatesAvailableAtByGate[String(event.payload.gateIndex)] = event.emittedAt;
        break;
      case 'progression/breakthrough':
        if (event.payload.major) {
          life.majorRealmEntriesByRealm[event.payload.toRealmId] = event.emittedAt;
        }
        break;
      case 'progression/city_entered':
        life.cityEnteredAtByCity[event.payload.cityId] = event.emittedAt;
        break;
      case 'progression/content_cap_reached':
        life.contentCapAt = event.emittedAt;
        break;
      case 'readiness/snapshot':
        readinessByAttemptId.set(`${event.payload.trialId}:${event.emittedAt}`, event.payload.overallBand);
        break;
      case 'trials/attempt_resolved': {
        const gate = gateStats.get(event.payload.gateIndex) ?? {
          attempts: 0, clears: 0, defeats: 0, bypasses: 0,
          readinessAttempts: {}, readinessWins: {}, clearDurations: [], defeatDurations: [], bossHpDefeats: [],
        };
        gate.attempts += 1;
        const band = readinessByAttemptId.get(`${event.payload.trialId}:${event.emittedAt}`) ?? 'unknown';
        gate.readinessAttempts[band] = (gate.readinessAttempts[band] ?? 0) + 1;
        if (event.payload.outcome === 'cleared') {
          gate.clears += 1;
          gate.readinessWins[band] = (gate.readinessWins[band] ?? 0) + 1;
          gate.clearDurations.push(event.payload.durationSec);
        } else if (event.payload.outcome === 'defeated') {
          gate.defeats += 1;
          gate.defeatDurations.push(event.payload.durationSec);
          if (typeof event.payload.bossHpPctRemaining === 'number') gate.bossHpDefeats.push(event.payload.bossHpPctRemaining);
        } else {
          gate.bypasses += 1;
        }
        gateStats.set(event.payload.gateIndex, gate);
        break;
      }
      case 'economy/currency_earned':
        earnedBySource[event.payload.sourceKind].gold += toNumber(event.payload.currencies.gold);
        earnedBySource[event.payload.sourceKind].merit += toNumber(event.payload.currencies.merit);
        earnedBySource[event.payload.sourceKind].spiritStones += toNumber(event.payload.currencies.spiritStones);
        break;
      case 'economy/currency_spent':
        spentBySink[event.payload.sinkKind].gold += toNumber(event.payload.currencies.gold);
        spentBySink[event.payload.sinkKind].merit += toNumber(event.payload.currencies.merit);
        spentBySink[event.payload.sinkKind].spiritStones += toNumber(event.payload.currencies.spiritStones);
        break;
      case 'support/bounty_claimed': {
        const key = `${event.payload.cityId}|${event.payload.difficulty}|${event.payload.kind}`;
        support.bountyClaimsByCityDifficultyKind[key] = (support.bountyClaimsByCityDifficultyKind[key] ?? 0) + 1;
        break;
      }
      case 'support/expedition_started': {
        const key = `${event.payload.cityId}|${event.payload.expeditionTypeId}|${event.payload.durationId}`;
        support.expeditionStartsByCityTypeDuration[key] = (support.expeditionStartsByCityTypeDuration[key] ?? 0) + 1;
        break;
      }
      case 'support/expedition_claimed': {
        const key = `${event.payload.cityId}|${event.payload.expeditionTypeId}|${event.payload.durationId}`;
        support.expeditionClaimsByCityTypeDuration[key] = (support.expeditionClaimsByCityTypeDuration[key] ?? 0) + 1;
        expeditionDurations.push(0);
        break;
      }
      case 'prestige/performed':
        prestige.apGainedTotal += event.payload.apGained;
        life.prestigeApGained += event.payload.apGained;
        break;
      case 'prestige/upgrade_purchased':
        prestige.apSpentOnUpgradesTotal += event.payload.apCost;
        break;
      case 'reclaim/milestone_reached': {
        life.reclaimMilestones[event.payload.milestoneId] = event.payload.elapsedMsSinceLifeStart;
        if (!prestige.reclaimMilestones[event.payload.milestoneId]) prestige.reclaimMilestones[event.payload.milestoneId] = [];
        prestige.reclaimMilestones[event.payload.milestoneId].push(event.payload.elapsedMsSinceLifeStart);
        break;
      }
      case 'offline/applied':
        offline.totalOfflineSeconds += event.payload.effectiveOfflineSeconds;
        offline.totalCappedOfflineSeconds += event.payload.wasCapped ? event.payload.effectiveOfflineSeconds : 0;
        offline.averageEffectiveEfficiency += event.payload.effectiveEfficiency;
        offline.totalQiGained += toNumber(event.payload.qiGained);
        offline.queuedActionsReadyTotal += event.payload.queuedActionsReady;
        offline.expeditionsReadyTotal += event.payload.expeditionsReady;
        break;
      default:
        break;
    }
  }

  const lives = [...lifeById.values()].sort((a, b) => (a.lifeOrdinal ?? 0) - (b.lifeOrdinal ?? 0));
  const gates = [...gateStats.entries()].sort((a, b) => a[0] - b[0]).map(([gateIndex, gate]) => {
    const winRateByReadinessBand: Record<string, number> = {};
    Object.keys(gate.readinessAttempts).forEach((band) => {
      const attempts = gate.readinessAttempts[band] ?? 0;
      winRateByReadinessBand[band] = attempts > 0 ? (gate.readinessWins[band] ?? 0) / attempts : 0;
    });
    return {
      gateIndex,
      attempts: gate.attempts,
      clears: gate.clears,
      defeats: gate.defeats,
      bypasses: gate.bypasses,
      attemptsByReadinessBand: gate.readinessAttempts,
      winRateByReadinessBand,
      medianClearDurationSec: median(gate.clearDurations),
      medianDefeatDurationSec: median(gate.defeatDurations),
      avgBossHpPctRemainingOnDefeat: gate.bossHpDefeats.length > 0 ? gate.bossHpDefeats.reduce((a, b) => a + b, 0) / gate.bossHpDefeats.length : null,
    };
  });

  support.expeditionCadenceSecMedian = median(expeditionDurations);
  offline.averageEffectiveEfficiency = sorted.filter((entry) => entry.kind === 'offline/applied').length > 0
    ? offline.averageEffectiveEfficiency / sorted.filter((entry) => entry.kind === 'offline/applied').length
    : 0;

  return {
    global: {
      eventCount: sorted.length,
      lifeCount: lives.length,
      reclaimLifeCount: lives.filter((life) => life.sessionKind === 'reclaim').length,
      prestigeCount: sorted.filter((event) => event.kind === 'prestige/performed').length,
      offlineAppliedCount: sorted.filter((event) => event.kind === 'offline/applied').length,
    },
    lives,
    gates,
    economy: { spentBySink, earnedBySource },
    support,
    prestige,
    offline,
  };
}

export function summarizeBalanceTelemetryReport(report: BalanceTelemetryReport): string {
  return [
    `Events: ${report.global.eventCount}`,
    `Lives: ${report.global.lifeCount} (reclaim=${report.global.reclaimLifeCount})`,
    `Gates tracked: ${report.gates.length}`,
    `Prestige events: ${report.global.prestigeCount} (AP gained=${report.prestige.apGainedTotal})`,
    `Offline applied: ${report.global.offlineAppliedCount} (seconds=${report.offline.totalOfflineSeconds}, qi=${report.offline.totalQiGained})`,
  ].join('\n');
}

export function buildBalanceTelemetryExportEnvelope(input: {
  events: BalanceTelemetryEvent[];
  balanceCaptureEnabled: boolean;
  maxBalanceEvents: number;
  exportedAt?: number;
  app?: { name: string; version?: string; mode?: string };
}): BalanceTelemetryExportEnvelope {
  const summary = buildBalanceTelemetryReport(input.events);
  return {
    schemaVersion: 1,
    exportedAt: input.exportedAt ?? Date.now(),
    app: input.app,
    capture: {
      balanceCaptureEnabled: input.balanceCaptureEnabled,
      maxBalanceEvents: input.maxBalanceEvents,
    },
    eventCount: input.events.length,
    balanceEvents: input.events,
    summary,
  };
}

export function serializeBalanceTelemetryExport(envelope: BalanceTelemetryExportEnvelope): string {
  return JSON.stringify(envelope, null, 2);
}

export function buildBalanceTelemetryCsvFiles(events: BalanceTelemetryEvent[]): Record<string, string> {
  const report = buildBalanceTelemetryReport(events);
  const baseEventColumns = ['eventId','emittedAt','kind','lifeId','lifeOrdinal','sessionKind','realmId','realmIndex','cityId'];
  const eventRows = events.map((event) => ({
    eventId: event.eventId,
    emittedAt: event.emittedAt,
    kind: event.kind,
    lifeId: event.lifeId,
    lifeOrdinal: event.lifeOrdinal,
    sessionKind: event.sessionKind,
    realmId: event.realmId,
    realmIndex: event.realmIndex,
    cityId: event.cityId,
  }));

  const livesRows = report.lives.map((life) => ({
    lifeId: life.lifeId,
    lifeOrdinal: life.lifeOrdinal,
    sessionKind: life.sessionKind,
    startedAt: life.startedAt,
    contentCapAt: life.contentCapAt,
    prestigeApGained: life.prestigeApGained,
  }));

  const gateRows = report.gates.map((gate) => ({
    gateIndex: gate.gateIndex,
    attempts: gate.attempts,
    clears: gate.clears,
    defeats: gate.defeats,
    bypasses: gate.bypasses,
    medianClearDurationSec: gate.medianClearDurationSec,
    medianDefeatDurationSec: gate.medianDefeatDurationSec,
    avgBossHpPctRemainingOnDefeat: gate.avgBossHpPctRemainingOnDefeat,
  }));

  const economyRows = [
    ...Object.entries(report.economy.earnedBySource).map(([key, value]) => ({ type: 'earned', key, gold: value.gold, merit: value.merit, spiritStones: value.spiritStones })),
    ...Object.entries(report.economy.spentBySink).map(([key, value]) => ({ type: 'spent', key, gold: value.gold, merit: value.merit, spiritStones: value.spiritStones })),
  ];

  const supportRows = [
    ...Object.entries(report.support.bountyClaimsByCityDifficultyKind).map(([key, count]) => ({ metric: 'bounty_claim', key, count })),
    ...Object.entries(report.support.expeditionStartsByCityTypeDuration).map(([key, count]) => ({ metric: 'expedition_start', key, count })),
    ...Object.entries(report.support.expeditionClaimsByCityTypeDuration).map(([key, count]) => ({ metric: 'expedition_claim', key, count })),
  ];

  const prestigeRows = [
    { metric: 'ap_gained_total', value: report.prestige.apGainedTotal },
    { metric: 'ap_spent_on_upgrades_total', value: report.prestige.apSpentOnUpgradesTotal },
    ...Object.entries(report.prestige.reclaimMilestones).map(([key, values]) => ({ metric: `reclaim_${key}_median_ms`, value: median(values) })),
  ];

  return {
    'balance_events.csv': toCsv(eventRows, baseEventColumns),
    'balance_lives.csv': toCsv(livesRows, ['lifeId','lifeOrdinal','sessionKind','startedAt','contentCapAt','prestigeApGained']),
    'balance_gates.csv': toCsv(gateRows, ['gateIndex','attempts','clears','defeats','bypasses','medianClearDurationSec','medianDefeatDurationSec','avgBossHpPctRemainingOnDefeat']),
    'balance_economy.csv': toCsv(economyRows, ['type','key','gold','merit','spiritStones']),
    'balance_support.csv': toCsv(supportRows, ['metric','key','count']),
    'balance_prestige.csv': toCsv(prestigeRows, ['metric','value']),
  };
}

export function parseBalanceTelemetryInput(input: unknown): BalanceTelemetryEvent[] {
  const maybe = input as any;
  if (Array.isArray(maybe)) return maybe as BalanceTelemetryEvent[];
  if (Array.isArray(maybe?.balanceEvents)) return maybe.balanceEvents as BalanceTelemetryEvent[];
  if (Array.isArray(maybe?.telemetry?.recentBalanceEvents)) return maybe.telemetry.recentBalanceEvents as BalanceTelemetryEvent[];
  throw new Error('Input JSON does not include a recognized balance telemetry event array.');
}
