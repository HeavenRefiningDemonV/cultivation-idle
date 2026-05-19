import type { ExactButtonSurface } from './bountiesExactTypes.js';

export const BOUNTIES_EXACT_SURFACE_VERSION = 1;
export const BOUNTIES_EXACT_ROOT_TEST_ID = 'bounties-exact-page';
export const BOUNTIES_EXACT_DEFAULT_CITY_ID = 'city_pinewind_hamlet';

export function createBountiesExactButton(
  id: string,
  label: string,
  intent: string,
  options: Partial<Omit<ExactButtonSurface, 'id' | 'label' | 'intent'>> = {},
): ExactButtonSurface {
  return {
    id,
    label,
    intent,
    enabled: options.enabled ?? true,
    visible: options.visible ?? true,
    tone: options.tone ?? 'secondary',
    reason: options.reason ?? null,
    ariaLabel: options.ariaLabel,
  };
}

export function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function titleCaseFromId(id: string): string {
  return id
    .replace(/^city_/u, '')
    .replace(/^trial_/u, '')
    .replace(/^mat_/u, '')
    .split(/[_\s-]+/gu)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ');
}

export function compactCityName(cityName: string): string {
  return cityName
    .replace(/\bHamlet\b/iu, '')
    .replace(/\bTown\b/iu, '')
    .replace(/\bCity\b/iu, '')
    .replace(/\s+/gu, ' ')
    .trim() || cityName;
}

export function formatCompactTime(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  if (seconds <= 0) return 'Ready';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes <= 0) return `${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${remainingMinutes}m`;
}
