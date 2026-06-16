/**
 * W8 — the Observatory ⇄ Three-Treasures re-bind (D8/D9), ADDITIVE + flag-gated.
 *
 * The live Status Observatory constellation binds the LEGACY 28-stat roster and is
 * public-default (STATUS_OBSERVATORY_PUBLIC_DEFAULT_ENABLED = true), contract-locked
 * at 28 nodes / 8-7-6-7. The meridian model is still flag-gated OFF
 * (TEMPERING_COURT_PUBLIC_DEFAULT_ENABLED = false); the legacy engine stays live until
 * the W13 cutover. So — exactly like the W2–W6 engine modules — this is a STANDALONE
 * builder that is NOT wired into the live observatory. It produces a constellation
 * surface bound to the 20 Three-Treasures stats, drop-in for StatusStatMeridian
 * Constellation once the flag flips at W13. The live surface + its 6 committed
 * contracts are untouched.
 *
 * THE EXPLICIT MAP (D9 "explicit map needed in W8"): the 28 fixed constellation nodes
 * keep their ids + geometry; 20 are re-bound to meridian-stat DATA and 8 read as
 * sockets. The tier→branch rule is semantic, not the legacy path split:
 *   - Universal spine (8 nodes)  ← the 7 Three-Treasure AXES (Tier-1) + 1 socket
 *   - Earth branch    (6 nodes)  ← the 6 FOUNDATION stats (Tier-0 — body / root)
 *   - Martial branch  (7 nodes)  ← 7 combat-DERIVED stats (Tier-2 — blade)
 *   - Heaven branch   (7 nodes)  ← sockets (high-sky / not-yet-bound)  → 8 sockets total
 * The Tier-2 derived selection + the per-node pairings are a documented W8 design
 * choice (the packet leaves the map to W8); all of it is flag-gated data, tunable at
 * W12/W13 and confirmable against STAT_SYSTEM_OVERHAUL Appendix B.
 */

import type { PathId } from '../../content/types.js';
import type {
  StatusObservatorySurfaceV1,
  StatusObservatoryStatNodeSurface,
} from '../ui/status/statusObservatoryTypes.js';
import type { StatusLedgerTone } from '../ui/status/statusLedgerTypes.js';
import { DERIVED_STAT_DISPLAY, type DerivedStatKey } from './derivedStats.js';
import { MERIDIAN_ROOTS, type MeridianView, type SpiritRootGrade } from './meridianModel.js';
import type { CourtStatView } from './temperingCourtSurface.js';

export type MeridianStatTier = 'tier0' | 'tier1' | 'tier2';

export type MeridianNodeSource =
  | { kind: 'axis'; statId: string }
  | { kind: 'foundation'; statId: string }
  | { kind: 'derived'; key: DerivedStatKey }
  | { kind: 'socket' };

export interface MeridianNodeBinding {
  /** One of the 28 fixed STATUS_OBSERVATORY_STAT_NODE_GEOMETRY node ids. */
  nodeId: string;
  branchId: 'universal' | 'heaven' | 'earth' | 'martial';
  /** null = socket (no meridian stat bound). */
  tier: MeridianStatTier | null;
  source: MeridianNodeSource;
}

/**
 * The 28-entry explicit map. Node ids + branches mirror the live geometry exactly
 * (a contract test pins this), so the produced surface is drop-in for the renderer.
 * 20 entries are bound (tier0/1/2); 8 are sockets.
 */
