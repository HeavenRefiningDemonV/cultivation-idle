import assert from 'node:assert/strict';

import type { ProgressionContract } from '../../../src/systems/progression/contract/index.js';
import type { ProgressionScenario } from './scenarioTypes.js';

export const assertNoContradictoryPathState = (scenario: ProgressionScenario): void => {
  if (scenario.pathState.lifePath === null) {
    assert.equal(scenario.pathState.selectedPathAlias, null);
    return;
  }

  if (scenario.pathState.selectedPathAlias !== null) {
    assert.equal(scenario.pathState.lifePath, scenario.pathState.selectedPathAlias);
  }
};

export const assertScenarioUsesContractOfflinePipeline = (
  scenario: ProgressionScenario,
  contract: ProgressionContract,
): void => {
  assert.equal(scenario.offlineState.pipelineId, contract.offline.pipelineId);
};
