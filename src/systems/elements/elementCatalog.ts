/**
 * F3-ELEM — the frozen element catalog (D3 Appendices A/C + the live roster).
 *
 * Transcribed verbatim from D3; structure only, every magnitude deferred to D15. The element id is the
 * live spelling — `lightning`, never `thunder` (§3); "Thunder / 雷" survives in `loreName`/`glyph`. The
 * id list `satisfies readonly SpiritRootElement[]`, so the type system guarantees one shared vocabulary.
 */
import type { SpiritRootElement } from '../../types/index.js';
import type {
  ElementDef,
  ElementId,
  OppositionEdge,
  ResonanceEdge,
  StateDef,
} from './elementTypes.js';

/** Deep-freeze a table so the catalog is immutable at runtime as well as at the type level. */
function deepFreeze<T>(table: readonly T[]): readonly T[] {
  for (const row of table) Object.freeze(row);
  return Object.freeze(table);
}

/**
 * The 14 element ids, in the live CANONICAL_SPIRIT_ROOT_ELEMENTS iteration order (§3.4). The
 * `satisfies` clause is the §3.3 single-roster guarantee — this list cannot drift from the live union.
 */
export const ELEMENT_IDS = [
  'wood', 'fire', 'earth', 'metal', 'water',
  'wind', 'lightning', 'ice',
  'light', 'shadow',
  'soul', 'void', 'time', 'astral',
] as const satisfies readonly SpiritRootElement[];

/** The one D3↔live divergence, documented so the lineage is auditable (§3.2): lightning's lore is Thunder. */
export const D3_LORE_NAME_BY_ELEMENT: Readonly<Record<ElementId, string>> = Object.freeze({
  wood: 'Wood', fire: 'Fire', earth: 'Earth', metal: 'Metal', water: 'Water',
  wind: 'Wind', lightning: 'Thunder', ice: 'Ice',
  light: 'Light', shadow: 'Shadow',
  soul: 'Soul', void: 'Void', time: 'Time', astral: 'Astral',
});

/** The 14-element roster (D3 §1.1, App. A.1/F.1). `ring` is the D3 membership field; iteration order
 *  follows the live array above. accentToken = the `--element-*` token NAME only (F3 emits no CSS). */
export const ELEMENT_ROSTER: readonly ElementDef[] = deepFreeze<ElementDef>([
  { id: 'wood', displayName: 'Wood', loreName: 'Wood', glyph: '木', pinyin: 'mù', ring: 1, accentToken: '--element-wood', signatureState: 'rotting' },
  { id: 'fire', displayName: 'Fire', loreName: 'Fire', glyph: '火', pinyin: 'huǒ', ring: 1, accentToken: '--element-fire', signatureState: 'burning' },
  { id: 'earth', displayName: 'Earth', loreName: 'Earth', glyph: '土', pinyin: 'tǔ', ring: 1, accentToken: '--element-earth', signatureState: 'weighted' },
  { id: 'metal', displayName: 'Metal', loreName: 'Metal', glyph: '金', pinyin: 'jīn', ring: 1, accentToken: '--element-metal', signatureState: 'rent' },
  { id: 'water', displayName: 'Water', loreName: 'Water', glyph: '水', pinyin: 'shuǐ', ring: 1, accentToken: '--element-water', signatureState: 'soaked' },
  { id: 'wind', displayName: 'Wind', loreName: 'Wind', glyph: '风', pinyin: 'fēng', ring: 2, accentToken: '--element-wind', signatureState: 'sundered' },
  { id: 'lightning', displayName: 'Thunder', loreName: 'Thunder', glyph: '雷', pinyin: 'léi', ring: 2, accentToken: '--element-thunder', signatureState: 'shocked' },
  { id: 'ice', displayName: 'Ice', loreName: 'Ice', glyph: '冰', pinyin: 'bīng', ring: 2, accentToken: '--element-ice', signatureState: 'chilled' },
  { id: 'light', displayName: 'Light', loreName: 'Light', glyph: '光', pinyin: 'guāng', ring: 3, accentToken: '--element-light', signatureState: 'exposed' },
  { id: 'shadow', displayName: 'Shadow', loreName: 'Shadow', glyph: '暗', pinyin: 'àn', ring: 3, accentToken: '--element-shadow', signatureState: 'cursed' },
  { id: 'soul', displayName: 'Soul', loreName: 'Soul', glyph: '魂', pinyin: 'hún', ring: 4, accentToken: '--element-soul', signatureState: 'soulExposed' },
  { id: 'void', displayName: 'Void', loreName: 'Void', glyph: '虚', pinyin: 'xū', ring: 4, accentToken: '--element-void', signatureState: 'voided' },
  { id: 'time', displayName: 'Time', loreName: 'Time', glyph: '时', pinyin: 'shí', ring: 4, accentToken: '--element-time', signatureState: 'withering' },
  { id: 'astral', displayName: 'Astral', loreName: 'Astral', glyph: '星', pinyin: 'xīng', ring: 4, accentToken: '--element-astral', signatureState: 'gravityBound' },
]);

