/**
 * F3-ELEM — the typed element vocabulary (D3 · Elements & Affinity).
 *
 * Pure types only: no logic, no data, no imports beyond the live `SpiritRootElement` roster that this
 * module reconciles onto (the §3 anti-fork ruling — the resolver's element id is `lightning`, NOT the
 * D3 lore spelling `thunder`; "Thunder / 雷" survives only as a display label). The catalog/reaction/
 * tuning files populate the record interfaces declared here; the resolver consumes the I/O types.
 */
import type { SpiritRootElement } from '../../types/index.js';

/**
 * The element id — ALIASED onto the one live roster so the type system guarantees the resolver and the
 * rest of the game speak the same 14 elements (§3.3). Never a fresh union; never `thunder`.
 */
export type ElementId = SpiritRootElement;

/** D3 §1: Ring I Five Phases · Ring II Three Storms · Ring III Two Lights · Ring IV Four Profound. */
export type Ring = 1 | 2 | 3 | 4;

/** Resonance edge source: `G` = Wu Xing generation cycle · `K` = thematic kinship (D3 §2.2). */
export type ResonanceSource = 'G' | 'K';

/** Opposition edge source (D3 §3.2): the pentagram, the storm-square, the lone melt cross-edge,
 *  the three mutual duals, and the three cross-ring anti-archetype counters. */
export type OppositionSource = 'pentagram' | 'storm-square' | 'cross-edge' | 'dual' | 'cross-ring';

/** The 21 element states (D3 §4.2): 19 base + the two escalation tiers (petrified, frozen). */
export type ElementStateId =
  | 'burning' | 'rotting' | 'soaked' | 'weighted' | 'petrified' | 'rent'
  | 'chilled' | 'frozen' | 'shocked' | 'sundered'
  | 'exposed' | 'cursed' | 'blinded'
  | 'soulExposed' | 'voided' | 'withering' | 'slowed' | 'hasted' | 'gravityBound' | 'fated'
  | 'catalyzed';

/** D3 §4.2 / Appendix C — a state's behavioural category. */
export type StateCategory = 'dot' | 'control' | 'amplifier' | 'mark' | 'buff';

/** The 33 reactions (D3 §5.3 / Appendix B), id = the live spelling (`superconduct`, etc.). */
export type ReactionId =
  // Cleanse
  | 'purge' | 'disperse'
  // Control
  | 'freeze' | 'entomb' | 'brambleSnare' | 'gravityWell' | 'stasis'
  // Sever / True
  | 'severance' | 'unmake' | 'eclipse' | 'paradox'
  // Shred
  | 'corrode' | 'superconduct' | 'erosion' | 'unmakingTouch'
  // Burst
  | 'thermalShock' | 'overload' | 'steamBurst' | 'detonation'
  // Spread
  | 'wildfire' | 'conduction' | 'miasmaBloom' | 'galeScatter'
  // DoT
  | 'combustion' | 'rot' | 'hemorrhage' | 'witheringReaction' | 'hex'
  // Drain
  | 'siphon' | 'devour'
  // Tempo
  | 'accelerate' | 'slow'
  // Catalyst
  | 'catalyze';

/** The 10 reaction families, in D3 §5.6 priority order (1 = resolves first). */
export type ReactionFamily =
  | 'cleanse' | 'control' | 'sever' | 'shred' | 'burst'
  | 'spread' | 'dot' | 'drain' | 'tempo' | 'catalyst';

/** D3 Appendix F.2 — the 10 family seal silhouettes (shape carrier, never colour). */
export type SealShape = '净' | '封' | '斩' | '裂' | '爆' | '蔓' | '蚀' | '吸' | '速' | '引';

// ─── catalog record interfaces (populated by elementCatalog.ts) ──────────────────────────────────

/** One element in the 14-roster (D3 §1.1, App. A.1/F.1). Identity (`id`) vs lore (`loreName`) are
 *  separate fields — the §3.2 ruling: the machine id is the live `lightning`, the lore label `Thunder`. */
export interface ElementDef {
  readonly id: ElementId;
  readonly displayName: string;     // the in-game name (= loreName today)
  readonly loreName: string;        // D3 lore spelling (lightning → "Thunder")
  readonly glyph: string;           // 漢字, e.g. 雷
  readonly pinyin: string;
  readonly ring: Ring;
  readonly accentToken: string;     // `--element-*` token NAME (string; F3 emits no CSS)
  readonly signatureState: ElementStateId;
}

