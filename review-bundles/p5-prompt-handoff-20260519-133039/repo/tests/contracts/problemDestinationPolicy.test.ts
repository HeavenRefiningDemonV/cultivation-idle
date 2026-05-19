import assert from 'node:assert/strict';
import test from 'node:test';

import { ECONOMIC_PROBLEM_KINDS } from '../../src/systems/economy/economicProblemKinds.js';
import { getAllProblemDestinationPolicies, getProblemDestinationPolicy } from '../../src/systems/economy/problemDestinationPolicy.js';

test('every packet 3.9B problem kind exposes at least one allowed destination family', () => {
  const policies = getAllProblemDestinationPolicies();
  assert.deepEqual(policies.map((policy) => policy.problemKind), ECONOMIC_PROBLEM_KINDS);
  policies.forEach((policy) => {
    assert.ok(policy.primaryDestinations.length >= 1, `${policy.problemKind} must expose a primary destination`);
    assert.ok(policy.primaryModuleKeys.length >= 1, `${policy.problemKind} must expose a primary module`);
  });
});

test('destination policy keeps the locked primary-module truth for key shortage classes', () => {
  assert.equal(getProblemDestinationPolicy('belowMinimumForgeFloor').primaryModuleKeys[0], 'forge');
  assert.notEqual(getProblemDestinationPolicy('belowMinimumForgeFloor').primaryModuleKeys[0], 'apothecary');

  assert.equal(getProblemDestinationPolicy('belowHealingFloor').primaryModuleKeys[0], 'apothecary');
  assert.notEqual(getProblemDestinationPolicy('belowHealingFloor').primaryModuleKeys[0], 'forge');

  assert.equal(getProblemDestinationPolicy('belowMeritReserve').primaryModuleKeys[0], 'bounties');
  assert.notEqual(getProblemDestinationPolicy('belowMeritReserve').primaryModuleKeys[0], 'outskirts');

  assert.equal(getProblemDestinationPolicy('buildCorrectionGap').primaryModuleKeys[0], 'manualPavilion');
  assert.notEqual(getProblemDestinationPolicy('buildCorrectionGap').primaryModuleKeys[0], 'forge');
});
