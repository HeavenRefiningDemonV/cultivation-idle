import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { adaptProgressionAuthoredContent, buildProgressionContract, getContentCapRealm, getOfflineProgressionContract, getTransitionByFromRealm, isDeferredSystem, normalizeGateItemAlias, } from '../../src/systems/progression/contract/index.js';
const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');
const FILES = {
    economy: 'economy.json',
    cities: 'cities.json',
    items: 'items.json',
    techniques: 'techniques.json',
    pavilions: 'pavilions.json',
    outskirts: 'outskirts.json',
    enemies: 'enemies.json',
    trials: 'trials.json',
    ruins: 'ruins.json',
    alchemy_recipes: 'alchemy_recipes.json',
    forge_blueprints: 'forge_blueprints.json',
    runes: 'runes.json',
    talisman_recipes: 'talisman_recipes.json',
    apothecary_shops: 'apothecary_shops.json',
    expeditions: 'expeditions.json',
    bounties: 'bounties.json',
    heart_laws: 'heart_laws.json',
    prestige_store: 'prestige_store.json',
};
const readJson = async (fileName) => JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8'));
const loadContent = async () => {
    const entries = await Promise.all(Object.entries(FILES).map(async ([key, fileName]) => [key, await readJson(fileName)]));
    return Object.fromEntries(entries);
};
test('progression contract builds from authored content', async () => {
    const authored = adaptProgressionAuthoredContent(await loadContent());
    const contract = buildProgressionContract(authored);
    assert.equal(contract.semesterSlice.liveMajorRealms.length, 6);
    assert.equal(contract.gateTransitions.length, 5);
});
test('each live transition resolves one trial and one gate item', async () => {
    const contract = buildProgressionContract(adaptProgressionAuthoredContent(await loadContent()));
    contract.gateTransitions.forEach((transition) => {
        assert.ok(transition.trialId);
        assert.ok(transition.gateItemId.startsWith('gate_'));
    });
});
test('city unlocks resolve to known major realms', async () => {
    const contract = buildProgressionContract(adaptProgressionAuthoredContent(await loadContent()));
    contract.cityUnlocks.forEach((unlock) => {
        assert.ok(contract.majorRealms[unlock.unlockOnRealmEntry]);
    });
});
test('gate item alias normalization works', () => {
    assert.equal(normalizeGateItemAlias('foundation_pill'), 'gate_foundation_pill');
    assert.equal(normalizeGateItemAlias('gate_core_catalyst'), 'gate_core_catalyst');
});
test('content-cap realm resolves to spirit_severing', async () => {
    const contract = buildProgressionContract(adaptProgressionAuthoredContent(await loadContent()));
    assert.equal(getContentCapRealm(contract), 'spirit_severing');
    assert.equal(getTransitionByFromRealm(contract, 'qi_condensation')?.toRealmId, 'foundation_establishment');
});
test('deferred and offline contract classification are queryable', async () => {
    const contract = buildProgressionContract(adaptProgressionAuthoredContent(await loadContent()));
    assert.equal(isDeferredSystem(contract, 'post_severing_cities'), true);
    const offline = getOfflineProgressionContract(contract);
    assert.equal(offline.pipelineId, 'offline_progression_v1');
    assert.deepEqual(offline.excludes, ['combat']);
    assert.equal(offline.cultivationPolicy.mode, 'passive_scaled_efficiency');
    assert.equal(offline.cultivationPolicy.meditatingOnly, false);
    assert.deepEqual(offline.timerAdvancedSystems, ['queued_actions', 'expeditions']);
});
