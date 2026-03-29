import type { UiFxEmitterDescriptor } from './types.js';

export const sparksEmitter: UiFxEmitterDescriptor = {
  id: 'uiFx.sparks.localizedForge',
  family: 'sparks',
  intendedLayer: 'hero',
  spawnSpace: 'area',
  motionProfile: 'burst',
  suitableForReducedMotion: false,
  continuous: false,
  baseCount: 10,
  countByQuality: {
    low: 0,
    medium: 5,
    high: 10,
  },
  lifetimeMs: {
    min: 300,
    max: 900,
  },
  alpha: {
    start: 0.9,
    end: 0,
  },
  speedPxPerSec: {
    min: 45,
    max: 120,
  },
  sizePx: {
    min: 2,
    max: 6,
  },
  spawnArea: {
    widthPct: 30,
    heightPct: 20,
    insetPct: 0,
  },
  notes: [
    'for localized craft/ritual flare',
    'not a whole-screen family',
    'should never become a constant fireworks layer',
  ],
};

export function createSparksEmitter(overrides: Partial<UiFxEmitterDescriptor> = {}): UiFxEmitterDescriptor {
  return { ...sparksEmitter, ...overrides };
}

export default sparksEmitter;
