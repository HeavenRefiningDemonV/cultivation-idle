/**
 * M.IV.1 ARTS-MECH / Step 1 — the pure Fortune Draw surface builder (live mode).
 *
 * Pure: takes plain data the owner (M.IV.3) reads from the stores/content (offer rows, the live pity
 * counters, the satchel, the reveal/reroll state) and returns a render-only `FortuneDrawSurfaceV1`. NO
 * store handles, NO mutation, NO RNG. The fixtures live in `fortuneDrawFixtures.ts`. All TUNED magnitudes
 * (the reroll cost, the pity thresholds) arrive as inputs — never authored here as canon (HELD → D15).
 */

import {
  ITEM_DETAIL_SCHEMA_VERSION,
  type ItemDetailAction,
  type ItemDetailAffix,
  type ItemDetailRarity,
  type ItemDetailSurfaceV1,
} from '../modals/itemDetailTypes.js';
import type { ManualGrade, ManualRarity } from '../../../features/manuals/pavilionStockTypes.js';
import {
  FORTUNE_DRAW_SCHEMA_VERSION,
  type FateThreadSurface,
  type FateThreadTrack,
  type FortuneDrawSurfaceV1,
  type FortuneDrawVisualState,
  type FortuneElementEdge,
  type FortuneOfferSurface,
  type FortunePurseEntry,
  type FortuneRarityFrame,
  type FortuneRevealSurface,
  type FortuneRerollSurface,
  type FortuneSatchelEntry,
} from './fortuneDrawTypes.js';

// ── shared item-language maps (F0 ramp + the two-axis labels) ───────────────────────────────────

const RARITY_FRAME: Record<ItemDetailRarity, FortuneRarityFrame> = {
  common: 'mortal',
  uncommon: 'spirit',
  rare: 'earth',
  epic: 'heaven',
  legendary: 'immortal',
};

const RARITY_LABEL: Record<ItemDetailRarity, string> = {
  common: '凡 Common',
  uncommon: '良 Uncommon',
  rare: '珍 Rare',
  epic: '极 Epic',
  legendary: '仙 Legendary',
};

const GRADE_LABEL: Record<ManualGrade, string> = {
  mortal: 'Mortal',
  earth: 'Earth',
  heaven: 'Heaven',
  mystic: 'Mystic',
};

const KIND_LABEL: Record<'active' | 'passive' | 'ultimate', string> = {
  active: 'Active',
  passive: 'Passive',
  ultimate: 'Ultimate',
};

export function fortuneRarityFrame(rarity: ItemDetailRarity): FortuneRarityFrame {
  return RARITY_FRAME[rarity];
}
export function fortuneRarityLabel(rarity: ItemDetailRarity): string {
  return RARITY_LABEL[rarity];
}
export function fortuneGradeLabel(grade: ManualGrade): string {
  return GRADE_LABEL[grade] ?? 'Mortal';
}

// ── inputs (the owner reads stores/content; the builder is pure formatting) ──────────────────────

export interface FortuneOfferInput {
  stockId: number;
  shelf: FortuneOfferSurface['shelf'];
  techniqueId: string;
  name: string;
  nameCjk?: string | null;
  kind: 'active' | 'passive' | 'ultimate';
  grade: ManualGrade;
  rarity: ManualRarity;
  pathLean?: string | null;
  element?: FortuneElementEdge | null;
  priceText: string;
  effectText?: string | null;
  sealed: boolean;
  sold: boolean;
  notSold: boolean;
  isFeatured?: boolean;
}

export interface FortuneSatchelInput {
  instanceId: string;
  techId: string;
  name: string;
  grade: ManualGrade;
  rarity: ManualRarity;
  studying: boolean;
}