/** Resonance — 20 unique undirected edges (D3 §2.3, App. A.3). `a` precedes `b` by roster order.
 *  G = Wu Xing generation spine (5); K = thematic kinship (15). Degree-sum = 40 (water = 5, the connector). */
export const RESONANCE_EDGES: readonly ResonanceEdge[] = deepFreeze<ResonanceEdge>([
  // generation spine (5, G)
  { a: 'wood', b: 'fire', source: 'G' },
  { a: 'fire', b: 'earth', source: 'G' },
  { a: 'earth', b: 'metal', source: 'G' },
  { a: 'metal', b: 'water', source: 'G' },
  { a: 'wood', b: 'water', source: 'G' },
  // thematic kinship (15, K)
  { a: 'metal', b: 'lightning', source: 'K' },
  { a: 'metal', b: 'ice', source: 'K' },
  { a: 'wood', b: 'wind', source: 'K' },
  { a: 'water', b: 'ice', source: 'K' },
  { a: 'water', b: 'shadow', source: 'K' },
  { a: 'water', b: 'time', source: 'K' },
  { a: 'fire', b: 'lightning', source: 'K' },
  { a: 'fire', b: 'light', source: 'K' },
  { a: 'wind', b: 'lightning', source: 'K' },
  { a: 'light', b: 'astral', source: 'K' },
  { a: 'light', b: 'soul', source: 'K' },
  { a: 'soul', b: 'astral', source: 'K' },
  { a: 'shadow', b: 'void', source: 'K' },
  { a: 'void', b: 'astral', source: 'K' },
  { a: 'void', b: 'time', source: 'K' },
]);

/** Opposition — 19 directed edges `from ▸ to` ("from counters to") (D3 §3.8, App. A.4).
 *  5 pentagram + 4 storm-square + 1 melt cross-edge + 6 duals (3 mutual pairs) + 3 cross-ring. */
export const OPPOSITION_EDGES: readonly OppositionEdge[] = deepFreeze<OppositionEdge>([
  // Wu Xing overcoming pentagram (5)
  { from: 'wood', to: 'earth', source: 'pentagram' },
  { from: 'earth', to: 'water', source: 'pentagram' },
  { from: 'water', to: 'fire', source: 'pentagram' },
  { from: 'fire', to: 'metal', source: 'pentagram' },
  { from: 'metal', to: 'wood', source: 'pentagram' },
  // storm-square (4)
  { from: 'lightning', to: 'ice', source: 'storm-square' },
  { from: 'ice', to: 'wind', source: 'storm-square' },
  { from: 'wind', to: 'earth', source: 'storm-square' },
  { from: 'earth', to: 'lightning', source: 'storm-square' },
  // melt cross-edge (1)
  { from: 'fire', to: 'ice', source: 'cross-edge' },
  // three duals (6 = 3 mutual pairs)
  { from: 'light', to: 'shadow', source: 'dual' },
  { from: 'shadow', to: 'light', source: 'dual' },
  { from: 'soul', to: 'void', source: 'dual' },
  { from: 'void', to: 'soul', source: 'dual' },
  { from: 'time', to: 'astral', source: 'dual' },
  { from: 'astral', to: 'time', source: 'dual' },
  // cross-ring anti-archetype counters (3)
  { from: 'soul', to: 'earth', source: 'cross-ring' },
  { from: 'time', to: 'wood', source: 'cross-ring' },
  { from: 'astral', to: 'wind', source: 'cross-ring' },
]);

/** The 21-state catalog (D3 §4.2, App. C): 19 base + the two escalation tiers (petrified, frozen).
 *  iconShape is the a11y shape NAME only (F3 stores it; the UI Movement draws the silhouette). */
