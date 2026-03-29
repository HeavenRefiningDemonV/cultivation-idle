import type { UiFxEmitterDescriptor } from './types.js';

export const mistEmitter: UiFxEmitterDescriptor = {
  id: 'uiFx.mist.softUnderlay',
  family: 'mist',
  intendedLayer: 'underlay',
  spawnSpace: 'screen',
  motionProfile: 'drift',
  suitableForReducedMotion: false,
  continuous: true,
  baseCount: 16,
  countByQuality: {
    low: 0,
    medium: 10,
    high: 16,
  },
  lifetimeMs: {
    min: 9000,
    max: 16000,
  },
  alpha: {
    start: 0.08,
    end: 0,
  },
  speedPxPerSec: {
    min: 3,
    max: 10,
  },
  sizePx: {
    min: 80,
    max: 220,
  },
  spawnArea: {
    widthPct: 100,
    heightPct: 100,
    insetPct: 4,
  },
  notes: ['soft scenic haze', 'never use for dense screens at high intensity', 'reduced motion should suppress this family entirely'],
};

export function createMistEmitter(overrides: Partial<UiFxEmitterDescriptor> = {}): UiFxEmitterDescriptor {
  return { ...mistEmitter, ...overrides };
}

export default mistEmitter;
