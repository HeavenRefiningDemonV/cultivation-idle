import {
  ITEM_DETAIL_SCHEMA_VERSION,
  type ItemDetailSurfaceV1,
} from './itemDetailTypes.js';

/**
 * F2-MODALS / S0 — deterministic inspector fixtures (§7.1 matrix). No live RNG; every value is
 * illustrative ([tune→D15]) — F2 fixes shape, never canonical balance. Consumed by
 * modal-stage.html?modal=itemDetail&state=<seed id>.
 *
 * F2.UI enrichment (artifact-fidelity port): each seed now carries the artifact's richer record
 * data — `nameCjk` (paired CJK name), affix `rollPosition` (the roll bar), the legendary
 * `signature` headline, the weapon-bond `max` ladder, the technique `reroll` panel + `casting` +
 * `scalesOff`, and the path `lean` chip. All additive; the 10 seeds + their visualStates are
 * unchanged (the guarding contract floor only rises). Real-surface wiring is deferred — see the
 * MODAL_SURFACE_WIRING_TODO note in ./index.ts.
 */

export const ITEM_DETAIL_FIXTURE_SEEDS = [
  'item-common',
  'item-uncommon',
  'item-rare',
  'item-epic',
  'item-legendary',
  'item-equippable-compare',
  'item-in-set-bonded',
  'technique-seat-reroll',
  'inspector-empty',
  'inspector-locked',
] as const;
export type ItemDetailFixtureSeedId = (typeof ITEM_DETAIL_FIXTURE_SEEDS)[number];

const el = (id: string, label: string, token: string) => ({ id, label, sceneColorToken: token });