/** An undirected resonance edge (D3 §2.3, App. A.3). Listed once, `a` before `b` by roster order. */
export interface ResonanceEdge {
  readonly a: ElementId;
  readonly b: ElementId;
  readonly source: ResonanceSource;
}

/** A directed opposition edge `from ▸ to` ("from counters to") (D3 §3.8, App. A.4). */
export interface OppositionEdge {
  readonly from: ElementId;
  readonly to: ElementId;
  readonly source: OppositionSource;
}

/** A state definition (D3 §4.2, App. C). `escalatesTo` names the hard-CC tier (weighted→petrified,
 *  chilled→frozen). `iconShape` is the a11y shape NAME (F3 stores it; the UI draws it). */
export interface StateDef {
  readonly id: ElementStateId;
  readonly label: string;           // English label
  readonly hanzi: string;
  readonly appliedBy: ElementId;
  readonly category: StateCategory;
  readonly escalatesTo: ElementStateId | null;
  readonly iconShape: string;
}

/** A reaction trigger (D3 §5.3): an applied element on a keyed state OR a keyed state-category. */
export interface ReactionTrigger {
  readonly element: ElementId;
  readonly keyedState?: ElementStateId;
  readonly keyedCategory?: StateCategory;
}

/** A reaction definition (D3 §5.3 / Appendix B), in resolution-priority order. */
export interface ReactionDef {
  readonly id: ReactionId;
  readonly hanzi: string;
  readonly label: string;
  readonly family: ReactionFamily;
  readonly familyPriority: number;            // 1..10 (D3 §5.6); data, not magic numbers
  readonly trigger: ReactionTrigger;
  readonly consumesState: boolean;            // does it spend the keyed state?
  /** D3 "at full intensity" / "apex" triggers (entomb, unmake): the keyed state must be at/over the
   *  escalation threshold. The reason basic void-on-voided yields unmakingTouch, not the apex unmake. */
  readonly requiresFullIntensity: boolean;
  readonly effectKind: ReactionEffect['kind'];
  readonly sealShape: SealShape;
  readonly domText: string;                   // a11y text (never colour-only)
  /** continuous passive-delta shreds (Unmaking Touch) have NO ICD (D3 §5.6). */
  readonly hasIcd: boolean;
}

// ─── resolver I/O types (D3 §7.2; packet §6.2/6.3 — the binding contract) ─────────────────────────

/** The element-weight vector — 14 entries, DERIVED from D7/D8/D9/D10, NEVER saved (D3 §2.4, §H). */
export type ElementWeights = Readonly<Record<ElementId, number>>;

/** Context for a resolve (D3 §H, App. E.2). The resolver itself is RNG-free; `seed` is explicit only. */
export interface ResolveCtx {
  readonly realm: number;                       // → realmScalar (D6), supplied by the caller
  readonly environment?: ElementId | null;      // reserved (D3 §I.4); resolver may ignore
  readonly ruleset?: 'pve' | 'pvp';             // PvP uses the SAME resolver (D3 §I.7)
  readonly seed?: number;                        // explicit only; resolver does not roll
}

/** resolveAffinity output — the soft-capped effective affinity + its transient contributors (D3 §6.1). */
export interface AffinityResult {
  readonly element: ElementId;
  readonly effective: number;          // softcap(Σ elementAffinity) — feeds D2's × (1 + Σ)
  readonly resonanceBonus: number;     // the §2 allied-web contribution
  readonly counterDelta: number;       // the §3 matchup affinity-pressure delta (0 if no targetElement)
}

/** A live affliction/imbuement on a target (transient, never saved). */
export interface ElementStateInstance {
  readonly state: ElementStateId;
  readonly category: StateCategory;
  readonly remainingMs: number;        // refresh-not-stack (D3 §4 R2)
  readonly intensity: number;          // bounded (D3 §4 R3)
  readonly accMs?: number;             // D11 3b-i — DoT tick accumulator (residual ms across frames; undefined ⇒ 0)
}

/** The target's transient element state the resolver reads (D3 §7.2). */
export interface TargetElementState {
  readonly resistByElement: ElementWeights;     // raw resist per element (pre-curve)
  readonly soulDefense: number;                 // D2 separate channel (Soul bypass)
  readonly activeStates: readonly ElementStateInstance[];
  readonly icdByPathway: Readonly<Record<string, number>>;   // ms remaining per pathway (D3 §5.6)
}

