import assert from 'node:assert/strict';
import test from 'node:test';

import { deriveQiLotusState } from '../../src/ui/cultivation/lotusState.js';

test('lotus state precedence keeps breakthrough readiness as the top state', () => {
  assert.equal(deriveQiLotusState({ breakthroughReady: true, activityType: 'meditate', qiPerSecond: '999' }), 'ready');
});

test('lotus state transitions through idle and active from live cultivation inputs', () => {
  assert.equal(deriveQiLotusState({ breakthroughReady: false, activityType: null, qiPerSecond: '0' }), 'idle');
  assert.equal(deriveQiLotusState({ breakthroughReady: false, activityType: 'meditate', qiPerSecond: '4.2' }), 'active');
  assert.equal(deriveQiLotusState({ breakthroughReady: false, activityType: 'meditate', qiPerSecond: '31.4' }), 'active');
});
