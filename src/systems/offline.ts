import Decimal from 'decimal.js';
import { useGameStore } from '../stores/gameStore';
import { cultivationService } from '../services/cultivationService';
import { usePrestigeStore } from '../stores/prestigeStore';
import { D, multiply, formatNumber } from '../utils/numbers';

/**
 * Offline progress constants
 */
const MAX_OFFLINE_HOURS = 12;                    // Maximum offline time to calculate (12 hours)
const DEFAULT_OFFLINE_EFFICIENCY = 0.5;          // Offline Qi gain is 50% of normal rate
const MAX_OFFLINE_SECONDS = MAX_OFFLINE_HOURS * 60 * 60;  // 43200 seconds
export const MAX_OFFLINE_MS = MAX_OFFLINE_SECONDS * 1000;
const ONE_WEEK_SECONDS = 7 * 24 * 60 * 60;       // 604800 seconds

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
  // Calculate time difference in seconds
  const timeDiffMs = currentUtc - lastOnlineUtc;
  let offlineSeconds = Math.floor(timeDiffMs / 1000);

  // Handle clock anomalies
  if (offlineSeconds < 0) {
    // Time went backwards (clock was adjusted)
    console.warn('[Offline] Clock anomaly detected: time went backwards');
    offlineSeconds = 0;
  } else if (offlineSeconds > ONE_WEEK_SECONDS) {
    // More than 1 week offline - cap at 12 hours
    console.warn('[Offline] Clock anomaly detected: offline time > 1 week, capping to 12 hours');
    offlineSeconds = MAX_OFFLINE_SECONDS;
  }

  // Determine if we need to cap
  const wasCapped = offlineSeconds > MAX_OFFLINE_SECONDS;
  const wasFullyOptimal = !wasCapped;

  // Cap offline time to maximum
  if (wasCapped) {
    console.log(`[Offline] Capping offline time from ${offlineSeconds}s to ${MAX_OFFLINE_SECONDS}s`);
    offlineSeconds = MAX_OFFLINE_SECONDS;
  }

  const { qiGained: baseQiGained } = computeCultivationOfflineGain(offlineSeconds);

  // Calculate offline Qi gain with efficiency multiplier
  // Formula: Qi/s * offline seconds * efficiency
  const offlineEfficiency = getOfflineEfficiency();
  const qiGained = multiply(baseQiGained, offlineEfficiency);

  return {
    offlineSeconds,
    qiGained,
    efficiency: offlineEfficiency,
    wasFullyOptimal,
    wasCapped,
  };
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

    if (!context.wasMeditating) {
      console.log('[Offline] Skipping cultivation offline gains (not meditating)');
      return null;
    }

    // Get current time
    const currentUtc = context.now;
    const lastOnlineUtc = currentUtc - context.dtMs;

    // If last online time is in the future or same as current, no offline progress
    if (lastOnlineUtc >= currentUtc) {
      console.log('[Offline] No offline time detected');
      return null;
    }

    // Calculate offline progress
    const progress = calculateOfflineProgress(lastOnlineUtc, currentUtc);

    // If no time passed, return null
    if (progress.offlineSeconds <= 0) {
      console.log('[Offline] No offline time to process');
      return null;
    }

    // Add Qi to player
    const gameState = useGameStore.getState();
    const currentQi = D(gameState.qi);
    const newQi = currentQi.plus(progress.qiGained);

    useGameStore.setState({
      qi: newQi.toString(),
      lastTickTime: currentUtc,
      lastActiveTime: currentUtc,
    });

    cultivationService.applyOfflineProgress(progress.offlineSeconds * 1000, lastOnlineUtc, currentUtc);

    // Create summary
    const summary: OfflineProgressSummary = {
      offlineDuration: formatOfflineDuration(progress.offlineSeconds),
      qiGained: formatNumber(progress.qiGained),
      efficiency: progress.efficiency,
      wasCapped: progress.wasCapped,
      offlineSeconds: progress.offlineSeconds,
    };

    console.log('[Offline] Progress applied:', summary);
    return summary;
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
    const bonus = prestigeStore.getUpgradeEffectByStat('offlineEfficiencyAdd') || 0;
    const efficiency = DEFAULT_OFFLINE_EFFICIENCY * (1 + bonus);
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
