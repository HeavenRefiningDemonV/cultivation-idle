import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { FxStageId } from './constants.js';

export type FxRequestedQuality = 'auto' | 'high' | 'medium' | 'low';

export type FxEffectiveQuality = 'high' | 'medium' | 'low' | 'reducedMotion';

export type FxQuality = FxEffectiveQuality;
export type FxReducedMotionOverride = boolean | null;

export type FxSceneMode = 'full' | 'minimal' | 'static';

export type FxStageKey = FxStageId | (string & {});

/**
 * Scene kind allows canonical stage kinds plus a generic fallback for non-screen utilities.
 */
export type FxSceneKind = 'generic' | FxStageId;

/**
 * Scene owner key identifies one mounted scene claimant per stage.
 * Keys are opaque strings chosen by each consumer (e.g. useId()).
 */
export type FxSceneOwnerKey = string;

export interface FxSceneBudget {
  sceneMode: FxSceneMode;
  continuousAtmosphere: 'full' | 'sparse' | 'off';
  allowBurstAtmosphere: boolean;
  allowHeroPulse: boolean;
  allowGlints: boolean;
  allowFilters: boolean;
  maxDpr: number;
  particleDensity: number;
  tickScale: number;
}

export interface FxStageBounds {
  width: number;
  height: number;
}

export type FxStageRegistrationToken = symbol;

export interface FxStageSnapshot {
  stageId: FxStageKey;
  hostElement: HTMLDivElement;
  bounds: FxStageBounds;
  dpr: number;
  /**
   * Host is connected and above minimum stage size.
   */
  hostReady: boolean;
  /**
   * Dormant means the stage is currently non-animating (hidden doc or unready host).
   */
  dormant: boolean;
  updatedAt: number;
}

export interface FxSceneContract {
  stageId: FxStageKey;
  sceneKind: FxSceneKind;
  bounds: FxStageBounds;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  shortestSide: number;
  longestSide: number;
  dpr: number;
  requestedQuality: FxRequestedQuality;
  effectiveQuality: FxEffectiveQuality;
  budget: FxSceneBudget;
  prefersReducedMotion: boolean;
  isStatic: boolean;
  canAnimateContinuously: boolean;
  hostReady: boolean;
  dormant: boolean;
}

export interface RegisterFxStageInput {
  stageId: FxStageKey;
  hostElement: HTMLDivElement;
  bounds: FxStageBounds;
  dpr: number;
}

export interface UpdateFxStageInput {
  stageId: FxStageKey;
  token: FxStageRegistrationToken;
  hostElement?: HTMLDivElement;
  bounds?: FxStageBounds;
  dpr?: number;
}

export interface UnregisterFxStageInput {
  stageId: FxStageKey;
  token: FxStageRegistrationToken;
}

export interface ClaimActiveFxSceneInput {
  stageId: FxStageKey;
  sceneKey: FxSceneOwnerKey;
}

export interface FxStageRegistryApi {
  registerStage: (input: RegisterFxStageInput) => FxStageRegistrationToken;
  updateStage: (input: UpdateFxStageInput) => void;
  unregisterStage: (input: UnregisterFxStageInput) => void;
  getStageSnapshot: (stageId: FxStageKey) => FxStageSnapshot | null;
  claimActiveScene: (input: ClaimActiveFxSceneInput) => boolean;
  releaseActiveScene: (input: ClaimActiveFxSceneInput) => void;
  getActiveSceneOwner: (stageId: FxStageKey) => FxSceneOwnerKey | null;
}

export interface FxQualityState {
  requestedQuality: FxRequestedQuality;
  effectiveQuality: FxEffectiveQuality;
  prefersReducedMotion: boolean;
  reducedMotionOverride: FxReducedMotionOverride;
  setRequestedQuality: Dispatch<SetStateAction<FxRequestedQuality>>;
  setReducedMotionOverride: Dispatch<SetStateAction<FxReducedMotionOverride>>;
}

export interface FxContextValue extends FxQualityState, FxStageRegistryApi {
  stageSnapshots: Record<string, FxStageSnapshot>;
  documentHidden: boolean;
}

export interface FxStagePortalProps {
  stageId: FxStageKey;
  children: ReactNode;
}

export type PixiUiStageRenderProp = (scene: FxSceneContract) => ReactNode;

export interface PixiUiStageProps {
  stageId: FxStageKey;
  sceneKind?: FxSceneKind;
  children?: ReactNode | PixiUiStageRenderProp;
}

export interface BuildFxSceneContractInput {
  stageId: FxStageKey;
  sceneKind: FxSceneKind;
  snapshot: FxStageSnapshot;
  requestedQuality: FxRequestedQuality;
  effectiveQuality: FxEffectiveQuality;
  prefersReducedMotion: boolean;
  documentHidden: boolean;
}
