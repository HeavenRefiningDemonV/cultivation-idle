import assert from 'node:assert/strict';
import test from 'node:test';
import { PROGRESSION_FIXTURE_CATALOG, buildProgressionFixture, validateProgressionFixtureCatalog, } from '../fixtures/progression/index.js';
const expectedIds = [
    'fresh-save',
    'gate-edge-pre-first',
    'gate-edge-post-first',
    'prestige-ready',
    'cap-reached',
    'legacy-path-conflict',
    'legacy-gate-alias',
    'legacy-trial-mismatch',
    'legacy-over-cap',
    'legacy-hidden-prestige',
    'legacy-hidden-unsupported-prestige',
    'legacy-partial-reset-residue',
    'legacy-offline-split',
];
test('progression fixture catalog integrity is stable and unique', async () => {
    const ids = PROGRESSION_FIXTURE_CATALOG.map((fixture) => fixture.metadata.id);
    assert.deepEqual(ids, expectedIds);
    assert.equal(new Set(ids).size, ids.length);
    for (const definition of PROGRESSION_FIXTURE_CATALOG) {
        assert.ok(definition.metadata.name.length > 0);
        assert.ok(definition.metadata.description.length > 0);
        assert.ok(definition.metadata.ownerPacket.length > 0);
        const built = await buildProgressionFixture(definition.metadata.id);
        assert.equal(built.metadata.id, definition.metadata.id);
        assert.ok(built.scenario || built.migrationFixture || built.saveShape);
    }
});
test('progression fixture matrix validates expected statuses and categories', async () => {
    const results = await validateProgressionFixtureCatalog();
    assert.equal(results.length, expectedIds.length);
    results.forEach((result) => {
        assert.equal(result.status, result.fixture.metadata.expectedValidationStatus);
        result.fixture.metadata.expectedIssueCategories.forEach((category) => {
            assert.equal(result.categories.includes(category), true, `${result.fixture.metadata.id} missing ${category}`);
        });
    });
});
test('baseline fixtures remain coherent and clean', async () => {
    const fresh = await buildProgressionFixture('fresh-save');
    assert.deepEqual(fresh.validationIssues, []);
    assert.equal(fresh.scenario?.cityState.unlockedCityIds.includes('city_pinewind_hamlet'), true);
    const gatePre = await buildProgressionFixture('gate-edge-pre-first');
    assert.deepEqual(gatePre.validationIssues, []);
    assert.equal(gatePre.scenario?.cityState.unlockedCityIds.includes('city_stonecrag_town'), false);
    const gatePost = await buildProgressionFixture('gate-edge-post-first');
    assert.deepEqual(gatePost.validationIssues, []);
    assert.equal(gatePost.scenario?.cityState.unlockedCityIds.includes('city_stonecrag_town'), true);
    const prestige = await buildProgressionFixture('prestige-ready');
    assert.deepEqual(prestige.validationIssues, []);
    assert.equal(prestige.scenario?.prestigeState.ready, true);
    const cap = await buildProgressionFixture('cap-reached');
    assert.deepEqual(cap.validationIssues, []);
    assert.equal(cap.scenario?.cityState.unlockedCityIds.includes('city_ironpeak_bastion'), true);
});
test('legacy fixtures surface their expected categories', async () => {
    const legacyIds = expectedIds.filter((id) => id.startsWith('legacy-'));
    for (const id of legacyIds) {
        const built = await buildProgressionFixture(id);
        const categories = new Set(built.validationIssues.map((issue) => issue.category));
        built.metadata.expectedIssueCategories.forEach((category) => {
            assert.equal(categories.has(category), true, `${id} missing ${category}`);
        });
    }
});
