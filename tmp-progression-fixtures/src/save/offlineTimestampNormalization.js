const OFFLINE_TIMESTAMP_PATHS = ['meta.lastActiveAtMs', 'gameState.lastActiveTime', 'gameState.lastTickTime'];
const isRecord = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
const readTimestamp = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);
export const readOfflineTimestampSnapshot = (save) => {
    const meta = isRecord(save.meta) ? save.meta : {};
    const gameState = isRecord(save.gameState) ? save.gameState : {};
    return {
        metaLastActiveAtMs: readTimestamp(meta.lastActiveAtMs),
        gameLastActiveTime: readTimestamp(gameState.lastActiveTime),
        gameLastTickTime: readTimestamp(gameState.lastTickTime),
    };
};
export const getNormalizedOfflineTimestamp = (snapshot) => {
    const present = Object.values(snapshot).filter((value) => value !== null);
    if (present.length === 0)
        return null;
    return Math.max(...present);
};
export const normalizeOfflineTimestamps = (save) => {
    const next = JSON.parse(JSON.stringify(save));
    const snapshot = readOfflineTimestampSnapshot(next);
    const normalizedTimestamp = getNormalizedOfflineTimestamp(snapshot);
    const present = Object.values(snapshot).filter((value) => value !== null);
    const hasSplit = present.length > 1 && new Set(present).size > 1;
    if (normalizedTimestamp === null) {
        return { save: next, normalizedTimestamp, snapshot, hasSplit, mutated: false };
    }
    if (!isRecord(next.meta))
        next.meta = {};
    if (!isRecord(next.gameState))
        next.gameState = {};
    const meta = next.meta;
    const gameState = next.gameState;
    let mutated = false;
    if (meta.lastActiveAtMs !== normalizedTimestamp) {
        meta.lastActiveAtMs = normalizedTimestamp;
        mutated = true;
    }
    if (gameState.lastActiveTime !== normalizedTimestamp) {
        gameState.lastActiveTime = normalizedTimestamp;
        mutated = true;
    }
    if (gameState.lastTickTime !== normalizedTimestamp) {
        gameState.lastTickTime = normalizedTimestamp;
        mutated = true;
    }
    return { save: next, normalizedTimestamp, snapshot, hasSplit, mutated };
};
export const OFFLINE_TIMESTAMP_TOUCH_PATHS = OFFLINE_TIMESTAMP_PATHS;
