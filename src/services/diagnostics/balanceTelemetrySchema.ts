import type { ReadinessBand, ReadinessShortfallCode } from '../../systems/readiness/readinessScoringTypes.js';
import type { FailureDiagnosisCode } from '../../systems/readiness/failureDiagnosisTypes.js';

export const BALANCE_TELEMETRY_SCHEMA_VERSION = 1 as const;

export type BalanceSessionKind = 'first_life' | 'reclaim';

export type EconomySourceKind =
  | 'outskirts'
  | 'ruins_room'
  | 'ruins_chest'
  | 'ruins_rare'
  | 'bounty'
  | 'expedition'
  | 'trial_clear'
  | 'eligible_defeat_merit'
  | 'manual_pavilion'
  | 'craft_completion'
  | 'debug'
  | 'other';

export type EconomySinkKind =
  | 'apothecary_shop'
  | 'apothecary_bundle'
  | 'alchemy_queue'
  | 'talisman_queue'
  | 'forge_service'
  | 'craft_session'
  | 'gate_fail_safe_purchase'
  | 'prestige_purchase'
  | 'heart_law_change'
  | 'breakthrough_gate_item'
  | 'other';

export const ECONOMY_SOURCE_KINDS: readonly EconomySourceKind[] = [
  'outskirts',
  'ruins_room',
  'ruins_chest',
  'ruins_rare',
  'bounty',
  'expedition',
  'trial_clear',
  'eligible_defeat_merit',
  'manual_pavilion',
  'craft_completion',
  'debug',
  'other',
] as const;

export const ECONOMY_SINK_KINDS: readonly EconomySinkKind[] = [
  'apothecary_shop',
  'apothecary_bundle',
  'alchemy_queue',
  'talisman_queue',
  'forge_service',
  'craft_session',
  'gate_fail_safe_purchase',
  'prestige_purchase',
  'heart_law_change',
  'breakthrough_gate_item',
  'other',
] as const;

export type BalanceTelemetryFamily =
  | 'progression'
  | 'trials'
  | 'readiness'
  | 'diagnosis'
  | 'economy'
  | 'support'
  | 'prestige'
  | 'reclaim'
  | 'offline'
  | 'training'
  | 'dao_heart'
  | 'breakthrough';

export type BalanceTelemetryName =
  | 'life_started'
  | 'gate_available'
  | 'breakthrough'
  | 'city_entered'
  | 'content_cap_reached'
  | 'attempt_started'
  | 'attempt_resolved'
  | 'gate_resolved'
  | 'snapshot'
  | 'computed'
  | 'currency_earned'
  | 'currency_spent'
  | 'items_gained'
  | 'items_spent'
  | 'bounty_claimed'
  | 'expedition_started'
  | 'expedition_claimed'
  | 'performed'
  | 'upgrade_purchased'
  | 'milestone_reached'
  | 'applied'
  | 'started'
  | 'grade_changed'
  | 'cap_hit'
  | 'offline_applied'
  | 'level_changed'
  | 'attempted'
  | 'memory_applied'
  | 'reset_bucket_applied'
  | 'gate_attempted';

export type BalanceTelemetryKind = `${BalanceTelemetryFamily}/${BalanceTelemetryName}`;

export interface BalanceTelemetryMeta {
  schemaVersion: typeof BALANCE_TELEMETRY_SCHEMA_VERSION;
  eventId: string;
  emittedAt: number;
  family: BalanceTelemetryFamily;
  name: BalanceTelemetryName;
  kind: BalanceTelemetryKind;
  lifeId?: string;
  lifeOrdinal?: number;
  sessionKind?: BalanceSessionKind;
  prestigeCount?: number;
  realmIndex?: number;
  realmId?: string;
  substage?: number;
  cityId?: string | null;
  cityIndex?: number | null;
  elapsedMsSinceLifeStart?: number;
}

type CurrencySnapshot = Partial<Record<'gold' | 'spiritStones' | 'merit', string>>;

type ItemSnapshot = Array<{ itemId: string; qty: number }>;

