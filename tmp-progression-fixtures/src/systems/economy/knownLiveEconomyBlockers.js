export const KNOWN_LIVE_ECONOMY_BLOCKERS = [];
const BLOCKER_BY_ID = new Map(KNOWN_LIVE_ECONOMY_BLOCKERS.map((entry) => [entry.id, entry]));
export function getKnownLiveEconomyBlocker(id) {
    return BLOCKER_BY_ID.get(id);
}
export function isKnownLiveEconomyBlocker(id) {
    return BLOCKER_BY_ID.has(id);
}
export function listKnownLiveEconomyBlockers() {
    return [...KNOWN_LIVE_ECONOMY_BLOCKERS];
}
