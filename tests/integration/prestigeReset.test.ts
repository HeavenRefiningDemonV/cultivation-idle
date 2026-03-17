import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getPrestigeClassificationHooks,
  getResetClassificationHooks,
} from '../../src/systems/progression/contract/index.js';
import { createPrestigeReadyScenario, loadProgressionContract } from '../helpers/progression/index.js';

test('reset classification hooks expose per-life/permanent/hybrid buckets', async () => {
  const contract = await loadProgressionContract();
  const hooks = getResetClassificationHooks(contract);
  assert.equal(hooks.classifyKey('gameState.realm'), 'per_life');
  assert.equal(hooks.classifyKey('prestigeState.totalAP'), 'permanent');
  assert.equal(hooks.classifyKey('masteryRetentionCarryOver'), 'hybrid');
});

test('prestige hook layer exists and classifies live/deferred/unknown nodes', async () => {
  const contract = await loadProgressionContract();
  const hooks = getPrestigeClassificationHooks(contract);
  assert.equal(hooks.classifyNode('ap_qi_gain_boost'), 'live');
  assert.equal(hooks.classifyNode('deferred_void_node'), 'deferred');
  assert.equal(hooks.classifyNode('mystery_node'), 'unknown');
});

test('prestige-ready scenario is callable and structured for future reset assertions', async () => {
  const contract = await loadProgressionContract();
  const scenario = createPrestigeReadyScenario({ contract });
  assert.equal(scenario.prestigeState.ready, true);
  assert.equal(scenario.pathState.lifePath, 'heaven');
});

// Future runtime assertions (packet 1.7/1.8): enable after reset orchestration and prestige consumers are centralized.
test('TODO(packet 1.7): prestige creates a clean new life instead of half-reset state', { todo: true }, () => {});
test('TODO(packet 1.7): per-life state clears while permanent state persists and hybrid state is re-derived', { todo: true }, () => {});
test('TODO(packet 1.8): accidental persistence from hidden consumers is eliminated', { todo: true }, () => {});
