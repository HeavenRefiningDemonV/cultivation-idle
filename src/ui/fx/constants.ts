export const FX_REDUCED_MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

export const FX_DEFAULT_REQUESTED_QUALITY = 'auto';

export const FX_DEFAULT_AUTO_QUALITY = 'medium';

export const FX_MAX_DPR = 2;

export const FX_DEFAULT_STAGE_Z_INDEX = 1;

export const FX_DEFAULT_CONTENT_Z_INDEX = 2;

export const FX_MIN_STAGE_SIZE = 1;

export const FX_MEDIUM_MAX_DPR = 1.5;

/**
 * Canonical stage ids for Phase 2 FX substrate.
 * Later packets should prefer these values over ad-hoc literals.
 */
export const FX_STAGE_IDS = {
  selection: 'selection',
  cultivation: 'cultivation',
  status: 'status',
  world: 'world',
  forge: 'forge',
} as const;

export type FxStageId = (typeof FX_STAGE_IDS)[keyof typeof FX_STAGE_IDS];

const FX_STAGE_ID_SET: ReadonlySet<string> = new Set(Object.values(FX_STAGE_IDS));

/**
 * Narrow runtime guard for packet-safe stage-id checks.
 */
export function isFxStageId(value: string): value is FxStageId {
  return FX_STAGE_ID_SET.has(value);
}

export const FX_SCENE_BUDGETS = {
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
} as const;