const SEED_BUILDERS: Record<ItemDetailFixtureSeedId, () => ItemDetailSurfaceV1> = {
  'item-common': () => ({
    schemaVersion: ITEM_DETAIL_SCHEMA_VERSION,
    visualState: 'item-common',
    identity: {
      name: 'Iron-Bark Cudgel',
      nameCjk: '铁桦棍',
      variant: 'item',
      tier: 1,
      realmTier: null,
      rarity: 'common',
      rarityLabel: '凡 · Common',
      rarityBand: '1 affix · ×1.00',
      element: el('wood', 'Wood', '--element-wood'),
      kind: 'weapon',
      slot: 'mainhand',
    },
    affixes: [{ name: 'Physical Attack', channel: 'Physical Attack', value: '+6', kind: 'prefix' }],
    setBond: null,
    compareVsEquipped: null,
    lore: 'A plain cudgel cut from spirit-bark; serviceable, unremarkable.',
    provenance: 'Found · Pinewind outskirts',
    actions: [
      { verb: 'Equip', enabled: true, route: 'item.equip' },
      { verb: 'Sell', enabled: true, route: 'item.sell', confirm: { prompt: 'Sell Iron-Bark Cudgel for 12 spirit stones?' } },
    ],
  }),
  'item-uncommon': () => ({
    schemaVersion: ITEM_DETAIL_SCHEMA_VERSION,
    visualState: 'item-common',
    identity: {
      name: 'Jade-Vein Bracer',
      nameCjk: '玉脉护腕',
      variant: 'item',
      tier: 2,
      realmTier: null,
      rarity: 'uncommon',
      rarityLabel: '良 · Uncommon',
      rarityBand: '1–2 affixes · ×1.08',
      element: el('earth', 'Earth', '--element-earth'),
      kind: 'accessory',
      slot: 'wrist',
    },
    affixes: [
      { name: 'Physical Defense', channel: 'Physical Defense', value: '+14', kind: 'prefix' },
      { name: 'HP Regen', channel: 'HP Regen', value: '+3/s', rolledRange: '+2 … +5', rollPosition: 0.45, quality: 'mid', kind: 'suffix' },
    ],
    setBond: null,
    compareVsEquipped: null,
    lore: 'Bracer veined with raw jade; a steadying weight on the arm.',
    provenance: 'Crafted · Stonecrag forge',
    actions: [
      { verb: 'Equip', enabled: true, route: 'item.equip' },
      { verb: 'Sell', enabled: true, route: 'item.sell', confirm: { prompt: 'Sell Jade-Vein Bracer?' } },
    ],
  }),
  'item-rare': () => ({
    schemaVersion: ITEM_DETAIL_SCHEMA_VERSION,
    visualState: 'item-common',
    identity: {
      name: 'Frostquill Talisman',
      nameCjk: '霜翎符',
      variant: 'item',
      tier: 3,
      realmTier: null,
      rarity: 'rare',
      rarityLabel: '珍 · Rare',
      rarityBand: '2–3 affixes · ×1.18',
      element: el('water', 'Water', '--element-water'),
      kind: 'accessory',
      slot: 'talisman',
      lean: 'Heaven',
    },
    affixes: [
      { name: 'Crit Chance', channel: 'Crit Chance', value: '+5%', kind: 'prefix' },
      { name: 'Dodge', channel: 'Dodge', value: '+8', rolledRange: '+6 … +12', rollPosition: 0.78, quality: 'high', kind: 'suffix' },
      { name: 'Speed', channel: 'Speed', value: '+0.1', kind: 'suffix' },
    ],
    setBond: null,
    compareVsEquipped: null,
    lore: 'A talisman that exhales a thread of cold; the hand quickens around it.',
    provenance: 'Reward · Frostpond bounty',
    actions: [
      { verb: 'Equip', enabled: true, route: 'item.equip' },
      { verb: 'Upgrade', enabled: false, route: 'item.upgrade', disabledReason: 'Needs 3× frost essence' },
      { verb: 'Sell', enabled: true, route: 'item.sell', confirm: { prompt: 'Sell Frostquill Talisman?' } },
    ],
  }),
  'item-epic': () => ({
    schemaVersion: ITEM_DETAIL_SCHEMA_VERSION,
    visualState: 'item-common',
    identity: {
      name: 'Emberforge Pauldron',
      nameCjk: '炽炉肩甲',
      variant: 'item',
      tier: 4,
      realmTier: null,
      rarity: 'epic',
      rarityLabel: '极 · Epic',
      rarityBand: '3–4 affixes · ×1.30',
      element: el('fire', 'Fire', '--element-fire'),
      kind: 'chest',
      slot: 'shoulders',
      lean: 'Earth',
    },
    affixes: [
      { name: 'Max HP', channel: 'Max HP', value: '+420', kind: 'prefix' },
      { name: 'Physical Defense', channel: 'Physical Defense', value: '+64', rolledRange: '+48 … +72', rollPosition: 0.82, quality: 'high', kind: 'prefix' },
      { name: 'Flat Damage Reduction', channel: 'Flat DR', value: '+12', kind: 'suffix' },
      { name: 'Stagger Resist', channel: 'Stagger Resist', value: '+9', kind: 'suffix' },
    ],
    setBond: null,
    compareVsEquipped: null,
    lore: 'Forged in a sealed kiln; the ember never fully dies in its seams.',
    provenance: 'Forged · Ironpeak crucible',
    actions: [
      { verb: 'Equip', enabled: true, route: 'item.equip' },
      { verb: 'Upgrade', enabled: true, route: 'item.upgrade' },
      { verb: 'Sell', enabled: true, route: 'item.sell', confirm: { prompt: 'Sell Emberforge Pauldron?' } },
    ],
  }),
  'item-legendary': () => ({
    schemaVersion: ITEM_DETAIL_SCHEMA_VERSION,
    visualState: 'item-legendary',
    identity: {
      name: 'Cinnabar Phoenix Spire',
      nameCjk: '丹凤朱阙',
      variant: 'item',
      tier: 5,
      realmTier: null,
      rarity: 'legendary',
      rarityLabel: '仙 · Legendary',
      rarityBand: '4–5 + signature · ×1.45',
      element: el('fire', 'Fire', '--element-fire'),
      kind: 'weapon',
      slot: 'mainhand',
      lean: 'Martial',
    },
    affixes: [
      { name: 'Physical Attack', channel: 'Physical Attack', value: '+1,240', kind: 'prefix' },
      { name: 'Crit Damage', channel: 'Crit Damage', value: '+85%', rolledRange: '+70% … +95%', rollPosition: 0.9, quality: 'high', kind: 'prefix' },
      { name: 'Crit Chance', channel: 'Crit Chance', value: '+12%', kind: 'suffix' },
      { name: 'Armor Pen', channel: 'Armor Penetration', value: '+140', kind: 'suffix' },
      { name: 'Phoenix Rekindle', channel: 'on kill, recover 8% HP', value: 'signature', kind: 'set' },
    ],
    setBond: {
      set: {
        name: 'Vermilion Regalia',
        held: 2,
        total: 3,
        activeBonuses: ['+10% Fire damage'],
        latentBonuses: ['(3) Rekindle spreads to a second strike'],
      },
    },
    compareVsEquipped: [
      { stat: 'Physical Attack', delta: '+320', direction: 'up' },
      { stat: 'Crit Damage', delta: '+25%', direction: 'up' },
      { stat: 'Max HP', delta: '-60', direction: 'down' },
    ],
    signature: {
      name: 'The Vermilion Echo',
      body: 'On a killing blow the spire rekindles — recover 8% max HP, and the next strike carries its fire whole. A named blade remembers what it has burned.',
    },
    lore: 'They say the first Vermilion Sovereign died holding this spire, and it has burned for her ever since.',
    provenance: 'Rare treasure · Spirit-Cavern depths',
    actions: [
      { verb: 'Equip', enabled: true, route: 'item.equip' },
      { verb: 'Upgrade', enabled: true, route: 'item.upgrade' },
      { verb: 'Sell', enabled: true, route: 'item.sell', confirm: { prompt: 'Sell Cinnabar Phoenix Spire — a legendary — for 9,800 spirit stones? This cannot be undone.' } },
    ],
  }),
  'item-equippable-compare': () => ({
    schemaVersion: ITEM_DETAIL_SCHEMA_VERSION,
    visualState: 'item-equippable',
    identity: {
      name: 'Whetstone Edge Saber',
      nameCjk: '砺锋刀',
      variant: 'item',
      tier: 3,
      realmTier: null,
      rarity: 'rare',
      rarityLabel: '珍 · Rare',
      rarityBand: '2–3 affixes · ×1.18',
      element: el('metal', 'Metal', '--element-metal'),
      kind: 'weapon',
      slot: 'mainhand',
      lean: 'Martial',
    },
    affixes: [
      { name: 'Physical Attack', channel: 'Physical Attack', value: '+86', kind: 'prefix' },
      { name: 'Crit Chance', channel: 'Crit Chance', value: '+7%', rolledRange: '+5% … +9%', rollPosition: 0.55, quality: 'mid', kind: 'suffix' },
    ],
    setBond: null,
    compareVsEquipped: [
      { stat: 'Physical Attack', delta: '+24', direction: 'up' },
      { stat: 'Crit Chance', delta: '+3%', direction: 'up' },
      { stat: 'Dodge', delta: '-5', direction: 'down' },
      { stat: 'Speed', delta: '0', direction: 'flat' },
    ],
    lore: 'A saber kept honed past reason; it bites before the swing finishes.',
    provenance: 'Found · Ruins, sublevel 2',
    actions: [
      { verb: 'Equip', enabled: true, route: 'item.equip' },
      { verb: 'Sell', enabled: true, route: 'item.sell', confirm: { prompt: 'Sell Whetstone Edge Saber?' } },
    ],
  }),
  'item-in-set-bonded': () => ({
    schemaVersion: ITEM_DETAIL_SCHEMA_VERSION,
    visualState: 'item-in-set',
    identity: {
      name: 'Oathbound Warblade',
      nameCjk: '誓盟战刃',
      variant: 'item',
      tier: 4,
      realmTier: null,
      rarity: 'epic',
      rarityLabel: '极 · Epic',
      rarityBand: '3–4 affixes · ×1.30',
      element: el('wood', 'Wood', '--element-wood'),
      kind: 'weapon',
      slot: 'mainhand',
      lean: 'Martial',
    },
    affixes: [
      { name: 'Physical Attack', channel: 'Physical Attack', value: '+540', kind: 'prefix' },
      { name: 'Attack Speed', channel: 'Attack Speed', value: '+6%', kind: 'suffix' },
      { name: 'Set · Verdant Oath', channel: '2-piece bonus active', value: 'set', kind: 'set' },
    ],
    setBond: {
      set: {
        name: 'Verdant Oath',
        held: 2,
        total: 4,
        activeBonuses: ['+8% Attack Speed'],
        latentBonuses: ['(3) +15% Stagger', '(4) Oath-strike: every 5th hit cannot miss'],
      },
      bond: {
        level: 3,
        max: 7,
        perks: ['Bond III · the blade returns to hand on dropped guard', 'Bond II · +4% damage while below 50% HP'],
      },
    },
    compareVsEquipped: null,
    lore: 'A natal weapon, sworn to its bearer; it remembers every life it was carried through.',
    provenance: 'Weapon-bond · awakened at Foundation Establishment',
    actions: [
      { verb: 'Equip', enabled: true, route: 'item.equip' },
      { verb: 'Upgrade', enabled: true, route: 'item.upgrade' },
    ],
  }),
  'technique-seat-reroll': () => ({
    schemaVersion: ITEM_DETAIL_SCHEMA_VERSION,
    visualState: 'technique-variant',
    identity: {
      name: 'Still-Pond Reflection Art',
      nameCjk: '静水照心诀',
      variant: 'technique',
      tier: null,
      realmTier: 'Core Formation tier',
      rarity: 'rare',
      rarityLabel: '珍 · Rare',
      rarityBand: 'Sword-art · 剑诀',
      element: el('water', 'Water', '--element-water'),
      kind: null,
      slot: 'active seat',
      lean: 'Heaven',
    },
    affixes: [
      { name: 'Sub-stat · Dodge', channel: 'Dodge', value: '+9', rolledRange: '+6 … +12', rollPosition: 0.78, quality: 'high', kind: 'suffix' },
      { name: 'Sub-stat · Qi Regen', channel: 'Qi Regen', value: '+4/s', rolledRange: '+3 … +6', rollPosition: 0.5, quality: 'mid', kind: 'suffix' },
      { name: 'Reflect 20% of a blocked strike', channel: 'on perfect guard', value: 'effect', kind: 'prefix' },
    ],
    setBond: null,
    compareVsEquipped: null,
    casting: 'Fires on a perfect guard — reflects 20% of the blocked strike back along its own line, applying Soaked on a critical reflect.',
    scalesOff: ['Stillness 静心', 'Qi Control 御气', 'Reflection 照影'],
    reroll: {
      cost: '1 Fortune Token',
      odds: '28% to improve a sub-stat',
      note: 'Honest odds, shown before you spend. A reroll never lowers a seated value below its current roll — never-regress holds.',
    },
    lore: 'Hold the mind as still water; what strikes the surface returns to the striker.',
    provenance: 'Manual · Lotusford pavilion',
    actions: [
      { verb: 'Seat', enabled: true, route: 'technique.seat' },
      { verb: 'Reroll', enabled: true, route: 'technique.reroll', confirm: { prompt: 'Reroll sub-stats? Honest odds — current rolls are discarded, none lowered below their seated value.' } },
    ],
  }),
  'inspector-empty': () => ({
    schemaVersion: ITEM_DETAIL_SCHEMA_VERSION,
    visualState: 'empty',
    identity: null,
    affixes: [],
    setBond: null,
    compareVsEquipped: null,
    lore: null,
    provenance: null,
    actions: [],
    emptyLegend: 'Select an item or technique to inspect it in full.',
  }),
  'inspector-locked': () => ({
    schemaVersion: ITEM_DETAIL_SCHEMA_VERSION,
    visualState: 'locked',
    identity: {
      name: 'Sealed Earthroot Mantle',
      nameCjk: '封·地根披风',
      variant: 'item',
      tier: 4,
      realmTier: null,
      rarity: 'epic',
      rarityLabel: '极 · Epic',
      rarityBand: '3–4 affixes · ×1.30',
      element: el('earth', 'Earth', '--element-earth'),
      kind: 'chest',
      slot: 'body',
    },
    affixes: [
      { name: 'Max HP', channel: 'Max HP', value: '+?', kind: 'prefix' },
      { name: 'Flat Damage Reduction', channel: 'Flat DR', value: '+?', kind: 'suffix' },
    ],
    setBond: null,
    compareVsEquipped: null,
    lore: 'The mantle is sealed; its weave will not answer to a vessel below Nascent Soul.',
    provenance: 'Locked · requirement unmet',
    actions: [{ verb: 'Equip', enabled: false, route: 'item.equip', disabledReason: 'Requires Nascent Soul realm' }],
    gate: { unmet: 'Requires Nascent Soul realm to attune', route: 'gate.realm' },
  }),
};

export function buildItemDetailSurface(seedId: string): ItemDetailSurfaceV1 {
  const builder = SEED_BUILDERS[seedId as ItemDetailFixtureSeedId];
  if (!builder) {
    throw new Error(`[itemDetailFixtures] unknown seed id: ${seedId}`);
  }
  return builder();
}
