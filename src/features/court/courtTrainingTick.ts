import type { PathMeridianDef } from '../../systems/meridians/index.js';
import { resolveCourtRealmIndex } from './buildLiveCourtSurface.js';
import { useCourtMeridianStore } from './useCourtMeridianStore.js';

/**
 * W13a-4 — the live Court training tick. Drives the meridian store from the game loop:
 * while the Court's training is the foreground activity, advance the active meridian by the
 * elapsed time; otherwise the forge heat recovers. Pure glue over the (already-tested)
 * store actions — gameLoop resolves the live context and calls this.
 */
export interface CourtTickContext {
  /** True when the Court's path_training is the foreground activity (else heat recovers). */
  trainingAllowed: boolean;
  /** 0-based realm index from gameStore.realm.index. */
  realmIndex0Based: number;
  /** Perception (Tier-0) for the rate formula. */
  perception: number;
  meridianDefs: PathMeridianDef[];
}

export function runCourtTrainingTick(elapsedMs: number, ctx: CourtTickContext): void {
  const dtSeconds = elapsedMs / 1000;
  if (dtSeconds <= 0) return;
  const store = useCourtMeridianStore.getState();
  if (ctx.trainingAllowed) {
    store.advanceActive({
      dtSeconds,
      realmIndex1to7: resolveCourtRealmIndex(ctx.realmIndex0Based),
      perception: ctx.perception,
      meridianDefs: ctx.meridianDefs,
    });
  } else {
    store.recoverFatigue(dtSeconds);
  }
}
