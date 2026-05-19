import { useEffect, useMemo, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import classNames from 'classnames';
import { FX_MIN_STAGE_SIZE } from './constants.js';
import { useFxContext } from './FxQualityProvider.js';
import { clampFxDpr } from './runtime.js';
import { resolveFxLayerOrder } from './shellContract.js';
import type { FxStageBounds, FxStageKey, FxStageRegistrationToken } from './types.js';
import './ScreenFxStage.scss';

const IS_DEV = import.meta.env.DEV;

export interface ScreenFxStageProps {
  stageId: FxStageKey;
  children: ReactNode;
  className?: string;
  stageClassName?: string;
  contentClassName?: string;
  stageZIndex?: number;
  contentZIndex?: number;
  disabled?: boolean;
}

function getStageBounds(element: HTMLDivElement | null): FxStageBounds {
  if (!element) {
    return { width: 0, height: 0 };
  }
  const rect = element.getBoundingClientRect();
  return {
    width: Math.max(0, Math.round(rect.width)),
    height: Math.max(0, Math.round(rect.height)),
  };
}

function getStageDpr() {
  if (typeof window === 'undefined') return 1;
  return clampFxDpr(window.devicePixelRatio || 1);
}

export function ScreenFxStage({
  stageId,
  children,
  className,
  stageClassName,
  contentClassName,
  stageZIndex,
  contentZIndex,
  disabled = false,
}: ScreenFxStageProps) {
  const stageHostRef = useRef<HTMLDivElement | null>(null);
  const registrationTokenRef = useRef<FxStageRegistrationToken | null>(null);
  const zOrderWarnedRef = useRef(false);
  const { registerStage, unregisterStage, updateStage } = useFxContext();

  const layerOrder = useMemo(
    () => resolveFxLayerOrder(stageZIndex, contentZIndex),
    [contentZIndex, stageZIndex],
  );

  const stageStyle = useMemo<CSSProperties>(() => ({ zIndex: layerOrder.stageZIndex }), [layerOrder.stageZIndex]);
  const contentStyle = useMemo<CSSProperties>(() => ({ zIndex: layerOrder.contentZIndex }), [layerOrder.contentZIndex]);

  useEffect(() => {
    if (!IS_DEV || !layerOrder.corrected || zOrderWarnedRef.current) return;
    zOrderWarnedRef.current = true;
    console.warn(
      `[fx] ScreenFxStage corrected invalid z-order for stageId "${String(stageId)}" (content must remain above FX layer).`,
    );
  }, [layerOrder.corrected, stageId]);

  useEffect(() => {
    if (disabled) return undefined;
    const stageHost = stageHostRef.current;
    if (!stageHost) return undefined;

    const initialBounds = getStageBounds(stageHost);
    registrationTokenRef.current = registerStage({
      stageId,
      hostElement: stageHost,
      bounds: initialBounds,
      dpr: getStageDpr(),
    });

    const token = registrationTokenRef.current;
    const updateSnapshot = () => {
      if (!token) return;
      const nextBounds = getStageBounds(stageHost);
      updateStage({
        stageId,
        token,
        hostElement: stageHost,
        bounds: nextBounds,
        dpr: getStageDpr(),
      });
    };

    updateSnapshot();

    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(() => {
        updateSnapshot();
      });
      observer.observe(stageHost);

      if (typeof window !== 'undefined') {
        window.addEventListener('resize', updateSnapshot);
      }

      return () => {
        observer.disconnect();
        if (typeof window !== 'undefined') {
          window.removeEventListener('resize', updateSnapshot);
        }
        unregisterStage({ stageId, token });
        registrationTokenRef.current = null;
      };
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateSnapshot);
    }

    const fallbackInterval = typeof window !== 'undefined' ? window.setInterval(updateSnapshot, 750) : null;

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateSnapshot);
      }
      if (fallbackInterval !== null && typeof window !== 'undefined') {
        window.clearInterval(fallbackInterval);
      }
      unregisterStage({ stageId, token });
      registrationTokenRef.current = null;
    };
  }, [disabled, registerStage, stageId, unregisterStage, updateStage]);

  return (
    <div className={classNames('screenFxStage', className)} data-fx-stage-disabled={disabled ? 'true' : 'false'}>
      <div
        ref={stageHostRef}
        className={classNames('screenFxStage__layer', stageClassName, { 'screenFxStage__layer--disabled': disabled })}
        style={stageStyle}
        aria-hidden="true"
        tabIndex={-1}
        data-fx-stage-id={String(stageId)}
      />
      <div className={classNames('screenFxStage__content', contentClassName)} style={contentStyle}>
        {children}
      </div>
    </div>
  );
}

export function isFxStageUsable(bounds: FxStageBounds) {
  return bounds.width >= FX_MIN_STAGE_SIZE && bounds.height >= FX_MIN_STAGE_SIZE;
}
