import assert from 'node:assert/strict';
import test from 'node:test';

import { mapGateTrialFixToAction } from '../../src/systems/ui/trials/gateTrialFixActions.js';

test('gate trial top-fix routing maps destinations to honest actions', () => {
  assert.equal(mapGateTrialFixToAction({ code: 'c', destination: 'cultivation', reason: '' }).kind, 'open_cultivation');
  assert.equal(mapGateTrialFixToAction({ code: 'f', destination: 'forge', reason: '' }).kind, 'open_module');
  assert.equal(mapGateTrialFixToAction({ code: 'buy_fail_safe', destination: 'trial', reason: '' }).kind, 'buy_safety_net');
});
