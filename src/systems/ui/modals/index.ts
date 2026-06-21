/**
 * F2-MODALS / S0 — barrel for the two shared-modal surfaces: types, fixtures, builders, and the
 * frozen option registries. Render-only; no store handles. The UI components (src/ui/modals/*,
 * src/ui/shell/*) consume these typed surfaces.
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * MODAL_SURFACE_WIRING_TODO (F2.UI deferred real-surface wiring)
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * These two surfaces are FIXTURE-DRIVEN today: `buildItemDetailSurface` / `buildRitualFrameSurface`
 * return deterministic illustrative records, not live game state. The VISUAL frames are
 * artifact-fidelity and ready; the DATA wiring is deferred until each system's mechanics land.
 * When those mechanics exist, build the real surface builders beside these and swap the owners to
 * them (the *SurfaceV1 shapes are the binding contract — keep them stable):
 *   • Inspector (item)      → real equipment/inventory item → ItemDetailSurfaceV1
 *                             (no Equipment nav seat yet — F2.UI §8 known gap; item variant unraised).
 *   • Inspector (technique) → bind beside the legacy TechniqueDetailModal owner (dev-flag swap).
 *   • Ritual · lifeSummary  → src/features/prestige/lifeSummarySurface.ts (LifeSummarySurface) — the
 *                             one real wired rite; map it into RitualModalSurfaceV1.scene at wire-time.
 *   • Ritual · breakthrough → src/features/breakthroughRitual/buildBreakthroughRitualSurface.ts.
 *   • Ritual · tribulation / rootUpgrade(洗髓) / echo-decree → NO rite surface exists yet; build them
 *                             with the mechanics, then bind. Until then these scenes are fixture-only.
 * Never fabricate gameplay data in the view to fill a zone — narrow, render empty, and report.
 * ───────────────────────────────────────────────────────────────────────────────────────────
 */

export {
  ITEM_DETAIL_SCHEMA_VERSION,
  ITEM_DETAIL_VARIANT_OPTIONS,
  ITEM_DETAIL_RARITY_OPTIONS,
  ITEM_DETAIL_VISUAL_STATE_OPTIONS,
} from './itemDetailTypes.js';
export type {
  ItemDetailVariant,
  ItemDetailRarity,
  ItemDetailVisualState,
  ItemDetailIdentity,
  ItemDetailAffix,
  ItemDetailSetBond,
  ItemDetailCompareRow,
  ItemDetailAction,
  ItemDetailSignature,
  ItemDetailReroll,
  ItemDetailSurfaceV1,
} from './itemDetailTypes.js';
export { ITEM_DETAIL_FIXTURE_SEEDS, buildItemDetailSurface } from './itemDetailFixtures.js';
export type { ItemDetailFixtureSeedId } from './itemDetailFixtures.js';

export {
  RITUAL_FRAME_SCHEMA_VERSION,
  RITUAL_RITE_OPTIONS,
  RITUAL_RITE_STATE_OPTIONS,
  RITUAL_OUTCOME_KIND_OPTIONS,
  RITUAL_VISUAL_STATE_OPTIONS,
} from './ritualFrameTypes.js';
export type {
  RitualRite,
  RitualRiteState,
  RitualOutcomeKind,
  RitualVisualState,
  RitualStakes,
  RitualNeverRegress,
  RitualOutcome,
  RitualSceneData,
  RitualLifeSummary,
  RitualModalSurfaceV1,
} from './ritualFrameTypes.js';
export { RITUAL_FRAME_FIXTURE_SEEDS, buildRitualFrameSurface } from './ritualFrameFixtures.js';
export type { RitualFrameFixtureSeedId } from './ritualFrameFixtures.js';
