import { GameEvents, type GameEvent } from '../events/GameEvents.js';
import { useTelemetryStore } from '../../stores/telemetryStore.js';
import {
  BALANCE_TELEMETRY_SCHEMA_VERSION,
  type BalanceTelemetryEvent,
  type BalanceSessionKind,
  type EconomySinkKind,
  type EconomySourceKind,
} from './balanceTelemetrySchema.js';
import { useGameStore } from '../../stores/gameStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useCityStore } from '../../stores/cityStore.js';
import { buildSection5ReadinessSurface } from '../../systems/readiness/section5Adapters.js';
import { useTrialStore } from '../../stores/trialStore.js';
import { getProgressionContract, getTransitionByTrialId } from '../../systems/progression/contract/progressionContract.js';
import { adaptProgressionAuthoredContent } from '../../systems/progression/contract/contentAdapter.js';
import { useContentStore } from '../../stores/contentStore.js';
import { getLiveRealmByIndex } from '../../systems/progression/runtime/index.js';

let initialized = false;
let nextEventId = 1;

function classifySourceKind(reason: string): EconomySourceKind {
  const r = reason.toLowerCase();
  if (r.startsWith('outskirts victory')) return 'outskirts';
  if (r.includes('ruins room')) return 'ruins_room';
  if (r.includes('ruins chest')) return 'ruins_chest';
  if (r.includes('ruins rare')) return 'ruins_rare';
  if (r.startsWith('bounty:')) return 'bounty';
  if (r.startsWith('expedition_claim:')) return 'expedition';
  if (r === 'gate trial clear') return 'trial_clear';
  if (r.startsWith('gate trial eligible defeat:')) return 'eligible_defeat_merit';
  if (r.startsWith('manual pavilion')) return 'manual_pavilion';
  if (r.startsWith('alchemy:') || r.startsWith('talisman:') || r.startsWith('forge session:') || r.startsWith('alchemy session:')) return 'craft_completion';
  if (r.startsWith('debug:')) return 'debug';
  return 'other';
}

function classifySinkKind(reason?: string): EconomySinkKind {
  const r = (reason ?? '').toLowerCase();
  if (r.startsWith('shop:')) return 'apothecary_shop';
  if (r.startsWith('apothecary_bundle:')) return 'apothecary_bundle';
  if (r.startsWith('alchemy_queue:')) return 'alchemy_queue';
  if (r.startsWith('talisman_queue:')) return 'talisman_queue';
  if (r.startsWith('forge:')) return 'forge_service';
  if (r.startsWith('craftsession:')) return 'craft_session';
  if (r.startsWith('gate_fail_safe:')) return 'gate_fail_safe_purchase';
  if (r.startsWith('prestige_purchase:')) return 'prestige_purchase';
  if (r.startsWith('heartlaw:')) return 'heart_law_change';
  if (r.startsWith('breakthrough_gate_item:')) return 'breakthrough_gate_item';
  return 'other';
}

function deriveContext() {
  const game = useGameStore.getState();
  const prestige = usePrestigeStore.getState();
  const city = useCityStore.getState();
  const runStartTime = game.runStartTime;
  const emittedAt = Date.now();
  const sessionKind: BalanceSessionKind = prestige.prestigeCount > 0 ? 'reclaim' : 'first_life';
  return {
    emittedAt,
    lifeId: `${runStartTime}:${prestige.prestigeCount}`,
    lifeOrdinal: prestige.prestigeCount + 1,
    sessionKind,
    prestigeCount: prestige.prestigeCount,
    realmIndex: game.realm.index,
    realmId: getLiveRealmByIndex(game.realm.index).id,
    substage: game.realm.substage,
    cityId: city.currentCityId,
    cityIndex: city.currentCityId ? useContentStore.getState().maps.citiesById[city.currentCityId]?.index ?? null : null,
    elapsedMsSinceLifeStart: Math.max(0, emittedAt - runStartTime),
  };
}

