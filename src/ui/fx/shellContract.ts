import {
  FX_DEFAULT_CONTENT_Z_INDEX,
  FX_DEFAULT_STAGE_Z_INDEX,
  FX_STAGE_IDS,
} from './constants.js';
import type { FxSceneContract, FxSceneKind, FxStageKey, FxStageSnapshot } from './types.js';

export type FxPortalBlockReason =
  | 'missingSnapshot'
  | 'missingHost'
  | 'hostDisconnected'
  | 'hostNotReady'
  | 'stageDormant';

export interface FxLayerOrder {
  stageZIndex: number;
  contentZIndex: number;
  corrected: boolean;
}

export interface FxPortalMountPolicy {
  canMount: boolean;
  reason: FxPortalBlockReason | null;
}

export const FX_ALLOWED_SCENE_KINDS_BY_STAGE: Readonly<Record<string, readonly FxSceneKind[]>> = Object.freeze({
  [FX_STAGE_IDS.selection]: ['selection', 'generic'],
  [FX_STAGE_IDS.cultivation]: ['cultivation', 'generic'],
  [FX_STAGE_IDS.status]: ['status', 'generic'],
  [FX_STAGE_IDS.world]: ['world', 'generic'],
  [FX_STAGE_IDS.forge]: ['forge', 'generic'],
  [FX_STAGE_IDS.ruins]: ['ruins', 'generic'],
  [FX_STAGE_IDS.gateTrial]: ['gateTrial', 'generic'],
});

export function resolveFxLayerOrder(
  stageZIndex = FX_DEFAULT_STAGE_Z_INDEX,
  contentZIndex = FX_DEFAULT_CONTENT_Z_INDEX,
): FxLayerOrder {
  if (contentZIndex > stageZIndex) {
    return { stageZIndex, contentZIndex, corrected: false };
  }

  return {
    stageZIndex,
    contentZIndex: stageZIndex + 1,
    corrected: true,
  };
}

export function resolveFxPortalMountPolicy(snapshot: FxStageSnapshot | null): FxPortalMountPolicy {
  if (!snapshot) return { canMount: false, reason: 'missingSnapshot' };
  if (!snapshot.hostElement) return { canMount: false, reason: 'missingHost' };
  if (!snapshot.hostElement.isConnected) return { canMount: false, reason: 'hostDisconnected' };
  if (snapshot.dormant) return { canMount: false, reason: 'stageDormant' };
  if (!snapshot.hostReady) return { canMount: false, reason: 'hostNotReady' };
  return { canMount: true, reason: null };
}

export function isSceneKindAllowedForStage(stageId: FxStageKey, sceneKind: FxSceneKind): boolean {
  const allowed = FX_ALLOWED_SCENE_KINDS_BY_STAGE[String(stageId)];
  if (!allowed) return sceneKind === 'generic';
  return allowed.includes(sceneKind);
}

export function canRenderPixiStage(scene: FxSceneContract | null): boolean {
  if (!scene) return false;
  if (!scene.hostReady || scene.dormant) return false;
  if (scene.width <= 0 || scene.height <= 0) return false;
  return true;
}
