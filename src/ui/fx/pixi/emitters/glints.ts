import type { UiFxEmitterDescriptor } from './types.js';

export const glintsEmitter: UiFxEmitterDescriptor = {
  id: 'uiFx.glints.selectionHalo',
  family: 'glints',
  intendedLayer: 'hero',
  spawnSpace: 'ring',
  motionProfile: 'flicker',
  suitableForReducedMotion: true,
  continuous: false,
  baseCount: 8,
  countByQuality: {
    low: 2,
    medium: 4,
    high: 8,
  },
  lifetimeMs: {
    min: 250,
    max: 700,
  },
  alpha: {
    start: 0.75,
    end: 0,
  },
  speedPxPerSec: {
    min: 10,
    max: 30,
  },
  sizePx: {
    min: 3,
    max: 10,
  },
  spawnArea: {
    ringThicknessPct: 12,
  },
  notes: [
    'momentary sacred shimmer',
    'suitable for readiness / recommendation / selection accents',
    'should remain sparse even on high',
  ],
};

export function createGlintsEmitter(overrides: Partial<UiFxEmitterDescriptor> = {}): UiFxEmitterDescriptor {
  return { ...glintsEmitter, ...overrides };
}

export default glintsEmitter;
