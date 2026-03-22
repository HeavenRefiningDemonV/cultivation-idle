import Decimal from 'decimal.js';
import { useGameStore } from '../stores/gameStore.js';
import { usePrestigeStore } from '../stores/prestigeStore.js';
import { useCultivationStore } from '../stores/cultivationStore.js';
import { useContentStore } from '../stores/contentStore.js';
import { getHeartLawBonuses } from './heartLaw/heartLawLogic.js';
import { D, multiply, formatNumber } from '../utils/numbers.js';
import { apply as applyOfflineCatchup } from '../services/time/OfflineCatchup.js';
import { DEFAULT_OFFLINE_EFFICIENCY, MAX_OFFLINE_MS, MAX_OFFLINE_SECONDS, ONE_WEEK_SECONDS } from '../services/time/offlineShared.js';

/**
 * Offline progress result
 */
export interface OfflineProgressResult {
  offlineSeconds: number;
  qiGained: Decimal;
  efficiency: number;
  wasFullyOptimal: boolean;
  wasCapped: boolean;
}

/**
 * Offline progress summary for display
 */
export interface OfflineProgressSummary {
  offlineDuration: string;
  qiGained: string;
  efficiency: number;
  wasCapped: boolean;
  offlineSeconds: number;
}

export interface OfflineContext {
  lastActiveAtMs: number;
  now: number;
  dtMs: number;
  rawMs: number;
  wasCapped: boolean;
  wasMeditating: boolean;
}

/**
 * Calculate offline progress based on time difference
 *
 * @param lastOnlineUtc - Last time player was online (milliseconds since epoch)
 * @param currentUtc - Current time (milliseconds since epoch)
 * @returns Offline progress details
 */
export function calculateOfflineProgress(
  lastOnlineUtc: number,
  currentUtc: number
): OfflineProgressResult {
  const timeDiffMs = currentUtc - lastOnlineUtc;
  let offlineSeconds = Math.floor(timeDiffMs / 1000);

  if (offlineSeconds < 0) {
    console.warn('[Offline] Clock anomaly detected: time went backwards');
    offlineSeconds = 0;
  } else if (offlineSeconds > ONE_WEEK_SECONDS) {
    console.warn('[Offline] Clock anomaly detected: offline time > 1 week, capping to 12 hours');
    offlineSeconds = MAX_OFFLINE_SECONDS;
  }

  const wasCapped = offlineSeconds > MAX_OFFLINE_SECONDS;
  const wasFullyOptimal = !wasCapped;
  if (wasCapped) {
    console.log(`[Offline] Capping offline time from ${offlineSeconds}s to ${MAX_OFFLINE_SECONDS}s`);
    offlineSeconds = MAX_OFFLINE_SECONDS;
  }

  const { qiGained: baseQiGained } = computeCultivationOfflineGain(offlineSeconds);
  const offlineEfficiency = getOfflineEfficiency();
  const qiGained = multiply(baseQiGained, offlineEfficiency);

  return { offlineSeconds, qiGained, efficiency: offlineEfficiency, wasFullyOptimal, wasCapped };
}

export function buildOfflineContext(
  lastActiveAtMs: number,
  options?: { now?: number; wasMeditating?: boolean },
): OfflineContext {
  const now = options?.now ?? Date.now();
  const rawMs = Math.max(0, now - lastActiveAtMs);
  const dtMs = Math.max(0, Math.min(rawMs, MAX_OFFLINE_MS));
  const wasCapped = rawMs > dtMs;
  if (import.meta.env?.DEV) {
    const rawSeconds = Math.floor(rawMs / 1000);
    const dtSeconds = Math.floor(dtMs / 1000);
    console.log(`[Offline] dt=${dtSeconds}s (capped from raw ${rawSeconds}s)`);
  }
  return {
    lastActiveAtMs,
    now,
    dtMs,
    rawMs,
    wasCapped,
    wasMeditating: options?.wasMeditating ?? false,
  };
}

export function computeCultivationOfflineGain(dtSeconds: number) {
  const clampedSeconds = Math.max(0, dtSeconds);
  const gameState = useGameStore.getState();
  const qiPerSecond = D(gameState.qiPerSecond);
  const qiGained = multiply(qiPerSecond, clampedSeconds);
  return { qiGained, qiPerSecond };
}

