import { getOfflineContributionPolicy } from '../../systems/balance/index.js';

const OFFLINE_POLICY = getOfflineContributionPolicy();

export const MAX_OFFLINE_HOURS = OFFLINE_POLICY.maxCatchupSeconds / 3600;
export const DEFAULT_OFFLINE_EFFICIENCY = OFFLINE_POLICY.baseEfficiency;
export const MAX_OFFLINE_SECONDS = MAX_OFFLINE_HOURS * 60 * 60;
export const MAX_OFFLINE_MS = MAX_OFFLINE_SECONDS * 1000;
export const ONE_WEEK_SECONDS = 7 * 24 * 60 * 60;

export function resolveOfflineCultivationEfficiency(input: {
  prestigeEfficiencyAdd: number;
  heartLawBonus?: number;
}): number {
  const additive = Number.isFinite(input.prestigeEfficiencyAdd) ? input.prestigeEfficiencyAdd : 0;
  const heartLawBonus = Number.isFinite(input.heartLawBonus) ? (input.heartLawBonus ?? 0) : 0;
  return Math.min(
    OFFLINE_POLICY.maxEfficiency,
    Math.max(0, OFFLINE_POLICY.baseEfficiency + additive + heartLawBonus),
  );
}

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

  if (secs > 0 && hours === 0) {
    parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);
  }

  if (parts.length === 0) {
    return '0 seconds';
  }
  if (parts.length === 1) {
    return parts[0];
  }
  if (parts.length === 2) {
    return `${parts[0]} and ${parts[1]}`;
  }
  const lastPart = parts.pop();
  return parts.join(', ') + ', and ' + lastPart;
}
