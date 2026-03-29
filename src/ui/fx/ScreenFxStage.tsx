import { useEffect, useMemo, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import classNames from 'classnames';
import {
  FX_DEFAULT_CONTENT_Z_INDEX,
  FX_DEFAULT_STAGE_Z_INDEX,
  FX_MAX_DPR,
  FX_MIN_STAGE_SIZE,
} from './constants.js';
import { useFxContext } from './FxQualityProvider.js';
import type { FxStageBounds, FxStageRegistrationToken } from './types.js';
import './ScreenFxStage.scss';

export interface ScreenFxStageProps {
  stageId: string;
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
  return Math.max(1, Math.min(FX_MAX_DPR, window.devicePixelRatio || 1));
}

export function ScreenFxStage({
  stageId,
  children,
  className,
  stageClassName,
  contentClassName,
  stageZIndex = FX_DEFAULT_STAGE_Z_INDEX,
  contentZIndex = FX_DEFAULT_CONTENT_Z_INDEX,
  disabled = false,
}: ScreenFxStageProps) {
  const stageHostRef = useRef<HTMLDivElement | null>(null);
  const registrationTokenRef = useRef<FxStageRegistrationToken | null>(null);
  const { registerStage, unregisterStage, updateStage } = useFxContext();

  const stageStyle = useMemo<CSSProperties>(() => ({ zIndex: stageZIndex }), [stageZIndex]);
  const contentStyle = useMemo<CSSProperties>(() => ({ zIndex: contentZIndex }), [contentZIndex]);

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

  if (disabled) {
    return <div className={classNames('screenFxStage', className)}>{children}</div>;
  }

  return (
    <div className={classNames('screenFxStage', className)}>
      <div
        ref={stageHostRef}
        className={classNames('screenFxStage__layer', stageClassName)}
        style={stageStyle}
        aria-hidden="true"
        tabIndex={-1}
        data-fx-stage-id={stageId}
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
