import assert from 'node:assert/strict';
import test from 'node:test';

import { deriveQiLotusState } from '../../src/ui/cultivation/lotusState.js';

test('qi lotus state resolves to idle, active, and ready with readiness precedence', () => {
  assert.equal(deriveQiLotusState({ breakthroughReady: true, activityType: 'meditate', qiPerSecond: '999' }), 'ready');
  assert.equal(deriveQiLotusState({ breakthroughReady: false, activityType: null, qiPerSecond: '0' }), 'idle');
  assert.equal(deriveQiLotusState({ breakthroughReady: false, activityType: 'meditate', qiPerSecond: '3.2' }), 'active');
});
