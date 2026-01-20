import type { ManualGrade } from './pavilionStockTypes';
import type { TechniqueDef } from '../../content';
import type { PathId } from '../../content/types';
import { normalizeGrade } from '../../stores/techCollectionStore';

export type ManualType = 'active' | 'passive' | 'ultimate';
export type ManualRole = 'offense' | 'defense' | 'utility' | 'general';

export const resolveManualType = (technique: Pick<TechniqueDef, 'type' | 'tags'> | undefined): ManualType => {
  if (!technique) return 'active';
  if (technique.type === 'ultimate') return 'ultimate';
  if (technique.type === 'passive' || technique.tags?.includes('passive')) return 'passive';
  return 'active';
};

export type TechniqueTypeKey = ManualType | 'unknown';

export const resolveTechniqueType = (
  technique: Pick<TechniqueDef, 'type' | 'tags'> | undefined,
): TechniqueTypeKey => {
  if (!technique) return 'unknown';
  if (technique.type === 'ultimate') return 'ultimate';
  if (technique.type === 'passive' || technique.tags?.includes('passive')) return 'passive';
  if (technique.type === 'active') return 'active';
  return 'unknown';
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

const MANUAL_ROLE_ICONS: Record<ManualRole, { icon: string; label: string }> = {
  offense: { icon: '⚔', label: 'Offense' },
  defense: { icon: '🛡', label: 'Defense' },
  utility: { icon: '🧿', label: 'Utility' },
  general: { icon: '◎', label: 'General' },
};

export const getManualTierIcon = (grade: ManualGrade) => MANUAL_TIER_ICONS[grade] ?? MANUAL_TIER_ICONS.mortal;

export const getManualPathIcon = (path?: string | null) => {
  if (path === 'heaven' || path === 'earth' || path === 'martial') {
    return MANUAL_PATH_ICONS[path];
  }
  return { icon: '◎', label: 'Unknown Path' };
};

export const getManualTypeIcon = (type: ManualType) => MANUAL_TYPE_ICONS[type] ?? MANUAL_TYPE_ICONS.active;

export const getManualRoleIcon = (role?: string | null) => {
  if (role === 'offense' || role === 'defense' || role === 'utility') {
    return MANUAL_ROLE_ICONS[role];
  }
  return MANUAL_ROLE_ICONS.general;
};

const unknownPathIcon = { icon: '◎', label: 'Unknown Path', key: 'unknown' };
const unknownTypeIcon = { icon: '◎', label: 'Unknown Type', key: 'unknown' };

export const getTierIcon = (gradeOrTierValue?: string | null) => {
  const grade = normalizeGrade(gradeOrTierValue ?? undefined);
  const icon = MANUAL_TIER_ICONS[grade] ?? MANUAL_TIER_ICONS.mortal;
  return { ...icon, key: grade };
};

export const getPathIcon = (pathValue?: string | null) => {
  if (pathValue === 'heaven' || pathValue === 'earth' || pathValue === 'martial') {
    const icon = MANUAL_PATH_ICONS[pathValue];
    return { ...icon, key: pathValue };
  }
  return unknownPathIcon;
};

export const getTypeIcon = (techniqueOrTypeValue?: Pick<TechniqueDef, 'type' | 'tags'> | string | null) => {
  if (typeof techniqueOrTypeValue === 'string') {
    const type = resolveTechniqueType({ type: techniqueOrTypeValue });
    if (type === 'unknown') return unknownTypeIcon;
    const icon = MANUAL_TYPE_ICONS[type] ?? MANUAL_TYPE_ICONS.active;
    return { ...icon, key: type };
  }
  const type = resolveTechniqueType(techniqueOrTypeValue ?? undefined);
  if (type === 'unknown') return unknownTypeIcon;
  const icon = MANUAL_TYPE_ICONS[type] ?? MANUAL_TYPE_ICONS.active;
  return { ...icon, key: type };
};