function toSummary(event: BalanceTelemetryEvent): string {
  return event.kind;
}

function emitBalanceEvent(
  event: Omit<BalanceTelemetryEvent, 'schemaVersion' | 'eventId' | 'emittedAt' | 'lifeId' | 'lifeOrdinal' | 'sessionKind' | 'prestigeCount' | 'realmIndex' | 'realmId' | 'substage' | 'cityId' | 'cityIndex' | 'elapsedMsSinceLifeStart'>,
  contextOverrides?: Partial<Pick<BalanceTelemetryEvent, 'emittedAt' | 'elapsedMsSinceLifeStart'>>,
) {
  const context = deriveContext();
  const normalized: BalanceTelemetryEvent = {
    ...event,
    schemaVersion: BALANCE_TELEMETRY_SCHEMA_VERSION,
    eventId: `bal_${nextEventId++}`,
    emittedAt: contextOverrides?.emittedAt ?? context.emittedAt,
    lifeId: context.lifeId,
    lifeOrdinal: context.lifeOrdinal,
    sessionKind: context.sessionKind,
    prestigeCount: context.prestigeCount,
    realmIndex: context.realmIndex,
    realmId: context.realmId,
    substage: context.substage,
    cityId: context.cityId,
    cityIndex: context.cityIndex,
    elapsedMsSinceLifeStart: contextOverrides?.elapsedMsSinceLifeStart ?? context.elapsedMsSinceLifeStart,
  } as BalanceTelemetryEvent;

  useTelemetryStore.getState().addBalanceEvent({
    ts: normalized.emittedAt,
    kind: normalized.kind,
    summary: toSummary(normalized),
    payload: normalized,
  });

  if (normalized.sessionKind !== 'reclaim') return;
  let milestoneId: string | null = null;
  if (normalized.kind === 'progression/gate_available') {
    milestoneId = normalized.payload.gateIndex === 1 ? 'gate_1_available' : null;
  } else if (normalized.kind === 'progression/breakthrough') {
    milestoneId = normalized.payload.toRealmIndex === 1
      ? 'foundation_entry'
      : normalized.payload.toRealmIndex === 2
        ? 'core_reentry'
        : normalized.payload.toRealmIndex === 3
          ? 'nascent_reentry'
          : null;
  }
  if (milestoneId) {
    emitBalanceEvent({
      family: 'reclaim',
      name: 'milestone_reached',
      kind: 'reclaim/milestone_reached',
      payload: {
        milestoneId,
        elapsedMsSinceLifeStart: normalized.elapsedMsSinceLifeStart ?? 0,
      },
    });
  }
}