export interface FortuneDrawBuildInput {
  /** optional explicit state; otherwise derived from the data (offers/reveal/reroll). */
  visualState?: FortuneDrawVisualState;
  pavilionId: string | null;
  pavilionName: string;
  dateLabel: string;
  offers: FortuneOfferInput[];
  /** the LIVE pity counters (PavilionStockState.pity). */
  pity: { featuredEpic: number; featuredLegendary: number };
  /** the HELD guarantee thresholds (from the generator; arrive as input, never authored here). */
  pityThresholds: { epic: number; legendary: number };
  reveal?: FortuneRevealSurface | null;
  reroll?: Partial<FortuneRerollSurface> | null;
  satchel?: FortuneSatchelInput[];
  selectedDetail?: ItemDetailSurfaceV1 | null;
  /** the currency wallet (the owner reads the currency store). */
  purse?: FortunePurseEntry[] | null;
}

// ── the fate-thread (never-regress pity surfaced) ───────────────────────────────────────────────

function track(tier: 'epic' | 'legendary', current: number, threshold: number): FateThreadTrack {
  const safeThreshold = threshold > 0 ? threshold : 1;
  const clamped = Math.max(0, Math.min(current, safeThreshold));
  return {
    tier,
    label: tier === 'epic' ? 'Epic guarantee' : 'Legendary guarantee',
    current: clamped,
    threshold: safeThreshold,
    ratio: safeThreshold > 0 ? clamped / safeThreshold : 0,
    guaranteed: current >= safeThreshold,
  };
}

function buildFateThread(
  pity: { featuredEpic: number; featuredLegendary: number },
  thresholds: { epic: number; legendary: number },
): FateThreadSurface {
  const epic = track('epic', pity.featuredEpic, thresholds.epic);
  const legendary = track('legendary', pity.featuredLegendary, thresholds.legendary);
  const headline = legendary.guaranteed
    ? 'The thread is taut — the next featured scroll is a guaranteed Legendary.'
    : epic.guaranteed
      ? 'The thread is taut — the next featured scroll is a guaranteed Epic.'
      : 'Fate gathers — the thread fills toward a guaranteed apex.';
  return { headline, epic, legendary };
}

// ── the builder ─────────────────────────────────────────────────────────────────────────────────

function mapOffer(o: FortuneOfferInput): FortuneOfferSurface {
  return {
    stockId: o.stockId,
    shelf: o.shelf,
    techniqueId: o.techniqueId,
    name: o.name,
    nameCjk: o.nameCjk ?? null,
    kind: o.kind,
    kindLabel: KIND_LABEL[o.kind] ?? 'Active',
    gradeLabel: fortuneGradeLabel(o.grade),
    rarity: o.rarity,
    rarityLabel: fortuneRarityLabel(o.rarity),
    rarityFrameGrade: fortuneRarityFrame(o.rarity),
    pathLean: o.pathLean ?? null,
    element: o.element ?? null,
    sealed: o.sealed,
    sold: o.sold,
    notSold: o.notSold,
    priceText: o.priceText,
    effectText: o.effectText ?? null,
    isFeatured: o.isFeatured ?? o.shelf === 'featured',
  };
}

function mapSatchel(s: FortuneSatchelInput): FortuneSatchelEntry {
  return {
    instanceId: s.instanceId,
    techId: s.techId,
    name: s.name,
    gradeLabel: fortuneGradeLabel(s.grade),
    rarity: s.rarity,
    rarityLabel: fortuneRarityLabel(s.rarity),
    rarityFrameGrade: fortuneRarityFrame(s.rarity),
    studying: s.studying,
  };
}

function deriveState(input: FortuneDrawBuildInput, fate: FateThreadSurface): FortuneDrawVisualState {
  if (input.visualState) return input.visualState;
  const liveOffers = input.offers.filter((o) => !o.sold && !o.notSold);
  if (liveOffers.length === 0 && !input.reveal) return 'empty';
  if (input.reroll?.spent) return 'rerollSpent';
  if (input.reveal) {
    const rare = input.reveal.rarity === 'rare' || input.reveal.rarity === 'epic' || input.reveal.rarity === 'legendary';
    return rare ? 'postDraw-rare' : 'postDraw-common';
  }
  if (fate.epic.guaranteed || fate.legendary.guaranteed) return 'pityGuaranteed';
  if (input.reroll?.available) return 'rerollAvailable';
  return 'preDraw';
}