export const MERIDIAN_CONSTELLATION_NODE_MAP: readonly MeridianNodeBinding[] = [
  // ---- Universal spine (8): 7 axes (Tier-1) + 1 socket ----
  { nodeId: 'dantian_depth', branchId: 'universal', tier: 'tier1', source: { kind: 'axis', statId: 'cultivation_base' } },
  { nodeId: 'meridian_throughput', branchId: 'universal', tier: 'tier1', source: { kind: 'axis', statId: 'meridian_openness' } },
  { nodeId: 'qi_purity', branchId: 'universal', tier: 'tier1', source: { kind: 'axis', statId: 'qi_purity' } },
  { nodeId: 'body_integrity', branchId: 'universal', tier: 'tier1', source: { kind: 'axis', statId: 'qi_pool' } },
  { nodeId: 'mind_clarity', branchId: 'universal', tier: 'tier1', source: { kind: 'axis', statId: 'soul_strength' } },
  { nodeId: 'dao_stability', branchId: 'universal', tier: 'tier1', source: { kind: 'axis', statId: 'dao_comprehension' } },
  { nodeId: 'spirit_sense', branchId: 'universal', tier: 'tier1', source: { kind: 'axis', statId: 'spiritual_sense' } },
  { nodeId: 'medicine_familiarity', branchId: 'universal', tier: null, source: { kind: 'socket' } },

  // ---- Earth branch (6): the 6 foundation stats (Tier-0) ----
  { nodeId: 'body_tempering', branchId: 'earth', tier: 'tier0', source: { kind: 'foundation', statId: 'physique' } },
  { nodeId: 'blood_essence', branchId: 'earth', tier: 'tier0', source: { kind: 'foundation', statId: 'vitality' } },
  { nodeId: 'armor_harmony', branchId: 'earth', tier: 'tier0', source: { kind: 'foundation', statId: 'agility' } },
  { nodeId: 'recovery_depth', branchId: 'earth', tier: 'tier0', source: { kind: 'foundation', statId: 'perception' } },
  { nodeId: 'meridian_fortitude', branchId: 'earth', tier: 'tier0', source: { kind: 'foundation', statId: 'willpower' } },
  { nodeId: 'rooted_guard', branchId: 'earth', tier: 'tier0', source: { kind: 'foundation', statId: 'luck' } },

  // ---- Martial branch (7): 7 combat-derived stats (Tier-2) ----
  { nodeId: 'weapon_intent', branchId: 'martial', tier: 'tier2', source: { kind: 'derived', key: 'physAttack' } },
  { nodeId: 'battle_rhythm', branchId: 'martial', tier: 'tier2', source: { kind: 'derived', key: 'attackSpeed' } },
  { nodeId: 'flow_step', branchId: 'martial', tier: 'tier2', source: { kind: 'derived', key: 'speed' } },
  { nodeId: 'precision', branchId: 'martial', tier: 'tier2', source: { kind: 'derived', key: 'accuracy' } },
  { nodeId: 'counter_sense', branchId: 'martial', tier: 'tier2', source: { kind: 'derived', key: 'evasion' } },
  { nodeId: 'killing_momentum', branchId: 'martial', tier: 'tier2', source: { kind: 'derived', key: 'critChance' } },
  { nodeId: 'weapon_bond', branchId: 'martial', tier: 'tier2', source: { kind: 'derived', key: 'armorPen' } },

  // ---- Heaven branch (7): sockets (not-yet-bound) ----
  { nodeId: 'dao_resonance', branchId: 'heaven', tier: null, source: { kind: 'socket' } },
  { nodeId: 'qi_control', branchId: 'heaven', tier: null, source: { kind: 'socket' } },
  { nodeId: 'divine_sense', branchId: 'heaven', tier: null, source: { kind: 'socket' } },
  { nodeId: 'law_weaving', branchId: 'heaven', tier: null, source: { kind: 'socket' } },
  { nodeId: 'tribulation_insight', branchId: 'heaven', tier: null, source: { kind: 'socket' } },
  { nodeId: 'star_rhythm', branchId: 'heaven', tier: null, source: { kind: 'socket' } },
  { nodeId: 'artifact_attunement', branchId: 'heaven', tier: null, source: { kind: 'socket' } },
];

/** The Tier-2 derived layer the constellation surfaces (documented W8 selection). */
export const MERIDIAN_CONSTELLATION_TIER2_KEYS: readonly DerivedStatKey[] = MERIDIAN_CONSTELLATION_NODE_MAP.filter(
  (entry): entry is MeridianNodeBinding & { source: { kind: 'derived'; key: DerivedStatKey } } =>
    entry.source.kind === 'derived',
).map((entry) => entry.source.key);

export interface MeridianConstellationInput {
  currentPath: PathId | null;
  /** Tier-1 axes (7), as CourtStatView (snake_case ids). */
  axes: CourtStatView[];
  /** Tier-0 foundation (6), as CourtStatView (snake_case ids). */
  foundation: CourtStatView[];
  /** Tier-2 derived values, keyed by DerivedStatKey (camelCase). */
  derived: Partial<Record<DerivedStatKey, number>>;
  /** Realm cap for axes/foundation rating-vs-cap display (derived carry no cap). */
  realmCap?: number;
}

/** Drop-in for StatusObservatorySurfaceV1['statConstellation'] except the subtitle is
 *  widened to string (the renderer's prop subtitle is widened at the W13 cutover). */
export type MeridianConstellationSurface = Omit<
  StatusObservatorySurfaceV1['statConstellation'],
  'subtitle'
