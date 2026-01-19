import type { ManualGrade } from './pavilionStockTypes';
import type { TechniqueDef } from '../../content';
import type { PathId } from '../../content/types';

export type ManualType = 'active' | 'passive' | 'ultimate';

export const resolveManualType = (technique: Pick<TechniqueDef, 'type' | 'tags'> | undefined): ManualType => {
  if (!technique) return 'active';
  if (technique.type === 'ultimate') return 'ultimate';
  if (technique.type === 'passive' || technique.tags?.includes('passive')) return 'passive';
  return 'active';
};

const MANUAL_TIER_ICONS: Record<ManualGrade, { icon: string; label: string }> = {
  mortal: { icon: 'M', label: 'Mortal Tier' },
  earth: { icon: 'E', label: 'Earth Tier' },
  heaven: { icon: 'H', label: 'Heaven Tier' },
  mystic: { icon: 'Y', label: 'Mystic Tier' },
};

const MANUAL_PATH_ICONS: Record<PathId, { icon: string; label: string }> = {
  heaven: { icon: '☁️', label: 'Heaven Path' },
  earth: { icon: '⛰️', label: 'Earth Path' },
  martial: { icon: '⚔️', label: 'Martial Path' },
};

const MANUAL_TYPE_ICONS: Record<ManualType, { icon: string; label: string }> = {
  active: { icon: '⚔', label: 'Active Technique' },
  passive: { icon: '⛩', label: 'Passive Technique' },
  ultimate: { icon: '☄', label: 'Ultimate Technique' },
};

export const getManualTierIcon = (grade: ManualGrade) => MANUAL_TIER_ICONS[grade] ?? MANUAL_TIER_ICONS.mortal;

export const getManualPathIcon = (path?: string | null) => {
  if (path === 'heaven' || path === 'earth' || path === 'martial') {
    return MANUAL_PATH_ICONS[path];
  }
  return { icon: '◎', label: 'Unknown Path' };
};

export const getManualTypeIcon = (type: ManualType) => MANUAL_TYPE_ICONS[type] ?? MANUAL_TYPE_ICONS.active;
