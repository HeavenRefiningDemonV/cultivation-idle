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
  | 'offline';

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
  | 'applied';

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
  | (BalanceTelemetryMeta & { kind: 'prestige/upgrade_purchased'; family: 'prestige'; name: 'upgrade_purchased'; payload: { upgradeId: string; nextLevel: number; apCost: number; remainingAP: number } })
  | (BalanceTelemetryMeta & { kind: 'reclaim/milestone_reached'; family: 'reclaim'; name: 'milestone_reached'; payload: { milestoneId: string; elapsedMsSinceLifeStart: number; sourceResetCheckpoint?: string } })
  | (BalanceTelemetryMeta & { kind: 'offline/applied'; family: 'offline'; name: 'applied'; payload: { rawOfflineSeconds: number; effectiveOfflineSeconds: number; effectiveEfficiency: number; wasCapped: boolean; qiGained: string; queuedActionsReady: number; expeditionsReady: number } });

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
  'prestige/upgrade_purchased',
  'reclaim/milestone_reached',
  'offline/applied',
] as const;
