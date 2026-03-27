import { GameEvents } from '../../../src/services/events/GameEvents.js';
import { createBalanceTelemetryHarness } from './createBalanceTelemetryHarness.js';
import { useTelemetryStore } from '../../../src/stores/telemetryStore.js';

export function runBalanceTelemetryProbe() {
  const harness = createBalanceTelemetryHarness();
  const start = 1_000_000;

  GameEvents.emit({ type: 'progression/life_started', payload: { timestamp: start, runStartTime: start, elapsedMsSinceLifeStart: 0, trigger: 'fresh_start', lifeOrdinal: 1, sessionKind: 'first_life' } });
  GameEvents.emit({ type: 'progression/gate_available', payload: { timestamp: start + 120_000, runStartTime: start, elapsedMsSinceLifeStart: 120_000, trialId: 'trial_g1', fromRealmId: 'qi_condensation', toRealmId: 'foundation_establishment', gateIndex: 1, cityId: 'city_pinewind_hamlet' } });
  GameEvents.emit({ type: 'progression/breakthrough', payload: { timestamp: start + 140_000, runStartTime: start, elapsedMsSinceLifeStart: 140_000, fromRealmIndex: 0, toRealmIndex: 1, fromSubstage: 9, toSubstage: 1, major: true, fromRealmId: 'qi_condensation', toRealmId: 'foundation_establishment' } });
  GameEvents.emit({ type: 'progression/city_entered', payload: { timestamp: start + 145_000, runStartTime: start, elapsedMsSinceLifeStart: 145_000, cityId: 'city_stonecrag_town', cityIndex: 1, majorRealmId: 'foundation_establishment' } });
  GameEvents.emit({ type: 'trials/attempt_started', payload: { timestamp: start + 130_000, trialId: 'trial_g1', gateIndex: 1, attemptId: 'a1', attemptNumberThisLife: 1, countsTowardFailSafe: true, lifecycleState: 'available' } });
  GameEvents.emit({ type: 'trials/attempt_resolved', payload: { timestamp: start + 131_000, trialId: 'trial_g1', gateIndex: 1, attemptId: 'a1', outcome: 'defeated', durationSec: 20, bossHpPctRemaining: 0.4, countsTowardFailSafe: true, eligibleFailCountAfterAttempt: 1 } });
  GameEvents.emit({ type: 'trials/attempt_resolved', payload: { timestamp: start + 161_000, trialId: 'trial_g1', gateIndex: 1, attemptId: 'a2', outcome: 'cleared', durationSec: 18, countsTowardFailSafe: true, eligibleFailCountAfterAttempt: 1 } });

  GameEvents.emit({ type: 'rewards/granted', payload: { timestamp: start + 162_000, reason: 'Gate Trial clear', summary: 'ok', bundle: { currencies: { merit: '40' } }, result: { appliedCurrencies: { merit: '40' }, appliedItems: [], droppedItems: [] } } });
  GameEvents.emit({ type: 'rewards/granted', payload: { timestamp: start + 163_000, reason: 'expedition_claim:scout:medium:city=city_pinewind_hamlet', summary: 'ok', bundle: { currencies: { spiritStones: '5' } }, result: { appliedCurrencies: { spiritStones: '5' }, appliedItems: [], droppedItems: [] } } });
  GameEvents.emit({ type: 'rewards/granted', payload: { timestamp: start + 164_000, reason: 'Bounty:resolved', summary: 'ok', bundle: { currencies: { merit: '10' } }, result: { appliedCurrencies: { merit: '10' }, appliedItems: [], droppedItems: [] } } });
  GameEvents.emit({ type: 'rewards/granted', payload: { timestamp: start + 165_000, reason: 'Gate Trial eligible defeat:trial_g1', summary: 'ok', bundle: { currencies: { merit: '5' } }, result: { appliedCurrencies: { merit: '5' }, appliedItems: [], droppedItems: [] } } });

  GameEvents.emit({ type: 'rewards/spent', payload: { costs: { gold: '100' }, reason: 'gate_fail_safe:trial_g2' } });
  GameEvents.emit({ type: 'rewards/spent', payload: { costs: { gold: '30' }, reason: 'alchemy_queue:test_recipe' } });
  GameEvents.emit({ type: 'rewards/spent', payload: { costs: { merit: '8' }, reason: 'prestige_purchase:ap_idle_qi_mult' } });

  GameEvents.emit({ type: 'bounties/claimed', payload: { timestamp: start + 170_000, cityId: 'city_pinewind_hamlet', templateId: 'bounty_1', difficulty: 'easy', kind: 'OUTSKIRTS_KILL', claimedAt: start + 170_000, createdAt: start + 169_000, rewards: { currencies: { merit: '10' } } } });
  GameEvents.emit({ type: 'expeditions/started', payload: { timestamp: start + 180_000, slotIndex: 0, expeditionTypeId: 'scout', durationId: 'medium', durationSeconds: 1800, cityId: 'city_pinewind_hamlet' } });
  GameEvents.emit({ type: 'expeditions/claimed', payload: { timestamp: start + 181_000, slotIndex: 0, expeditionTypeId: 'scout', durationId: 'medium', cityId: 'city_pinewind_hamlet', rolled: { currencies: { spiritStones: '5' } } } });

  GameEvents.emit({ type: 'prestige/performed', payload: { timestamp: start + 500_000, apGained: 28, totalAPAfter: 50, realmReached: 4, resolvedGateCount: 3, timeSpentSec: 5000, advisorLabel: 'great' } });
  GameEvents.emit({ type: 'offline/applied', payload: { timestamp: start + 550_000, rawOfflineSeconds: 7200, effectiveOfflineSeconds: 7200, effectiveEfficiency: 0.75, wasCapped: false, qiGained: '200', queuedActionsReady: 2, expeditionsReady: 1 } });

  const store = useTelemetryStore.getState();
  store.addBalanceEvent({
    ts: start + 182_000,
    kind: 'readiness/snapshot',
    summary: 'readiness/snapshot',
    payload: {
      schemaVersion: 1,
      eventId: 'manual_readiness',
      emittedAt: start + 182_000,
      family: 'readiness',
      name: 'snapshot',
      kind: 'readiness/snapshot',
      lifeId: 'manual',
      lifeOrdinal: 1,
      sessionKind: 'first_life',
      payload: {
        trialId: 'trial_g1',
        overallBand: 'recommended_met',
        buildBand: 'recommended_met',
        forgeBand: 'recommended_met',
        economicBand: 'recommended_met',
        postureBand: 'recommended_met',
        topShortfallCodes: [],
      },
    },
  });
  store.addBalanceEvent({
    ts: start + 183_000,
    kind: 'diagnosis/computed',
    summary: 'diagnosis/computed',
    payload: {
      schemaVersion: 1,
      eventId: 'manual_diagnosis',
      emittedAt: start + 183_000,
      family: 'diagnosis',
      name: 'computed',
      kind: 'diagnosis/computed',
      lifeId: 'manual',
      lifeOrdinal: 1,
      sessionKind: 'first_life',
      payload: {
        trialId: 'trial_g1',
        primary: 'underbuilt',
        secondary: null,
        topFixKeys: ['improve_weapon'],
      },
    },
  });
  store.addBalanceEvent({
    ts: start + 184_000,
    kind: 'reclaim/milestone_reached',
    summary: 'reclaim/milestone_reached',
    payload: {
      schemaVersion: 1,
      eventId: 'manual_reclaim',
      emittedAt: start + 184_000,
      family: 'reclaim',
      name: 'milestone_reached',
      kind: 'reclaim/milestone_reached',
      lifeId: 'manual',
      lifeOrdinal: 2,
      sessionKind: 'reclaim',
      payload: {
        milestoneId: 'gate_1_available',
        elapsedMsSinceLifeStart: 120000,
      },
    },
  });


  return harness;
}
