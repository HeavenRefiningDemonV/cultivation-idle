import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  FX_DEFAULT_AUTO_QUALITY,
  FX_DEFAULT_REQUESTED_QUALITY,
  FX_MAX_DPR,
  FX_REDUCED_MOTION_MEDIA_QUERY,
} from './constants.js';
import type {
  FxContextValue,
  FxQuality,
  FxRequestedQuality,
  FxStageRegistrationToken,
  FxStageSnapshot,
  RegisterFxStageInput,
  UnregisterFxStageInput,
  UpdateFxStageInput,
} from './types.js';

const FxContext = createContext<FxContextValue | null>(null);

const IS_DEV = import.meta.env.DEV;

interface StoredFxStageSnapshot extends FxStageSnapshot {
  token: FxStageRegistrationToken;
}

function resolveEffectiveQuality(requestedQuality: FxRequestedQuality, prefersReducedMotion: boolean): FxQuality {
  if (prefersReducedMotion) return 'reducedMotion';
  if (requestedQuality === 'auto') return FX_DEFAULT_AUTO_QUALITY;
  return requestedQuality;
}

function clampDpr(rawDpr: number | undefined): number {
  const fallbackDpr =
    typeof window !== 'undefined' && typeof window.devicePixelRatio === 'number' ? window.devicePixelRatio : 1;
  const candidate = Number.isFinite(rawDpr) ? rawDpr : fallbackDpr;
  return Math.max(1, Math.min(FX_MAX_DPR, candidate));
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

export function FxQualityProvider({ children }: { children: ReactNode }) {
  const [requestedQuality, setRequestedQuality] = useState<FxRequestedQuality>(FX_DEFAULT_REQUESTED_QUALITY);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(getInitialReducedMotionPreference);
  const [stageRegistry, setStageRegistry] = useState<Record<string, StoredFxStageSnapshot>>({});
  const duplicateWarnedStageIdsRef = useRef<Set<string>>(new Set());

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
          dpr: clampDpr(input.dpr),
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
      if (!existing) return current;
      if (existing.token !== input.token) return current;

      const nextSnapshot: StoredFxStageSnapshot = {
        ...existing,
        hostElement: input.hostElement ?? existing.hostElement,
        bounds: input.bounds ?? existing.bounds,
        dpr: clampDpr(input.dpr ?? existing.dpr),
        updatedAt: nowTimestamp(),
      };

      const unchanged =
        nextSnapshot.hostElement === existing.hostElement &&
        nextSnapshot.dpr === existing.dpr &&
        nextSnapshot.bounds.width === existing.bounds.width &&
        nextSnapshot.bounds.height === existing.bounds.height;

      if (unchanged) return current;

      return {
        ...current,
        [input.stageId]: nextSnapshot,
      };
    });
  }, []);

  const unregisterStage = useCallback((input: UnregisterFxStageInput) => {
    setStageRegistry((current) => {
      const existing = current[input.stageId];
      if (!existing) return current;
      if (existing.token !== input.token) return current;

      const next = { ...current };
      delete next[input.stageId];
      return next;
    });
  }, []);

  const stageSnapshots = useMemo<Record<string, FxStageSnapshot>>(() => {
    const snapshots: Record<string, FxStageSnapshot> = {};
    for (const [stageId, snapshot] of Object.entries(stageRegistry)) {
      snapshots[stageId] = {
        stageId,
        hostElement: snapshot.hostElement,
        bounds: snapshot.bounds,
        dpr: snapshot.dpr,
        updatedAt: snapshot.updatedAt,
      };
    }
    return snapshots;
  }, [stageRegistry]);

  const getStageSnapshot = useCallback(
    (stageId: string) => {
      return stageSnapshots[stageId] ?? null;
    },
    [stageSnapshots],
  );

  const effectiveQuality = useMemo(
    () => resolveEffectiveQuality(requestedQuality, prefersReducedMotion),
    [prefersReducedMotion, requestedQuality],
  );

  const contextValue = useMemo<FxContextValue>(
    () => ({
      requestedQuality,
      effectiveQuality,
      prefersReducedMotion,
      setRequestedQuality,
      stageSnapshots,
      registerStage,
      updateStage,
      unregisterStage,
      getStageSnapshot,
    }),
    [
      effectiveQuality,
      getStageSnapshot,
      prefersReducedMotion,
      registerStage,
      requestedQuality,
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
