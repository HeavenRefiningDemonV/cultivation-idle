import {
  FX_DEFAULT_AUTO_QUALITY,
  FX_MAX_DPR,
  FX_MIN_STAGE_SIZE,
  FX_SCENE_BUDGETS,
} from './constants.js';
import { resolveFxStageDormant } from './stageRegistry.js';
import type {
  BuildFxSceneContractInput,
  FxEffectiveQuality,
  FxRequestedQuality,
  FxSceneBudget,
  FxSceneContract,
} from './types.js';

/**
 * Single quality authority rule: reduced motion always wins.
 */
export function resolveFxEffectiveQuality(
  requestedQuality: FxRequestedQuality,
  prefersReducedMotion: boolean,
): FxEffectiveQuality {
  if (prefersReducedMotion) return 'reducedMotion';
  if (requestedQuality === 'auto') return FX_DEFAULT_AUTO_QUALITY;
  return requestedQuality;
}

export function clampFxDpr(rawDpr: number | undefined, maxDpr = FX_MAX_DPR): number {
  const fallback = 1;
  const source = Number.isFinite(rawDpr) ? (rawDpr as number) : fallback;
  return Math.max(1, Math.min(maxDpr, source));
}

export function buildFxSceneBudget(effectiveQuality: FxEffectiveQuality): FxSceneBudget {
  return FX_SCENE_BUDGETS[effectiveQuality] as FxSceneBudget;
}

export function buildFxSceneContract(input: BuildFxSceneContractInput): FxSceneContract {
  const { snapshot, stageId, sceneKind, requestedQuality, effectiveQuality, prefersReducedMotion, documentHidden } = input;
  const budget = buildFxSceneBudget(effectiveQuality);
  const hostReady =
    snapshot.hostReady && snapshot.bounds.width >= FX_MIN_STAGE_SIZE && snapshot.bounds.height >= FX_MIN_STAGE_SIZE;
  const dormant = resolveFxStageDormant({ documentHidden, hostReady }) || snapshot.dormant;
  const dpr = clampFxDpr(snapshot.dpr, budget.maxDpr);
  const width = snapshot.bounds.width;
  const height = snapshot.bounds.height;

  return {
    stageId,
    sceneKind,
    bounds: snapshot.bounds,
    width,
    height,
    centerX: width / 2,
    centerY: height / 2,
    shortestSide: Math.min(width, height),
    longestSide: Math.max(width, height),
    dpr,
    requestedQuality,
    effectiveQuality,
    budget,
    prefersReducedMotion,
    isStatic: budget.sceneMode === 'static' || dormant,
    canAnimateContinuously: !dormant && budget.continuousAtmosphere !== 'off' && budget.tickScale > 0,
    hostReady,
    dormant,
  };
}
