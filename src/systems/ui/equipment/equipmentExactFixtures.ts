/**
 * M.III.1 EQ-MECH / S0 — deterministic Panoply + Vault surface fixtures (one per visual state).
 *
 * No live RNG; every value is illustrative ([tune]→D15) — S0 fixes SHAPE, never canonical balance.
 * The real builders (M.III.1 S3) read S1 state + composeGear's output and produce these same contracts.
 * `selectedDetail` reuses the F2 `buildItemDetailSurface` so it is, by construction, a valid
 * ItemDetailSurfaceV1 (the binding cross-surface item language).
 */

import { buildItemDetailSurface } from '../modals/itemDetailFixtures.js';
import {
  PANOPLY_EXACT_SCHEMA_VERSION,
  VAULT_EXACT_SCHEMA_VERSION,
  type EquipmentExactVisualState,
  type GearElementEdge,
  type PanoplyExactSurfaceV1,
  type VaultExactSurfaceV1,
  type VaultSlipSurface,
} from './equipmentExactTypes.js';

const el = (id: string, label: string, token: string): GearElementEdge => ({ id, label, sceneColorToken: token });

const ZERO_BY_RARITY = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 } as const;

const emptyTotals = (): PanoplyExactSurfaceV1['totals'] => ({ offense: [], defense: [], utility: [] });

// ─── Panoply ──────────────────────────────────────────────────────────────────────────────────

export const PANOPLY_EXACT_FIXTURE_SEEDS = [
  'healthy',
  'empty',
  'blocked',
  'detail-affix',
  'detail-legendary',
  'contentCap',
  'unknown',
] as const satisfies readonly EquipmentExactVisualState[];
export type PanoplyExactFixtureSeedId = (typeof PANOPLY_EXACT_FIXTURE_SEEDS)[number];

const martialLoadout = (): PanoplyExactSurfaceV1['slots'] => [
  {
    slot: 'weapon',
    filled: true,
    mountLabel: 'Weapon mount',
    item: {
      instanceId: 'gi-weapon-1',
      name: 'Oathbound Warblade',
      nameCjk: '誓盟战刃',
      tierMark: 'T4',
      rarity: 'epic',
      rarityLabel: '极 · Epic',
      rarityFrameGrade: 'heaven',
      element: el('wood', 'Wood', '--element-wood'),
      affixCount: 3,
    },
  },
  { slot: 'head', filled: false, mountLabel: 'Head mount' },
  { slot: 'chest', filled: false, mountLabel: 'Chest mount' },
  { slot: 'legs', filled: false, mountLabel: 'Legs mount' },
  {
    slot: 'accessory',
    filled: true,
    mountLabel: 'Accessory mount',
    item: {
      instanceId: 'gi-acc-1',
      name: 'Frostquill Talisman',
      nameCjk: '霜翎符',
      tierMark: 'T3',
      rarity: 'rare',
      rarityLabel: '珍 · Rare',
      rarityFrameGrade: 'earth',
      element: el('water', 'Water', '--element-water'),
      affixCount: 2,
    },
  },
];

const emptyLoadout = (): PanoplyExactSurfaceV1['slots'] => [
  { slot: 'weapon', filled: false, mountLabel: 'Weapon mount' },
  { slot: 'head', filled: false, mountLabel: 'Head mount' },
  { slot: 'chest', filled: false, mountLabel: 'Chest mount' },
  { slot: 'legs', filled: false, mountLabel: 'Legs mount' },
  { slot: 'accessory', filled: false, mountLabel: 'Accessory mount' },
];