> & { subtitle: string };

const TIER_CATEGORY = { tier0: 'foundation', tier1: 'doctrine', tier2: 'path' } as const;
const TIER_RANK = { tier0: 'support', tier1: 'core', tier2: 'advanced' } as const;

function shortLabelFrom(view: CourtStatView | null, fallback: string): string {
  if (view?.zi && view.zi.trim().length > 0) return view.zi;
  if (view?.name) return view.name.split(/\s+/)[0] ?? fallback;
  return fallback;
}

function boundNode(
  binding: MeridianNodeBinding,
  input: MeridianConstellationInput,
  axisById: Map<string, CourtStatView>,
  foundationById: Map<string, CourtStatView>,
): StatusObservatoryStatNodeSurface {
  const tier = binding.tier as MeridianStatTier;
  const realmCap = input.realmCap ?? 0;
  let displayName = binding.nodeId;
  let shortLabel = binding.nodeId;
  let effectSummary = '';
  let currentRating = 0;
  let cap = 0;
  let detail = '';

  if (binding.source.kind === 'axis') {
    const view = axisById.get(binding.source.statId) ?? null;
    displayName = view?.name ?? binding.source.statId;
    shortLabel = shortLabelFrom(view, displayName);
    currentRating = Math.round(view?.value ?? 0);
    cap = realmCap;
    effectSummary = 'Three Treasures core axis — the spine of cultivation.';
    detail = `${displayName} · core treasure`;
  } else if (binding.source.kind === 'foundation') {
    const view = foundationById.get(binding.source.statId) ?? null;
    displayName = view?.name ?? binding.source.statId;
    shortLabel = shortLabelFrom(view, displayName);
    currentRating = Math.round(view?.value ?? 0);
    cap = realmCap;
    effectSummary = view?.grade ? `Foundation aptitude — ${view.grade}.` : 'Foundation base stat — body and root.';
    detail = `${displayName} · foundation`;
  } else if (binding.source.kind === 'derived') {
    const display = DERIVED_STAT_DISPLAY[binding.source.key];
    displayName = display.label;
    shortLabel = display.label.split(/\s+/)[0] ?? display.label;
    currentRating = Math.round(input.derived[binding.source.key] ?? 0);
    cap = 0;
    effectSummary = `Combat-derived (${display.tone}) — produced by the meridian tiers.`;
    detail = `${displayName} · derived ${display.tone}`;
  } else {
    // Unreachable: boundNode is only called for tier !== null (non-socket) bindings.
    throw new Error(`boundNode called for socket binding ${binding.nodeId}`);
  }

  const capPct = cap > 0 ? Math.min(1, currentRating / cap) : 1;
  const nodeState = tier === 'tier2' ? 'lit' : 'foundation';
  const contributionState = tier === 'tier2' ? 'current_path' : 'foundation';
  const tone: StatusLedgerTone = tier === 'tier2' ? 'gold' : 'jade';
  const value = cap > 0 ? `${currentRating} of ${cap}` : `${currentRating}`;

  return {
    id: binding.nodeId,
    displayName,
    shortLabel,
    label: displayName,
    detail,
    path: binding.branchId,
    branchId: binding.branchId,
    category: TIER_CATEGORY[tier],
    tier: TIER_RANK[tier],
    sourceSystems: ['Three Treasures', 'Meridian Tempering'],
    effectSummary,
    currentRating,
    cap,
    capPct,
    unlockRealmIndex: null,
    unlockRealmLabel: null,
    lockedReason: null,
    unlockState: 'unlocked',
    nodeState,
    contributionState,
    visible: true,
    weakLink: false,
    weakReason: null,
    tone,
    routeAction: null,
    detailRows: [],
    ariaLabel: `${displayName}. ${effectSummary} Value ${value}.`,
  };
}

