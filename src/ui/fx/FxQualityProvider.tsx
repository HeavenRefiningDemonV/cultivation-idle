import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { FX_DEFAULT_REQUESTED_QUALITY, FX_REDUCED_MOTION_MEDIA_QUERY, FX_MIN_STAGE_SIZE } from './constants.js';
import { installFxDebugApi } from './dev/fxDebug.js';
import { clampFxDpr, resolveFxEffectiveQuality } from './runtime.js';
import type {
  ClaimActiveFxSceneInput,
  FxContextValue,
  FxRequestedQuality,
  FxStageRegistrationToken,
  FxStageSnapshot,
  RegisterFxStageInput,
  UnregisterFxStageInput,
  UpdateFxStageInput,
} from './types.js';

const FxContext = createContext<FxContextValue | null>(null);

const IS_DEV = import.meta.env.DEV;

interface StoredFxStageSnapshot {
  stageId: string;
  hostElement: HTMLDivElement;
  bounds: FxStageSnapshot['bounds'];
  dpr: number;
  updatedAt: number;
  token: FxStageRegistrationToken;
}

function nowTimestamp() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function getInitialReducedMotionPreference() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(FX_REDUCED_MOTION_MEDIA_QUERY).matches;
}

function isHostReady(hostElement: HTMLDivElement, width: number, height: number) {
  return hostElement.isConnected && width >= FX_MIN_STAGE_SIZE && height >= FX_MIN_STAGE_SIZE;
}