const PANOPLY_SEED_BUILDERS: Record<PanoplyExactFixtureSeedId, () => PanoplyExactSurfaceV1> = {
  healthy: () => ({
    schemaVersion: PANOPLY_EXACT_SCHEMA_VERSION,
    visualState: 'healthy',
    pathLean: 'martial',
    slots: martialLoadout(),
    setBonuses: [],
    bond: { level: 3, max: 7, xpSources: ['Foundation strikes'], latentAffixes: ['(Bond V) Returning edge'], weaponArts: [] },
    totals: {
      offense: [{ channel: 'physAttack', label: 'Physical Attack', addText: '×1.16', tone: 'gain' }],
      defense: [],
      utility: [{ channel: 'critChance', label: 'Crit Chance', addText: '+5%', tone: 'gain' }],
    },
    elementLean: { entries: [{ element: 'wood', label: 'Wood', weight: 1, sceneColorToken: '--element-wood' }] },
    selectedDetail: null,
  }),
  empty: () => ({
    schemaVersion: PANOPLY_EXACT_SCHEMA_VERSION,
    visualState: 'empty',
    pathLean: 'martial',
    slots: emptyLoadout(),
    setBonuses: [],
    bond: null,
    totals: emptyTotals(),
    elementLean: null,
    selectedDetail: null,
  }),
  blocked: () => ({
    schemaVersion: PANOPLY_EXACT_SCHEMA_VERSION,
    visualState: 'blocked',
    pathLean: 'earth',
    slots: [
      { slot: 'weapon', filled: false, mountLabel: 'Weapon mount' },
      { slot: 'head', filled: false, mountLabel: 'Head mount', locked: { requirement: 'Requires Foundation Establishment' } },
      { slot: 'chest', filled: false, mountLabel: 'Chest mount' },
      { slot: 'legs', filled: false, mountLabel: 'Legs mount' },
      { slot: 'accessory', filled: false, mountLabel: 'Accessory mount' },
    ],
    setBonuses: [],
    bond: null,
    totals: emptyTotals(),
    elementLean: null,
    selectedDetail: null,
  }),
  'detail-affix': () => ({
    schemaVersion: PANOPLY_EXACT_SCHEMA_VERSION,
    visualState: 'detail-affix',
    pathLean: 'earth',
    slots: martialLoadout(),
    setBonuses: [{ setId: 'verdant_oath', name: 'Verdant Oath', held: 2, total: 3, activeTier: null, effectText: 'Inactive · 2 of 3 — bonus held' }],
    bond: null,
    totals: {
      offense: [{ channel: 'physAttack', label: 'Physical Attack', addText: '×1.16', tone: 'gain' }],
      defense: [{ channel: 'physDefense', label: 'Physical Defense', addText: '×1.10', tone: 'gain' }],
      utility: [],
    },
    elementLean: null,
    selectedDetail: buildItemDetailSurface('item-epic'),
  }),
  'detail-legendary': () => ({
    schemaVersion: PANOPLY_EXACT_SCHEMA_VERSION,
    visualState: 'detail-legendary',
    pathLean: 'martial',
    slots: martialLoadout(),
    setBonuses: [],
    bond: { level: 5, max: 7, xpSources: ['Core trials'], latentAffixes: [], weaponArts: ['Vermilion Echo'] },
    totals: {
      offense: [{ channel: 'physAttack', label: 'Physical Attack', addText: '×1.45', tone: 'gain' }],
      defense: [],
      utility: [{ channel: 'critChance', label: 'Crit Chance', addText: '+12%', tone: 'gain' }],
    },
    elementLean: { entries: [{ element: 'fire', label: 'Fire', weight: 1, sceneColorToken: '--element-fire' }] },
    selectedDetail: buildItemDetailSurface('item-legendary'),
  }),
  contentCap: () => ({
    schemaVersion: PANOPLY_EXACT_SCHEMA_VERSION,
    visualState: 'contentCap',
    pathLean: 'heaven',
    slots: [
      {
        slot: 'weapon',
        filled: true,
        mountLabel: 'Weapon mount',
        item: {
          instanceId: 'gi-weapon-capped',
          name: 'Whetstone Edge Saber',
          tierMark: 'T3',
          rarity: 'rare',
          rarityLabel: '珍 · Rare',
          rarityFrameGrade: 'earth',
          element: el('metal', 'Metal', '--element-metal'),
          affixCount: 2,
          capped: { capped: true, note: 'Tier below content — effectiveness capped' },
        },
      },
      { slot: 'head', filled: false, mountLabel: 'Head mount' },
      { slot: 'chest', filled: false, mountLabel: 'Chest mount' },
      { slot: 'legs', filled: false, mountLabel: 'Legs mount' },
      { slot: 'accessory', filled: false, mountLabel: 'Accessory mount' },
    ],
    setBonuses: [],
    bond: null,
    totals: emptyTotals(),
    elementLean: null,
    selectedDetail: null,
  }),
  unknown: () => ({
    schemaVersion: PANOPLY_EXACT_SCHEMA_VERSION,
    visualState: 'unknown',
    pathLean: 'martial',
    slots: emptyLoadout(),
    setBonuses: [],
    bond: null,
    totals: emptyTotals(),
    elementLean: null,
    selectedDetail: null,
  }),
};

