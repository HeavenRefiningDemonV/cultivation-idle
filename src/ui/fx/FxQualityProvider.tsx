import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { FX_DEFAULT_REQUESTED_QUALITY, FX_REDUCED_MOTION_MEDIA_QUERY } from './constants.js';
import { installFxDebugApi } from './dev/fxDebug.js';
import { resolveFxEffectiveQuality } from './runtime.js';
import { createFxStageRegistry } from './stageRegistry.js';
import type {
  ClaimActiveFxSceneInput,
  FxContextValue,
  FxRequestedQuality,
  FxStageKey,
  FxStageSnapshot,
  RegisterFxStageInput,
  UnregisterFxStageInput,
  UpdateFxStageInput,
} from './types.js';

const FxContext = createContext<FxContextValue | null>(null);

const IS_DEV = import.meta.env.DEV;

function getInitialReducedMotionPreference() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(FX_REDUCED_MOTION_MEDIA_QUERY).matches;
}

export function FxQualityProvider({ children }: { children: ReactNode }) {
  const [requestedQuality, setRequestedQualityState] = useState<FxRequestedQuality>(FX_DEFAULT_REQUESTED_QUALITY);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(getInitialReducedMotionPreference);
  const [documentHidden, setDocumentHidden] = useState<boolean>(
    typeof document !== 'undefined' ? document.hidden : false,
  );
  const [stageSnapshots, setStageSnapshots] = useState<Record<string, FxStageSnapshot>>({});
  const registryRef = useRef(createFxStageRegistry());
  const duplicateWarnedStageIdsRef = useRef<Set<string>>(new Set());
  const duplicateSceneWarnedStageIdsRef = useRef<Set<string>>(new Set());

  const syncSnapshots = useCallback(() => {
    setStageSnapshots(registryRef.current.getAllStageSnapshots(documentHidden));
  }, [documentHidden]);

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

  useEffect(() => {
    syncSnapshots();
  }, [documentHidden, syncSnapshots]);

  const setRequestedQuality = useCallback<FxContextValue['setRequestedQuality']>((value) => {
    setRequestedQualityState((current) => {
      if (typeof value === 'function') {
        return value(current);
      }
      return value;
    });
  }, []);

  const registerStage = useCallback((input: RegisterFxStageInput) => {
    const result = registryRef.current.registerStage(input);
    const stageId = String(input.stageId);

    if (IS_DEV && result.duplicateStageId && !duplicateWarnedStageIdsRef.current.has(stageId)) {
      duplicateWarnedStageIdsRef.current.add(stageId);
      console.warn(`[fx] Duplicate stage id registration detected: "${stageId}".`);
    }

    syncSnapshots();
    return result.token;
  }, [syncSnapshots]);

  const updateStage = useCallback((input: UpdateFxStageInput) => {
    const changed = registryRef.current.updateStage(input);
    if (!changed) return;
    syncSnapshots();
  }, [syncSnapshots]);

  const unregisterStage = useCallback((input: UnregisterFxStageInput) => {
    const removed = registryRef.current.unregisterStage(input);
    if (!removed) return;
    syncSnapshots();
  }, [syncSnapshots]);

  const claimActiveScene = useCallback((input: ClaimActiveFxSceneInput) => {
    const stageId = String(input.stageId);
    const result = registryRef.current.claimActiveScene(input);

    if (IS_DEV && result.duplicateOwnerBlocked && !duplicateSceneWarnedStageIdsRef.current.has(stageId)) {
      duplicateSceneWarnedStageIdsRef.current.add(stageId);
      console.warn(`[fx] Duplicate active scene mount blocked for stageId "${stageId}".`);
    }

    return result.claimed;
  }, []);

  const releaseActiveScene = useCallback((input: ClaimActiveFxSceneInput) => {
    registryRef.current.releaseActiveScene(input);
  }, []);

  const getActiveSceneOwner = useCallback(
    (stageId: FxStageKey) => registryRef.current.getActiveSceneOwner(stageId),
    [],
  );

  const getStageSnapshot = useCallback(
    (stageId: FxStageKey) => {
      return stageSnapshots[String(stageId)] ?? null;
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

export function useFxStageSnapshot(stageId: FxStageKey) {
  const context = useFxContext();
  return context.stageSnapshots[String(stageId)] ?? null;
}
