import assert from 'node:assert/strict';
import test from 'node:test';

import { GameEvents } from '../../src/services/events/GameEvents.js';
import { createBalanceTelemetryHarness } from '../helpers/telemetry/createBalanceTelemetryHarness.js';

test('balance telemetry captures major hook families from runtime events', () => {
  const harness = createBalanceTelemetryHarness();
  const now = Date.now();

  GameEvents.emit({ type: 'progression/life_started', payload: { timestamp: now, runStartTime: now - 120000, elapsedMsSinceLifeStart: 120000, trigger: 'fresh_start', lifeOrdinal: 1, sessionKind: 'first_life' } });
  GameEvents.emit({ type: 'progression/gate_available', payload: { timestamp: now, runStartTime: now - 120000, elapsedMsSinceLifeStart: 120000, trialId: 'trial_novices_clearing', fromRealmId: 'qi_condensation', toRealmId: 'foundation_establishment', gateIndex: 1, cityId: 'city_greenwater' } });
  GameEvents.emit({ type: 'progression/breakthrough', payload: { timestamp: now, runStartTime: now - 120000, elapsedMsSinceLifeStart: 120000, fromRealmIndex: 0, toRealmIndex: 1, fromSubstage: 9, toSubstage: 1, major: true, fromRealmId: 'qi_condensation', toRealmId: 'foundation_establishment' } });
  GameEvents.emit({ type: 'progression/city_entered', payload: { timestamp: now, runStartTime: now - 120000, elapsedMsSinceLifeStart: 120000, cityId: 'city_greenwater', cityIndex: 0, majorRealmId: 'foundation_establishment' } });
  GameEvents.emit({ type: 'trials/attempt_started', payload: { timestamp: now, trialId: 'trial_novices_clearing', gateIndex: 1, attemptId: 'trial_novices_clearing:1', attemptNumberThisLife: 1, countsTowardFailSafe: true, lifecycleState: 'available' } });
  GameEvents.emit({ type: 'trials/attempt_resolved', payload: { timestamp: now + 15000, trialId: 'trial_novices_clearing', gateIndex: 1, attemptId: 'trial_novices_clearing:1', outcome: 'defeated', durationSec: 15, bossHpPctRemaining: 0.18, countsTowardFailSafe: true, eligibleFailCountAfterAttempt: 1 } });
  GameEvents.emit({ type: 'rewards/granted', payload: { timestamp: now, reason: 'Outskirts Victory (Mob)', summary: 'ok', bundle: { currencies: { gold: '30' } }, result: { appliedCurrencies: { gold: '30' }, appliedItems: [], droppedItems: [] } } });
  GameEvents.emit({ type: 'rewards/spent', payload: { costs: { gold: '20' }, reason: 'alchemy_queue:test_recipe' } });
  GameEvents.emit({ type: 'economy/items_spent', payload: { reason: 'craftSession:alchemy:test_recipe', module: 'craftSession', items: [{ itemId: 'herb_green', qty: 2 }] } });
  GameEvents.emit({ type: 'bounties/claimed', payload: { timestamp: now, cityId: 'city_greenwater', templateId: 'bounty_1', difficulty: 'easy', kind: 'OUTSKIRTS_KILL', claimedAt: now, createdAt: now - 1000, rewards: { currencies: { merit: '10' } } } });
  GameEvents.emit({ type: 'expeditions/started', payload: { timestamp: now, slotIndex: 0, expeditionTypeId: 'scout', durationId: 'medium', durationSeconds: 1800, cityId: 'city_greenwater' } });
  GameEvents.emit({ type: 'expeditions/claimed', payload: { timestamp: now + 1800, slotIndex: 0, expeditionTypeId: 'scout', durationId: 'medium', cityId: 'city_greenwater', rareDropItemId: 'lotus', rolled: { currencies: { spiritStones: '5' } } } });
  GameEvents.emit({ type: 'prestige/performed', payload: { timestamp: now, apGained: 12, totalAPAfter: 30, realmReached: 3, resolvedGateCount: 2, timeSpentSec: 600, advisorLabel: 'good' } });
  GameEvents.emit({ type: 'offline/applied', payload: { timestamp: now, rawOfflineSeconds: 3600, effectiveOfflineSeconds: 3600, effectiveEfficiency: 0.8, wasCapped: false, qiGained: '100', queuedActionsReady: 2, expeditionsReady: 1 } });

  const kinds = new Set(harness.balanceEvents.map((event) => event.kind));
  assert.ok(kinds.has('progression/life_started'));
  assert.ok(kinds.has('progression/gate_available'));
  assert.ok(kinds.has('progression/breakthrough'));
  assert.ok(kinds.has('progression/city_entered'));
  assert.ok(kinds.has('trials/attempt_started'));
  assert.ok(kinds.has('trials/attempt_resolved'));
  assert.ok(kinds.has('economy/currency_earned'));
  assert.ok(kinds.has('economy/currency_spent'));
  assert.ok(kinds.has('economy/items_spent'));
  assert.ok(kinds.has('support/bounty_claimed'));
  assert.ok(kinds.has('support/expedition_started'));
  assert.ok(kinds.has('support/expedition_claimed'));
  assert.ok(kinds.has('prestige/performed'));
  assert.ok(kinds.has('offline/applied'));
});
