import type { ActiveActivity } from '../../stores/activityStore.js';
import type { CultivationPath } from '../../types/index.js';
import { COMBAT_ACTIVITY_TYPES } from '../../types/activity.js';
import {
  COURT_REALM_NAMES,
  buildTemperingCourtSurface,
  type CourtIntensityId,
  type CourtOfflineSummary,
  type CourtStatView,
  type CourtStatus,
  type MeridianTrainingState,
  type PathMeridianDef,
  type TemperingCourtSurface,
} from '../../systems/meridians/index.js';

/**
 * W13a — the LIVE Tempering Court surface adapter (flag-gated; NOT yet default). Mirrors
 * the legacy TrainingHallScreenOwner's resolve-then-build pattern: it maps the live store
 * reads (path / realm / activity / fatigue / shared-tier values / meridian save state) to
 * the render-only W6 buildTemperingCourtSurface input. Pure — no store mutation, no
 * persistence — so it is fully testable and reversible. The shared-tier values (axes /
 * foundation / perception) are resolved by the caller (the mount) from the cultivator-stats
 * system; persistence of the meridian state is a separate save-schema step.
 */

/** Realm index in the save is 0-based (0 = Qi Condensation). The Court ladder is 1..7. */
export function resolveCourtRealmIndex(realmIndex0Based: number): number {
  return Math.min(Math.max(Math.trunc(realmIndex0Based) + 1, 1), COURT_REALM_NAMES.length);
}

/**
 * Derive the Court status from the live activity gate — mirrors the legacy statusFor:
 * no path → no_path; a combat activity → blocked_by_combat; the Court's own training →
 * active; any other foreground activity → blocked_by_activity; otherwise idle.
 */
export function resolveCourtStatus(
  selectedPath: CultivationPath | null,
  activeActivity: ActiveActivity | null,
  isCourtTraining: boolean,
): CourtStatus {
  if (!selectedPath) return 'no_path';
  if (activeActivity && COMBAT_ACTIVITY_TYPES.includes(activeActivity.type)) return 'blocked_by_combat';
  if (activeActivity?.type === 'path_training' && isCourtTraining) return 'active';
  if (activeActivity && activeActivity.type !== 'path_training') return 'blocked_by_activity';
  return 'idle';
}

export interface BuildLiveCourtInput {
  selectedPath: CultivationPath | null;
  /** 0-based realm index from gameStore.realm.index. */
  realmIndex0Based: number;
  /** Live realm name (gameStore.realm.name); falls back to the Court 7-name ladder. */
  realmName?: string | null;
  cultPct: number;
  activeActivity: ActiveActivity | null;
  /** True when the active foreground activity is THIS Court's meridian training. */
  isCourtTraining: boolean;
  fatigue: number;
  intensityId: CourtIntensityId;
  perception: number;
  /** Tier-1 axes (7) + Tier-0 foundation (6), resolved from the cultivator-stats system. */
  axes: CourtStatView[];
  foundation: CourtStatView[];
  /** The persisted meridian save state (active id + root roll + per-meridian progress). */
  trainingState: MeridianTrainingState;
  meridianDefs: PathMeridianDef[];
  offlineSummary?: CourtOfflineSummary | null;
}

/** Resolve live store reads → the render-only TemperingCourtSurface (W6 builder). */
export function buildLiveCourtSurface(input: BuildLiveCourtInput): TemperingCourtSurface {
  const realmIndex1to7 = resolveCourtRealmIndex(input.realmIndex0Based);
  const status = resolveCourtStatus(input.selectedPath, input.activeActivity, input.isCourtTraining);
  return buildTemperingCourtSurface({
    path: input.selectedPath,
    meridianDefs: input.meridianDefs,
    trainingState: input.trainingState,
    realmIndex1to7,
    cultPct: input.cultPct,
    fatigue: input.fatigue,
    intensityId: input.intensityId,
    status,
    perception: input.perception,
    axes: input.axes,
    foundation: input.foundation,
    realmName: input.realmName ?? COURT_REALM_NAMES[realmIndex1to7 - 1],
    offlineSummary: input.offlineSummary ?? null,
  });
}