function socketNode(
  binding: MeridianNodeBinding,
  currentPath: PathId | null,
): StatusObservatoryStatNodeSurface {
  const isHeaven = binding.branchId === 'heaven';
  const futureCurrent = isHeaven && currentPath === 'heaven';
  const displayName = isHeaven ? 'Heaven Aspect' : 'Reserved Socket';
  const effectSummary = isHeaven
    ? 'Heaven-path meridian aspect — reserved, not yet bound in the Three Treasures map.'
    : 'Reserved constellation socket — dormant, not yet bound to a stat.';
  return {
    id: binding.nodeId,
    displayName,
    shortLabel: isHeaven ? '天' : '—',
    label: displayName,
    detail: effectSummary,
    path: binding.branchId,
    branchId: binding.branchId,
    category: 'path',
    tier: null,
    sourceSystems: ['Three Treasures'],
    effectSummary,
    currentRating: 0,
    cap: 0,
    capPct: 0,
    unlockRealmIndex: null,
    unlockRealmLabel: null,
    lockedReason: null,
    unlockState: futureCurrent ? 'future_current_path' : 'future_off_path',
    nodeState: 'future',
    contributionState: futureCurrent ? 'future_current_path' : 'future_off_path',
    visible: true,
    weakLink: false,
    weakReason: null,
    tone: 'muted',
    routeAction: null,
    detailRows: [],
    ariaLabel: `${displayName}. ${effectSummary}`,
  };
}

/**
 * Build the Three-Treasures-bound constellation surface from the meridian model.
 * Render-only: assembles the 28 fixed nodes (20 bound + 8 socket) from the map.
 * Drop-in for StatusStatMeridianConstellation at the W13 cutover.
 */
export function buildMeridianConstellationSurface(
  input: MeridianConstellationInput,
): MeridianConstellationSurface {
  const axisById = new Map(input.axes.map((view) => [view.id, view]));
  const foundationById = new Map(input.foundation.map((view) => [view.id, view]));

  const nodes = MERIDIAN_CONSTELLATION_NODE_MAP.map((binding) =>
    binding.tier === null
      ? socketNode(binding, input.currentPath)
      : boundNode(binding, input, axisById, foundationById),
  );

  const branchCounts = { universal: 0, heaven: 0, earth: 0, martial: 0 };
  for (const binding of MERIDIAN_CONSTELLATION_NODE_MAP) branchCounts[binding.branchId] += 1;

  const boundCount = MERIDIAN_CONSTELLATION_NODE_MAP.filter((entry) => entry.tier !== null).length;
  const firstBound = nodes.find((node) => node.nodeState !== 'future') ?? null;

  return {
    rootTestId: 'status-stat-constellation',
    title: 'Stat Meridian Constellation',
    subtitle: `${boundCount} Named Stats — Three Treasures`,
    currentPath: input.currentPath,
    nodes,
    selectedLensDefaultStatId: firstBound?.id ?? null,
    branchCounts,
    branchPaths: [
      { id: 'universal', title: 'Spine', role: 'Three Treasures axes', expectedCount: 8, actualCount: branchCounts.universal },
      { id: 'heaven', title: 'Heaven', role: 'Not yet bound', expectedCount: 7, actualCount: branchCounts.heaven },
      { id: 'earth', title: 'Earth', role: 'Foundation stats', expectedCount: 6, actualCount: branchCounts.earth },
      { id: 'martial', title: 'Martial', role: 'Combat-derived', expectedCount: 7, actualCount: branchCounts.martial },
    ],
    weakLinks: [],
    bridgeSockets: [],
    legend: [
      { id: 'tier1', label: 'Treasure Axis', detail: 'Tier-1 cultivation core (spine).', nodeState: 'foundation' },
      { id: 'tier0', label: 'Foundation', detail: 'Tier-0 body / root stat.', nodeState: 'foundation' },
      { id: 'tier2', label: 'Combat Derived', detail: 'Tier-2 combat output.', nodeState: 'lit' },
      { id: 'socket', label: 'Unbound socket', detail: 'Not yet bound — not a failure.', nodeState: 'future' },
    ],
    causalThreads: [],
  };
}

export interface MeridianAptitudeChip {
  meridianId: string;
  meridianName: string;
  gradeKey: SpiritRootGrade;
  gradeLabel: string;
  /** Court root-chip grade key (matches courtChips .courtRootChip--<chipClass>). */
  chipClass: SpiritRootGrade;
}

/**
 * D8 — per-meridian aptitude-grade chips for the Spirit Root Astrolabe strip. The
 * astrolabe keeps its 14-element wheel (geometry untouched); these chips surface the
 * rolled root GRADE per meridian alongside it.
 */
export function meridianAstrolabeAptitudeChips(
  meridians: ReadonlyArray<Pick<MeridianView, 'id' | 'name' | 'root'>>,
): MeridianAptitudeChip[] {
  return meridians.map((meridian) => {
    const root = MERIDIAN_ROOTS[meridian.root.key];
    return {
      meridianId: meridian.id,
      meridianName: meridian.name,
      gradeKey: meridian.root.key,
      gradeLabel: root.label,
      chipClass: root.chipClass,
    };
  });
}
