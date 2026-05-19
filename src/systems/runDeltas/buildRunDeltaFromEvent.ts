import type { GameEvent } from '../../services/events/GameEvents.js';
import type { GrantRewardsResult, RewardBundle, RewardCurrencyBundle } from '../../services/rewards/types.js';
import type { RunCausalityDelta, RunDeltaSource } from './types.js';

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function summarizeCurrencies(currencies: RewardCurrencyBundle | undefined): string[] {
  if (!currencies) return [];
  return Object.entries(currencies)
    .filter(([, amount]) => amount != null && String(amount) !== '0')
    .map(([currency, amount]) => `+${amount} ${titleCase(currency)}`);
}

function summarizeRewardBundle(bundle: RewardBundle): string[] {
  const currencies = summarizeCurrencies(bundle.currencies);
  const items = (bundle.items ?? [])
    .filter((item) => item.qty > 0)
    .map((item) => `+${item.qty} ${titleCase(item.itemId)}`);
  return [...currencies, ...items].slice(0, 3);
}

function summarizeResult(result: GrantRewardsResult): {
  rewardSummary: string | null;
  currencies: string[];
  items: string[];
  doctrineAmount: number;
  heartLawId: string | null;
} {
  const currencies = Object.entries(result.appliedCurrencies ?? {})
    .filter(([, amount]) => amount != null && String(amount) !== '0')
    .map(([currency, amount]) => `+${amount} ${titleCase(currency)}`)
    .slice(0, 3);
  const items = (result.appliedItems ?? [])
    .map((entry) => `+${entry.qty} ${titleCase(entry.itemId)}`)
    .slice(0, 3);
  const doctrine = result.appliedComprehension ?? null;
  const doctrineAmount = doctrine?.applied ? doctrine.amount : 0;
  const summary = [...currencies, ...items].slice(0, 3).join(' - ');
  return {
    rewardSummary: summary || null,
    currencies,
    items,
    doctrineAmount,
    heartLawId: doctrine?.targetHeartLawId ?? null,
  };
}

function sourceFromRewardReason(reason: string): RunDeltaSource {
  const normalized = reason.toLowerCase();
  if (normalized.includes('bounty')) return 'bounty';
  if (normalized.includes('expedition')) return 'expedition';
  if (normalized.includes('trial') || normalized.includes('gate')) return 'trial';
  if (normalized.includes('craft') || normalized.includes('forge') || normalized.includes('alchemy')) return 'crafting';
  return 'rewards';
}

function eventTimestamp(event: GameEvent): number {
  const payload = event.payload as { timestamp?: number; claimedAt?: number; at?: number };
  return payload.timestamp ?? payload.claimedAt ?? payload.at ?? Date.now();
}

