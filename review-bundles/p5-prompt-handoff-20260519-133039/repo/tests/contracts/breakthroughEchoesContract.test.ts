import assert from 'node:assert/strict';
import test from 'node:test';

import { GameEvents } from '../../src/services/events/GameEvents.js';
import {
  clearBreakthroughEchoes,
  initBreakthroughEchoEventBridge,
  resetBreakthroughEchoEventBridgeForTests,
  useBreakthroughEchoStore,
} from '../../src/features/breakthroughEchoes/index.js';
import {
  buildCurrentLifeSummarySurface,
  buildPrestigeLifeSummarySnapshot,
  buildLastCompletedLifeSummarySurface,
} from '../../src/features/prestige/lifeSummarySurface.js';

test.beforeEach(() => {
  resetBreakthroughEchoEventBridgeForTests();
  clearBreakthroughEchoes();
});

test.afterEach(() => {
  resetBreakthroughEchoEventBridgeForTests();
  clearBreakthroughEchoes();
});

test('major breakthrough records one current-life echo through the event bridge', () => {
  initBreakthroughEchoEventBridge();
  initBreakthroughEchoEventBridge();

  GameEvents.emit({
    type: 'progression/breakthrough_completed',
    payload: {
      timestamp: 123,
      fromRealmIndex: 0,
      fromSubstage: 9,
      toRealmIndex: 1,
      toSubstage: 1,
      fromRealmName: 'Qi Condensation',
      toRealmName: 'Foundation Establishment',
      major: true,
      gateItemIdSpent: 'gate_foundation_pill',
      gateItemNameSpent: 'Gate Foundation Pill',
      qiSpent: '24.4M',
      cityUnlockedIds: ['city_stonecrag_town'],
      cityUnlockedNames: ['Stonecrag Town'],
      currentCityId: 'city_stonecrag_town',
      method: 'safety_net_bypass',
    },
  });

  const echoes = useBreakthroughEchoStore.getState().echoes;
  assert.equal(echoes.length, 1);
  assert.equal(echoes[0].method, 'safety_net_bypass');
  assert.equal(echoes[0].proofItemId, 'gate_foundation_pill');
  assert.equal(echoes[0].proofSource, 'safety_net');
  assert.match(echoes[0].memoryLine, /Foundation|Safety Net/i);
});

test('minor breakthrough does not record echo and echoes have no gameplay bonus fields', () => {
  initBreakthroughEchoEventBridge();

  GameEvents.emit({
    type: 'progression/breakthrough_completed',
    payload: {
      timestamp: 456,
      fromRealmIndex: 1,
      fromSubstage: 1,
      toRealmIndex: 1,
      toSubstage: 2,
      fromRealmName: 'Foundation Establishment',
      toRealmName: 'Foundation Establishment',
      major: false,
      qiSpent: '30M',
      cityUnlockedIds: [],
      cityUnlockedNames: [],
      currentCityId: 'city_stonecrag_town',
      method: 'unknown',
    },
  });

  assert.equal(useBreakthroughEchoStore.getState().echoes.length, 0);

  const echoShape = Object.keys({
    echoId: '',
    createdAt: 0,
    fromRealmIndex: 0,
    fromRealmName: '',
    toRealmIndex: 0,
    toRealmName: '',
    method: 'unknown',
    memoryLine: '',
  });
  assert.equal(echoShape.includes('statBonus'), false);
  assert.equal(echoShape.includes('qiBonus'), false);
  assert.equal(echoShape.includes('currency'), false);
});

test('echoes appear in current and archived Life Summary, then reset from current life', () => {
  useBreakthroughEchoStore.getState().recordEcho({
    echoId: 'echo-foundation',
    createdAt: 123,
    fromRealmIndex: 0,
    fromRealmName: 'Qi Condensation',
    toRealmIndex: 1,
    toRealmName: 'Foundation Establishment',
    method: 'clean_clear',
    proofItemId: 'gate_foundation_pill',
    proofItemName: 'Gate Foundation Pill',
    proofSource: 'gate_clear',
    cityUnlockedId: 'city_stonecrag_town',
    cityUnlockedName: 'Stonecrag Town',
    doctrineLine: 'Doctrine settled around the vessel.',
    strongestBlockerOvercome: null,
    memoryLine: 'Echo: Foundation established by clean clear.',
  });

  const current = buildCurrentLifeSummarySurface();
  const currentText = JSON.stringify(current.blocks);
  assert.match(currentText, /Breakthrough Echoes|Foundation established/i);

  const snapshot = buildPrestigeLifeSummarySnapshot();
  clearBreakthroughEchoes();
  const afterReset = buildCurrentLifeSummarySurface();
  assert.doesNotMatch(JSON.stringify(afterReset.blocks), /Foundation established by clean clear/);

  const archived = buildLastCompletedLifeSummarySurface(snapshot);
  assert.match(JSON.stringify(archived.blocks), /Foundation established by clean clear/);
});
