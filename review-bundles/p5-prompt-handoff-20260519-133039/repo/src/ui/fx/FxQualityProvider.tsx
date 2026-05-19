import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { FX_DEFAULT_REQUESTED_QUALITY, FX_REDUCED_MOTION_MEDIA_QUERY } from './constants.js';
import { installFxDebugApi } from './dev/fxDebug.js';
import { resolveFxEffectiveQuality, resolveFxReducedMotionPreference } from './runtime.js';
import { createFxStageRegistry } from './stageRegistry.js';
import type {
  ClaimActiveFxSceneInput,
  FxContextValue,
  FxReducedMotionOverride,
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
  const [systemPrefersReducedMotion, setSystemPrefersReducedMotion] = useState<boolean>(getInitialReducedMotionPreference);
  const [reducedMotionOverride, setReducedMotionOverrideState] = useState<FxReducedMotionOverride>(null);
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
      setSystemPrefersReducedMotion(event.matches);
    };

    setSystemPrefersReducedMotion(mediaQueryList.matches);
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

  const setReducedMotionOverride = useCallback<FxContextValue['setReducedMotionOverride']>((value) => {
    setReducedMotionOverrideState((current) => {
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

  const prefersReducedMotion = useMemo(
    () => resolveFxReducedMotionPreference(systemPrefersReducedMotion, reducedMotionOverride),
    [reducedMotionOverride, systemPrefersReducedMotion],
  );

  const effectiveQuality = useMemo(
    () => resolveFxEffectiveQuality(requestedQuality, systemPrefersReducedMotion, reducedMotionOverride),
    [reducedMotionOverride, requestedQuality, systemPrefersReducedMotion],
  );

  useEffect(() => {
    return installFxDebugApi({
      getState: () => ({
        requestedQuality,
        effectiveQuality,
        prefersReducedMotion,
        reducedMotionOverride,
        systemPrefersReducedMotion,
      }),
      setRequestedQuality: (quality) => {
        setRequestedQuality(quality);
      },
      setReducedMotionOverride: (override) => {
        setReducedMotionOverride(override);
      },
      clearOverride: () => {
        setRequestedQuality(FX_DEFAULT_REQUESTED_QUALITY);
        setReducedMotionOverride(null);
      },
    });
  }, [
    effectiveQuality,
    prefersReducedMotion,
    reducedMotionOverride,
    requestedQuality,
    setReducedMotionOverride,
    setRequestedQuality,
    systemPrefersReducedMotion,
  ]);

  const contextValue = useMemo<FxContextValue>(
    () => ({
      requestedQuality,
      effectiveQuality,
      prefersReducedMotion,
      reducedMotionOverride,
      setRequestedQuality,
      setReducedMotionOverride,
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
      reducedMotionOverride,
      registerStage,
      releaseActiveScene,
      requestedQuality,
      setReducedMotionOverride,
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
    reducedMotionOverride: context.reducedMotionOverride,
    setRequestedQuality: context.setRequestedQuality,
    setReducedMotionOverride: context.setReducedMotionOverride,
  };
}

export function useFxStageSnapshot(stageId: FxStageKey) {
  const context = useFxContext();
  return context.stageSnapshots[String(stageId)] ?? null;
}
