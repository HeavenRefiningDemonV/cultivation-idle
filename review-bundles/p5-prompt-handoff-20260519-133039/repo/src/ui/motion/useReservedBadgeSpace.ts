import { useMemo } from 'react';
import { getReservedBadgeSpaceStyle } from './layoutStability.js';
import type { ReservedBadgeSpacePreset, ReservedBadgeSpaceStyle } from './layoutStability.js';

export function useReservedBadgeSpace(preset: ReservedBadgeSpacePreset): ReservedBadgeSpaceStyle {
  return useMemo(() => getReservedBadgeSpaceStyle(preset), [preset]);
}
