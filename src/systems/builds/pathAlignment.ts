import type { CultivationPath } from '../../types/index.js';
import type { TechniqueFamily } from './techniqueFamilies.js';

export type NativePathAlignmentStrength = 'strong' | 'neutral';
export type PathAlignmentStrength = 'strong' | 'neutral' | 'off';

export const STRONG_PATH_FAMILY_BIASES: Readonly<Record<CultivationPath, readonly TechniqueFamily[]>> = Object.freeze({
  heaven: Object.freeze(['coreDamage', 'execute', 'setup', 'control', 'buff'] as const),
  earth: Object.freeze(['guard', 'heal', 'setup', 'control', 'execute', 'buff'] as const),
  martial: Object.freeze(['coreDamage', 'execute', 'setup', 'buff', 'mobility'] as const),
});

export const CROSS_PATH_SUPPORT_FAMILIES: readonly TechniqueFamily[] = Object.freeze([
  'guard',
  'heal',
  'buff',
  'setup',
  'control',
  'mobility',
  'cleanse',
  'farm',
]);

export const CROSS_PATH_OFFENSIVE_FAMILIES: readonly TechniqueFamily[] = Object.freeze([
  'coreDamage',
  'aoe',
  'execute',
]);

function intersects(families: readonly TechniqueFamily[], candidates: readonly TechniqueFamily[]): boolean {
  const candidateSet = new Set(candidates);
  return families.some((family) => candidateSet.has(family));
}

export function getNativePathAlignment(
  path: CultivationPath,
  families: readonly TechniqueFamily[],
): NativePathAlignmentStrength {
  return intersects(families, STRONG_PATH_FAMILY_BIASES[path]) ? 'strong' : 'neutral';
}

export function getTechniquePathFit(input: {
  techPath: CultivationPath;
  families: readonly TechniqueFamily[];
  nativeAlignment: NativePathAlignmentStrength;
  selectedPath: CultivationPath | null;
}): PathAlignmentStrength {
  if (input.selectedPath === null) {
    return 'off';
  }

  if (input.selectedPath === input.techPath) {
    return input.nativeAlignment;
  }

  if (intersects(input.families, CROSS_PATH_OFFENSIVE_FAMILIES)) {
    return 'off';
  }

  if (intersects(input.families, CROSS_PATH_SUPPORT_FAMILIES)) {
    return 'neutral';
  }

  return 'off';
}

export function scoreTechniqueForPath(input: {
  techPath: CultivationPath;
  families: readonly TechniqueFamily[];
  nativeAlignment: NativePathAlignmentStrength;
  selectedPath: CultivationPath | null;
}): 0 | 1 | 2 {
  const strength = getTechniquePathFit(input);
  if (strength === 'strong') {
    return 2;
  }
  if (strength === 'neutral') {
    return 1;
  }
  return 0;
}

export function resolveTechniquePathAlignment(input: {
  techPath: CultivationPath;
  families: readonly TechniqueFamily[];
  nativeAlignment: NativePathAlignmentStrength;
  selectedPath: CultivationPath | null;
}): { fit: PathAlignmentStrength; score: 0 | 1 | 2 } {
  const fit = getTechniquePathFit(input);
  return {
    fit,
    score: fit === 'strong' ? 2 : fit === 'neutral' ? 1 : 0,
  };
}
