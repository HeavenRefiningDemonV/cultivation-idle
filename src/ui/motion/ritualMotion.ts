export interface RitualMotionProfile {
  hoverMs: number;
  selectMs: number;
  modalMs: number;
  commitMs: number;
}

const DEFAULT_PROFILE: RitualMotionProfile = Object.freeze({
  hoverMs: 150,
  selectMs: 190,
  modalMs: 200,
  commitMs: 130,
});

const REDUCED_PROFILE: RitualMotionProfile = Object.freeze({
  hoverMs: 0,
  selectMs: 0,
  modalMs: 0,
  commitMs: 0,
});

export function getRitualMotionProfile(prefersReducedMotion: boolean): RitualMotionProfile {
  return prefersReducedMotion ? REDUCED_PROFILE : DEFAULT_PROFILE;
}

export function getSelectionCommitDelay(prefersReducedMotion: boolean): number {
  return getRitualMotionProfile(prefersReducedMotion).commitMs;
}
