import type { GameIconKey } from '../../ui/icons/iconRegistry';

export const MANUAL_ICON_MAP: Record<string, GameIconKey> = {
  combat: 'manual_combat',
  cultivation: 'manual_cultivation',
};

export function resolveManualIcon(iconKey?: string | null): GameIconKey {
  if (!iconKey) return 'manual_neutral';
  return MANUAL_ICON_MAP[iconKey] ?? 'manual_neutral';
}
