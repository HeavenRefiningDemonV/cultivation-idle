import type { UiFxEmitterDescriptor, UiFxEmitterFamily, UiFxEmitterResolveInput } from './types.js';

const ATMOSPHERE_FAMILIES: readonly UiFxEmitterFamily[] = ['mist', 'dust', 'fireflies'];
const HERO_FAMILIES: readonly UiFxEmitterFamily[] = ['sparks', 'glints'];

export function clampEmitterCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

export function scaleEmitterCount(value: number, scale = 1): number {
  const normalizedScale = Number.isFinite(scale) ? Math.max(0, scale) : 1;
  return clampEmitterCount(value * normalizedScale);
}

export function normalizeEmitterRange(range: { min: number; max: number }): { min: number; max: number } {
  const min = Number.isFinite(range.min) ? range.min : 0;
  const max = Number.isFinite(range.max) ? range.max : min;
  if (min <= max) {
    return { min, max };
  }

  return { min: max, max: min };
}

export function buildEmitterId(family: UiFxEmitterFamily, variant: string): string {
  return `uiFx.${family}.${variant}`;
}

export function toResolvedEmitterCount(input: UiFxEmitterResolveInput): number {
  if (input.resolvedQuality === 'off') {
    return 0;
  }

  const baseCount = input.descriptor.countByQuality[input.resolvedQuality];
  return scaleEmitterCount(baseCount, input.countScale ?? 1);
}

export function isEmitterFamilyAllowedByQualityContract(
  family: UiFxEmitterFamily,
  allowAtmosphere: boolean,
  allowHeroFx: boolean,
): boolean {
  if (ATMOSPHERE_FAMILIES.includes(family) && !allowAtmosphere) {
    return false;
  }

  if (HERO_FAMILIES.includes(family) && !allowHeroFx) {
    return false;
  }

  return true;
}

export function shouldDisableContinuousInStaticMode(descriptor: UiFxEmitterDescriptor, renderMode: 'off' | 'static' | 'full'): boolean {
  return renderMode === 'static' && descriptor.continuous;
}
