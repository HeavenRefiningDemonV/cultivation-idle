/**
 * M.IV.1 ARTS-MECH / Step 1 — the render-only Fortune Draw surface contract (D17 §M.IV.2 layout).
 *
 * The Manual Pavilion's *audience with fate*: the day's manuals offered as sealed scrolls on a lectern, a
 * DRAW that unfurls the chosen scroll to its rarity frame, a REROLL row, and a visible *fate-thread* (the
 * never-regress pity) filling toward a guaranteed rare. This is the contract the M.IV.2 artifact targets and
 * the M.IV.3 port consumes — it is NOT the broader `manualPavilionExact` (the whole shop screen); it is the
 * focused draw ceremony.
 *
 * Render-only law (mirrors PanoplyExactSurfaceV1 / ItemDetailSurfaceV1): NO field is a method; NO field
 * references a Zustand store. Every value is data the builder (Step 1 live mode) computes upstream and the
 * painted port binds. `selectedDetail` is the EXACT F2 `ItemDetailSurfaceV1` (a technique slip), imported,
 * never re-declared. Rarity is never hue-alone — every `rarityFrameGrade` is paired with a `rarityLabel`.
 * Every TUNED magnitude (the reroll cost, the pity thresholds) is HELD → D15; the surface shows the SHAPE.
 */

import { type ItemDetailRarity, type ItemDetailSurfaceV1 } from '../modals/itemDetailTypes.js';

export const FORTUNE_DRAW_SCHEMA_VERSION = 'fortune-draw-v1' as const;

/** The M.IV.2 state matrix (the artifact must prove each; the builder fixtures cover each). */
export type FortuneDrawVisualState =
  | 'preDraw'
  | 'revealing'
  | 'postDraw-common'
  | 'postDraw-rare'
  | 'pityGuaranteed'
  | 'rerollAvailable'
  | 'rerollSpent'
  | 'empty'
  | 'unknown';
export const FORTUNE_DRAW_VISUAL_STATE_OPTIONS = [
  'preDraw',
  'revealing',
  'postDraw-common',
  'postDraw-rare',
  'pityGuaranteed',
  'rerollAvailable',
  'rerollSpent',
  'empty',
  'unknown',
] as const satisfies readonly FortuneDrawVisualState[];

/** The F0 rarity frame grade (`--rarity-mortal`…`--rarity-immortal`); always paired with a rarityLabel. */
export type FortuneRarityFrame = 'mortal' | 'spirit' | 'earth' | 'heaven' | 'immortal';
export const FORTUNE_RARITY_FRAME_OPTIONS = [
  'mortal',
  'spirit',
  'earth',
  'heaven',
  'immortal',
] as const satisfies readonly FortuneRarityFrame[];

/** The element edge-glyph (D3 / F3): id + label + the NAMED element scene-color token (elemental arts). */
export interface FortuneElementEdge {
  id: string;
  label: string;
  sceneColorToken: string;
}

/**
 * One pity track of the fate-thread (the never-regress guarantee surfaced). `current` of `threshold` draws
 * accumulated toward the guaranteed tier; `ratio` 0..1 drives the thread fill; `guaranteed` true when the
 * next featured roll is force-upgraded. Thresholds are HELD → D15 — the surface carries the live counter +
 * the SHAPE, never an authored "correct" threshold as canon.
 */
export interface FateThreadTrack {
  tier: 'epic' | 'legendary';
  label: string;
  current: number;
  threshold: number;
  ratio: number;
  guaranteed: boolean;
}

/** The banner readout — the fate-thread (pity) toward the guaranteed rare, never-regress. */
export interface FateThreadSurface {
  /** the headline, e.g. "Fate gathers — the thread nears a guaranteed apex". */
  headline: string;
  epic: FateThreadTrack;
  legendary: FateThreadTrack;
}

/** The player's purse — currency the draw can spend. Bound from the CURRENCY store (cross-cutting; not the
 *  draw surface proper), shown so the screen answers "what can I spend?". `id` drives the currency glyph. */
