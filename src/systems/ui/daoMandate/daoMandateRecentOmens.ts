import type { DaoImpressionAward } from '../../daoImpressions/types.js';
import type { FailureReflectionRecord } from '../../failureReflection/types.js';
import type { RunCompassDeltaSummaryV2 } from '../runCompass/types.js';
import type { DaoMandateTone, DaoRecentOmen } from './daoMandateTypes.js';

type OmenCandidate = DaoRecentOmen & {
  priority: number;
  triggerHash: string;
};

export interface BuildDaoMandateRecentOmensArgs {
  now: number;
  runDeltas?: readonly RunCompassDeltaSummaryV2[];
  failureReflections?: readonly FailureReflectionRecord[];
  daoImpressions?: readonly DaoImpressionAward[];
  offlineReturn?: {
    state: 'changed' | 'progressed' | 'unchanged' | 'capped' | 'unavailable';
    label: string;
    detail: string;
    evidence: readonly string[];
  } | null;
  cap?: number;
}

const PLAYER_COPY_BLOCKLIST = /Packet|P7|debug|adapter|placeholder|TODO|Run Compass/i;

function safeLine(value: string, fallback: string): string {
  const cleaned = value.replace(PLAYER_COPY_BLOCKLIST, '').replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned : fallback;
}

function toneFromRunDelta(tone: RunCompassDeltaSummaryV2['tone']): DaoMandateTone {
  if (tone === 'success') return 'success';
  if (tone === 'warning') return 'warning';
  if (tone === 'danger') return 'danger';
  if (tone === 'muted') return 'muted';
  return 'info';
}

function readinessDeltaLabel(delta: RunCompassDeltaSummaryV2): string | null {
  if (delta.readinessDelta?.deltaLabel) return delta.readinessDelta.deltaLabel;
  if (delta.readinessDelta?.beforeLabel || delta.readinessDelta?.afterLabel) {
    return `${delta.readinessDelta.beforeLabel ?? 'Previous'} -> ${delta.readinessDelta.afterLabel ?? 'Current'}`;
  }
  return null;
}

function priorityForRunDelta(delta: RunCompassDeltaSummaryV2): number {
  const text = `${delta.source} ${delta.label} ${delta.detail} ${delta.memoryLine}`.toLowerCase();
  if (/blocked|safety net|cap recommended|chapter|content cap/.test(text)) return 0;
  if (/gate.*(clear|opened|proof|bypass)|realm entered|city unlock/.test(text)) return 5;
  if (/defeat|rejection|inner demon|route changed|mandate shifted/.test(text)) return 10;
  if (/offline|threshold|source route|resolved/.test(text)) return 15;
  if (/craft|medicine|forge|manual|technique|floor/.test(text)) return 20;
  if (/dao impression|impression/.test(text)) return 30;
  if (/ap|reincarnation|prestige/.test(text)) return 40;
  return 50;
}

function candidateFromRunDelta(delta: RunCompassDeltaSummaryV2): OmenCandidate {
  return {
    id: delta.id,
    source: delta.source,
    timestamp: delta.timestamp,
    tone: toneFromRunDelta(delta.tone),
    label: safeLine(delta.label, 'Recent omen'),
    detail: safeLine(delta.detail, delta.memoryLine),
    memoryLine: safeLine(delta.memoryLine, delta.detail),
    rewardSummary: delta.rewardSummary ?? null,
    readinessDeltaLabel: readinessDeltaLabel(delta),
    priority: priorityForRunDelta(delta),
    triggerHash: `run:${delta.source}:${delta.id}`,
  };
}

function detailForFailure(record: FailureReflectionRecord): string {
  const route = record.correctiveRoute.label;
  if (/underprepared|medicine|apothecary/i.test(record.diagnosisCode)) {
    return `The gate exposed a medicine reserve gap. ${route} is the corrective route.`;
  }
  if (/underforged|forge/i.test(record.diagnosisCode)) {
    return `The gate pressed through the current weapon floor. ${route} is the corrective route.`;
  }
  if (/underbuilt|technique|manual/i.test(record.diagnosisCode)) {
    return `The guardian revealed an unstable loadout. ${route} is the corrective route.`;
  }
  if (/undercultivated|qi/i.test(record.diagnosisCode)) {
    return `The gate exposed a Qi threshold weakness. ${route} is the corrective route.`;
  }
  if (/bypass|safety/i.test(record.diagnosisCode)) {
    return 'Safety Net proof is now available for this gate.';
  }
  return `The gate exposed a repeated pattern. ${route} is the corrective route.`;
}

