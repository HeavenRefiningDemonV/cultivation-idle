import assert from 'node:assert/strict';
import test from 'node:test';
import { REALMS } from '../../src/constants/index.js';
import { LIVE_REALM_PROJECTION, clampRealmIndexToSemesterSlice, getLiveRealmByIndex, getLiveRealmNameByIndex, getNextLiveRealm, getOrderedLiveRealms, getSemesterCapRealm, hasNextLiveRealm, isAtSemesterCap, } from '../../src/systems/progression/runtime/index.js';
test('live realm projection exposes the canonical six-realm semester slice', () => {
    assert.deepEqual(getOrderedLiveRealms().map((realm) => realm.id), [
        'qi_condensation',
        'foundation_establishment',
        'core_formation',
        'nascent_soul',
        'soul_formation',
        'spirit_severing',
    ]);
    assert.equal(LIVE_REALM_PROJECTION.length, 6);
    assert.equal(REALMS.length, 6);
});
test('live realm projection exposes canonical display names and cap behavior', () => {
    assert.equal(getLiveRealmNameByIndex(0), 'Qi Condensation');
    assert.equal(getLiveRealmNameByIndex(2), 'Core Formation');
    assert.equal(getLiveRealmNameByIndex(4), 'Soul Formation');
    assert.equal(getLiveRealmNameByIndex(5), 'Spirit Severing');
    assert.equal(getNextLiveRealm(4)?.name, 'Spirit Severing');
    assert.equal(getNextLiveRealm(5), null);
    assert.equal(hasNextLiveRealm(5), false);
    assert.equal(isAtSemesterCap(5), true);
    assert.equal(getSemesterCapRealm().id, 'spirit_severing');
});
test('realm indices clamp to the semester slice instead of leaking future realms', () => {
    assert.equal(clampRealmIndexToSemesterSlice(-3), 0);
    assert.equal(clampRealmIndexToSemesterSlice(2), 2);
    assert.equal(clampRealmIndexToSemesterSlice(99), 5);
    assert.equal(getLiveRealmByIndex(99).name, 'Spirit Severing');
});