/**
 * Apply offline progress to the game
 * Retrieves last online time, calculates progress, and updates game state
 *
 * @returns Summary of offline progress for display
 */
export function applyOfflineProgressFromContext(context: OfflineContext): OfflineProgressSummary | null {
  try {
    console.log('[Offline] Calculating offline progress...');
    const result = applyOfflineCatchup(context);
    const summary = result.summary;
    if (!summary) {
      console.log('[Offline] No offline time to process');
      return null;
    }

    const qiPart = summary.parts.find((part) => part.label === 'Qi gained');
    const modalSummary: OfflineProgressSummary = {
      offlineDuration: summary.offlineDuration,
      qiGained: qiPart?.value ?? formatNumber(0),
      efficiency: summary.efficiency,
      wasCapped: summary.wasCapped,
      offlineSeconds: summary.offlineSeconds,
    };

    console.log('[Offline] Progress applied:', modalSummary);
    return modalSummary;
  } catch (error) {
    console.error('[Offline] Error applying offline progress:', error);
    return null;
  }
}

export function applyOfflineProgress(): OfflineProgressSummary | null {
  const gameState = useGameStore.getState();
  const currentUtc = Date.now();
  const lastOnlineUtc = gameState.lastActiveTime || gameState.lastTickTime || currentUtc;
  const context = buildOfflineContext(lastOnlineUtc, { now: currentUtc, wasMeditating: false });
  return applyOfflineProgressFromContext(context);
}

/**
 * Format offline duration into human-readable string
 *
 * @param seconds - Total seconds offline
 * @returns Human-readable duration string
 *
 * @example
 * formatOfflineDuration(65) // "1 minute, 5 seconds"
 * formatOfflineDuration(3661) // "1 hour, 1 minute"
 * formatOfflineDuration(43200) // "12 hours"
 */
export function formatOfflineDuration(seconds: number): string {
  if (seconds <= 0) {
    return '0 seconds';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  }

  // Only show seconds if less than 1 hour total
  if (secs > 0 && hours === 0) {
    parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);
  }

  // Join parts with commas and "and" for last item
  if (parts.length === 0) {
    return '0 seconds';
  } else if (parts.length === 1) {
    return parts[0];
  } else if (parts.length === 2) {
    return `${parts[0]} and ${parts[1]}`;
  } else {
    const lastPart = parts.pop();
    return parts.join(', ') + ', and ' + lastPart;
  }
}

/**
 * Get offline efficiency multiplier
 * Can be upgraded or modified by player later
 *
 * @returns Current offline efficiency (0.0 to 1.0)
 */
export function getOfflineEfficiency(): number {
  try {
    const prestigeStore = usePrestigeStore.getState();
    const cultivationStore = useCultivationStore.getState();
    const heartLawId = cultivationStore.selectedHeartLawId;
    const heartLawDef = heartLawId ? useContentStore.getState().maps.heartLawsById[heartLawId] ?? null : null;
    const heartLawBonus = getHeartLawBonuses({
      heartLawDef,
      chapter: cultivationStore.chapter,
      spiritRoot: prestigeStore.spiritRoot,
    }).offlineEfficiencyAdd;
    const efficiency =
      DEFAULT_OFFLINE_EFFICIENCY * prestigeStore.getOfflineEfficiencyMultiplier() + heartLawBonus;
    return Math.min(efficiency, 1);
  } catch {
    return DEFAULT_OFFLINE_EFFICIENCY;
  }
}

/**
 * Get maximum offline time in seconds
 * Can be upgraded or modified by player later
 *
 * @returns Maximum offline time in seconds
 */
export function getMaxOfflineTime(): number {
  // TODO: Check for upgrades that increase offline cap
  return MAX_OFFLINE_SECONDS;
}

/**
 * Preview offline gains without applying them
 * Useful for UI to show potential gains
 *
 * @param hours - Number of hours to preview
 * @returns Estimated Qi gain
 */
export function previewOfflineGains(hours: number): string {
  const gameState = useGameStore.getState();
  const qiPerSecond = D(gameState.qiPerSecond);

  const seconds = Math.min(hours * 3600, MAX_OFFLINE_SECONDS);
  const qiGained = multiply(multiply(qiPerSecond, seconds), getOfflineEfficiency());

  return formatNumber(qiGained);
}
