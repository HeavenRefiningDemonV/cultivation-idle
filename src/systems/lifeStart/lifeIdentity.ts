import type { BreathMode, CultivationPath } from '../../types/index.js';

export type LifeIdentityMissingPart = 'path' | 'heartLaw' | 'breath';

export interface LifeIdentityInput {
  pathId: CultivationPath | null;
  selectedHeartLawId: string | null;
  breathMode: BreathMode | null;
}

export interface LifeIdentityStatus {
  complete: boolean;
  missing: LifeIdentityMissingPart[];
}

export function resolveLifeIdentityStatus(input: LifeIdentityInput): LifeIdentityStatus {
  const missing: LifeIdentityMissingPart[] = [];
  if (!input.pathId) missing.push('path');
  if (!input.selectedHeartLawId) missing.push('heartLaw');
  if (!input.breathMode) missing.push('breath');

  return {
    complete: missing.length === 0,
    missing,
  };
}

export function isLifeIdentityComplete(input: LifeIdentityInput): boolean {
  return resolveLifeIdentityStatus(input).complete;
}
