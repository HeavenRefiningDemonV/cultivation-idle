import { PROGRESSION_FIXTURE_CATALOG } from './fixtureCatalog.js';
const matchesFilter = (metadata, options) => {
    if (options.packet && !metadata.intendedConsumerPackets.includes(options.packet) && metadata.ownerPacket !== options.packet) {
        return false;
    }
    if (options.tag && !metadata.tags.includes(options.tag)) {
        return false;
    }
    return true;
};
export const listProgressionFixtures = (options = {}) => PROGRESSION_FIXTURE_CATALOG
    .map((fixture) => fixture.metadata)
    .filter((metadata) => matchesFilter(metadata, options))
    .sort((a, b) => a.id.localeCompare(b.id));
