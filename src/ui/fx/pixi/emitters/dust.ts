import type { UiFxEmitterDescriptor } from './types.js';

export const dustEmitter: UiFxEmitterDescriptor = {
  id: 'uiFx.dust.ambientMotes',
  family: 'dust',
  intendedLayer: 'underlay',
  spawnSpace: 'screen',
  motionProfile: 'float',
  suitableForReducedMotion: true,
  continuous: true,
  baseCount: 22,
  countByQuality: {
    low: 6,
    medium: 14,
    high: 22,
  },
  lifetimeMs: {
    min: 6000,
    max: 12000,
  },
  alpha: {
    start: 0.18,
    end: 0,
  },
  speedPxPerSec: {
    min: 2,
    max: 8,
  },
  sizePx: {
    min: 2,
    max: 8,
  },
  spawnArea: {
    widthPct: 100,
    heightPct: 100,
    insetPct: 3,
  },
  notes: [
    'quiet ambient life',
    'acceptable on most screens',
    'low quality should keep a sparse static-like impression rather than total removal',
  ],
};

export function createDustEmitter(overrides: Partial<UiFxEmitterDescriptor> = {}): UiFxEmitterDescriptor {
  return { ...dustEmitter, ...overrides };
}

export default dustEmitter;
