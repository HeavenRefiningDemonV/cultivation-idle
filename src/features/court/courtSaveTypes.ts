// Import from the LEAF modules (not the meridians barrel): the barrel re-exports
// observatoryMeridianBinding, which pulls ui/status types → ui/icons (.tsx). courtSaveTypes
// flows into types/index.ts (SaveData), so pulling the barrel would drag .tsx into the
// progression-fixtures tsc project (no jsx). The leaves carry only the types we need.
import type { CourtIntensityId } from '../../systems/meridians/computeMeridianRate.js';
import type { MeridianTrainingState } from '../../systems/meridians/meridianTrainingState.js';

/**
 * W13a-5 — the persisted Court meridian-training slice. Plain serializable data (no React,
 * no zustand) so the save layer (src/types SaveData, defaultSaveState, saveload) can import
 * it without pulling the store/UI. Identical to the store's live state shape.
 */
export interface SaveMeridianCourtState extends MeridianTrainingState {
  /** Per-meridian sum of all rating ever invested, across reincarnations (Form-Memory, §2.11). */
  lifetimeTotals: Record<string, number>;
  intensityId: CourtIntensityId;
  /** Forge heat 0..100 (§2.12). */
  fatigue: number;
}

export function createDefaultMeridianCourtSaveState(): SaveMeridianCourtState {
  return {
    activeMeridianId: null,
    rootByMeridianId: {},
    progressByMeridianId: {},
    lifetimeTotals: {},
    intensityId: 'steady',
    fatigue: 0,
  };
}
