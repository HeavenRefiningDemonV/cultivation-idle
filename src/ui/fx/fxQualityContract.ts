export type FxRequestedQuality = 'auto' | 'high' | 'medium' | 'low';
export type FxResolvedQuality = 'off' | 'low' | 'medium' | 'high';
export type FxRenderMode = 'off' | 'static' | 'full';
export type FxDebugReducedMotionOverride = 'system' | 'force-on' | 'force-off';
export type FxQualityReason =
  | 'disabled'
  | 'reduced-motion'
  | 'auto-default-medium'
  | 'low-quality-static'
  | 'atmosphere-disabled'
  | 'hero-disabled';

export interface ResolveFxQualityContractInput {
  enabled?: boolean;
  requestedQuality?: FxRequestedQuality;
  reducedMotion?: boolean;
  allowAtmosphere?: boolean;
  allowHeroFx?: boolean;
  debugReducedMotionOverride?: FxDebugReducedMotionOverride;
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
  reasons: FxQualityReason[];
}

export const DEFAULT_FX_DPR_CAP = 1.5;
export const FX_QUALITY_DPR_CAP: Record<FxRequestedQuality, number> = {
  auto: 1.5,
  high: 2,
  medium: 1.5,
  low: 1,
};

const normalizeDprCap = (value: number | undefined): number | null => {
  if (typeof value === 'undefined') {
    return null;
  }
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

const resolveReducedMotion = (
  reducedMotion: boolean,
  debugReducedMotionOverride: FxDebugReducedMotionOverride,
): boolean => {
  if (debugReducedMotionOverride === 'force-on') {
    return true;
  }
  if (debugReducedMotionOverride === 'force-off') {
    return false;
  }
  return reducedMotion;
};

export function resolveFxQualityContract(
  input: ResolveFxQualityContractInput = {},
): FxQualityContract {
  const enabled = input.enabled ?? true;
  const requestedQuality = input.requestedQuality ?? 'auto';
  const reducedMotion = input.reducedMotion ?? false;
  const debugReducedMotionOverride = input.debugReducedMotionOverride ?? 'system';
  const allowAtmosphere = input.allowAtmosphere ?? true;
  const allowHeroFx = input.allowHeroFx ?? true;
  const effectiveReducedMotion = resolveReducedMotion(reducedMotion, debugReducedMotionOverride);
  const reasons: FxQualityReason[] = [];

  if (!enabled) {
    reasons.push('disabled');
  }
  if (effectiveReducedMotion) {
    reasons.push('reduced-motion');
  }
  if (requestedQuality === 'auto') {
    reasons.push('auto-default-medium');
  }
  if (!allowAtmosphere) {
    reasons.push('atmosphere-disabled');
  }
  if (!allowHeroFx) {
    reasons.push('hero-disabled');
  }

  const anyFxEnabled = enabled && (allowAtmosphere || allowHeroFx);
  let resolvedQuality = anyFxEnabled ? resolveRequestedQuality(requestedQuality) : 'off';
  if (effectiveReducedMotion && resolvedQuality !== 'off') {
    resolvedQuality = 'low';
  }
  if (resolvedQuality === 'low') {
    reasons.push('low-quality-static');
  }

  let renderMode: FxRenderMode = 'off';
  if (anyFxEnabled) {
    if (effectiveReducedMotion || resolvedQuality === 'low') {
      renderMode = 'static';
    } else if (resolvedQuality === 'medium' || resolvedQuality === 'high') {
      renderMode = 'full';
    }
  }

  if (renderMode === 'off') {
    resolvedQuality = 'off';
  }

  const qualityCap = FX_QUALITY_DPR_CAP[requestedQuality];
  const explicitCap = normalizeDprCap(input.devicePixelRatioCap);
  let devicePixelRatioCap = explicitCap === null ? qualityCap : Math.min(qualityCap, explicitCap);
  if (renderMode !== 'full') {
    devicePixelRatioCap = Math.min(devicePixelRatioCap, FX_QUALITY_DPR_CAP.medium);
  }

  const allowContinuousAtmosphere = allowAtmosphere && !effectiveReducedMotion && renderMode === 'full';
  const allowAnimatedHeroFx = allowHeroFx && !effectiveReducedMotion && renderMode === 'full';

  return {
    requestedQuality,
    resolvedQuality,
    renderMode,
    reducedMotion: effectiveReducedMotion,
    allowAtmosphere,
    allowHeroFx,
    allowContinuousAtmosphere,
    allowAnimatedHeroFx,
    devicePixelRatioCap,
    reasons: [...new Set(reasons)],
  };
}
