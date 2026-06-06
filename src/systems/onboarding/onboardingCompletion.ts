import type { GameEvent } from '../../services/events/GameEvents.js';
import type {
  OnboardingEventFactState,
  OnboardingGateDefeatFact,
  OnboardingMilestoneId,
  OnboardingRuntimeMilestoneId,
  OnboardingTimestampEventFactKey,
} from './onboardingTypes.js';

export type OnboardingEventEffect =
  | { kind: 'record_fact'; fact: OnboardingTimestampEventFactKey; timestamp: number }
  | { kind: 'record_gate_defeat'; fact: OnboardingGateDefeatFact }
  | { kind: 'complete_milestone'; milestoneId: OnboardingMilestoneId; timestamp: number; reason: string }
  | { kind: 'activate_milestone'; milestoneId: OnboardingRuntimeMilestoneId; timestamp: number; reason: string };

const eventTimestamp = (event: GameEvent): number => {
  const payload = event.payload as { timestamp?: unknown; claimedAt?: unknown };
  if (typeof payload.timestamp === 'number') return payload.timestamp;
  if (typeof payload.claimedAt === 'number') return payload.claimedAt;
  return Date.now();
};

const sourceMatches = (payload: Record<string, unknown>, needle: string): boolean =>
  [payload.source, payload.sourceId, payload.moduleKey, payload.ruinId]
    .filter((value): value is string => typeof value === 'string')
    .some((value) => value.toLowerCase().includes(needle));

const complete = (milestoneId: OnboardingMilestoneId, timestamp: number, reason: string): OnboardingEventEffect => ({
  kind: 'complete_milestone',
  milestoneId,
  timestamp,
  reason,
});

const fact = (factId: OnboardingTimestampEventFactKey, timestamp: number): OnboardingEventEffect => ({
  kind: 'record_fact',
  fact: factId,
  timestamp,
});

