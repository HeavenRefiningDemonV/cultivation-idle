export type FxRequestedQuality = 'auto' | 'high' | 'medium' | 'low';
export type FxResolvedQuality = 'off' | 'low' | 'medium' | 'high';
export type FxRenderMode = 'off' | 'static' | 'full';

export interface ResolveFxQualityContractInput {
  enabled?: boolean;
  requestedQuality?: FxRequestedQuality;
  reducedMotion?: boolean;
  allowAtmosphere?: boolean;
  allowHeroFx?: boolean;
  devicePixelRatioCap?: number;
}

export interface FxQualityContract {
  requestedQuality: FxRequestedQuality;
  resolvedQuality: FxResolvedQuality;
  renderMode: FxRenderMode;
  reducedMotion: boolean;
  allowAtmosphere: boolean;
  allowHeroFx: boolean;
  allowContinuousAtmosphere: boolean;
  allowAnimatedHeroFx: boolean;
  devicePixelRatioCap: number;
}

export const DEFAULT_FX_DPR_CAP = 1.5;

const normalizeDprCap = (value: number | undefined): number => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return DEFAULT_FX_DPR_CAP;
  }
  return Math.min(Math.max(value, 0.5), 2);
};

const resolveRequestedQuality = (requestedQuality: FxRequestedQuality): FxResolvedQuality => {
  if (requestedQuality === 'auto') {
    return 'medium';
  }
  return requestedQuality;
};

export function resolveFxQualityContract(
  input: ResolveFxQualityContractInput = {},
): FxQualityContract {
  const enabled = input.enabled ?? true;
  const requestedQuality = input.requestedQuality ?? 'auto';
  const reducedMotion = input.reducedMotion ?? false;
  const allowAtmosphere = input.allowAtmosphere ?? true;
  const allowHeroFx = input.allowHeroFx ?? true;
  const devicePixelRatioCap = normalizeDprCap(input.devicePixelRatioCap);

  const anyFxEnabled = enabled && (allowAtmosphere || allowHeroFx);

  if (!anyFxEnabled) {
    return {
      requestedQuality,
      resolvedQuality: 'off',
      renderMode: 'off',
      reducedMotion,
      allowAtmosphere,
      allowHeroFx,
      allowContinuousAtmosphere: false,
      allowAnimatedHeroFx: false,
      devicePixelRatioCap,
    };
  }

  let resolvedQuality = resolveRequestedQuality(requestedQuality);

  if (reducedMotion && resolvedQuality !== 'off') {
    resolvedQuality = 'low';
  }

  const renderMode: FxRenderMode = resolvedQuality === 'high' || resolvedQuality === 'medium' ? 'full' : 'static';

  const allowContinuousAtmosphere = allowAtmosphere && !reducedMotion && renderMode === 'full';
  const allowAnimatedHeroFx = allowHeroFx && !reducedMotion && renderMode === 'full';

  return {
    requestedQuality,
    resolvedQuality,
    renderMode,
    reducedMotion,
    allowAtmosphere,
    allowHeroFx,
    allowContinuousAtmosphere,
    allowAnimatedHeroFx,
    devicePixelRatioCap,
  };
}