function candidateFromFailure(record: FailureReflectionRecord): OmenCandidate | null {
  if (record.resolved || !record.memoryEligible) return null;
  const detail = detailForFailure(record);
  return {
    id: `failure:${record.reflectionId}`,
    source: 'failure_reflection',
    timestamp: record.lastUpdatedAt,
    tone: record.repeatedCount >= 3 ? 'warning' : 'info',
    label: 'Gate Reflection recorded',
    detail,
    memoryLine: `${detail} Seen ${record.repeatedCount} times at this gate.`,
    rewardSummary: null,
    readinessDeltaLabel: record.correctiveRoute.label,
    priority: record.repeatedCount >= 3 ? 0 : 10,
    triggerHash: `failure:${record.trialId}:${record.gateIndex}:${record.diagnosisCode}`,
  };
}

function candidateFromDaoImpression(award: DaoImpressionAward): OmenCandidate | null {
  if (!award.memoryEligible) return null;
  return {
    id: `dao-impression:${award.awardId}`,
    source: 'dao_impression',
    timestamp: award.createdAt,
    tone: award.applied ? 'success' : 'muted',
    label: safeLine(award.title, 'Dao Impression recorded'),
    detail: safeLine(award.memoryLine, 'A Dao Impression settled into memory.'),
    memoryLine: safeLine(award.memoryLine, 'A Dao Impression settled into memory.'),
    rewardSummary: award.applied ? `+${award.comprehensionDelta} Comprehension` : null,
    readinessDeltaLabel: award.routeHint?.label ?? null,
    priority: 30,
    triggerHash: `dao:${award.sourceKind}:${award.sourceEventKey}`,
  };
}

function candidateFromOfflineReturn(args: NonNullable<BuildDaoMandateRecentOmensArgs['offlineReturn']>, now: number): OmenCandidate | null {
  if (args.state === 'unavailable' || args.state === 'unchanged') return null;
  return {
    id: `offline-return:${args.state}`,
    source: 'offline',
    timestamp: now,
    tone: args.state === 'capped' ? 'warning' : 'info',
    label: safeLine(args.label, 'Offline settlement recorded'),
    detail: safeLine(args.detail, 'Offline settlement changed the current counsel.'),
    memoryLine: safeLine(args.evidence[0] ?? args.detail, args.detail),
    rewardSummary: null,
    readinessDeltaLabel: null,
    priority: args.state === 'capped' ? 0 : 15,
    triggerHash: `offline:${args.state}:${args.label}`,
  };
}

function dedupeAndSort(candidates: OmenCandidate[], cap: number): DaoRecentOmen[] {
  const byTrigger = new Map<string, OmenCandidate>();
  for (const candidate of candidates) {
    const existing = byTrigger.get(candidate.triggerHash);
    if (!existing || candidate.priority < existing.priority || (
      candidate.priority === existing.priority && candidate.timestamp >= existing.timestamp
    )) {
      byTrigger.set(candidate.triggerHash, candidate);
    }
  }

  return [...byTrigger.values()]
    .sort((left, right) => left.priority - right.priority || right.timestamp - left.timestamp || left.id.localeCompare(right.id))
    .slice(0, cap)
    .map(({ priority: _priority, triggerHash: _triggerHash, ...omen }) => omen);
}

export function buildDaoMandateRecentOmens(args: BuildDaoMandateRecentOmensArgs): DaoRecentOmen[] {
  const candidates: OmenCandidate[] = [];
  for (const delta of args.runDeltas ?? []) candidates.push(candidateFromRunDelta(delta));
  for (const record of args.failureReflections ?? []) {
    const candidate = candidateFromFailure(record);
    if (candidate) candidates.push(candidate);
  }
  for (const award of args.daoImpressions ?? []) {
    const candidate = candidateFromDaoImpression(award);
    if (candidate) candidates.push(candidate);
  }
  if (args.offlineReturn) {
    const candidate = candidateFromOfflineReturn(args.offlineReturn, args.now);
    if (candidate) candidates.push(candidate);
  }
  return dedupeAndSort(candidates, args.cap ?? 12);
}
