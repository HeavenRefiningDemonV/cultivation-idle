import { create } from 'zustand';

import {
  COURT_INTENSITY_FPM,
  advanceMeridian,
  computeMeridianRate,
  createMeridianProgress,
  effectiveMeridianCap,
  masteryRankFromXp,
  type CourtIntensityId,
  type MeridianProgress,
  type MeridianTrainingState,
  type PathMeridianDef,
  type SpiritRootGrade,
} from '../../systems/meridians/index.js';
import { applyFormMemoryReset, rollSpiritRootGrade } from '../../systems/prestige/formMemory.js';
import { createDefaultMeridianCourtSaveState, type SaveMeridianCourtState } from './courtSaveTypes.js';

/**
 * W13a-2 — the live meridian-training store (flag-gated; NOT default). Owns the Court's
 * training-domain state and is the live counterpart of the W3 pure engine: setActive /
 * setIntensity / ensureRootsForPath / advanceActive (the tick) / recoverFatigue.
 *
 * IN-MEMORY for now (no persistence) — a new standalone store, so it changes NO save
 * schema and is fully reversible. Save persistence (via src/save/) is a separate W13a
 * step done before the W13b flip. Status (active/idle/blocked) is NOT owned here — it
 * comes from the foreground activity gate (activityStore), resolved in the surface adapter.
 */

/** Base Court training rate — 2.4 xp/min at mult 1.0 (mirrors the THIS PRACTICE display). */
export const COURT_BASE_RATE_PER_MIN = 2.4;

/** The live store state — identical to the persisted slice (W13a-5). */
export type CourtMeridianState = SaveMeridianCourtState;
export type { SaveMeridianCourtState } from './courtSaveTypes.js';

export interface AdvanceActiveInput {
  /** Elapsed seconds since the last advance. */
  dtSeconds: number;
  realmIndex1to7: number;
  perception: number;
  meridianDefs: PathMeridianDef[];
}

export interface CourtMeridianStore extends CourtMeridianState {
  setActiveMeridian: (meridianId: string) => void;
  setIntensity: (intensityId: CourtIntensityId) => void;
  /** Roll a spirit root for any of the given meridians that lacks one (Life Start, §2.3). */
  ensureRootsForPath: (meridianIds: readonly string[], rng?: () => number) => void;
  /** One training tick on the active meridian: rate → advance → accrue forge heat. */
  advanceActive: (input: AdvanceActiveInput) => void;
  /** Forge heat eases while not training (§2.12). */
  recoverFatigue: (dtSeconds: number, perMinute?: number) => void;
  /** W13a-5 — serialize the persisted slice for the save blob. */
  toSaveState: () => SaveMeridianCourtState;
  /** W13a-5 — restore from a saved slice (defensive: defaults any missing field). */
  hydrateFromSave: (saved: SaveMeridianCourtState | null | undefined) => void;
  /** W13a-6 — reincarnation: fold lifetime, start each meridian at its Form-Memory floor,
   *  reset comprehension, re-roll roots, clear forge heat (§2.11). */
  resetForPrestige: (meridianIds: readonly string[], rng?: () => number) => void;
}

const FATIGUE_RECOVERY_PER_MIN = 6;

function freshProgress(): MeridianProgress {
  return createMeridianProgress(true);
}

