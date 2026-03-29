import type { Dispatch, ReactNode, SetStateAction } from 'react';

export type FxRequestedQuality = 'auto' | 'high' | 'medium' | 'low';

export type FxQuality = 'high' | 'medium' | 'low' | 'reducedMotion';

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
  updatedAt: number;
}

export interface FxSceneContract {
  stageId: string;
  width: number;
  height: number;
  dpr: number;
  quality: FxQuality;
  reducedMotion: boolean;
  staticMode: boolean;
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

export interface FxStageRegistryApi {
  registerStage: (input: RegisterFxStageInput) => FxStageRegistrationToken;
  updateStage: (input: UpdateFxStageInput) => void;
  unregisterStage: (input: UnregisterFxStageInput) => void;
  getStageSnapshot: (stageId: string) => FxStageSnapshot | null;
}

export interface FxQualityState {
  requestedQuality: FxRequestedQuality;
  effectiveQuality: FxQuality;
  prefersReducedMotion: boolean;
  setRequestedQuality: Dispatch<SetStateAction<FxRequestedQuality>>;
}

export interface FxContextValue extends FxQualityState, FxStageRegistryApi {
  stageSnapshots: Record<string, FxStageSnapshot>;
}

export interface FxStagePortalProps {
  stageId: string;
  children: ReactNode;
}

export type PixiUiStageRenderProp = (scene: FxSceneContract) => ReactNode;

export interface PixiUiStageProps {
  stageId: string;
  children?: ReactNode | PixiUiStageRenderProp;
}
