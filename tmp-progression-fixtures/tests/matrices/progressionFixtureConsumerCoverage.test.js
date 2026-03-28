import assert from 'node:assert/strict';
import test from 'node:test';
import { FIXTURE_CONSUMER_PACKET_MAP, PROGRESSION_FIXTURE_CATALOG, } from '../fixtures/progression/index.js';
const fixtureIds = new Set(PROGRESSION_FIXTURE_CATALOG.map((fixture) => fixture.metadata.id));
test('future packet coverage map only references registered fixtures', () => {
    Object.entries(FIXTURE_CONSUMER_PACKET_MAP).forEach(([packet, ids]) => {
        assert.ok(ids.length > 0, `${packet} should reference at least one fixture`);
        ids.forEach((id) => assert.equal(fixtureIds.has(id), true, `${packet} references unknown fixture ${id}`));
    });
});
test('fixtures declare their intended consumer packets coherently', () => {
    Object.entries(FIXTURE_CONSUMER_PACKET_MAP).forEach(([packet, ids]) => {
        ids.forEach((id) => {
            const fixture = PROGRESSION_FIXTURE_CATALOG.find((entry) => entry.metadata.id === id);
            assert.ok(fixture);
            assert.equal(fixture?.metadata.intendedConsumerPackets.includes(packet), true, `${id} missing consumer packet ${packet}`);
        });
    });
});
