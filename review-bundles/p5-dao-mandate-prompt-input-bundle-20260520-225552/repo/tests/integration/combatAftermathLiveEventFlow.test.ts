import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';

import {
  buildLiveCombatAftermathSurface,
  clearCombatAftermathEventMemoryForTests,
  initCombatAftermathEventBridge,
  resetCombatAftermathEventBridgeForTests,
} from '../../src/features/combatAftermath/index.js';
import { GameEvents } from '../../src/services/events/GameEvents.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useTrialStore } from '../../src/stores/trialStore.js';
import {
  initRunDeltaEventBridge,
  resetRunDeltaEventBridgeForTests,
} from '../../src/systems/runDeltas/initRunDeltaEventBridge.js';
import { clearRunDeltas } from '../../src/systems/runDeltas/runDeltaStore.js';

const emptyRewardResult = {
  appliedCurrencies: {},
  appliedItems: [],
  droppedItems: [],
  appliedTechniqueFragments: [],
  appliedManuals: [],
  appliedComprehension: null,
  skippedRewards: [],
};

beforeEach(() => {
  clearRunDeltas();
  useTrialStore.setState({ activeTrialSessionId: null, progressByTrialId: {} });
  useContentStore.setState((state) => ({
    ...state,
    maps: {
      ...state.maps,
      itemsById: {
        gate_foundation_pill: { id: 'gate_foundation_pill', name: 'Foundation Pill' } as never,
        mat_spirit_leaf: { id: 'mat_spirit_leaf', name: 'Spirit Leaf' } as never,
      },
    },
  }));
  initRunDeltaEventBridge();
  initCombatAftermathEventBridge();
  clearCombatAftermathEventMemoryForTests();
});

afterEach(() => {
  resetRunDeltaEventBridgeForTests();
  resetCombatAftermathEventBridgeForTests();
  clearRunDeltas();
});

test('live Gate Trial clear aftermath preserves structured gate proof reward result', () => {
  const timestamp = 1_000;
  GameEvents.emit({
    type: 'rewards/granted',
    payload: {
      reason: 'Gate Trial clear',
      bundle: { items: [{ itemId: 'gate_foundation_pill', qty: 1 }] },
      result: {
        ...emptyRewardResult,
        appliedItems: [{ itemId: 'gate_foundation_pill', qty: 1 }],
      },
      summary: '+1 Foundation Pill',
      timestamp,
    },
  });
  GameEvents.emit({
    type: 'trials/attempt_resolved',
    payload: {
      timestamp: timestamp + 1,
      trialId: 'trial_novices_clearing',
      gateIndex: 1,
      attemptId: 'attempt-1',
      outcome: 'cleared',
      durationSec: 18,
      countsTowardFailSafe: true,
      eligibleFailCountAfterAttempt: 0,
    },
  });

  const surface = buildLiveCombatAftermathSurface({
    kind: 'gate_trial',
    cityId: 'city_pinewind_hamlet',
    trialId: 'trial_novices_clearing',
    gateLabel: 'Foundation Gate',
    gateProofItemId: 'gate_foundation_pill',
  });

  assert.equal(surface?.outcome.kind, 'cleared');
  const gateProof = surface?.spoilsGroups.find((group) => group.id === 'gate_proof');
  assert.equal(gateProof?.empty, false);
  assert.equal(gateProof?.lines[0]?.itemId, 'gate_foundation_pill');
});

test('live Outskirts victory keeps reward groups after combat has exited', () => {
  GameEvents.emit({
    type: 'rewards/granted',
    payload: {
      reason: 'Outskirts Victory (Mob)',
      bundle: { currencies: { gold: '300' }, items: [{ itemId: 'mat_spirit_leaf', qty: 2 }] },
      result: {
        ...emptyRewardResult,
        appliedCurrencies: { gold: '300' },
        appliedItems: [{ itemId: 'mat_spirit_leaf', qty: 2 }],
      },
      summary: '+300 gold, +2 Spirit Leaf',
      timestamp: 2_000,
    },
  });

  const surface = buildLiveCombatAftermathSurface({
    kind: 'outskirts',
    cityId: 'city_pinewind_hamlet',
    sourceId: 'outskirts_pinewind',
  });

  assert.equal(surface?.outcome.kind, 'victory');
  assert.equal(surface?.spoilsGroups.find((group) => group.id === 'immediate_spend')?.empty, false);
  assert.equal(surface?.spoilsGroups.find((group) => group.id === 'gate_prep')?.empty, false);
  assert.doesNotMatch(surface?.outcome.title ?? '', /pending|unknown/i);
});

test('live Ruins victory keeps structured support rewards after combat has exited', () => {
  GameEvents.emit({
    type: 'rewards/granted',
    payload: {
      reason: 'Ruins - Hollow Log Den (Final Chest)',
      bundle: { currencies: { gold: '80' }, items: [{ itemId: 'mat_spirit_leaf', qty: 1 }] },
      result: {
        ...emptyRewardResult,
        appliedCurrencies: { gold: '80' },
        appliedItems: [{ itemId: 'mat_spirit_leaf', qty: 1 }],
      },
      summary: '+80 gold, +1 Spirit Leaf',
      timestamp: 3_000,
    },
  });

  const surface = buildLiveCombatAftermathSurface({
    kind: 'ruins',
    cityId: 'city_pinewind_hamlet',
    ruinId: 'ruin_pinewind_hollow',
  });

  assert.equal(surface?.outcome.kind, 'support_complete');
  assert.equal(surface?.spoilsGroups.find((group) => group.id === 'immediate_spend')?.empty, false);
  assert.equal(surface?.spoilsGroups.find((group) => group.id === 'gate_prep')?.empty, false);
  assert.doesNotMatch(surface?.outcome.title ?? '', /pending|unknown/i);
});

test('live aftermath memory clears on new life events', () => {
  GameEvents.emit({
    type: 'rewards/granted',
    payload: {
      reason: 'Outskirts Victory (Mob)',
      bundle: { currencies: { gold: '100' } },
      result: {
        ...emptyRewardResult,
        appliedCurrencies: { gold: '100' },
      },
      summary: '+100 gold',
      timestamp: 4_000,
    },
  });
  assert.notEqual(buildLiveCombatAftermathSurface({ kind: 'outskirts' }), null);

  GameEvents.emit({
    type: 'progression/life_started',
    payload: {
      timestamp: 4_001,
      runStartTime: 4_001,
      elapsedMsSinceLifeStart: 0,
      trigger: 'prestige_reset',
    },
  });

  assert.equal(buildLiveCombatAftermathSurface({ kind: 'outskirts' }), null);
});
