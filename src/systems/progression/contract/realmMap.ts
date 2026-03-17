import type { MajorRealmId } from './contractTypes.js';

export const CANONICAL_MAJOR_REALMS: MajorRealmId[] = [
  'qi_condensation',
  'foundation_establishment',
  'core_formation',
  'nascent_soul',
  'soul_formation',
  'spirit_severing',
];

export const MAJOR_REALM_ALIASES: Record<string, MajorRealmId> = {
  golden_core: 'core_formation',
};

export const isMajorRealmId = (value: string): value is MajorRealmId =>
  CANONICAL_MAJOR_REALMS.includes(value as MajorRealmId);

export const normalizeMajorRealmId = (value: string): MajorRealmId | null => {
  if (isMajorRealmId(value)) return value;
  return MAJOR_REALM_ALIASES[value] ?? null;
};
