import assert from 'node:assert/strict';
import test from 'node:test';

import { deriveQiLotusState } from '../../src/ui/cultivation/lotusState.js';

test('lotus state precedence keeps breakthrough readiness as the top state', () => {
  assert.equal(deriveQiLotusState({ breakthroughReady: true, activityType: 'meditate', qiPerSecond: '999' }), 'ready');
});

test('lotus state transitions through dormant, flowing, and blooming from live cultivation inputs', () => {
  assert.equal(deriveQiLotusState({ breakthroughReady: false, activityType: null, qiPerSecond: '0' }), 'dormant');
  assert.equal(deriveQiLotusState({ breakthroughReady: false, activityType: 'meditate', qiPerSecond: '4.2' }), 'flowing');
  assert.equal(deriveQiLotusState({ breakthroughReady: false, activityType: 'meditate', qiPerSecond: '31.4' }), 'blooming');
});
