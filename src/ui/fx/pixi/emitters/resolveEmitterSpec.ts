import {
  isEmitterFamilyAllowedByQualityContract,
  normalizeEmitterRange,
  shouldDisableContinuousInStaticMode,
  toResolvedEmitterCount,
} from './shared.js';
import type { UiFxEmitterResolveInput, UiFxResolvedEmitterSpec } from './types.js';

export function resolveEmitterSpec(input: UiFxEmitterResolveInput): UiFxResolvedEmitterSpec {
  const { descriptor } = input;
  const reasons: string[] = [];
  let enabled = true;

  if (input.renderMode === 'off') {
    enabled = false;
    reasons.push('render-off');
  }

  if (input.resolvedQuality === 'off') {
    enabled = false;
    reasons.push('quality-off');
  }

  if (shouldDisableContinuousInStaticMode(descriptor, input.renderMode)) {
    enabled = false;
    reasons.push('static-mode');
  }

  if (input.reducedMotion && !descriptor.suitableForReducedMotion) {
    enabled = false;
    reasons.push('reduced-motion');
  }

  const qualityAllowed = isEmitterFamilyAllowedByQualityContract(
    descriptor.family,
    input.allowAtmosphere,
    input.allowHeroFx,
  );

  if (!qualityAllowed) {
    if (descriptor.family === 'mist' || descriptor.family === 'dust' || descriptor.family === 'fireflies') {
      reasons.push('atmosphere-disabled');
    }
    if (descriptor.family === 'sparks' || descriptor.family === 'glints') {
      reasons.push('hero-disabled');
    }
    enabled = false;
  }

  const count = enabled ? toResolvedEmitterCount(input) : 0;

  return {
    id: descriptor.id,
    family: descriptor.family,
    enabled,
    layer: descriptor.intendedLayer,
    spawnSpace: descriptor.spawnSpace,
    motionProfile: descriptor.motionProfile,
    count,
    lifetimeMs: normalizeEmitterRange(descriptor.lifetimeMs),
    alpha: descriptor.alpha,
    speedPxPerSec: normalizeEmitterRange(descriptor.speedPxPerSec),
    sizePx: normalizeEmitterRange(descriptor.sizePx),
    spawnArea: descriptor.spawnArea,
    reasons,
  };
}
