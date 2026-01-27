import type { ManualGrade } from './pavilionStockTypes';
import type { TechniqueDef } from '../../content';
import type { PathId } from '../../content/types';
import type { IconId } from '../../ui/icons';
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

type ManualIcon = {
  label: string;
  iconId?: IconId;
  iconText?: string;
};

const MANUAL_TIER_ICONS: Record<ManualGrade, ManualIcon> = {
  mortal: { iconText: 'M', label: 'Mortal Tier' },
  earth: { iconText: 'E', label: 'Earth Tier' },
  heaven: { iconText: 'H', label: 'Heaven Tier' },
  mystic: { iconText: 'Y', label: 'Mystic Tier' },
};

const MANUAL_PATH_ICONS: Record<PathId, ManualIcon> = {
  heaven: { iconId: 'bookHeaven', label: 'Heaven Path' },
  earth: { iconId: 'bookEarth', label: 'Earth Path' },
  martial: { iconId: 'bookMartial', label: 'Martial Path' },
};

const MANUAL_TYPE_ICONS: Record<ManualType, ManualIcon> = {
  active: { iconId: 'jadeSword', label: 'Active Technique' },
  passive: { iconId: 'inkSwirl', label: 'Passive Technique' },
  ultimate: { iconId: 'inkBurst', label: 'Ultimate Technique' },
};

const MANUAL_ROLE_ICONS: Record<ManualRole, ManualIcon> = {
  offense: { iconId: 'jadeSword', label: 'Offense' },
  defense: { iconId: 'inkShield', label: 'Defense' },
  utility: { iconId: 'inkSwirl', label: 'Utility' },
  general: { iconId: 'inkSparkles', label: 'General' },
};

export const getManualTierIcon = (grade: ManualGrade) => MANUAL_TIER_ICONS[grade] ?? MANUAL_TIER_ICONS.mortal;

export const getManualPathIcon = (path?: string | null) => {
  if (path === 'heaven' || path === 'earth' || path === 'martial') {
    return MANUAL_PATH_ICONS[path];
  }
  return { iconId: 'inkWip', label: 'Unknown Path' };
};

export const getManualTypeIcon = (type: ManualType) => MANUAL_TYPE_ICONS[type] ?? MANUAL_TYPE_ICONS.active;

export const getManualRoleIcon = (role?: string | null) => {
  if (role === 'offense' || role === 'defense' || role === 'utility') {
    return MANUAL_ROLE_ICONS[role];
  }
  return MANUAL_ROLE_ICONS.general;
};

const unknownPathIcon = { iconId: 'inkWip', label: 'Unknown Path', key: 'unknown' };
const unknownTypeIcon = { iconId: 'inkWip', label: 'Unknown Type', key: 'unknown' };

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
