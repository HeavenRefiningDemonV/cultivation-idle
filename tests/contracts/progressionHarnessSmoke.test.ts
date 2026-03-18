import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createCapReachedScenario,
  createFreshLifeScenario,
  createGateEdgeScenario,
  createLegacyAliasScenario,
  createPostFirstGateScenario,
  createPrestigeReadyScenario,
  loadProgressionContract,
} from '../helpers/progression/index.js';

test('all progression scenario builders are callable and return structured fixtures', async () => {
  const contract = await loadProgressionContract();

  const scenarios = [
    createFreshLifeScenario({ contract }),
    createGateEdgeScenario({ contract }),
    createPostFirstGateScenario({ contract }),
    createPrestigeReadyScenario({ contract }),
    createCapReachedScenario({ contract }),
    createLegacyAliasScenario({ contract }),
  ];

  assert.equal(scenarios.length, 6);
  scenarios.forEach((scenario) => {
    assert.ok(scenario.kind.length > 0);
    assert.ok(scenario.realmState.enteredRealms.length > 0);
    assert.ok(typeof scenario.gateState.resolutionByTransitionId === 'object');
    assert.ok(typeof scenario.offlineState.pipelineId === 'string');
  });
});
