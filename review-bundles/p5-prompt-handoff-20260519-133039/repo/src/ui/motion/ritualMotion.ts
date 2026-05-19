export interface RitualMotionProfile {
  hoverMs: number;
  selectMs: number;
  modalMs: number;
  commitMs: number;
}

export const RITUAL_MOTION_PROFILE_DEFAULT: RitualMotionProfile = Object.freeze({
  hoverMs: 150,
  selectMs: 190,
  modalMs: 200,
  commitMs: 130,
});

export const RITUAL_MOTION_PROFILE_REDUCED: RitualMotionProfile = Object.freeze({
  hoverMs: 0,
  selectMs: 0,
  modalMs: 0,
  commitMs: 0,
});

export function getRitualMotionProfile(prefersReducedMotion: boolean): RitualMotionProfile {
  return prefersReducedMotion ? RITUAL_MOTION_PROFILE_REDUCED : RITUAL_MOTION_PROFILE_DEFAULT;
}

export function getSelectionCommitDelay(prefersReducedMotion: boolean): number {
  return getRitualMotionProfile(prefersReducedMotion).commitMs;
}
