import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProgressionFixture, } from '../fixtures/progression/index.js';
import { getPrestigeClassificationHooks, getResetClassificationHooks, } from '../../src/systems/progression/contract/index.js';
import { createPrestigeReadyScenario, loadProgressionContract } from '../helpers/progression/index.js';
test('reset classification hooks expose packet-1.7 permanent, per-life, and hybrid families', async () => {
    const contract = await loadProgressionContract();
    const hooks = getResetClassificationHooks(contract);
    assert.equal(hooks.classifyKey('gameState.realm'), 'per_life');
    assert.equal(hooks.classifyKey('cityState.currentCityId'), 'per_life');
    assert.equal(hooks.classifyKey('trialState.progressByTrialId.trial_novices_clearing'), 'per_life');
    assert.equal(hooks.classifyKey('prestigeState.totalAP'), 'permanent');
    assert.equal(hooks.classifyKey('prestigeState.prestigeRuns'), 'permanent');
    assert.equal(hooks.classifyKey('techniqueState.loadouts.loadout_1'), 'hybrid');
    assert.equal(hooks.classifyKey('medicinePouchState.slots.healing'), 'hybrid');
    assert.equal(hooks.classifyKey('masteryRetentionCarryOver'), 'hybrid');
});
test('prestige hook layer exists and classifies live/deferred/unknown nodes', async () => {
    const contract = await loadProgressionContract();
    const hooks = getPrestigeClassificationHooks(contract);
    assert.equal(hooks.classifyNode('ap_qi_gain_boost'), 'live');
    assert.equal(hooks.classifyNode('deferred_void_node'), 'deferred');
    assert.equal(hooks.classifyNode('mystery_node'), 'unknown');
});
test('prestige-ready scenario remains available for packet-1.7 reset assertions', async () => {
    const contract = await loadProgressionContract();
    const scenario = createPrestigeReadyScenario({ contract });
    assert.equal(scenario.prestigeState.ready, true);
    assert.equal(scenario.pathState.selectedPath, 'heaven');
    assert.equal(scenario.pathState.lifePathAlias, null);
    assert.deepEqual(scenario.cityState.unlockedCityIds, ['city_pinewind_hamlet', 'city_stonecrag_town']);
});
test('legacy partial-reset fixture keeps legacy migration input but canonical save-shape output is clean', async () => {
    const fixture = await buildProgressionFixture('legacy-partial-reset-residue');
    const migrationFixture = fixture.migrationFixture?.data;
    const saveShape = fixture.saveShape;
    const migrationCityState = migrationFixture.cityState;
    const migrationEquipmentState = migrationFixture.equipmentState;
    const saveCityState = saveShape.cityState;
    const saveTrialState = saveShape.trialState;
    const saveEquipmentState = saveShape.equipmentState;
    const saveTechniqueState = saveShape.techniqueState;
    const saveLoadouts = Array.isArray(saveTechniqueState?.loadouts) ? saveTechniqueState.loadouts : [];
    assert.deepEqual(migrationCityState?.unlockedCityIds, ['city_pinewind_hamlet', 'city_stonecrag_town']);
    assert.equal(migrationEquipmentState?.equippedWeaponId, 'weapon_test');
    assert.deepEqual(saveCityState?.unlockedCityIds, ['city_pinewind_hamlet']);
    assert.equal(saveCityState?.currentCityId, 'city_pinewind_hamlet');
    assert.deepEqual(saveTrialState?.progressByTrialId, {});
    assert.equal(saveEquipmentState?.equippedWeaponId, null);
    assert.deepEqual(saveLoadouts[0]?.slots ?? {}, {
        active: [],
        passive: [],
        ultimate: null,
    });
});
