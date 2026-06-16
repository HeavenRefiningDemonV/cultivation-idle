import { useEffect, useRef, useState } from 'react';

/**
 * Mockup-native design space. Every observatory layout/SVG coordinate is
 * authored in these units; the Stage scales the whole 2048×1152 canvas
 * uniformly so the painted composition reads identically at any monitor size
 * (Frame I law). One design unit = one mockup pixel.
 */
export const OBS_STAGE_WIDTH = 2048;
export const OBS_STAGE_HEIGHT = 1152;

const MIN_SCALE = 0.45;
const MAX_SCALE = 1.75;

export interface ObservatoryScaleState {
  /** Uniform scale applied to the stage, clamped to [0.45, 1.75]. */
  scale: number;
  /** True when the unclamped fit fell below the floor — viewport may scroll. */
  atFloor: boolean;
}

export interface ObservatoryScaleHandle extends ObservatoryScaleState {
  viewportRef: React.RefObject<HTMLDivElement>;
}

/**
 * Observes the stage viewport and computes the uniform scale that fits the
 * 2048×1152 design canvas inside it (the smaller of the width/height ratios, so
 * the whole composition is always visible). SSR-safe: returns scale 1 until the
 * first client-side measurement. The ResizeObserver is cleaned up on unmount.
 */
export function useObservatoryScale(): ObservatoryScaleHandle {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ObservatoryScaleState>({ scale: 1, atFloor: false });

  useEffect(() => {
    const element = viewportRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    const measure = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      if (width <= 0 || height <= 0) {
        return;
      }
      const raw = Math.min(width / OBS_STAGE_WIDTH, height / OBS_STAGE_HEIGHT);
      const atFloor = raw < MIN_SCALE;
      const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, raw));
      setState((previous) =>
        previous.scale === scale && previous.atFloor === atFloor
          ? previous
          : { scale, atFloor },
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { viewportRef, scale: state.scale, atFloor: state.atFloor };
}
