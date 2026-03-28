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
  allowHoverLift: boolean;
  allowSelectionOpacityEmphasis: boolean;
  enterDurationMs: number;
  exitDurationMs: number;
  selectionScale: number;
  hoverLiftPx: number;
  pressShiftPx: number;
}

// Keep these numeric values in sync with src/styles/uiMotionTokens.scss.
const EMPHASIS_DEFAULTS: Record<MotionEmphasis, { durationMs: number; selectionScale: number; hoverLiftPx: number; pressShiftPx: number }> = {
  subtle: { durationMs: 160, selectionScale: 1.005, hoverLiftPx: 0.5, pressShiftPx: 0.5 },
  standard: { durationMs: 200, selectionScale: 1.01, hoverLiftPx: 1, pressShiftPx: 1 },
  hero: { durationMs: 240, selectionScale: 1.012, hoverLiftPx: 1.25, pressShiftPx: 1 },
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
      allowHoverLift: false,
      allowSelectionOpacityEmphasis: true,
      enterDurationMs: 0,
      exitDurationMs: 0,
      selectionScale: 1,
      hoverLiftPx: 0,
      pressShiftPx: 0,
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
    allowHoverLift: true,
    allowSelectionOpacityEmphasis: true,
    enterDurationMs: defaults.durationMs,
    exitDurationMs: defaults.durationMs,
    selectionScale: allowScale ? defaults.selectionScale : 1,
    hoverLiftPx: defaults.hoverLiftPx,
    pressShiftPx: defaults.pressShiftPx,
  };
}
