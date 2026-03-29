import type { UiFxEmitterDescriptor } from './types.js';

export const firefliesEmitter: UiFxEmitterDescriptor = {
  id: 'uiFx.fireflies.worldDrift',
  family: 'fireflies',
  intendedLayer: 'underlay',
  spawnSpace: 'screen',
  motionProfile: 'drift',
  suitableForReducedMotion: false,
  continuous: true,
  baseCount: 9,
  countByQuality: {
    low: 0,
    medium: 4,
    high: 9,
  },
  lifetimeMs: {
    min: 7000,
    max: 14000,
  },
  alpha: {
    start: 0.45,
    end: 0,
  },
  speedPxPerSec: {
    min: 4,
    max: 14,
  },
  sizePx: {
    min: 3,
    max: 9,
  },
  spawnArea: {
    widthPct: 100,
    heightPct: 100,
    insetPct: 8,
  },
  notes: ['sparse organic world ambience', 'not for dense data-heavy screens', 'reduced motion should suppress this family entirely'],
};

export function createFirefliesEmitter(overrides: Partial<UiFxEmitterDescriptor> = {}): UiFxEmitterDescriptor {
  return { ...firefliesEmitter, ...overrides };
}

export default firefliesEmitter;