export type BalanceTelemetryEvent =
  | (BalanceTelemetryMeta & { kind: 'progression/life_started'; family: 'progression'; name: 'life_started'; payload: { trigger: 'hard_reset' | 'prestige_reset' | 'fresh_start' | 'other'; runStartTime: number } })
  | (BalanceTelemetryMeta & { kind: 'progression/gate_available'; family: 'progression'; name: 'gate_available'; payload: { trialId: string; gateIndex: number; fromRealmId: string; toRealmId: string } })
  | (BalanceTelemetryMeta & { kind: 'progression/breakthrough'; family: 'progression'; name: 'breakthrough'; payload: { fromRealmIndex: number; toRealmIndex: number; fromRealmId: string; toRealmId: string; major: boolean } })
  | (BalanceTelemetryMeta & { kind: 'progression/city_entered'; family: 'progression'; name: 'city_entered'; payload: { cityId: string; unlockedBecauseRealmId: string } })
  | (BalanceTelemetryMeta & { kind: 'progression/content_cap_reached'; family: 'progression'; name: 'content_cap_reached'; payload: { realmId: string; cityId: string | null } })
  | (BalanceTelemetryMeta & { kind: 'trials/attempt_started'; family: 'trials'; name: 'attempt_started'; payload: { trialId: string; gateIndex: number; attemptId: string; attemptNumberThisLife: number; countsTowardFailSafe: boolean; lifecycleState: string } })
  | (BalanceTelemetryMeta & { kind: 'trials/attempt_resolved'; family: 'trials'; name: 'attempt_resolved'; payload: { trialId: string; gateIndex: number; attemptId: string; outcome: 'cleared' | 'defeated' | 'bypassed'; durationSec: number; bossHpPctRemaining?: number; countsTowardFailSafe: boolean; eligibleFailCountAfterAttempt?: number } })
  | (BalanceTelemetryMeta & { kind: 'trials/gate_resolved'; family: 'trials'; name: 'gate_resolved'; payload: { trialId: string; gateIndex: number; resolution: 'cleared' | 'bypassed' } })
  | (BalanceTelemetryMeta & { kind: 'readiness/snapshot'; family: 'readiness'; name: 'snapshot'; payload: { trialId: string; overallBand: ReadinessBand; buildBand: ReadinessBand; forgeBand: ReadinessBand; economicBand: ReadinessBand; postureBand: ReadinessBand; topShortfallCodes: ReadinessShortfallCode[] } })
  | (BalanceTelemetryMeta & { kind: 'diagnosis/computed'; family: 'diagnosis'; name: 'computed'; payload: { trialId: string; primary: FailureDiagnosisCode; secondary: FailureDiagnosisCode | null; topFixKeys: string[]; bossHpPct?: number; durationSec?: number; spikeRatio?: number; timeToDieSec?: number | null } })
  | (BalanceTelemetryMeta & { kind: 'economy/currency_earned'; family: 'economy'; name: 'currency_earned'; payload: { reason: string; sourceKind: EconomySourceKind; currencies: CurrencySnapshot; module?: string } })
  | (BalanceTelemetryMeta & { kind: 'economy/currency_spent'; family: 'economy'; name: 'currency_spent'; payload: { reason: string; sinkKind: EconomySinkKind; currencies: CurrencySnapshot; module?: string } })
  | (BalanceTelemetryMeta & { kind: 'economy/items_gained'; family: 'economy'; name: 'items_gained'; payload: { reason: string; sourceKind: EconomySourceKind; items: ItemSnapshot; module?: string } })
  | (BalanceTelemetryMeta & { kind: 'economy/items_spent'; family: 'economy'; name: 'items_spent'; payload: { reason: string; sinkKind: EconomySinkKind; items: ItemSnapshot; module?: string } })
  | (BalanceTelemetryMeta & { kind: 'support/bounty_claimed'; family: 'support'; name: 'bounty_claimed'; payload: { cityId: string; templateId: string; difficulty: string; kind: string; rewards: { currencies: CurrencySnapshot; items: ItemSnapshot }; claimedAt: number; ageSec?: number } })
  | (BalanceTelemetryMeta & { kind: 'support/expedition_started'; family: 'support'; name: 'expedition_started'; payload: { slotIndex: number; expeditionTypeId: string; durationId: string; durationSeconds: number; cityId: string } })
  | (BalanceTelemetryMeta & { kind: 'support/expedition_claimed'; family: 'support'; name: 'expedition_claimed'; payload: { slotIndex: number; expeditionTypeId: string; durationId: string; cityId: string; rareDropItemId?: string; rewards: { currencies: CurrencySnapshot; items: ItemSnapshot } } })
  | (BalanceTelemetryMeta & { kind: 'prestige/performed'; family: 'prestige'; name: 'performed'; payload: { apGained: number; totalAPAfter: number; realmReached: number; resolvedGateCount: number; timeSpentSec: number; advisorLabel?: string } })
  | (BalanceTelemetryMeta & { kind: 'prestige/started'; family: 'prestige'; name: 'started'; payload: { realm: number; ap: number; trainedStats: Record<string, number>; heartLawLevel: number; retainedMemory: number } })
  | (BalanceTelemetryMeta & { kind: 'prestige/memory_applied'; family: 'prestige'; name: 'memory_applied'; payload: { effectId: string; rank: number; value: number; targetId?: string } })
  | (BalanceTelemetryMeta & { kind: 'prestige/reset_bucket_applied'; family: 'prestige'; name: 'reset_bucket_applied'; payload: { bucketId: string; kind: 'reset' | 'carry' | 'rebuilt' | 'hybrid'; label: string } })
  | (BalanceTelemetryMeta & { kind: 'prestige/upgrade_purchased'; family: 'prestige'; name: 'upgrade_purchased'; payload: { upgradeId: string; nextLevel: number; apCost: number; remainingAP: number } })
  | (BalanceTelemetryMeta & { kind: 'reclaim/milestone_reached'; family: 'reclaim'; name: 'milestone_reached'; payload: { milestoneId: string; elapsedMsSinceLifeStart: number; sourceResetCheckpoint?: string } })
  | (BalanceTelemetryMeta & { kind: 'offline/applied'; family: 'offline'; name: 'applied'; payload: { rawOfflineSeconds: number; effectiveOfflineSeconds: number; effectiveEfficiency: number; wasCapped: boolean; qiGained: string; queuedActionsReady: number; expeditionsReady: number } })
  | (BalanceTelemetryMeta & { kind: 'training/started'; family: 'training'; name: 'started'; payload: { path: string; regimenId: string; intensity: string; realmId: string; ratingSnapshot: Record<string, number>; fatigue: number } })
  | (BalanceTelemetryMeta & { kind: 'training/grade_changed'; family: 'training'; name: 'grade_changed'; payload: { statId: string; oldGrade: number; newGrade: number; minutesSinceLastGrade: number; realmId: string } })
  | (BalanceTelemetryMeta & { kind: 'training/cap_hit'; family: 'training'; name: 'cap_hit'; payload: { statId: string; realmId: string; rating: number; masteryRank: number } })
  | (BalanceTelemetryMeta & { kind: 'training/offline_applied'; family: 'training'; name: 'offline_applied'; payload: { appliedMs: number; ratingGainedById: Record<string, number>; statXpGainedById: Record<string, number>; masteryXpGainedByRegimenId: Record<string, number>; fatigueGained: number; intensityDowngrades: number; blockedReason?: string } })
  | (BalanceTelemetryMeta & { kind: 'dao_heart/started'; family: 'dao_heart'; name: 'started'; payload: { lawId: string; activityId: string; parityDelta: number; turbulence: number; clarity: number } })
  | (BalanceTelemetryMeta & { kind: 'dao_heart/level_changed'; family: 'dao_heart'; name: 'level_changed'; payload: { lawId: string; oldLevel: number; newLevel: number; parityDelta: number } })
  | (BalanceTelemetryMeta & { kind: 'dao_heart/offline_applied'; family: 'dao_heart'; name: 'offline_applied'; payload: { lawId: string; activityId: string; appliedMs: number; heartLawXpGain: number; verseMasteryGain: number; clarityGain: number; turbulenceGain: number; levelsGained: number; blockedReason?: string } })
  | (BalanceTelemetryMeta & { kind: 'breakthrough/attempted'; family: 'breakthrough'; name: 'attempted'; payload: { fromRealm: string; risk: number; causeRows: Array<{ id: string; value: number }>; parityDelta: number; fatigue: number; result: 'success' | 'failure' | 'blocked' } })
  | (BalanceTelemetryMeta & { kind: 'trials/gate_attempted'; family: 'trials'; name: 'gate_attempted'; payload: { trialId: string; readinessScore: number; categoryScores: Record<string, number>; path: string | null; lawId: string | null; result: 'cleared' | 'defeated' | 'blocked' | 'bypassed' } });

export const BALANCE_TELEMETRY_KINDS: readonly BalanceTelemetryKind[] = [
  'progression/life_started',
  'progression/gate_available',
  'progression/breakthrough',
  'progression/city_entered',
  'progression/content_cap_reached',
  'trials/attempt_started',
  'trials/attempt_resolved',
  'trials/gate_resolved',
  'readiness/snapshot',
  'diagnosis/computed',
  'economy/currency_earned',
  'economy/currency_spent',
  'economy/items_gained',
  'economy/items_spent',
  'support/bounty_claimed',
  'support/expedition_started',
  'support/expedition_claimed',
  'prestige/performed',
  'prestige/started',
  'prestige/memory_applied',
  'prestige/reset_bucket_applied',
  'prestige/upgrade_purchased',
  'reclaim/milestone_reached',
  'offline/applied',
  'training/started',
  'training/grade_changed',
  'training/cap_hit',
  'training/offline_applied',
  'dao_heart/started',
  'dao_heart/level_changed',
  'dao_heart/offline_applied',
  'breakthrough/attempted',
  'trials/gate_attempted',
] as const;
