import assert from 'node:assert/strict';
import test from 'node:test';

import { mapGateTrialFixToAction } from '../../src/systems/ui/trials/gateTrialFixActions.js';

test('gate trial top-fix routing maps destinations to honest actions', () => {
  assert.equal(mapGateTrialFixToAction({ code: 'c', destination: 'cultivation', reason: '' }).kind, 'open_cultivation');
  assert.equal(mapGateTrialFixToAction({ code: 'f', destination: 'forge', reason: '' }).kind, 'open_module');
  assert.equal(mapGateTrialFixToAction({ code: 'buy_fail_safe', destination: 'trial', reason: '' }).kind, 'buy_safety_net');
  assert.equal(mapGateTrialFixToAction({ code: 'configure_pouch', destination: 'medicine_pouch', reason: '' }).kind, 'open_apothecary_pouch');
  assert.equal(mapGateTrialFixToAction({ code: 'fix_ai_posture', destination: 'trial', reason: '' }).kind, 'set_ai_profile_survivor');
  assert.equal(mapGateTrialFixToAction({ code: 'fix_casting_posture', destination: 'trial', reason: '' }).kind, 'open_techniques');
});
