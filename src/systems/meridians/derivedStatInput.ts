import { useGameStore } from '../../stores/gameStore.js';
import { useTrainingStore } from '../../stores/trainingStore.js';
import { useCourtMeridianStore } from '../../features/court/useCourtMeridianStore.js';
import { resolveCourtSharedStats } from '../../features/court/courtSharedStats.js';
import { resolveCourtRealmIndex } from '../../features/court/buildLiveCourtSurface.js';
import { mapAxisViewsToRecord, mapFoundationViewsToRecord } from './combatStatBridge.js';
import { applyFocusEmphasis } from './focusEmphasis.js';
import { useUIStore } from '../../stores/uiStore.js';
import type { DerivedStatInput } from './derivedStats.js';

/**
 * F1 — assemble a DerivedStatInput from the LIVE stores (SA-A1, §3.2). NOT pure (reads
 * stores), so it lives at the store/seam boundary — wired into gameStore.calculatePlayerStats
 * via the lazy injector (setDerivedStatInputGetter, from the gameLoop bootstrap), exactly
 * mirroring _getPrestigeStore, to avoid the gameStore↔trainingStore import cycle.
 *
 * Every source is verified-live (§1.5): the foundation/axes come from the SAME
 * resolveCourtSharedStats mapping the Court reads at runtime (so a migrated save and a live
 * read agree — one mapping, not two); meridian ratings from the live court store; realm
 * index from the game store, mapped 0-based → 1..7 by resolveCourtRealmIndex.
 */
export function toDerivedStatInput(): DerivedStatInput {
  const realmIndex0 = useGameStore.getState().realm.index;
  const realmIndex1to7 = resolveCourtRealmIndex(realmIndex0);

  const shared = resolveCourtSharedStats(useTrainingStore.getState().statRatingsById);
  const foundation = mapFoundationViewsToRecord(shared.foundation);
  const axes = mapAxisViewsToRecord(shared.axes);

  const meridianRatings: Record<string, number> = {};
  const court = useCourtMeridianStore.getState();
  for (const [id, progress] of Object.entries(court.progressByMeridianId)) {
    meridianRatings[id] = (progress as { rating?: number }).rating ?? 0;
  }

  const base: DerivedStatInput = { foundation, axes, meridianRatings, realmIndex1to7 };
  // B-STATS — bias the Tier-1 axes (and Body's Tier-0 foundation) by the Seat's focus pick. IDENTITY
  // while the coefficient is held inert (FOCUS_EMPHASIS_PRIMARY=0), so derived-path parity stays exact;
  // F-BAL flips the magnitude and the dial becomes a real build lever with no further wiring.
  return applyFocusEmphasis(base, useUIStore.getState().cultivationFocusAxis);
}
