import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getTransitionByFromRealm,
  normalizeGateItemAlias,
} from '../../src/systems/progression/contract/index.js';
import { createGateEdgeScenario, loadProgressionContract } from '../helpers/progression/index.js';

test('first transition resolves one trial and one gate item', async () => {
  const contract = await loadProgressionContract();
  const transition = getTransitionByFromRealm(contract, 'qi_condensation');
  assert.ok(transition);
  assert.equal(transition?.trialId, 'trial_novices_clearing');
  assert.ok(transition?.gateItemId.startsWith('gate_'));
});

test('legacy gate item alias normalization exists', () => {
  assert.equal(normalizeGateItemAlias('foundation_pill'), 'gate_foundation_pill');
  assert.equal(normalizeGateItemAlias('core_stabilizer'), 'gate_core_stabilizer');
});

test('gate edge scenario is contract-aware and does not pre-grant first gate reward', async () => {
  const contract = await loadProgressionContract();
  const scenario = createGateEdgeScenario({ contract });
  assert.equal(scenario.kind, 'pre_first_gate');
  assert.equal(scenario.gateState.inventoryGateItems.gate_foundation_pill, 0);
});

// Future runtime assertions (packet 1.3/1.4): enable after gate runtime is contract-driven.
test('TODO(packet 1.3): fresh save enters first Gate Trial without already owning reward item', { todo: true }, () => {});
test('TODO(packet 1.3): first eligible Gate Trial clear grants exact breakthrough-consumed gate item', { todo: true }, () => {});
test('TODO(packet 1.4): trial entry, reward grant, and breakthrough consume one gate-item truth', { todo: true }, () => {});
