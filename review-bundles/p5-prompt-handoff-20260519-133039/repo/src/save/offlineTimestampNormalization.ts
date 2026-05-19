const OFFLINE_TIMESTAMP_PATHS = ['meta.lastActiveAtMs', 'gameState.lastActiveTime', 'gameState.lastTickTime'] as const;

export interface OfflineTimestampSnapshot {
  metaLastActiveAtMs: number | null;
  gameLastActiveTime: number | null;
  gameLastTickTime: number | null;
}

export interface OfflineTimestampNormalizationResult {
  normalizedTimestamp: number | null;
  snapshot: OfflineTimestampSnapshot;
  hasSplit: boolean;
  mutated: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

const readTimestamp = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);

export const readOfflineTimestampSnapshot = (save: Record<string, unknown>): OfflineTimestampSnapshot => {
  const meta = isRecord(save.meta) ? save.meta : {};
  const gameState = isRecord(save.gameState) ? save.gameState : {};
  return {
    metaLastActiveAtMs: readTimestamp(meta.lastActiveAtMs),
    gameLastActiveTime: readTimestamp(gameState.lastActiveTime),
    gameLastTickTime: readTimestamp(gameState.lastTickTime),
  };
};

export const getNormalizedOfflineTimestamp = (snapshot: OfflineTimestampSnapshot): number | null => {
  const present = Object.values(snapshot).filter((value): value is number => value !== null);
  if (present.length === 0) return null;
  return Math.max(...present);
};

export const normalizeOfflineTimestamps = (
  save: Record<string, unknown>,
): OfflineTimestampNormalizationResult & { save: Record<string, unknown> } => {
  const next = JSON.parse(JSON.stringify(save)) as Record<string, unknown>;
  const snapshot = readOfflineTimestampSnapshot(next);
  const normalizedTimestamp = getNormalizedOfflineTimestamp(snapshot);
  const present = Object.values(snapshot).filter((value): value is number => value !== null);
  const hasSplit = present.length > 1 && new Set(present).size > 1;

  if (normalizedTimestamp === null) {
    return { save: next, normalizedTimestamp, snapshot, hasSplit, mutated: false };
  }

  if (!isRecord(next.meta)) next.meta = {};
  if (!isRecord(next.gameState)) next.gameState = {};
  const meta = next.meta as Record<string, unknown>;
  const gameState = next.gameState as Record<string, unknown>;

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
