import assert from 'node:assert/strict';
import test from 'node:test';

import { GameEvents } from '../../src/services/events/GameEvents.js';
import { createBalanceTelemetryHarness } from '../helpers/telemetry/createBalanceTelemetryHarness.js';

test('typed balance telemetry can reconstruct key section-6 KPI sequence', () => {
  const harness = createBalanceTelemetryHarness();
  const start = Date.now() - 600000;

  GameEvents.emit({ type: 'progression/life_started', payload: { timestamp: start, runStartTime: start, elapsedMsSinceLifeStart: 0, trigger: 'prestige_reset', lifeOrdinal: 2, sessionKind: 'reclaim' } });
  GameEvents.emit({ type: 'progression/gate_available', payload: { timestamp: start + 120000, runStartTime: start, elapsedMsSinceLifeStart: 120000, trialId: 'trial_g1', fromRealmId: 'q1', toRealmId: 'q2', gateIndex: 1, cityId: 'city_greenwater' } });
  GameEvents.emit({ type: 'progression/breakthrough', payload: { timestamp: start + 140000, runStartTime: start, elapsedMsSinceLifeStart: 140000, fromRealmIndex: 1, toRealmIndex: 2, fromSubstage: 9, toSubstage: 1, major: true, fromRealmId: 'foundation_establishment', toRealmId: 'core_formation' } });
  GameEvents.emit({ type: 'trials/attempt_resolved', payload: { timestamp: start + 130000, trialId: 'trial_g1', gateIndex: 1, attemptId: 'a1', outcome: 'defeated', durationSec: 20, bossHpPctRemaining: 0.3, countsTowardFailSafe: true, eligibleFailCountAfterAttempt: 1 } });
  GameEvents.emit({ type: 'trials/attempt_resolved', payload: { timestamp: start + 160000, trialId: 'trial_g1', gateIndex: 1, attemptId: 'a2', outcome: 'cleared', durationSec: 18, countsTowardFailSafe: true, eligibleFailCountAfterAttempt: 1 } });
  GameEvents.emit({ type: 'rewards/granted', payload: { timestamp: start + 161000, reason: 'Gate Trial clear', summary: 'ok', bundle: { currencies: { merit: '40' } }, result: { appliedCurrencies: { merit: '40' }, appliedItems: [], droppedItems: [], appliedTechniqueFragments: [], appliedManuals: [], appliedComprehension: null, skippedRewards: [] } } });
  GameEvents.emit({ type: 'rewards/granted', payload: { timestamp: start + 162000, reason: 'expedition_claim:scout:medium:city=city_greenwater', summary: 'ok', bundle: { currencies: { spiritStones: '5' } }, result: { appliedCurrencies: { spiritStones: '5' }, appliedItems: [], droppedItems: [], appliedTechniqueFragments: [], appliedManuals: [], appliedComprehension: null, skippedRewards: [] } } });
  GameEvents.emit({ type: 'rewards/spent', payload: { costs: { gold: '100' }, reason: 'gate_fail_safe:trial_g2' } });
  GameEvents.emit({ type: 'expeditions/started', payload: { timestamp: start + 10000, slotIndex: 0, expeditionTypeId: 'scout', durationId: 'medium', durationSeconds: 1800, cityId: 'city_greenwater' } });
  GameEvents.emit({ type: 'expeditions/claimed', payload: { timestamp: start + 20000, slotIndex: 0, expeditionTypeId: 'scout', durationId: 'medium', cityId: 'city_greenwater', rolled: { currencies: { spiritStones: '5' } } } });
  GameEvents.emit({ type: 'prestige/performed', payload: { timestamp: start + 500000, apGained: 28, totalAPAfter: 50, realmReached: 4, resolvedGateCount: 3, timeSpentSec: 5000, advisorLabel: 'great' } });
  GameEvents.emit({ type: 'offline/applied', payload: { timestamp: start + 550000, rawOfflineSeconds: 7200, effectiveOfflineSeconds: 7200, effectiveEfficiency: 0.75, wasCapped: false, qiGained: '200', queuedActionsReady: 2, expeditionsReady: 1 } });

  const events = harness.balanceEvents;
  const gateAvailable = events.find((event) => event.kind === 'progression/gate_available');
  assert.ok(gateAvailable);
  assert.equal(gateAvailable?.elapsedMsSinceLifeStart, 120000);

  const kinds = new Set(events.map((event) => event.kind));
  assert.equal(kinds.has('trials/attempt_resolved'), true);
  assert.equal(kinds.has('prestige/performed'), true);
  assert.equal(kinds.has('support/expedition_started') || kinds.has('support/expedition_claimed'), true);
  assert.equal(kinds.has('offline/applied'), true);
});
