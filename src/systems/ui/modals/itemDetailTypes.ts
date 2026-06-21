/**
 * F2-MODALS / S0 — the Item/Technique-Detail inspector surface (Codex §III.W).
 *
 * Render-only typed surface (mirrors the repo's `*SurfaceV1` convention, e.g.
 * StatusObservatorySurfaceV1): a SCHEMA_VERSION const, a VisualState union, and nested
 * render-only data with NO methods and NO store handles. Action `route`s are OPAQUE intent
 * identifiers the owning system resolves — the surface carries the route NAME, never a
 * mutating callback. This is the single enforcement point of the cross-surface item language:
 * tier mark + rarity frame grade + element edge-glyph + affixes in real text.
 */

export const ITEM_DETAIL_SCHEMA_VERSION = 'item-detail-v1' as const;

export type ItemDetailVariant = 'item' | 'technique';
export const ITEM_DETAIL_VARIANT_OPTIONS = ['item', 'technique'] as const satisfies readonly ItemDetailVariant[];

/** Common 凡 → Legendary 仙. Maps to --rarity-mortal → --rarity-immortal (F0). */
export type ItemDetailRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export const ITEM_DETAIL_RARITY_OPTIONS =
  ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const satisfies readonly ItemDetailRarity[];

/** The 10 inspector states (Codex W.8 content variants + the two D17 §3.3 modal-specific). */
export type ItemDetailVisualState =
  | 'item-common'
  | 'item-legendary'
  | 'item-equippable'
  | 'item-in-set'
  | 'technique-variant'
  | 'upgrade-available'
  | 'sell-confirm'
  | 'per-element'
  | 'empty'
  | 'locked';
export const ITEM_DETAIL_VISUAL_STATE_OPTIONS = [
  'item-common',
  'item-legendary',
  'item-equippable',
  'item-in-set',
  'technique-variant',
  'upgrade-available',
  'sell-confirm',
  'per-element',
  'empty',
  'locked',
] as const satisfies readonly ItemDetailVisualState[];

/** W.7.1 — the canonical compact item language, shown in full. */
export interface ItemDetailIdentity {
  name: string;
  /** the Kai-ti CJK name shown beneath the English name (artifact `kai`). Always paired with English. */
  nameCjk?: string | null;
  variant: ItemDetailVariant;
  /** item tier 1-7 (item variant) ... */
  tier: number | null;
  /** ... or realm-tier (technique variant). */
  realmTier: string | null;
  rarity: ItemDetailRarity;
  /** 凡/良/珍/极/仙 + English — the rarity label, so the frame grade is never hue-alone. */
  rarityLabel: string;
  /** the affix-band + multiplier line under the rarity seal, e.g. "4–5 + signature · ×1.45". */
  rarityBand?: string | null;
  /** the element edge-glyph (D3): id + label + the element scene-color token. */
  element: { id: string; label: string; sceneColorToken: string } | null;
  /** weapon/head/chest/legs/accessory (item variant). */
  kind: string | null;
  slot: string | null;
  /** path lean chip (D5 — Martial/Earth/Heaven) — item variant. */
  lean?: string | null;
}

/** W.7.2 — real text, never vague, never hover-only. `kind` drives the F0 affix tint. */
export interface ItemDetailAffix {
  name: string;
  /** the stat channel the affix rolls on (D2 §4.6), e.g. "Physical Attack" — shown beside the name. */
  channel?: string | null;
  /** formatted value with unit. */
  value: string;
  /** rolled affixes show their range, e.g. "+4 … +9". */
  rolledRange?: string;
  /** 0..1 — where the roll landed in its range (drives the roll bar). Surface-computed; never derived in JSX. */
  rollPosition?: number;
  quality?: 'low' | 'mid' | 'high';
  kind: 'prefix' | 'suffix' | 'bond' | 'set';
}

/** W.7.3 — set membership + Martial weapon bond. Accent --affix-bond-tint. */
export interface ItemDetailSetBond {
  set?: { name: string; held: number; total: number; activeBonuses: string[]; latentBonuses: string[] };
  bond?: { level: number; max?: number; perks: string[] };
}

/** W.7 — the legendary signature mechanic (the named edge); item variant, legendary only. */
export interface ItemDetailSignature {
  name: string;
  body: string;
}

/** W.7 — the technique reroll panel: honest odds, cost, never-regress (D13 Fortune-gated). */
export interface ItemDetailReroll {
  cost: string;
  /** honest odds, shown verbatim — never a flattering rounding. */
  odds: string;
  note: string;
}

/** W.7.4 — item variant; carried by shape + sign + value, never color alone. */
export interface ItemDetailCompareRow {
  stat: string;
  /** "+12" / "-3". */
  delta: string;
  direction: 'up' | 'down' | 'flat';
}

/** W.7.5 — forwarded as intents; the modal NEVER mutates. */
export interface ItemDetailAction {
  /** Equip/Upgrade/Sell (item) | Seat/Reroll (technique). */
  verb: string;
  enabled: boolean;
  /** opaque intent id resolved by the owning system. */
  route: string;
  /** Sell raises a light confirm naming what is given up. */
  confirm?: { prompt: string };
  /** for the 'locked' state. */
  disabledReason?: string;
}

export interface ItemDetailSurfaceV1 {
  schemaVersion: typeof ITEM_DETAIL_SCHEMA_VERSION;
  visualState: ItemDetailVisualState;
  /** null in the 'empty' state. */
  identity: ItemDetailIdentity | null;
  affixes: ItemDetailAffix[];
  setBond: ItemDetailSetBond | null;
  /** item variant only. */
  compareVsEquipped: ItemDetailCompareRow[] | null;
  lore: string | null;
  /** where found / how obtained. */
  provenance: string | null;
  actions: ItemDetailAction[];
  /** legendary signature mechanic — the headline named-edge block (item variant). */
  signature?: ItemDetailSignature | null;
  /** technique casting line — how the art fires. */
  casting?: string | null;
  /** technique — the stats the art scales off (D7). */
  scalesOff?: string[] | null;
  /** technique reroll panel — honest odds, never-regress (replaces the set/bond left cell). */
  reroll?: ItemDetailReroll | null;
  /** the 'empty' state legend. */
  emptyLegend?: string;
  /** the 'locked' state honesty: what unlocks it. */
  gate?: { unmet: string; route?: string };
}
