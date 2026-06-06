import assert from 'node:assert/strict';
import test from 'node:test';
import { getOfflineProgressionContract } from '../../src/systems/progression/contract/index.js';
import { assertScenarioUsesContractOfflinePipeline, createCapReachedScenario, createLegacyAliasScenario, loadProgressionContract, } from '../helpers/progression/index.js';
test('offline contract exposes one canonical pipeline shape', async () => {
    const contract = await loadProgressionContract();
    const offline = getOfflineProgressionContract(contract);
    assert.equal(offline.pipelineId, 'offline_progression_v1');
    assert.deepEqual(offline.appliesTo, ['cultivation', 'queued_actions', 'expeditions']);
    assert.deepEqual(offline.excludes, ['combat']);
    assert.deepEqual(offline.timerAdvancedSystems, ['queued_actions', 'expeditions']);
});
test('offline contract exposes packet-1.8 semester efficiency policy truthfully', async () => {
    const contract = await loadProgressionContract();
    const offline = getOfflineProgressionContract(contract);
    assert.equal(offline.maxCatchupSeconds, 43200);
    assert.equal(offline.cultivationPolicy.mode, 'passive_scaled_efficiency');
    assert.equal(offline.cultivationPolicy.baseEfficiency, 0.5);
    assert.equal(offline.cultivationPolicy.prestigeEfficiencyPerLevel, 0.08);
    assert.equal(offline.cultivationPolicy.maxEfficiency, 0.9);
    assert.equal(offline.cultivationPolicy.meditatingOnly, false);
    assert.deepEqual(offline.summaryParts, ['qi_gained', 'queued_actions', 'expeditions']);
});
test('cap-reached and legacy-alias scenarios are usable in offline-related harness checks', async () => {
    const contract = await loadProgressionContract();
    const capScenario = createCapReachedScenario({ contract });
    const legacyScenario = createLegacyAliasScenario({ contract });
    assertScenarioUsesContractOfflinePipeline(capScenario, contract);
    assert.equal(legacyScenario.kind, 'legacy_alias');
    assert.equal(capScenario.offlineState.cultivationPolicy.meditatingOnly, false);
    assert.deepEqual(capScenario.offlineState.timerAdvancedSystems, ['queued_actions', 'expeditions']);
});
