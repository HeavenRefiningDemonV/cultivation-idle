import type { CultivationSeatSurfaceV1, CultivationSeatVisualState } from './cultivationSeatTypes.js';

/** M.II.3 — presentation resolver: visual-state → a11y labels + dominant-tone flags. */
export const CULTIVATION_SEAT_VISUAL_STATE_LABELS: Record<CultivationSeatVisualState, string> = {
  seclusion: 'In seclusion — cultivation accrues.',
  cultivating: 'Cultivating — the Seat intensifies.',
  combatHeld: 'Held — combat preempted the foreground.',
  peakReady: 'The Threshold has woken — the crossing is ready.',
  peakBlocked: 'At the Peak — the Threshold waits.',
  unknown: 'The Seat of Becoming.',
};

export interface CultivationSeatPresentation {
  visualStateLabel: string;
  dominantTone: 'jade' | 'gold' | 'cinnabar';
  thresholdAwake: boolean;
  held: boolean;
}

export function resolveCultivationSeatPresentation(surface: CultivationSeatSurfaceV1): CultivationSeatPresentation {
  const state = surface.meta.visualState;
  return {
    visualStateLabel: CULTIVATION_SEAT_VISUAL_STATE_LABELS[state],
    dominantTone: state === 'combatHeld' || state === 'peakBlocked' ? 'cinnabar' : state === 'peakReady' ? 'gold' : 'jade',
    thresholdAwake: surface.breakthrough.thresholdWoken,
    held: state === 'combatHeld',
  };
}