function emitFromRuntimeEvent(event: GameEvent) {
  switch (event.type) {
    case 'progression/life_started':
      emitBalanceEvent({ family: 'progression', name: 'life_started', kind: 'progression/life_started', payload: { trigger: event.payload.trigger ?? 'other', runStartTime: event.payload.runStartTime } }, { emittedAt: event.payload.timestamp, elapsedMsSinceLifeStart: event.payload.elapsedMsSinceLifeStart });
      return;
    case 'progression/gate_available':
      emitBalanceEvent({ family: 'progression', name: 'gate_available', kind: 'progression/gate_available', payload: { trialId: event.payload.trialId, gateIndex: event.payload.gateIndex, fromRealmId: event.payload.fromRealmId, toRealmId: event.payload.toRealmId } }, { emittedAt: event.payload.timestamp, elapsedMsSinceLifeStart: event.payload.elapsedMsSinceLifeStart });
      return;
    case 'progression/breakthrough':
      emitBalanceEvent({ family: 'progression', name: 'breakthrough', kind: 'progression/breakthrough', payload: { fromRealmIndex: event.payload.fromRealmIndex, toRealmIndex: event.payload.toRealmIndex, fromRealmId: event.payload.fromRealmId, toRealmId: event.payload.toRealmId, major: event.payload.major } }, { emittedAt: event.payload.timestamp, elapsedMsSinceLifeStart: event.payload.elapsedMsSinceLifeStart });
      return;
    case 'progression/city_entered':
      emitBalanceEvent({ family: 'progression', name: 'city_entered', kind: 'progression/city_entered', payload: { cityId: event.payload.cityId, unlockedBecauseRealmId: event.payload.majorRealmId } }, { emittedAt: event.payload.timestamp, elapsedMsSinceLifeStart: event.payload.elapsedMsSinceLifeStart });
      return;
    case 'progression/content_cap_reached':
      emitBalanceEvent({ family: 'progression', name: 'content_cap_reached', kind: 'progression/content_cap_reached', payload: { realmId: event.payload.realmId, cityId: event.payload.cityId } }, { emittedAt: event.payload.timestamp, elapsedMsSinceLifeStart: event.payload.elapsedMsSinceLifeStart });
      return;
    case 'trials/attempt_started': {
      emitBalanceEvent({ family: 'trials', name: 'attempt_started', kind: 'trials/attempt_started', payload: event.payload });
      const readiness = buildSection5ReadinessSurface(event.payload.trialId)?.readiness;
      if (readiness) {
        emitBalanceEvent({
          family: 'readiness',
          name: 'snapshot',
          kind: 'readiness/snapshot',
          payload: {
            trialId: event.payload.trialId,
            overallBand: readiness.overallBand,
            buildBand: readiness.build.band,
            forgeBand: readiness.forge.band,
            economicBand: readiness.economic.band,
            postureBand: readiness.posture.band,
            topShortfallCodes: readiness.shortfalls.slice(0, 3).map((entry) => entry.code),
          },
        });
      }
      return;
    }
    case 'trials/attempt_resolved': {
      emitBalanceEvent({ family: 'trials', name: 'attempt_resolved', kind: 'trials/attempt_resolved', payload: event.payload });
      if (event.payload.outcome === 'cleared' || event.payload.outcome === 'bypassed') {
        emitBalanceEvent({ family: 'trials', name: 'gate_resolved', kind: 'trials/gate_resolved', payload: { trialId: event.payload.trialId, gateIndex: event.payload.gateIndex, resolution: event.payload.outcome } });
      }
      const surface = buildSection5ReadinessSurface(event.payload.trialId);
      if (surface?.diagnosis) {
        emitBalanceEvent({
          family: 'diagnosis',
          name: 'computed',
          kind: 'diagnosis/computed',
          payload: {
            trialId: event.payload.trialId,
            primary: surface.diagnosis.primary,
            secondary: surface.diagnosis.secondary,
            topFixKeys: surface.diagnosis.topFixes.map((fix) => fix.code),
            bossHpPct: surface.lastAttemptSummary?.bossHpPct,
            durationSec: surface.lastAttemptSummary?.durationSec,
            spikeRatio: surface.lastAttemptSummary?.spikeRatio,
            timeToDieSec: surface.lastAttemptSummary?.timeToDieSec,
          },
        });
      }
      return;
    }
    case 'rewards/granted': {
      const sourceKind = classifySourceKind(event.payload.reason);
      const module = event.payload.reason.split(':')[0] ?? 'other';
      if (event.payload.result.appliedCurrencies && Object.keys(event.payload.result.appliedCurrencies).length > 0) {
        emitBalanceEvent({ family: 'economy', name: 'currency_earned', kind: 'economy/currency_earned', payload: { reason: event.payload.reason, sourceKind, currencies: event.payload.result.appliedCurrencies, module } });
      }
      if (event.payload.result.appliedItems.length > 0) {
        emitBalanceEvent({ family: 'economy', name: 'items_gained', kind: 'economy/items_gained', payload: { reason: event.payload.reason, sourceKind, items: event.payload.result.appliedItems, module } });
      }
      return;
    }
    case 'rewards/spent':
      emitBalanceEvent({ family: 'economy', name: 'currency_spent', kind: 'economy/currency_spent', payload: { reason: event.payload.reason ?? 'unspecified', sinkKind: classifySinkKind(event.payload.reason), currencies: event.payload.costs, module: event.payload.reason?.split(':')[0] } });
      return;
    case 'economy/items_spent':
      emitBalanceEvent({ family: 'economy', name: 'items_spent', kind: 'economy/items_spent', payload: { reason: event.payload.reason, sinkKind: classifySinkKind(event.payload.reason), items: event.payload.items, module: event.payload.module } });
      return;
    case 'bounties/claimed':
      emitBalanceEvent({ family: 'support', name: 'bounty_claimed', kind: 'support/bounty_claimed', payload: { cityId: event.payload.cityId, templateId: event.payload.templateId, difficulty: event.payload.difficulty, kind: event.payload.kind, rewards: { currencies: event.payload.rewards.currencies ?? {}, items: event.payload.rewards.items ?? [] }, claimedAt: event.payload.claimedAt, ageSec: Math.max(0, (event.payload.claimedAt - event.payload.createdAt) / 1000) } });
      return;
    case 'expeditions/started':
      emitBalanceEvent({ family: 'support', name: 'expedition_started', kind: 'support/expedition_started', payload: event.payload });
      return;
    case 'expeditions/claimed':
      emitBalanceEvent({ family: 'support', name: 'expedition_claimed', kind: 'support/expedition_claimed', payload: { slotIndex: event.payload.slotIndex, expeditionTypeId: event.payload.expeditionTypeId, durationId: event.payload.durationId, cityId: event.payload.cityId, rareDropItemId: event.payload.rareDropItemId, rewards: { currencies: event.payload.rolled.currencies ?? {}, items: event.payload.rolled.items ?? [] } } });
      return;
    case 'prestige/performed':
      emitBalanceEvent({ family: 'prestige', name: 'performed', kind: 'prestige/performed', payload: { apGained: event.payload.apGained, totalAPAfter: event.payload.totalAPAfter, realmReached: event.payload.realmReached, resolvedGateCount: event.payload.resolvedGateCount, timeSpentSec: event.payload.timeSpentSec, advisorLabel: event.payload.advisorLabel } });
      return;
    case 'prestige/upgrade_purchased':
      emitBalanceEvent({ family: 'prestige', name: 'upgrade_purchased', kind: 'prestige/upgrade_purchased', payload: { upgradeId: event.payload.upgradeId, nextLevel: event.payload.nextLevel, apCost: event.payload.apCost, remainingAP: event.payload.remainingAP } });
      return;
    case 'offline/applied':
      emitBalanceEvent({ family: 'offline', name: 'applied', kind: 'offline/applied', payload: event.payload });
      return;
    case 'progression/gate_resolved': {
      const trialId = event.payload.trialId;
      const attemptId = `${trialId}:${event.payload.timestamp}`;
      emitBalanceEvent({ family: 'trials', name: 'attempt_resolved', kind: 'trials/attempt_resolved', payload: { trialId, gateIndex: event.payload.gateIndex, attemptId, outcome: event.payload.resolution, durationSec: 0, countsTowardFailSafe: true } });
      return;
    }
    default:
  }
}

export function getTrialGateIndex(trialId: string): number {
  const content = useContentStore.getState().raw;
  if (!content) return 0;
  const contract = getProgressionContract(adaptProgressionAuthoredContent(content));
  const transition = getTransitionByTrialId(contract, trialId);
  return transition ? (contract.majorRealms[transition.fromRealmId]?.index ?? 0) + 1 : 0;
}

export function initializeBalanceTelemetry(): void {
  if (initialized) return;
  initialized = true;
  GameEvents.onAny(emitFromRuntimeEvent);
}

export function buildTrialAttemptId(trialId: string, startedAt: number): string {
  return `${trialId}:${startedAt}`;
}

export function getEligibleFailCount(trialId: string): number {
  return useTrialStore.getState().getProgress(trialId).eligibleFailures;
}