function deltaId(event: GameEvent, suffix: string): string {
  return `${event.type}:${eventTimestamp(event)}:${suffix}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasRewardServiceGrantedPayload(payload: unknown): payload is Extract<GameEvent, { type: 'rewards/granted' }>['payload'] {
  if (!isRecord(payload)) return false;
  if (typeof payload.reason !== 'string' || !payload.reason) return false;
  if (typeof payload.summary !== 'string') return false;
  if (typeof payload.timestamp !== 'number' || !Number.isFinite(payload.timestamp)) return false;
  if (!isRecord(payload.bundle) || !isRecord(payload.result)) return false;
  return true;
}

export type RunDeltaEventBuildResult =
  | { kind: 'push'; delta: RunCausalityDelta }
  | { kind: 'clear_then_push'; delta: RunCausalityDelta }
  | { kind: 'ignore' };

export function buildRunDeltaFromEvent(event: GameEvent): RunDeltaEventBuildResult {
  switch (event.type) {
    case 'rewards/granted': {
      if (!hasRewardServiceGrantedPayload(event.payload)) {
        return { kind: 'ignore' };
      }
      const result = summarizeResult(event.payload.result);
      const fallback = event.payload.summary || summarizeRewardBundle(event.payload.bundle).join(' - ');
      const rewardSummary = result.rewardSummary ?? fallback;
      const source = sourceFromRewardReason(event.payload.reason);
      return {
        kind: 'push',
        delta: {
          id: deltaId(event, event.payload.reason),
          source,
          timestamp: event.payload.timestamp,
          tone: 'success',
          label: result.doctrineAmount > 0 ? 'Doctrine refined' : 'Reward gained',
          detail: rewardSummary || 'Reward bundle applied.',
          memoryLine: result.doctrineAmount > 0
            ? `Doctrine refined: +${result.doctrineAmount} Comprehension.`
            : `Reward gained: ${rewardSummary || 'bundle applied'}.`,
          rewardSummary: rewardSummary || null,
          economyDelta: { currencies: result.currencies, items: result.items },
          doctrineDelta: result.doctrineAmount > 0
            ? { heartLawId: result.heartLawId, amount: result.doctrineAmount }
            : null,
        },
      };
    }

    case 'rewards/spent': {
      const parts = Object.entries(event.payload.costs ?? {})
        .filter(([, amount]) => amount != null && String(amount) !== '0')
        .map(([currency, amount]) => `-${amount} ${titleCase(currency)}`);
      if (parts.length === 0) return { kind: 'ignore' };
      const reason = event.payload.reason ?? 'support spend';
      if (!/safety|forge|apothecary|prep|gate|prestige/i.test(reason)) return { kind: 'ignore' };
      return {
        kind: 'push',
        delta: {
          id: deltaId(event, reason),
          source: 'spend',
          timestamp: Date.now(),
          tone: 'info',
          label: 'Reserve spent',
          detail: parts.join(' - '),
          memoryLine: `Reserve spent: ${parts.join(' - ')}.`,
          rewardSummary: parts.join(' - '),
          economyDelta: { currencies: parts },
        },
      };
    }

    case 'trials/attempt_resolved': {
      const outcome = event.payload.outcome;
      const defeated = outcome === 'defeated' || (outcome as string) === 'defeat';
      const cleared = outcome === 'cleared' || outcome === 'bypassed';
      const count = event.payload.eligibleFailCountAfterAttempt;
      return {
        kind: 'push',
        delta: {
          id: deltaId(event, `${event.payload.trialId}:${outcome}`),
          source: 'trial',
          timestamp: event.payload.timestamp,
          tone: defeated ? 'warning' : 'success',
          label: cleared ? 'Gate resolved' : 'Gate rejected',
          detail: defeated
            ? `Eligible defeat recorded${typeof count === 'number' ? `; Safety Net ${count}` : ''}.`
            : outcome === 'bypassed'
              ? 'Safety Net bypass resolved the gate.'
              : 'Gate trial cleared.',
          memoryLine: defeated
            ? `Gate rejected: eligible defeat ${typeof count === 'number' ? count : 'recorded'}.`
            : outcome === 'bypassed'
              ? 'Gate opened: Safety Net bypass resolved the proof.'
              : 'Gate opened: proof acquired.',
          routeDelta: cleared ? { label: 'Return to Cultivation', target: { kind: 'tab', tab: 'cultivation' } } : null,
        },
      };
    }

    case 'dao/impression_awarded':
      return {
        kind: 'push',
        delta: {
          id: deltaId(event, event.payload.awardId),
          source: 'dao_impression',
          timestamp: event.payload.timestamp,
          tone: event.payload.applied ? 'success' : 'info',
          label: `Dao Impression gained: ${event.payload.title}`,
          detail: event.payload.applied
            ? `+${event.payload.comprehensionDelta} Comprehension`
            : 'Spiritual trace recorded without comprehension.',
          memoryLine: event.payload.memoryLine,
          rewardSummary: event.payload.applied ? `+${event.payload.comprehensionDelta} Comprehension` : null,
          doctrineDelta: event.payload.applied
            ? { heartLawId: event.payload.targetHeartLawId, amount: event.payload.comprehensionDelta }
            : null,
          routeDelta: event.payload.routeKind && event.payload.routeLabel
            ? { label: event.payload.routeLabel }
            : null,
        },
      };

    case 'failure_reflection/updated':
      return {
        kind: 'push',
        delta: {
          id: deltaId(event, event.payload.reflectionId),
          source: 'trial',
          timestamp: event.payload.timestamp,
          tone: event.payload.resolved ? 'success' : 'warning',
          label: event.payload.resolved ? 'Inner Demon resolved' : 'Inner Demon Reflection',
          detail: event.payload.resolved
            ? `${event.payload.correctiveRouteLabel} settled the repeated gate pattern.`
            : `${event.payload.diagnosisCode} repeated ${event.payload.repeatedCount} times.`,
          memoryLine: event.payload.resolved
            ? `Resolved Inner Demon: ${event.payload.diagnosisCode} pattern settled.`
            : `Inner Demon: repeated ${event.payload.diagnosisCode} at the gate.`,
          routeDelta: event.payload.resolved
            ? null
            : { label: event.payload.correctiveRouteLabel },
        },
      };

    case 'progression/gate_resolved':
      return {
        kind: 'push',
        delta: {
          id: deltaId(event, event.payload.trialId),
          source: 'trial',
          timestamp: event.payload.timestamp,
          tone: 'success',
          label: 'Gate resolved',
          detail: `${titleCase(event.payload.resolution)} proof is ready.`,
          memoryLine: 'Gate opened: proof acquired. Breakthrough is next.',
          routeDelta: { label: 'Return to Cultivation', target: { kind: 'tab', tab: 'cultivation' } },
        },
      };

    case 'progression/breakthrough':
      return {
        kind: 'push',
        delta: {
          id: deltaId(event, `${event.payload.fromRealmIndex}:${event.payload.toRealmIndex}`),
          source: 'breakthrough',
          timestamp: event.payload.timestamp,
          tone: 'success',
          label: 'Breakthrough complete',
          detail: event.payload.major
            ? `Entered realm index ${event.payload.toRealmIndex}.`
            : `Advanced to substage ${event.payload.toSubstage}.`,
          memoryLine: event.payload.major
            ? `Breakthrough complete: entered realm index ${event.payload.toRealmIndex}.`
            : `Breakthrough complete: reached substage ${event.payload.toSubstage}.`,
        },
      };

    case 'progression/breakthrough_completed':
      return {
        kind: 'push',
        delta: {
          id: deltaId(event, `${event.payload.fromRealmIndex}:${event.payload.toRealmIndex}:completed`),
          source: 'breakthrough',
          timestamp: event.payload.timestamp,
          tone: 'success',
          label: 'Breakthrough ritual recorded',
          detail: event.payload.major
            ? `${event.payload.toRealmName ?? `Realm ${event.payload.toRealmIndex}`} entered.`
            : `Substage ${event.payload.toSubstage} entered.`,
          memoryLine: event.payload.major
            ? `This life remembers ${event.payload.toRealmName ?? `realm ${event.payload.toRealmIndex}`}.`
            : `Substage ${event.payload.toSubstage} crossed.`,
          routeDelta: event.payload.method === 'cap_transition'
            ? { label: 'Review Reincarnation', target: { kind: 'tab', tab: 'prestige' } }
            : undefined,
        },
      };

    case 'progression/city_entered':
      return {
        kind: 'push',
        delta: {
          id: deltaId(event, event.payload.cityId),
          source: 'breakthrough',
          timestamp: event.payload.timestamp,
          tone: 'info',
          label: 'City entered',
          detail: titleCase(event.payload.cityId),
          memoryLine: `City entered: ${titleCase(event.payload.cityId)}.`,
          routeDelta: { label: 'Open World', target: { kind: 'tab', tab: 'adventure' } },
        },
      };

    case 'progression/content_cap_reached':
      return {
        kind: 'push',
        delta: {
          id: deltaId(event, event.payload.realmId),
          source: 'prestige',
          timestamp: event.payload.timestamp,
          tone: 'info',
          label: 'Chapter cap reached',
          detail: 'Current authored chapter complete.',
          memoryLine: 'Current authored chapter complete. Review Reincarnation.',
          routeDelta: { label: 'Review Reincarnation', target: { kind: 'tab', tab: 'prestige' } },
        },
      };

    case 'bounties/claimed':
      return {
        kind: 'push',
        delta: {
          id: deltaId(event, event.payload.templateId),
          source: 'bounty',
          timestamp: event.payload.timestamp,
          tone: 'success',
          label: 'Bounty claimed',
          detail: summarizeRewardBundle(event.payload.rewards).join(' - ') || 'Merit reserve improved.',
          memoryLine: 'Bounty claimed: Merit reserve improved.',
        },
      };

    case 'expeditions/claimed':
      return {
        kind: 'push',
        delta: {
          id: deltaId(event, event.payload.expeditionTypeId),
          source: 'expedition',
          timestamp: event.payload.timestamp,
          tone: 'success',
          label: 'Expedition returned',
          detail: summarizeRewardBundle(event.payload.rolled).join(' - ') || 'Background supplies delivered.',
          memoryLine: 'Expedition returned: background supplies delivered.',
        },
      };

    case 'crafting/queue_completed':
    case 'crafting/session_completed':
      return {
        kind: 'push',
        delta: {
          id: deltaId(event, `${event.payload.station}:${event.payload.sourceId}`),
          source: 'crafting',
          timestamp: Date.now(),
          tone: 'success',
          label: 'Craft completed',
          detail: `${titleCase(event.payload.station)} work is ready.`,
          memoryLine: `Craft completed: ${titleCase(event.payload.station)} work is ready.`,
        },
      };

    case 'prestige/performed':
      return {
        kind: 'clear_then_push',
        delta: {
          id: deltaId(event, 'prestige'),
          source: 'prestige',
          timestamp: event.payload.timestamp,
          tone: 'success',
          label: 'Reincarnation performed',
          detail: `Gained ${event.payload.apGained} AP.`,
          memoryLine: `Reincarnation performed: +${event.payload.apGained} AP.`,
        },
      };

    case 'progression/life_started':
      return {
        kind: 'clear_then_push',
        delta: {
          id: deltaId(event, `life-${event.payload.lifeOrdinal ?? 1}`),
          source: 'life',
          timestamp: event.payload.timestamp,
          tone: 'info',
          label: 'New life started',
          detail: 'Per-life consequence memory was cleared.',
          memoryLine: 'New life started: per-life deltas cleared.',
        },
      };

    case 'offline/applied':
      if (Number(event.payload.effectiveOfflineSeconds) <= 0) return { kind: 'ignore' };
      return {
        kind: 'push',
        delta: {
          id: deltaId(event, 'offline'),
          source: 'offline',
          timestamp: event.payload.timestamp,
          tone: 'info',
          label: 'Offline progress applied',
          detail: `Qi gained ${event.payload.qiGained}; queues ready ${event.payload.queuedActionsReady}.`,
          memoryLine: 'Offline progress applied: cultivation and queues advanced.',
        },
      };

    default:
      return { kind: 'ignore' };
  }
}
