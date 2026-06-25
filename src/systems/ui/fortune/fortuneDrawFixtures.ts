/**
 * M.IV.1 ARTS-MECH / Step 1 — the Fortune Draw fixture matrix (deterministic, no RNG, no stores).
 *
 * One `FortuneDrawSurfaceV1` per M.IV.2 visual state — the cells the artifact must prove and the M.IV.3 port
 * captures. Built through the real `buildFortuneDrawSurface` so the fixtures exercise the same shaping the
 * live owner will. Magnitudes are illustrative: prices are content-shaped placeholders; the reroll cost is
 * HELD ([tune] → D15); the pity thresholds mirror the live generator (10 / 30) as the SHAPE, not authored canon.
 */

import {
  buildFortuneDrawSurface,
  buildFortuneOfferDetail,
  type FortuneDrawBuildInput,
  type FortuneOfferDetailInput,
  type FortuneOfferInput,
} from './fortuneDrawBuilders.js';
import {
  FORTUNE_DRAW_VISUAL_STATE_OPTIONS,
  type FortuneDrawSurfaceV1,
  type FortuneDrawVisualState,
} from './fortuneDrawTypes.js';

const PITY_THRESHOLDS = { epic: 10, legendary: 30 } as const;

function baseOffers(): FortuneOfferInput[] {
  return [
    {
      stockId: 0,
      shelf: 'common',
      techniqueId: 'tq-iron-skin',
      name: 'Iron-Skin Stance',
      nameCjk: '铁身式',
      kind: 'passive',
      grade: 'mortal',
      rarity: 'common',
      pathLean: 'Earth',
      priceText: '120 Gold',
      effectText: 'A steadfast guard — physical defense holds the line.',
      sealed: true,
      sold: false,
      notSold: false,
    },
    {
      stockId: 1,
      shelf: 'advanced',
      techniqueId: 'tq-azure-tide',
      name: 'Azure Tide Verse',
      nameCjk: '碧潮诀',
      kind: 'active',
      grade: 'earth',
      rarity: 'rare',
      pathLean: 'Heaven',
      element: { id: 'water', label: 'Water', sceneColorToken: '--element-water' },
      priceText: '40 Spirit Stones',
      effectText: 'A surging strike that scales off the derived Spirit channel.',
      sealed: true,
      sold: false,
      notSold: false,
    },
    {
      stockId: 2,
      shelf: 'featured',
      techniqueId: 'tq-vermilion-rite',
      name: 'Vermilion Phoenix Rite',
      nameCjk: '朱凤仪',
      kind: 'ultimate',
      grade: 'heaven',
      rarity: 'epic',
      pathLean: 'Martial',
      element: { id: 'fire', label: 'Fire', sceneColorToken: '--element-fire' },
      priceText: '12 Merit',
      effectText: 'The featured apex art — a phoenix rite that rekindles on the kill.',
      sealed: true,
      sold: false,
      notSold: false,
      isFeatured: true,
    },
    {
      stockId: 3,
      shelf: 'filler',
      techniqueId: 'tq-still-mind',
      name: 'Still-Mind Breathing',
      nameCjk: '静心息',
      kind: 'passive',
      grade: 'mortal',
      rarity: 'uncommon',
      pathLean: 'Heaven',
      priceText: '80 Gold',
      effectText: 'Calm restores focus over time.',
      sealed: true,
      sold: false,
      notSold: false,
    },
  ];
}

const PURSE: FortuneDrawBuildInput['purse'] = [
  { id: 'fortune', label: 'Fortune Tokens', amount: '3' },
  { id: 'gold', label: 'Gold', amount: '1,240' },
  { id: 'stones', label: 'Spirit Stones', amount: '86' },
  { id: 'merit', label: 'Merit', amount: '24' },
];

const SATCHEL: FortuneDrawBuildInput['satchel'] = [
  { instanceId: 'm-held-1', techId: 'tq-azure-tide', name: 'Azure Tide Verse', grade: 'earth', rarity: 'rare', studying: false },
  { instanceId: 'm-held-2', techId: 'tq-iron-skin', name: 'Iron-Skin Stance', grade: 'mortal', rarity: 'common', studying: true },
];

