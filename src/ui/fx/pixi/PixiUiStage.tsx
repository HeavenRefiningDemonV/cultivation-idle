import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ComponentType, ReactNode } from 'react';
import type { FxRenderMode } from '../../fxQualityContract.js';

interface PixiApplicationProps {
  width: number;
  height: number;
  resolution: number;
  backgroundAlpha?: number;
  antialias?: boolean;
  autoDensity?: boolean;
  children?: ReactNode;
}

interface PixiReactModule {
  Application?: ComponentType<PixiApplicationProps>;
}

export interface PixiUiStageProps {
  active?: boolean;
  renderMode: FxRenderMode;
  className?: string;
  style?: CSSProperties;
  width?: number;
  height?: number;
  resolutionCap?: number;
  children?: ReactNode;
}

const PIXI_REACT_MODULE_NAME = '@pixi/react';

export function PixiUiStage({
  active = true,
  renderMode,
  className,
  style,
  width,
  height,
  resolutionCap = 1.5,
  children,
}: PixiUiStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [measuredSize, setMeasuredSize] = useState({ width: 0, height: 0 });
  const [applicationComponent, setApplicationComponent] = useState<ComponentType<PixiApplicationProps> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPixiReact = async () => {
      try {
        const pixiModule = (await import(/* @vite-ignore */ PIXI_REACT_MODULE_NAME)) as PixiReactModule;
        if (!cancelled) {
          setApplicationComponent(() => pixiModule.Application ?? null);
        }
      } catch {
        if (!cancelled) {
          setApplicationComponent(null);
        }
      }
    };

    void loadPixiReact();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined' || !containerRef.current || typeof width === 'number' || typeof height === 'number') {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect;
      if (!next) return;
      setMeasuredSize({ width: Math.floor(next.width), height: Math.floor(next.height) });
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [height, width]);

  const resolvedWidth = width ?? measuredSize.width;
  const resolvedHeight = height ?? measuredSize.height;

  const resolution = useMemo(() => {
    const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
    return Math.max(1, Math.min(dpr, resolutionCap));
  }, [resolutionCap]);

  if (!active || renderMode === 'off') {
    return null;
  }

  const ApplicationComponent = applicationComponent;
  const isReady = resolvedWidth > 0 && resolvedHeight > 0;

  return (
    <div className={className} style={style} ref={containerRef} aria-hidden="true">
      {isReady && ApplicationComponent ? (
        <ApplicationComponent
          width={resolvedWidth}
          height={resolvedHeight}
          resolution={resolution}
          autoDensity
          antialias={renderMode === 'full'}
          backgroundAlpha={0}
        >
          {children}
        </ApplicationComponent>
      ) : null}
    </div>
  );
}
