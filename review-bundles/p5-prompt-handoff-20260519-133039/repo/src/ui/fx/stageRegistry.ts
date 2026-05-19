import { FX_MAX_DPR, FX_MIN_STAGE_SIZE } from './constants.js';
import type {
  ClaimActiveFxSceneInput,
  FxSceneOwnerKey,
  FxStageBounds,
  FxStageKey,
  FxStageRegistrationToken,
  FxStageSnapshot,
  RegisterFxStageInput,
  UnregisterFxStageInput,
  UpdateFxStageInput,
} from './types.js';

interface StoredFxStageSnapshot {
  stageId: FxStageKey;
  hostElement: HTMLDivElement;
  bounds: FxStageBounds;
  dpr: number;
  updatedAt: number;
  token: FxStageRegistrationToken;
}

export interface FxStageDormancyInput {
  documentHidden: boolean;
  hostReady: boolean;
}

export interface FxStageReadinessInput {
  hostElement: HTMLDivElement;
  bounds: FxStageBounds;
}

export interface RegisterStageResult {
  token: FxStageRegistrationToken;
  duplicateStageId: boolean;
}

export interface ClaimSceneResult {
  claimed: boolean;
  duplicateOwnerBlocked: boolean;
}


function clampFxDprLocal(rawDpr: number | undefined, maxDpr = FX_MAX_DPR): number {
  const fallback = 1;
  const source = Number.isFinite(rawDpr) ? (rawDpr as number) : fallback;
  return Math.max(1, Math.min(maxDpr, source));
}
function nowTimestamp() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function resolveFxStageHostReady(input: FxStageReadinessInput): boolean {
  return input.hostElement.isConnected
    && input.bounds.width >= FX_MIN_STAGE_SIZE
    && input.bounds.height >= FX_MIN_STAGE_SIZE;
}

export function resolveFxStageDormant(input: FxStageDormancyInput): boolean {
  return input.documentHidden || !input.hostReady;
}

export function buildFxStageSnapshot(snapshot: StoredFxStageSnapshot, documentHidden: boolean): FxStageSnapshot {
  const hostReady = resolveFxStageHostReady({
    hostElement: snapshot.hostElement,
    bounds: snapshot.bounds,
  });

  return {
    stageId: snapshot.stageId,
    hostElement: snapshot.hostElement,
    bounds: snapshot.bounds,
    dpr: snapshot.dpr,
    hostReady,
    dormant: resolveFxStageDormant({ documentHidden, hostReady }),
    updatedAt: snapshot.updatedAt,
  };
}

export function createFxStageRegistry() {
  const stageRegistry: Record<string, StoredFxStageSnapshot> = {};
  const activeSceneOwners: Record<string, FxSceneOwnerKey> = {};

  const registerStage = (input: RegisterFxStageInput): RegisterStageResult => {
    const token = Symbol(String(input.stageId));
    const stageId = String(input.stageId);

    const duplicateStageId = Boolean(stageRegistry[stageId]);
    stageRegistry[stageId] = {
      stageId: input.stageId,
      hostElement: input.hostElement,
      bounds: input.bounds,
      dpr: clampFxDprLocal(input.dpr),
      updatedAt: nowTimestamp(),
      token,
    };

    return { token, duplicateStageId };
  };

  const updateStage = (input: UpdateFxStageInput): boolean => {
    const stageId = String(input.stageId);
    const existing = stageRegistry[stageId];
    if (!existing || existing.token !== input.token) return false;

    const nextHostElement = input.hostElement ?? existing.hostElement;
    const nextBounds = input.bounds ?? existing.bounds;
    const nextDpr = clampFxDprLocal(input.dpr ?? existing.dpr);
    const unchanged =
      nextHostElement === existing.hostElement
      && nextDpr === existing.dpr
      && nextBounds.width === existing.bounds.width
      && nextBounds.height === existing.bounds.height;

    if (unchanged) return false;

    stageRegistry[stageId] = {
      ...existing,
      hostElement: nextHostElement,
      bounds: nextBounds,
      dpr: nextDpr,
      updatedAt: nowTimestamp(),
    };
    return true;
  };

  const unregisterStage = (input: UnregisterFxStageInput): boolean => {
    const stageId = String(input.stageId);
    const existing = stageRegistry[stageId];
    if (!existing || existing.token !== input.token) return false;

    delete stageRegistry[stageId];
    delete activeSceneOwners[stageId];
    return true;
  };

  const claimActiveScene = (input: ClaimActiveFxSceneInput): ClaimSceneResult => {
    const stageId = String(input.stageId);
    const owner = activeSceneOwners[stageId];

    if (!owner || owner === input.sceneKey) {
      activeSceneOwners[stageId] = input.sceneKey;
      return { claimed: true, duplicateOwnerBlocked: false };
    }

    return { claimed: false, duplicateOwnerBlocked: true };
  };

  const releaseActiveScene = (input: ClaimActiveFxSceneInput): boolean => {
    const stageId = String(input.stageId);
    if (activeSceneOwners[stageId] !== input.sceneKey) return false;
    delete activeSceneOwners[stageId];
    return true;
  };

  const getStageSnapshot = (stageId: FxStageKey, documentHidden: boolean): FxStageSnapshot | null => {
    const stored = stageRegistry[String(stageId)];
    if (!stored) return null;
    return buildFxStageSnapshot(stored, documentHidden);
  };

  const getAllStageSnapshots = (documentHidden: boolean): Record<string, FxStageSnapshot> => {
    const snapshots: Record<string, FxStageSnapshot> = {};
    for (const [stageId, stored] of Object.entries(stageRegistry)) {
      snapshots[stageId] = buildFxStageSnapshot(stored, documentHidden);
    }
    return snapshots;
  };

  const getActiveSceneOwner = (stageId: FxStageKey): FxSceneOwnerKey | null => activeSceneOwners[String(stageId)] ?? null;

  return {
    registerStage,
    updateStage,
    unregisterStage,
    claimActiveScene,
    releaseActiveScene,
    getStageSnapshot,
    getAllStageSnapshots,
    getActiveSceneOwner,
  };
}