export const STATE_CATALOG: readonly StateDef[] = deepFreeze<StateDef>([
  { id: 'burning', label: 'Burning', hanzi: '燃', appliedBy: 'fire', category: 'dot', escalatesTo: null, iconShape: 'flame' },
  { id: 'rotting', label: 'Rotting', hanzi: '腐', appliedBy: 'wood', category: 'dot', escalatesTo: null, iconShape: 'decay' },
  { id: 'soaked', label: 'Soaked', hanzi: '湿', appliedBy: 'water', category: 'amplifier', escalatesTo: null, iconShape: 'droplet' },
  { id: 'weighted', label: 'Weighted', hanzi: '镇', appliedBy: 'earth', category: 'control', escalatesTo: 'petrified', iconShape: 'weight' },
  { id: 'petrified', label: 'Petrified', hanzi: '石', appliedBy: 'earth', category: 'control', escalatesTo: null, iconShape: 'stone' },
  { id: 'rent', label: 'Rent', hanzi: '裂', appliedBy: 'metal', category: 'mark', escalatesTo: null, iconShape: 'crack' },
  { id: 'chilled', label: 'Chilled', hanzi: '寒', appliedBy: 'ice', category: 'control', escalatesTo: 'frozen', iconShape: 'frost' },
  { id: 'frozen', label: 'Frozen', hanzi: '冻', appliedBy: 'ice', category: 'control', escalatesTo: null, iconShape: 'ice-lock' },
  { id: 'shocked', label: 'Shocked', hanzi: '麻', appliedBy: 'lightning', category: 'mark', escalatesTo: null, iconShape: 'bolt' },
  { id: 'sundered', label: 'Sundered', hanzi: '损', appliedBy: 'wind', category: 'mark', escalatesTo: null, iconShape: 'rift' },
  { id: 'exposed', label: 'Exposed', hanzi: '露', appliedBy: 'light', category: 'amplifier', escalatesTo: null, iconShape: 'ray' },
  { id: 'cursed', label: 'Cursed', hanzi: '咒', appliedBy: 'shadow', category: 'amplifier', escalatesTo: null, iconShape: 'sigil' },
  { id: 'blinded', label: 'Blinded', hanzi: '盲', appliedBy: 'shadow', category: 'mark', escalatesTo: null, iconShape: 'veil' },
  { id: 'soulExposed', label: 'Soul-Exposed', hanzi: '魂露', appliedBy: 'soul', category: 'amplifier', escalatesTo: null, iconShape: 'spirit' },
  { id: 'voided', label: 'Voided', hanzi: '虚蚀', appliedBy: 'void', category: 'amplifier', escalatesTo: null, iconShape: 'nullring' },
  { id: 'withering', label: 'Withering', hanzi: '凋', appliedBy: 'time', category: 'dot', escalatesTo: null, iconShape: 'wilt' },
  { id: 'slowed', label: 'Slowed', hanzi: '缓', appliedBy: 'time', category: 'control', escalatesTo: null, iconShape: 'clock-slow' },
  { id: 'hasted', label: 'Hasted', hanzi: '疾', appliedBy: 'time', category: 'buff', escalatesTo: null, iconShape: 'clock-fast' },
  { id: 'gravityBound', label: 'Gravity-Bound', hanzi: '引', appliedBy: 'astral', category: 'control', escalatesTo: null, iconShape: 'anchor' },
  { id: 'fated', label: 'Fated', hanzi: '命', appliedBy: 'astral', category: 'mark', escalatesTo: null, iconShape: 'starmark' },
  { id: 'catalyzed', label: 'Catalyzed', hanzi: '催', appliedBy: 'astral', category: 'buff', escalatesTo: null, iconShape: 'spark' },
]);

/** Fast lookups (frozen). */
export const ELEMENT_BY_ID: Readonly<Record<ElementId, ElementDef>> = Object.freeze(
  Object.fromEntries(ELEMENT_ROSTER.map((e) => [e.id, e])) as Record<ElementId, ElementDef>,
);
export const STATE_BY_ID: Readonly<Record<string, StateDef>> = Object.freeze(
  Object.fromEntries(STATE_CATALOG.map((s) => [s.id, s])),
);
/** Roster index (= the fixed element index used in the determinism tie-break, §8). */
export const ELEMENT_INDEX: Readonly<Record<ElementId, number>> = Object.freeze(
  Object.fromEntries(ELEMENT_IDS.map((id, i) => [id, i])) as Record<ElementId, number>,
);