export function buildFortuneDrawSurface(input: FortuneDrawBuildInput): FortuneDrawSurfaceV1 {
  const fateThread = buildFateThread(input.pity, input.pityThresholds);
  const offers = input.offers.map(mapOffer);
  const satchelEntries = (input.satchel ?? []).map(mapSatchel);
  const reroll: FortuneRerollSurface = {
    available: input.reroll?.available ?? false,
    costText: input.reroll?.costText ?? '[tune] → D15',
    spent: input.reroll?.spent ?? false,
    note: input.reroll?.note ?? 'A reroll renews the offers — your fate-thread never regresses.',
    nextRefreshLabel: input.reroll?.nextRefreshLabel ?? null,
  };
  const visualState = deriveState(input, fateThread);
  return {
    schemaVersion: FORTUNE_DRAW_SCHEMA_VERSION,
    visualState,
    pavilionId: input.pavilionId,
    pavilionName: input.pavilionName,
    dateLabel: input.dateLabel,
    purse: input.purse ?? null,
    fateThread,
    offers,
    reveal: input.reveal ?? null,
    reroll,
    satchel: { count: satchelEntries.length, entries: satchelEntries },
    selectedDetail: input.selectedDetail ?? null,
    emptyLegend: visualState === 'empty' ? 'The lectern is bare — fate renews with the next cycle.' : null,
  };
}

const SLOT_BY_KIND: Record<'active' | 'passive' | 'ultimate', string> = {
  active: 'active seat',
  passive: 'passive seat',
  ultimate: 'ultimate seat',
};

/** The technique enrichment the owner reads from the live content (everything beyond the offer itself). */
export interface FortuneOfferDetailInput {
  realmTier?: string | null;
  rarityBand?: string | null;
  scalesOff?: string[] | null;
  signature?: { name: string; body: string } | null;
  lore?: string | null;
  provenance?: string | null;
  /** the reroll panel — HELD odds/cost (D13 Fortune-gated). */
  reroll?: { cost: string; odds: string; note: string } | null;
  /** the technique's sub-stat / effect rows (real, from the technique — not faked roll bars). */
  affixes?: ItemDetailAffix[] | null;
  actions?: ItemDetailAction[] | null;
}

/**
 * Build the F2 `ItemDetailSurfaceV1` (technique-variant) for a focused Fortune offer. Pure: the owner supplies
 * the live technique enrichment; this shapes it into the inspector contract. Mirrors the artifact's
 * `toDetailSurface`.
 */
export function buildFortuneOfferDetail(
  offer: FortuneOfferSurface,
  input: FortuneOfferDetailInput = {},
): ItemDetailSurfaceV1 {
  return {
    schemaVersion: ITEM_DETAIL_SCHEMA_VERSION,
    visualState: 'technique-variant',
    identity: {
      name: offer.name,
      nameCjk: offer.nameCjk ?? null,
      variant: 'technique',
      tier: null,
      realmTier: input.realmTier ?? null,
      rarity: offer.rarity,
      rarityLabel: offer.rarityLabel,
      rarityBand: input.rarityBand ?? null,
      element: offer.element ? { id: offer.element.id, label: offer.element.label, sceneColorToken: offer.element.sceneColorToken } : null,
      kind: offer.kindLabel,
      slot: SLOT_BY_KIND[offer.kind] ?? null,
      lean: offer.pathLean ?? null,
    },
    affixes: input.affixes ?? [],
    setBond: null,
    compareVsEquipped: null,
    casting: offer.effectText ?? null,
    scalesOff: input.scalesOff ?? null,
    reroll: input.reroll ?? null,
    signature: input.signature ?? null,
    lore: input.lore ?? null,
    provenance: input.provenance ?? null,
    actions: input.actions ?? [],
  };
}
