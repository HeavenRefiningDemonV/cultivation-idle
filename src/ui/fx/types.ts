import type { Dispatch, ReactNode, SetStateAction } from 'react';

export type FxRequestedQuality = 'auto' | 'high' | 'medium' | 'low';

export type FxEffectiveQuality = 'high' | 'medium' | 'low' | 'reducedMotion';

export type FxQuality = FxEffectiveQuality;

export type FxSceneMode = 'full' | 'minimal' | 'static';

export type FxSceneKind = 'generic' | 'selection' | 'cultivation' | 'status' | 'world' | 'forge';

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
  stageId: string;
  hostElement: HTMLDivElement;
  bounds: FxStageBounds;
  dpr: number;
  hostReady: boolean;
  dormant: boolean;
  updatedAt: number;
}

export interface FxSceneContract {
  stageId: string;
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
  stageId: string;
  hostElement: HTMLDivElement;
  bounds: FxStageBounds;
  dpr: number;
}

export interface UpdateFxStageInput {
  stageId: string;
  token: FxStageRegistrationToken;
  hostElement?: HTMLDivElement;
  bounds?: FxStageBounds;
  dpr?: number;
}

export interface UnregisterFxStageInput {
  stageId: string;
  token: FxStageRegistrationToken;
}

export interface ClaimActiveFxSceneInput {
  stageId: string;
  sceneKey: string;
}

export interface FxStageRegistryApi {
  registerStage: (input: RegisterFxStageInput) => FxStageRegistrationToken;
  updateStage: (input: UpdateFxStageInput) => void;
  unregisterStage: (input: UnregisterFxStageInput) => void;
  getStageSnapshot: (stageId: string) => FxStageSnapshot | null;
  claimActiveScene: (input: ClaimActiveFxSceneInput) => boolean;
  releaseActiveScene: (input: ClaimActiveFxSceneInput) => void;
  getActiveSceneOwner: (stageId: string) => string | null;
}

export interface FxQualityState {
  requestedQuality: FxRequestedQuality;
  effectiveQuality: FxEffectiveQuality;
  prefersReducedMotion: boolean;
  setRequestedQuality: Dispatch<SetStateAction<FxRequestedQuality>>;
}

export interface FxContextValue extends FxQualityState, FxStageRegistryApi {
  stageSnapshots: Record<string, FxStageSnapshot>;
  documentHidden: boolean;
}

export interface FxStagePortalProps {
  stageId: string;
  children: ReactNode;
}

export type PixiUiStageRenderProp = (scene: FxSceneContract) => ReactNode;

export interface PixiUiStageProps {
  stageId: string;
  sceneKind?: FxSceneKind;
  children?: ReactNode | PixiUiStageRenderProp;
}

export interface BuildFxSceneContractInput {
  stageId: string;
  sceneKind: FxSceneKind;
  snapshot: FxStageSnapshot;
  requestedQuality: FxRequestedQuality;
  effectiveQuality: FxEffectiveQuality;
  prefersReducedMotion: boolean;
  documentHidden: boolean;
}