export const useCourtMeridianStore = create<CourtMeridianStore>((set, get) => ({
  activeMeridianId: null,
  rootByMeridianId: {},
  progressByMeridianId: {},
  lifetimeTotals: {},
  intensityId: 'steady',
  fatigue: 0,

  setActiveMeridian: (meridianId) =>
    set((state) => ({
      activeMeridianId: meridianId,
      progressByMeridianId: state.progressByMeridianId[meridianId]
        ? state.progressByMeridianId
        : { ...state.progressByMeridianId, [meridianId]: freshProgress() },
    })),

  setIntensity: (intensityId) => set({ intensityId }),

  ensureRootsForPath: (meridianIds, rng = Math.random) =>
    set((state) => {
      let changed = false;
      const next: Record<string, SpiritRootGrade> = { ...state.rootByMeridianId };
      for (const id of meridianIds) {
        if (!next[id]) {
          next[id] = rollSpiritRootGrade(rng);
          changed = true;
        }
      }
      return changed ? { rootByMeridianId: next } : {};
    }),

  advanceActive: ({ dtSeconds, realmIndex1to7, perception, meridianDefs }) =>
    set((state) => {
      const id = state.activeMeridianId;
      if (!id || dtSeconds <= 0) return {};
      const def = meridianDefs.find((d) => d.id === id);
      if (!def) return {};
      const progress = state.progressByMeridianId[id] ?? freshProgress();
      const grade: SpiritRootGrade = state.rootByMeridianId[id] ?? 'true';
      const cap = effectiveMeridianCap(realmIndex1to7, grade);
      const rate = computeMeridianRate({
        intensityId: state.intensityId,
        fatigue: state.fatigue,
        perception,
        rootGrade: grade,
        masteryRank: masteryRankFromXp(progress.masteryXp),
        comprehension: progress.comprehension,
        capPct: cap > 0 ? progress.rating / cap : 0,
      });
      const amount = (COURT_BASE_RATE_PER_MIN / 60) * rate.mult * dtSeconds;
      const result = advanceMeridian({
        state,
        meridianId: id,
        amount,
        source: 'court',
        realmIndex1to7,
        unlockRealm: def.unlockRealm,
        perception,
      });
      const fpm = COURT_INTENSITY_FPM[state.intensityId] ?? 0;
      const fatigue = Math.min(100, state.fatigue + (fpm / 60) * dtSeconds);
      // lifetimeTotals is folded only at reincarnation (accumulateLifetimeRatings folds the
      // CURRENT rating then) — never incrementally, which would double-count (§2.11).
      return { progressByMeridianId: result.state.progressByMeridianId, fatigue };
    }),

  recoverFatigue: (dtSeconds, perMinute = FATIGUE_RECOVERY_PER_MIN) =>
    set((state) => {
      if (dtSeconds <= 0 || state.fatigue <= 0) return {};
      return { fatigue: Math.max(0, state.fatigue - (perMinute / 60) * dtSeconds) };
    }),

  toSaveState: () => {
    const s = get();
    return {
      activeMeridianId: s.activeMeridianId,
      rootByMeridianId: { ...s.rootByMeridianId },
      progressByMeridianId: { ...s.progressByMeridianId },
      lifetimeTotals: { ...s.lifetimeTotals },
      intensityId: s.intensityId,
      fatigue: s.fatigue,
    };
  },

  hydrateFromSave: (saved) => {
    if (!saved) {
      set(createDefaultMeridianCourtSaveState());
      return;
    }
    set({
      activeMeridianId: saved.activeMeridianId ?? null,
      rootByMeridianId: { ...(saved.rootByMeridianId ?? {}) },
      progressByMeridianId: { ...(saved.progressByMeridianId ?? {}) },
      lifetimeTotals: { ...(saved.lifetimeTotals ?? {}) },
      intensityId: saved.intensityId ?? 'steady',
      fatigue: typeof saved.fatigue === 'number' && Number.isFinite(saved.fatigue) ? saved.fatigue : 0,
    });
  },

  resetForPrestige: (meridianIds, rng = Math.random) =>
    set((state) => {
      const result = applyFormMemoryReset(state.lifetimeTotals, state, meridianIds, rng);
      return {
        activeMeridianId: result.state.activeMeridianId,
        rootByMeridianId: result.state.rootByMeridianId,
        progressByMeridianId: result.state.progressByMeridianId,
        lifetimeTotals: result.lifetime,
        fatigue: 0,
        // intensityId carries across lives (a UI preference, not run state).
      };
    }),
}));