export interface FortunePurseEntry {
  id: 'fortune' | 'gold' | 'stones' | 'merit';
  label: string;
  amount: string;
}

/** A sealed-scroll offer on the lectern. Pre-draw it shows a faint rarity hint (`sealed`); the reveal unfurls it. */
export interface FortuneOfferSurface {
  /** the buy/draw target (PavilionStockSlot.slotIndex). */
  stockId: number;
  shelf: 'common' | 'advanced' | 'rare' | 'featured' | 'filler';
  techniqueId: string;
  name: string;
  nameCjk?: string | null;
  /** active / passive / ultimate (the KIND axis, raw — drives the kind glyph). */
  kind: 'active' | 'passive' | 'ultimate';
  /** Active / Passive / Ultimate (the KIND axis label). */
  kindLabel: string;
  /** Mortal / Earth / Heaven / Mystic (the GRADE axis — manualGrade). */
  gradeLabel: string;
  rarity: ItemDetailRarity;
  /** 凡/良/珍/极/仙 + English — so the frame grade is never hue-alone. */
  rarityLabel: string;
  rarityFrameGrade: FortuneRarityFrame;
  /** Martial / Earth / Heaven path lean chip. */
  pathLean?: string | null;
  /** elemental art edge (F3), null for non-elemental arts. */
  element?: FortuneElementEdge | null;
  /** wax-seal: true = sealed (a faint rarity hint only); false = unfurled to its full rarity frame. */
  sealed: boolean;
  sold: boolean;
  notSold: boolean;
  /** the formatted price line (content-driven, real). */
  priceText: string;
  /** the manual's effect line, shown on reveal. */
  effectText?: string | null;
  isFeatured: boolean;
}

/** The reveal outcome (postDraw states) — drives the unfurl animation + the aria-live announcement. */
export interface FortuneRevealSurface {
  stockId: number;
  name: string;
  rarity: ItemDetailRarity;
  rarityLabel: string;
  rarityFrameGrade: FortuneRarityFrame;
  /** verbatim aria-live, e.g. "You drew a Rare manual: Azure Tide Verse." */
  announce: string;
}

/** The reroll row — the reroll action + cost; never-regress (a reroll keeps the fate-thread). */
export interface FortuneRerollSurface {
  available: boolean;
  /** HELD → D15 — the reroll cost. "[tune]" while held; the surface shows the SHAPE of the sink. */
  costText: string;
  spent: boolean;
  /** the never-regress promise, shown verbatim: a reroll does not consume the pity. */
  note: string;
  /** the free-refresh readiness, e.g. "Free draw renews in 5h" — null when ready now. */
  nextRefreshLabel?: string | null;
}

/** The satchel footer — manuals held but not yet studied (manualSatchelStore). */
export interface FortuneSatchelEntry {
  instanceId: string;
  techId: string;
  name: string;
  gradeLabel: string;
  rarity: ItemDetailRarity;
  rarityLabel: string;
  rarityFrameGrade: FortuneRarityFrame;
  /** true if this manual is the active study. */
  studying: boolean;
}

export interface FortuneDrawSurfaceV1 {
  schemaVersion: typeof FORTUNE_DRAW_SCHEMA_VERSION;
  visualState: FortuneDrawVisualState;
  pavilionId: string | null;
  pavilionName: string;
  /** today's date label (the banner). */
  dateLabel: string;
  /** the currency wallet (bound from the currency store by the live owner; null in pure fixtures). */
  purse?: FortunePurseEntry[] | null;
  fateThread: FateThreadSurface;
  /** the 3–5 sealed-scroll offers on the lectern. */
  offers: FortuneOfferSurface[];
  /** the just-revealed outcome (postDraw / revealing) — null in preDraw/empty. */
  reveal: FortuneRevealSurface | null;
  reroll: FortuneRerollSurface;
  satchel: { count: number; entries: FortuneSatchelEntry[] };
  /** the F2 inspector payload for a focused offer/manual (technique variant). */
  selectedDetail: ItemDetailSurfaceV1 | null;
  /** the 'empty' state legend (no offers — a between-cycles state). */
  emptyLegend?: string | null;
}