export function FxQualityProvider({ children }: { children: ReactNode }) {
  const [requestedQuality, setRequestedQualityState] = useState<FxRequestedQuality>(FX_DEFAULT_REQUESTED_QUALITY);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(getInitialReducedMotionPreference);
  const [stageRegistry, setStageRegistry] = useState<Record<string, StoredFxStageSnapshot>>({});
  const [activeSceneOwners, setActiveSceneOwners] = useState<Record<string, string>>({});
  const [documentHidden, setDocumentHidden] = useState<boolean>(
    typeof document !== 'undefined' ? document.hidden : false,
  );
  const duplicateWarnedStageIdsRef = useRef<Set<string>>(new Set());
  const duplicateSceneWarnedStageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQueryList = window.matchMedia(FX_REDUCED_MOTION_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    setPrefersReducedMotion(mediaQueryList.matches);
    mediaQueryList.addEventListener('change', handleChange);
    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const handleVisibilityChange = () => {
      setDocumentHidden(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const setRequestedQuality = useCallback<FxContextValue['setRequestedQuality']>((value) => {
    setRequestedQualityState((current) => {
      if (typeof value === 'function') {
        return value(current);
      }
      return value;
    });
  }, []);

  const registerStage = useCallback((input: RegisterFxStageInput) => {
    const token = Symbol(input.stageId);
    setStageRegistry((current) => {
      const existing = current[input.stageId];
      if (IS_DEV && existing && !duplicateWarnedStageIdsRef.current.has(input.stageId)) {
        duplicateWarnedStageIdsRef.current.add(input.stageId);
        console.warn(`[fx] Duplicate stage id registration detected: "${input.stageId}".`);
      }

      return {
        ...current,
        [input.stageId]: {
          stageId: input.stageId,
          hostElement: input.hostElement,
          bounds: input.bounds,
          dpr: clampFxDpr(input.dpr),
          updatedAt: nowTimestamp(),
          token,
        },
      };
    });
    return token;
  }, []);

  const updateStage = useCallback((input: UpdateFxStageInput) => {
    setStageRegistry((current) => {
      const existing = current[input.stageId];
      if (!existing || existing.token !== input.token) return current;

      const nextHostElement = input.hostElement ?? existing.hostElement;
      const nextBounds = input.bounds ?? existing.bounds;
      const nextDpr = clampFxDpr(input.dpr ?? existing.dpr);
      const unchanged =
        nextHostElement === existing.hostElement &&
        nextDpr === existing.dpr &&
        nextBounds.width === existing.bounds.width &&
        nextBounds.height === existing.bounds.height;

      if (unchanged) return current;

      return {
        ...current,
        [input.stageId]: {
          ...existing,
          hostElement: nextHostElement,
          bounds: nextBounds,
          dpr: nextDpr,
          updatedAt: nowTimestamp(),
        },
      };
    });
  }, []);

  const unregisterStage = useCallback((input: UnregisterFxStageInput) => {
    setStageRegistry((current) => {
      const existing = current[input.stageId];
      if (!existing || existing.token !== input.token) return current;
      const next = { ...current };
      delete next[input.stageId];
      return next;
    });
    setActiveSceneOwners((current) => {
      if (!current[input.stageId]) return current;
      const next = { ...current };
      delete next[input.stageId];
      return next;
    });
  }, []);

  const claimActiveScene = useCallback((input: ClaimActiveFxSceneInput) => {
    let didClaim = false;
    setActiveSceneOwners((current) => {
      const owner = current[input.stageId];
      if (!owner || owner === input.sceneKey) {
        didClaim = true;
        if (owner === input.sceneKey) return current;
        return {
          ...current,
          [input.stageId]: input.sceneKey,
        };
      }

      if (IS_DEV && !duplicateSceneWarnedStageIdsRef.current.has(input.stageId)) {
        duplicateSceneWarnedStageIdsRef.current.add(input.stageId);
        console.warn(`[fx] Duplicate active scene mount blocked for stageId "${input.stageId}".`);
      }
      return current;
    });
    return didClaim;
  }, []);

  const releaseActiveScene = useCallback((input: ClaimActiveFxSceneInput) => {
    setActiveSceneOwners((current) => {
      const owner = current[input.stageId];
      if (!owner || owner !== input.sceneKey) return current;
      const next = { ...current };
      delete next[input.stageId];
      return next;
    });
  }, []);

  const getActiveSceneOwner = useCallback(
    (stageId: string) => {
      return activeSceneOwners[stageId] ?? null;
    },
    [activeSceneOwners],
  );

  const stageSnapshots = useMemo<Record<string, FxStageSnapshot>>(() => {
    const snapshots: Record<string, FxStageSnapshot> = {};
    for (const [stageId, snapshot] of Object.entries(stageRegistry)) {
      const hostReady = isHostReady(snapshot.hostElement, snapshot.bounds.width, snapshot.bounds.height);
      snapshots[stageId] = {
        stageId,
        hostElement: snapshot.hostElement,
        bounds: snapshot.bounds,
        dpr: snapshot.dpr,
        hostReady,
        dormant: documentHidden || !hostReady,
        updatedAt: snapshot.updatedAt,
      };
    }
    return snapshots;
  }, [documentHidden, stageRegistry]);

  const getStageSnapshot = useCallback(
    (stageId: string) => {
      return stageSnapshots[stageId] ?? null;
    },
    [stageSnapshots],
  );

  const effectiveQuality = useMemo(
    () => resolveFxEffectiveQuality(requestedQuality, prefersReducedMotion),
    [prefersReducedMotion, requestedQuality],
  );

  useEffect(() => {
    return installFxDebugApi({
      getState: () => ({
        requestedQuality,
        effectiveQuality,
        prefersReducedMotion,
      }),
      setRequestedQuality: (quality) => {
        setRequestedQuality(quality);
      },
      clearOverride: () => {
        setRequestedQuality(FX_DEFAULT_REQUESTED_QUALITY);
      },
    });
  }, [effectiveQuality, prefersReducedMotion, requestedQuality, setRequestedQuality]);

  const contextValue = useMemo<FxContextValue>(
    () => ({
      requestedQuality,
      effectiveQuality,
      prefersReducedMotion,
      setRequestedQuality,
      stageSnapshots,
      documentHidden,
      registerStage,
      updateStage,
      unregisterStage,
      getStageSnapshot,
      claimActiveScene,
      releaseActiveScene,
      getActiveSceneOwner,
    }),
    [
      claimActiveScene,
      documentHidden,
      effectiveQuality,
      getActiveSceneOwner,
      getStageSnapshot,
      prefersReducedMotion,
      registerStage,
      releaseActiveScene,
      requestedQuality,
      setRequestedQuality,
      stageSnapshots,
      unregisterStage,
      updateStage,
    ],
  );

  return <FxContext.Provider value={contextValue}>{children}</FxContext.Provider>;
}

export function useFxContext() {
  const context = useContext(FxContext);
  if (!context) {
    throw new Error('useFxContext must be used within FxQualityProvider.');
  }
  return context;
}

export function useFxQuality() {
  const context = useFxContext();
  return {
    requestedQuality: context.requestedQuality,
    effectiveQuality: context.effectiveQuality,
    prefersReducedMotion: context.prefersReducedMotion,
    setRequestedQuality: context.setRequestedQuality,
  };
}

export function useFxStageSnapshot(stageId: string) {
  const context = useFxContext();
  return context.stageSnapshots[stageId] ?? null;
}
