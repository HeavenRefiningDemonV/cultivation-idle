import type { MotionEmphasis } from '../types.js';

export interface ResolveMotionSafetyInput {
  reducedMotion: boolean;
  emphasis?: MotionEmphasis;
  disableScale?: boolean;
}

export interface MotionSafetyResolvedContract {
  reducedMotion: boolean;
  emphasis: MotionEmphasis;
  allowMotion: boolean;
  allowScale: boolean;
  allowSharedLayout: boolean;
  enterDurationMs: number;
  exitDurationMs: number;
  selectionScale: number;
  hoverLiftPx: number;
}

const EMPHASIS_DEFAULTS: Record<MotionEmphasis, { durationMs: number; selectionScale: number; hoverLiftPx: number }> = {
  subtle: { durationMs: 140, selectionScale: 1.01, hoverLiftPx: 0.5 },
  standard: { durationMs: 180, selectionScale: 1.015, hoverLiftPx: 1 },
  hero: { durationMs: 220, selectionScale: 1.02, hoverLiftPx: 1.5 },
};

export function resolveMotionSafetyContract(input: ResolveMotionSafetyInput): MotionSafetyResolvedContract {
  const emphasis = input.emphasis ?? 'subtle';

  if (input.reducedMotion) {
    return {
      reducedMotion: true,
      emphasis,
      allowMotion: false,
      allowScale: false,
      allowSharedLayout: false,
      enterDurationMs: 0,
      exitDurationMs: 0,
      selectionScale: 1,
      hoverLiftPx: 0,
    };
  }

  const defaults = EMPHASIS_DEFAULTS[emphasis];
  const allowScale = !input.disableScale;

  return {
    reducedMotion: false,
    emphasis,
    allowMotion: true,
    allowScale,
    allowSharedLayout: true,
    enterDurationMs: defaults.durationMs,
    exitDurationMs: defaults.durationMs,
    selectionScale: allowScale ? defaults.selectionScale : 1,
    hoverLiftPx: defaults.hoverLiftPx,
  };
}