export function buildPanoplyExactFixture(seedId: string): PanoplyExactSurfaceV1 {
  const builder = PANOPLY_SEED_BUILDERS[seedId as PanoplyExactFixtureSeedId];
  if (!builder) throw new Error(`[equipmentExactFixtures] unknown panoply seed id: ${seedId}`);
  return builder();
}

// ─── Vault ────────────────────────────────────────────────────────────────────────────────────

export const VAULT_EXACT_FIXTURE_SEEDS = [
  'healthy',
  'empty',
  'blocked',
  'detail-affix',
  'detail-legendary',
  'contentCap',
  'unknown',
] as const satisfies readonly EquipmentExactVisualState[];
export type VaultExactFixtureSeedId = (typeof VAULT_EXACT_FIXTURE_SEEDS)[number];

const slip = (over: Partial<VaultSlipSurface> & Pick<VaultSlipSurface, 'instanceId' | 'name' | 'slot' | 'rarity' | 'rarityLabel' | 'rarityFrameGrade'>): VaultSlipSurface => ({
  glyphId: 'glyph-default',
  tierMark: 'T1',
  affixCount: 1,
  isEquipped: false,
  ...over,
});

const populatedSlips = (): VaultSlipSurface[] => [
  slip({ instanceId: 'gi-weapon-1', name: 'Oathbound Warblade', glyphId: 'glyph-blade', slot: 'weapon', tierMark: 'T4', rarity: 'epic', rarityLabel: '极 · Epic', rarityFrameGrade: 'heaven', element: el('wood', 'Wood', '--element-wood'), affixCount: 3, isEquipped: true }),
  slip({ instanceId: 'gi-acc-1', name: 'Frostquill Talisman', glyphId: 'glyph-talisman', slot: 'accessory', tierMark: 'T3', rarity: 'rare', rarityLabel: '珍 · Rare', rarityFrameGrade: 'earth', element: el('water', 'Water', '--element-water'), affixCount: 2 }),
  slip({ instanceId: 'gi-chest-1', name: 'Emberforge Pauldron', glyphId: 'glyph-pauldron', slot: 'chest', tierMark: 'T4', rarity: 'epic', rarityLabel: '极 · Epic', rarityFrameGrade: 'heaven', element: el('fire', 'Fire', '--element-fire'), affixCount: 4, isNew: true }),
  slip({ instanceId: 'gi-weapon-2', name: 'Iron-Bark Cudgel', glyphId: 'glyph-cudgel', slot: 'weapon', rarity: 'common', rarityLabel: '凡 · Common', rarityFrameGrade: 'mortal', element: el('wood', 'Wood', '--element-wood') }),
];