// Per-offer inspector enrichment (the artifact's detailFor — illustrative; no faked roll bars, the live owner
// reads the real technique). Keyed by stockId.
const ENRICH: Record<number, FortuneOfferDetailInput> = {
  0: {
    realmTier: 'Qi Condensation tier', rarityBand: 'Body-art · 体诀',
    scalesOff: ['Physical Defense 护体', 'Constitution 体魄'],
    reroll: { cost: '1 Fortune Token', odds: '34% to improve a sub-stat', note: 'Honest odds, shown before you spend. Never-regress holds — no seated value drops.' },
    lore: 'The mountain does not flinch when the storm leans on it.', provenance: 'Manual · Azure City pavilion',
    actions: [{ verb: 'Study', enabled: true, route: 'fortune.buyAndStudy:0' }, { verb: 'Hold in Satchel', enabled: true, route: 'fortune.buy:0' }],
  },
  1: {
    realmTier: 'Foundation Establishment tier', rarityBand: 'Water-art · 水诀',
    scalesOff: ['Spirit Power 灵力', 'Qi Control 御气', 'Water Affinity 水性'],
    reroll: { cost: '1 Fortune Token', odds: '31% to improve a sub-stat', note: 'Honest odds, shown before you spend. A reroll never lowers a seated value below its current roll — never-regress holds.' },
    lore: 'The tide does not strike; it arrives, and the shore was always going to yield.', provenance: 'Manual · Azure City pavilion',
    actions: [{ verb: 'Study', enabled: true, route: 'fortune.buyAndStudy:1' }, { verb: 'Hold in Satchel', enabled: true, route: 'fortune.buy:1' }],
  },
  2: {
    realmTier: 'Core Formation tier', rarityBand: 'Apex ultimate · 绝学',
    scalesOff: ['Spirit Power 灵力', 'Burst 爆发', 'Fire Affinity 火性'],
    signature: { name: 'Rekindling Pyre', body: 'On the kill the rite reignites — its cost is partly refunded ([tune] → D15), so a clean finish flows straight into the next casting.' },
    reroll: { cost: '2 Fortune Tokens', odds: '24% to improve a sub-stat', note: 'Honest odds. A reroll discards current sub-stats but never lowers a seated value — never-regress holds even at apex.' },
    lore: 'Ash is not an ending. The bird remembers the shape of its own burning.', provenance: 'Featured · Azure City pavilion',
    actions: [{ verb: 'Study', enabled: true, route: 'fortune.buyAndStudy:2' }, { verb: 'Hold in Satchel', enabled: true, route: 'fortune.buy:2' }],
  },
  3: {
    realmTier: 'Qi Condensation tier', rarityBand: 'Breath-art · 息诀',
    scalesOff: ['Stillness 静心', 'Qi Regen 回气'],
    reroll: { cost: '1 Fortune Token', odds: '33% to improve a sub-stat', note: 'Honest odds. Never-regress holds.' },
    lore: 'Still the breath, and the world grows quiet enough to hear the next step.', provenance: 'Manual · Azure City pavilion',
    actions: [{ verb: 'Study', enabled: true, route: 'fortune.buyAndStudy:3' }, { verb: 'Hold in Satchel', enabled: true, route: 'fortune.buy:3' }],
  },
};

const DETAIL_STATE: Partial<Record<FortuneDrawVisualState, number>> = {
  preDraw: 2, revealing: 1, 'postDraw-common': 0, 'postDraw-rare': 2, pityGuaranteed: 2, rerollAvailable: 1, rerollSpent: 3,
};

function seed(state: FortuneDrawVisualState, patch: Partial<FortuneDrawBuildInput>): FortuneDrawSurfaceV1 {
  const base: FortuneDrawBuildInput = {
    visualState: state,
    pavilionId: 'pav-azure-city',
    pavilionName: 'The Manual Pavilion',
    dateLabel: 'Day 1 · Azure City',
    offers: baseOffers(),
    pity: { featuredEpic: 4, featuredLegendary: 11 },
    pityThresholds: PITY_THRESHOLDS,
    satchel: SATCHEL,
    purse: PURSE,
    ...patch,
  };
  const surface = buildFortuneDrawSurface(base);
  // Pre-seed the docked inspector (the artifact pre-selects a scroll per state) unless the patch set one.
  if (!surface.selectedDetail) {
    const stockId = DETAIL_STATE[state];
    if (stockId !== undefined) {
      const offer = surface.offers.find((o) => o.stockId === stockId);
      if (offer) surface.selectedDetail = buildFortuneOfferDetail(offer, ENRICH[stockId]);
    }
  }
  return surface;
}

const reveal = (stockId: number, name: string, rarity: FortuneDrawSurfaceV1['offers'][number]['rarity']) => ({
  stockId,
  name,
  rarity,
  rarityLabel: { common: '凡 Common', uncommon: '良 Uncommon', rare: '珍 Rare', epic: '极 Epic', legendary: '仙 Legendary' }[rarity],
  rarityFrameGrade: ({ common: 'mortal', uncommon: 'spirit', rare: 'earth', epic: 'heaven', legendary: 'immortal' } as const)[rarity],
  announce: `You drew a ${rarity[0].toUpperCase()}${rarity.slice(1)} manual: ${name}.`,
});

export const FORTUNE_DRAW_FIXTURE_SEEDS: Record<FortuneDrawVisualState, FortuneDrawSurfaceV1> = {
  preDraw: seed('preDraw', {}),
  revealing: seed('revealing', { reveal: reveal(1, 'Azure Tide Verse', 'rare') }),
  'postDraw-common': seed('postDraw-common', {
    offers: baseOffers().map((o) => (o.stockId === 0 ? { ...o, sealed: false, sold: true } : o)),
    reveal: reveal(0, 'Iron-Skin Stance', 'common'),
  }),
  'postDraw-rare': seed('postDraw-rare', {
    offers: baseOffers().map((o) => (o.stockId === 2 ? { ...o, sealed: false, sold: true } : o)),
    reveal: reveal(2, 'Vermilion Phoenix Rite', 'epic'),
  }),
  pityGuaranteed: seed('pityGuaranteed', { pity: { featuredEpic: 10, featuredLegendary: 22 } }),
  rerollAvailable: seed('rerollAvailable', { reroll: { available: true, costText: '[tune] → D15', spent: false } }),
  rerollSpent: seed('rerollSpent', { reroll: { available: false, costText: '[tune] → D15', spent: true } }),
  empty: seed('empty', { offers: baseOffers().map((o) => ({ ...o, sold: true })), satchel: [] }),
  unknown: seed('unknown', { offers: [], pity: { featuredEpic: 0, featuredLegendary: 0 }, satchel: [] }),
};

export const FORTUNE_DRAW_FIXTURE_LIST: readonly FortuneDrawSurfaceV1[] =
  FORTUNE_DRAW_VISUAL_STATE_OPTIONS.map((s) => FORTUNE_DRAW_FIXTURE_SEEDS[s]);