export function deriveOnboardingEventEffects(event: GameEvent): OnboardingEventEffect[] {
  const timestamp = eventTimestamp(event);
  switch (event.type) {
    case 'progression/life_started':
      return event.payload.sessionKind === 'first_life' && event.payload.trigger !== 'prestige_reset'
        ? [
          complete('M0_life_start', timestamp, 'first_life_committed'),
          { kind: 'activate_milestone', milestoneId: 'M1_cultivation_only', timestamp, reason: 'first_life_committed' },
        ]
        : [];

    case 'ui/tab_changed':
      return event.payload.next === 'status'
        ? [fact('statusOpenedAt', timestamp), complete('M2_status_unlock', timestamp, 'status_tab_opened')]
        : [];

    case 'progression/breakthrough_completed': {
      const effects: OnboardingEventEffect[] = [];
      if (event.payload.fromRealmIndex === 0 && event.payload.fromSubstage === 1 && event.payload.toSubstage === 2) {
        effects.push(complete('M1_cultivation_only', timestamp, 'first_qi_breakthrough'));
        effects.push({ kind: 'activate_milestone', milestoneId: 'M2_status_unlock', timestamp, reason: 'first_qi_breakthrough' });
      }
      if (event.payload.major && event.payload.toRealmIndex >= 1) {
        effects.push(fact('firstFoundationBreakthroughAt', timestamp));
        effects.push(complete('M10_foundation_graduation', timestamp, 'foundation_breakthrough_completed'));
      }
      return effects;
    }

    case 'progression/breakthrough': {
      if (event.payload.major && event.payload.toRealmIndex >= 1) {
        return [
          fact('firstFoundationBreakthroughAt', timestamp),
          complete('M10_foundation_graduation', timestamp, 'foundation_breakthrough_completed'),
        ];
      }
      if (event.payload.fromRealmIndex === 0 && event.payload.fromSubstage === 1 && event.payload.toSubstage === 2) {
        return [
          complete('M1_cultivation_only', timestamp, 'first_qi_breakthrough'),
          { kind: 'activate_milestone', milestoneId: 'M2_status_unlock', timestamp, reason: 'first_qi_breakthrough' },
        ];
      }
      return [];
    }

    case 'combat/resolved': {
      const payload = event.payload as Record<string, unknown>;
      if (event.payload.outcome !== 'victory') return [];
      if (sourceMatches(payload, 'outskirts')) {
        return [
          fact('firstOutskirtsRewardClaimedAt', timestamp),
          complete('M3_world_outskirts', timestamp, 'first_outskirts_victory'),
        ];
      }
      if (sourceMatches(payload, 'ruin')) {
        return [
          fact('firstRuinOrBountySupportAt', timestamp),
          complete('M8_ruins_bounties', timestamp, 'first_ruins_support_victory'),
        ];
      }
      return [];
    }

    case 'rewards/granted':
      return event.payload.reason.toLowerCase().includes('outskirts')
        ? [fact('firstOutskirtsRewardClaimedAt', timestamp), complete('M3_world_outskirts', timestamp, 'first_outskirts_reward')]
        : [];

    case 'pavilion/buy_success':
    case 'manuals/purchased':
      return [fact('firstManualAcquiredAt', timestamp), complete('M4_pavilion_satchel', timestamp, 'first_manual_acquired')];

    case 'manuals/studied':
      return [fact('firstManualStudyObservedAt', timestamp)];

    case 'techniques/equipped':
      return [
        fact('firstTechniqueEquippedAt', timestamp),
        complete('M5_techniques_loadout', timestamp, 'first_technique_equipped'),
      ];

    case 'techniques/equip_changed':
      return event.payload.action === 'equip' || event.payload.action === 'swap'
        ? [fact('firstTechniqueEquippedAt', timestamp), complete('M5_techniques_loadout', timestamp, 'first_technique_equipped')]
        : [];

    case 'expeditions/started':
      return [fact('firstExpeditionStartedAt', timestamp)];

    case 'apothecary/buy_success':
      return [complete('M6_apothecary_expedition', timestamp, 'first_apothecary_purchase')];

    case 'pouch/equip':
      return [
        fact('firstPouchEquippedAt', timestamp),
        complete('M6_apothecary_expedition', timestamp, 'first_pouch_equipped'),
      ];

    case 'forge/refine_result':
    case 'forge/temper_result':
      return event.payload.ok
        ? [fact('firstForgeUpgradeAt', timestamp), complete('M7_forge', timestamp, 'first_forge_upgrade')]
        : [];

    case 'crafting/session_claimed':
      return event.payload.station === 'forge'
        ? [fact('firstForgeUpgradeAt', timestamp), complete('M7_forge', timestamp, 'first_forge_claim')]
        : [];

    case 'bounties/claimed':
      return [
        fact('firstRuinOrBountySupportAt', timestamp),
        complete('M8_ruins_bounties', timestamp, 'first_bounty_support_claimed'),
      ];

    case 'trials/attempt_resolved':
      if (event.payload.outcome === 'cleared' || event.payload.outcome === 'bypassed') {
        return [fact('firstGateResolvedAt', timestamp), complete('M9_gate_trial', timestamp, 'gate_trial_resolved')];
      }
      if (event.payload.outcome === 'defeated') {
        return [{
          kind: 'record_gate_defeat',
          fact: {
            timestamp,
            ...(event.payload.diagnosisCode ? { diagnosisCode: event.payload.diagnosisCode } : {}),
            ...(event.payload.topFixDestination ? { topFixDestination: event.payload.topFixDestination } : {}),
            ...(event.payload.topFixReason ? { topFixReason: event.payload.topFixReason } : {}),
          },
        }];
      }
      return [];

    case 'progression/gate_resolved':
      return [
        fact('firstGateResolvedAt', timestamp),
        complete('M9_gate_trial', timestamp, 'gate_trial_resolved'),
      ];

    default:
      return [];
  }
}

export function getOnboardingFactFromEvent(event: GameEvent): null | {
  fact: keyof OnboardingEventFactState;
  timestamp: number;
  relatedMilestoneId?: OnboardingMilestoneId;
} {
  const effect = deriveOnboardingEventEffects(event).find((entry) => entry.kind === 'record_fact');
  return effect?.kind === 'record_fact' ? { fact: effect.fact, timestamp: effect.timestamp } : null;
}

export function getMilestoneCompletionFromEvent(event: GameEvent): null | {
  milestoneId: OnboardingMilestoneId;
  timestamp: number;
  reason: string;
} {
  const effect = deriveOnboardingEventEffects(event).find((entry) => entry.kind === 'complete_milestone');
  return effect?.kind === 'complete_milestone'
    ? { milestoneId: effect.milestoneId, timestamp: effect.timestamp, reason: effect.reason }
    : null;
}
