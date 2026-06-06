import assert from 'node:assert/strict';
export const assertNoContradictoryPathState = (scenario) => {
    if (scenario.pathState.selectedPath === null) {
        assert.equal(scenario.pathState.lifePathAlias, null);
        return;
    }
    if (scenario.pathState.lifePathAlias !== null) {
        assert.equal(scenario.pathState.selectedPath, scenario.pathState.lifePathAlias);
    }
};
export const assertScenarioUsesContractOfflinePipeline = (scenario, contract) => {
    assert.equal(scenario.offlineState.pipelineId, contract.offline.pipelineId);
};
