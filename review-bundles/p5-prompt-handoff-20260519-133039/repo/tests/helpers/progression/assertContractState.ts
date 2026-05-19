import assert from 'node:assert/strict';

import type { ProgressionContract } from '../../../src/systems/progression/contract/index.js';
import type { ProgressionScenario } from './scenarioTypes.js';

export const assertNoContradictoryPathState = (scenario: ProgressionScenario): void => {
  if (scenario.pathState.selectedPath === null) {
    assert.equal(scenario.pathState.lifePathAlias, null);
    return;
  }

  if (scenario.pathState.lifePathAlias !== null) {
    assert.equal(scenario.pathState.selectedPath, scenario.pathState.lifePathAlias);
  }
};

export const assertScenarioUsesContractOfflinePipeline = (
  scenario: ProgressionScenario,
  contract: ProgressionContract,
): void => {
  assert.equal(scenario.offlineState.pipelineId, contract.offline.pipelineId);
};