/** resolveState output — the state to write/refresh (D11 applies it). */
export interface StateDelta {
  readonly stateId: ElementStateId;
  readonly category: StateCategory;
  readonly refreshMs: number;          // refresh-not-stack duration
  readonly intensity: number;          // bounded
  readonly escalatedTo: ElementStateId | null;   // set when intensity crossed the escalation threshold
}

/** The typed reaction effect (D3 §7.2 / packet §6.2) — consumed by D11's existing pipeline. */
export type ReactionEffect =
  | { readonly kind: 'burst'; readonly amount: number; readonly capped: true }
  | { readonly kind: 'control'; readonly stateId: ElementStateId; readonly durationMs: number }
  | { readonly kind: 'shred'; readonly resistDelta: number }
  | { readonly kind: 'dot'; readonly stateId: ElementStateId; readonly tickCoeff: number }
  | { readonly kind: 'spread'; readonly stateId: ElementStateId; readonly radius: number; readonly count: number }
  | { readonly kind: 'drain'; readonly amount: number; readonly interrupt?: boolean }
  | { readonly kind: 'sever'; readonly amount: number; readonly bypassesBody: true; readonly capped: true }
  | { readonly kind: 'cleanse'; readonly categories: readonly StateCategory[] }
  | { readonly kind: 'tempo'; readonly delta: number }
  | { readonly kind: 'catalyst'; readonly amplifyNextPct: number };

/** The discrete-event half of DR-12 — carries the render-data the UI draws without recomputing (D3 §7.2). */
export interface ReactionEvent {
  readonly reaction: ReactionId;
  readonly family: ReactionFamily;
  readonly effect: ReactionEffect;
  readonly sealShape: SealShape;       // UI seal silhouette (shape, NOT colour)
  readonly label: string;              // hanzi, e.g. '魂断'
  readonly domText: string;            // a11y accessibility-tree text (never colour-only)
}

// ─── tuning (D15 injects values; F3 owns shape + safe defaults) ──────────────────────────────────

/** The D15 number-deposit shape (D3 §6.5 / App. D). Every field is `[tune]`; F3 ships balance-inert
 *  defaults in elementTuning.ts. Retuning is a data change here, never a logic change to the resolver. */
export interface ElementTuning {
  readonly resonanceBonusPerEdge: number;       // #1 — focus & cluster both viable; no runaway
  readonly affinitySoftcapKnee: number;         // #8 — knee of the diminishing curve
  readonly affinitySoftcapTailDivisor: number;  // #8 — strength of the diminishing tail (> 0)
  readonly counterAffinityDelta: number;        // #4 — favourable-matchup affinity pressure (bounded)
  readonly offElementBlunt: number;             // #5 — unfavourable-matchup blunting (disadvantaged, not nullified)
  readonly resistHardcap: number;               // #6 — HARDCAP < 1 always (no immunity floor)
  readonly resistHalfSaturation: number;        // #7 — K in the saturating curve
  readonly counterPenetration: number;          // #3 — counter resist-penetration (bounded)
  readonly voidShredDelta: number;              // #11-adjacent — Unmaking Touch continuous resist-shred
  readonly reactionBase: number;                // #10 — shared placeholder per-reaction base
  readonly severCapMultiple: number;            // #11 — true/sever cap (× realmScalar)
  readonly burstCapMultiple: number;            // #12 — burst cap (× realmScalar)
  readonly icdMsByFamily: Readonly<Record<ReactionFamily, number>>; // #13 — per-pathway ICD windows
  readonly catalyzeMultiplier: number;          // #16 — amplifies one reaction; no feedback loop
  readonly stateBaseDurationMs: number;         // #9 — refresh duration
  readonly stateMaxIntensity: number;           // #9 — bounded intensity cap
  readonly stateEscalationThreshold: number;    // #9 — intensity at which weighted→petrified / chilled→frozen
  readonly dotTickCoeff: number;                // #10-adjacent — per-tick DoT damage coeff (× intensity × realmScalar); HELD 0 until D15
  readonly dotTickIntervalMs: number;           // #10-adjacent — DoT tick cadence (the interval-accumulator step); inert while coeff 0
  readonly controlSkipChance: number;           // #control (DR-11c) — P(a hard-CC affliction skips the enemy's turn), 0..1; HELD 0 ⇒ never skips until D15
}
