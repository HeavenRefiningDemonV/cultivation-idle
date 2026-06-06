import assert from 'node:assert/strict';
import test from 'node:test';
import { REALMS } from '../../src/constants/index.js';
import { getContentCapRealm } from '../../src/systems/progression/contract/index.js';
import { getNextLiveRealm, getSemesterCapRealm, isAtSemesterCap, } from '../../src/systems/progression/runtime/index.js';
import { buildProgressionFixture, loadProgressionFixtureContext } from '../fixtures/progression/index.js';
test('constants and contract agree on the live semester cap realm', async () => {
    const context = await loadProgressionFixtureContext();
    const capRealm = getSemesterCapRealm();
    assert.equal(getContentCapRealm(context.contract), capRealm.id);
    assert.equal(REALMS[REALMS.length - 1]?.name, capRealm.name);
});
test('cap-reached fixture does not imply a next realm or fake post-cap city', async () => {
    const capFixture = await buildProgressionFixture('cap-reached');
    const realmIndex = capFixture.scenario?.realmState.enteredRealms.length ? 5 : 0;
    assert.equal(isAtSemesterCap(realmIndex), true);
    assert.equal(getNextLiveRealm(realmIndex), null);
    assert.equal(capFixture.scenario?.cityState.unlockedCityIds.includes('city_ironpeak_bastion'), true);
    assert.equal(capFixture.scenario?.cityState.unlockedCityIds.includes('city_six'), false);
});
