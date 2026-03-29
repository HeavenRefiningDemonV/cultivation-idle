import type { FxEffectiveQuality, FxRequestedQuality, FxSceneBudget } from './types.js';

export const FX_REDUCED_MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

export const FX_DEFAULT_REQUESTED_QUALITY: FxRequestedQuality = 'auto';

export const FX_DEFAULT_AUTO_QUALITY: FxEffectiveQuality = 'medium';

export const FX_MAX_DPR = 2;

export const FX_DEFAULT_STAGE_Z_INDEX = 1;

export const FX_DEFAULT_CONTENT_Z_INDEX = 2;

export const FX_MIN_STAGE_SIZE = 1;

export const FX_MEDIUM_MAX_DPR = 1.5;

export const FX_STAGE_IDS = {
  selection: 'selection',
  cultivation: 'cultivation',
  status: 'status',
  world: 'world',
  forge: 'forge',
} as const;

export const FX_SCENE_BUDGETS: Record<FxEffectiveQuality, FxSceneBudget> = {
  high: {
    sceneMode: 'full',
    continuousAtmosphere: 'full',
    allowBurstAtmosphere: true,
    allowHeroPulse: true,
    allowGlints: true,
    allowFilters: true,
    maxDpr: 2,
    particleDensity: 1,
    tickScale: 1,
  },
  medium: {
    sceneMode: 'minimal',
    continuousAtmosphere: 'sparse',
    allowBurstAtmosphere: true,
    allowHeroPulse: true,
    allowGlints: true,
    allowFilters: false,
    maxDpr: FX_MEDIUM_MAX_DPR,
    particleDensity: 0.6,
    tickScale: 0.88,
  },
  low: {
    sceneMode: 'minimal',
    continuousAtmosphere: 'off',
    allowBurstAtmosphere: true,
    allowHeroPulse: false,
    allowGlints: true,
    allowFilters: false,
    maxDpr: 1,
    particleDensity: 0.25,
    tickScale: 0.7,
  },
  reducedMotion: {
    sceneMode: 'static',
    continuousAtmosphere: 'off',
    allowBurstAtmosphere: false,
    allowHeroPulse: false,
    allowGlints: false,
    allowFilters: false,
    maxDpr: 1,
    particleDensity: 0,
    tickScale: 0,
  },
};
