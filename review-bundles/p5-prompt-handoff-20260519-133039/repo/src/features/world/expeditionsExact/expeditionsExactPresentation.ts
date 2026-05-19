import type { ExactButtonSurface } from './expeditionsExactTypes.js';

export const EXPEDITIONS_EXACT_SURFACE_VERSION = 1;
export const EXPEDITIONS_EXACT_ROOT_TEST_ID = 'expeditions-exact-page';
export const EXPEDITIONS_EXACT_DEFAULT_CITY_ID = 'city_pinewind_hamlet';

export const EXPEDITION_ROUTE_ORDER = ['forage', 'mine', 'scout'] as const;
export const EXPEDITION_SLOT_ROMANS = ['I', 'II', 'III', 'IV'] as const;

export function createExpeditionsExactButton(
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

export function formatTimeLeft(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  if (seconds <= 0) return 'Ready';
  const minutes = Math.floor(seconds / 60);
  if (minutes <= 0) return `${seconds}s left`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours <= 0) return `${minutes}m left`;
  return `${hours}h ${remainingMinutes}m left`;
}

export function titleCaseFromId(id: string): string {
  return id
    .replace(/^mat_/u, '')
    .replace(/^city_/u, '')
    .split(/[_\s-]+/gu)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ');
}