const VAULT_SEED_BUILDERS: Record<VaultExactFixtureSeedId, () => VaultExactSurfaceV1> = {
  healthy: () => ({
    schemaVersion: VAULT_EXACT_SCHEMA_VERSION,
    visualState: 'healthy',
    slips: populatedSlips(),
    filter: { slot: 'all', grade: 'all' },
    sort: { by: 'rarity', dir: 'desc' },
    counts: { total: 4, byRarity: { ...ZERO_BY_RARITY, common: 1, rare: 1, epic: 2 } },
    selection: { instanceId: null },
    selectedDetail: null,
    dismantle: { enabled: true, confirmPrompt: 'Dismantle this item? Its materials return to your stores.' },
  }),
  empty: () => ({
    schemaVersion: VAULT_EXACT_SCHEMA_VERSION,
    visualState: 'empty',
    slips: [],
    filter: { slot: 'all', grade: 'all' },
    sort: { by: 'recent', dir: 'desc' },
    counts: { total: 0, byRarity: { ...ZERO_BY_RARITY } },
    selection: { instanceId: null },
    selectedDetail: null,
    dismantle: { enabled: false, confirmPrompt: 'Dismantle this item? Its materials return to your stores.' },
  }),
  blocked: () => ({
    schemaVersion: VAULT_EXACT_SCHEMA_VERSION,
    visualState: 'blocked',
    slips: populatedSlips(),
    filter: { slot: 'weapon', grade: 'all' },
    sort: { by: 'slot', dir: 'asc' },
    counts: { total: 4, byRarity: { ...ZERO_BY_RARITY, common: 1, rare: 1, epic: 2 } },
    selection: { instanceId: null },
    selectedDetail: null,
    dismantle: { enabled: false, confirmPrompt: 'Dismantle this item? Its materials return to your stores.' },
  }),
  'detail-affix': () => ({
    schemaVersion: VAULT_EXACT_SCHEMA_VERSION,
    visualState: 'detail-affix',
    slips: populatedSlips(),
    filter: { slot: 'all', grade: 'rare' },
    sort: { by: 'rarity', dir: 'desc' },
    counts: { total: 4, byRarity: { ...ZERO_BY_RARITY, common: 1, rare: 1, epic: 2 } },
    selection: { instanceId: 'gi-acc-1' },
    selectedDetail: buildItemDetailSurface('item-rare'),
    dismantle: { enabled: true, confirmPrompt: 'Dismantle Frostquill Talisman? Its materials return to your stores.' },
  }),
  'detail-legendary': () => ({
    schemaVersion: VAULT_EXACT_SCHEMA_VERSION,
    visualState: 'detail-legendary',
    slips: [
      slip({ instanceId: 'gi-legendary-1', name: 'Cinnabar Phoenix Spire', glyphId: 'glyph-spire', slot: 'weapon', tierMark: 'T5', rarity: 'legendary', rarityLabel: '仙 · Legendary', rarityFrameGrade: 'immortal', element: el('fire', 'Fire', '--element-fire'), affixCount: 5, isNew: true }),
      ...populatedSlips(),
    ],
    filter: { slot: 'all', grade: 'all' },
    sort: { by: 'rarity', dir: 'desc' },
    counts: { total: 5, byRarity: { ...ZERO_BY_RARITY, common: 1, rare: 1, epic: 2, legendary: 1 } },
    selection: { instanceId: 'gi-legendary-1' },
    selectedDetail: buildItemDetailSurface('item-legendary'),
    dismantle: { enabled: false, confirmPrompt: 'Dismantle a legendary? This cannot be undone.' },
  }),
  contentCap: () => ({
    schemaVersion: VAULT_EXACT_SCHEMA_VERSION,
    visualState: 'contentCap',
    slips: populatedSlips(),
    filter: { slot: 'all', grade: 'all' },
    sort: { by: 'rarity', dir: 'desc' },
    counts: { total: 4, byRarity: { ...ZERO_BY_RARITY, common: 1, rare: 1, epic: 2 } },
    selection: { instanceId: null },
    selectedDetail: null,
    dismantle: { enabled: true, confirmPrompt: 'Dismantle this item? Its materials return to your stores.' },
  }),
  unknown: () => ({
    schemaVersion: VAULT_EXACT_SCHEMA_VERSION,
    visualState: 'unknown',
    slips: [],
    filter: { slot: 'all', grade: 'all' },
    sort: { by: 'recent', dir: 'desc' },
    counts: { total: 0, byRarity: { ...ZERO_BY_RARITY } },
    selection: { instanceId: null },
    selectedDetail: null,
    dismantle: null,
  }),
};

export function buildVaultExactFixture(seedId: string): VaultExactSurfaceV1 {
  const builder = VAULT_SEED_BUILDERS[seedId as VaultExactFixtureSeedId];
  if (!builder) throw new Error(`[equipmentExactFixtures] unknown vault seed id: ${seedId}`);
  return builder();
}
