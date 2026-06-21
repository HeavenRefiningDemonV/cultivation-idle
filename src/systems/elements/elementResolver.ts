/**
 * F3-ELEM — the four pure resolver functions (D3 §6 / §7.2). The SINGLE place affinity / resist /
 * reaction / state are computed (RK-15). PURE: same inputs → same outputs; no side effects; no
 * mutation of any argument; no module-level mutable state; no randomness; and — by construction —
 * it imports nothing from the stores, the persistence layer, the stat engine, or any view. It COMPUTES;
 * D11 APPLIES. Every magnitude is read from the injected `ElementTuning` data, never hard-coded.
 */
import {
  ELEMENT_BY_ID,
  ELEMENT_INDEX,
  ELEMENT_ROSTER,
  OPPOSITION_EDGES,
  RESONANCE_EDGES,
  STATE_BY_ID,
} from './elementCatalog.js';
import { REACTION_CATALOG, REACTION_INDEX } from './reactionCatalog.js';
import type {
  AffinityResult,
  ElementId,
  ElementTuning,
  ElementWeights,
  ReactionDef,
  ReactionEffect,
  ReactionEvent,
  ResolveCtx,
  StateCategory,
  StateDelta,
  TargetElementState,
} from './elementTypes.js';

// ─── pure derivations from the frozen catalog (computed once; no mutable state) ──────────────────

/** Allied (resonance) neighbours per element. */
const RESONANCE_NEIGHBORS: Readonly<Record<ElementId, readonly ElementId[]>> = (() => {
  const map: Record<string, ElementId[]> = {};
  for (const e of ELEMENT_ROSTER) map[e.id] = [];
  for (const edge of RESONANCE_EDGES) { map[edge.a].push(edge.b); map[edge.b].push(edge.a); }
  for (const id of Object.keys(map)) Object.freeze(map[id]); // deep-freeze the inner arrays too
  return Object.freeze(map) as Readonly<Record<ElementId, readonly ElementId[]>>;
})();

/** Directed counter set: `${from}>${to}` ⇔ "from counters to". */
const COUNTER_SET: ReadonlySet<string> = new Set(OPPOSITION_EDGES.map((o) => `${o.from}>${o.to}`));
const counters = (from: ElementId, to: ElementId): boolean => COUNTER_SET.has(`${from}>${to}`);

/** The control-result state each control reaction writes (the escalation/lock it produces). */
const CONTROL_RESULT_STATE: Readonly<Record<string, string>> = Object.freeze({
  freeze: 'frozen', entomb: 'petrified', brambleSnare: 'slowed',
  gravityWell: 'gravityBound', stasis: 'slowed', paradox: 'slowed',
});
/** The categories each cleanse reaction strips (Eclipse strips everything). */
const CLEANSE_CATEGORIES: Readonly<Record<string, readonly StateCategory[]>> = Object.freeze({
  purge: ['dot'], disperse: ['mark'], eclipse: ['amplifier', 'mark', 'buff'],
});

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
const realmScalar = (ctx: ResolveCtx): number => Math.max(1, ctx.realm);

// ─── 1 · AFFINITY (the offensive multiplier, D3 §6.1) ────────────────────────────────────────────
/**
 * The soft-capped effective affinity for `element`, INCLUDING the resonance bonus (§2) and, when a
 * `targetElement` is given, the counter affinity-pressure delta (§3). Pure; feeds D2's × (1 + Σ).
 */
export function resolveAffinity(
  weights: ElementWeights,
  element: ElementId,
  ctx: ResolveCtx,
  tuning: ElementTuning,
  targetElement?: ElementId,
): AffinityResult {
  const base = weights[element] ?? 0;

  // resonance bonus: the more allied elements this build co-expresses, the larger the bonus (D3 §2.1).
  let coExpressed = 0;
  for (const n of RESONANCE_NEIGHBORS[element]) coExpressed += Math.max(0, weights[n] ?? 0);
  const resonanceBonus = tuning.resonanceBonusPerEdge * coExpressed;

  // counter delta: favourable matchup presses affinity; unfavourable matchup is blunted (never nullified).
  let counterDelta = 0;
  if (targetElement) {
    if (counters(element, targetElement)) counterDelta = tuning.counterAffinityDelta;
    else if (counters(targetElement, element)) counterDelta = -tuning.offElementBlunt;
  }

  const raw = base + resonanceBonus + counterDelta;
  // soft-cap: ≈linear below the knee, strongly diminishing above it (D3 §6.3). Monotonic; never an asymptote.
  const k = tuning.affinitySoftcapKnee;
  const effective = raw <= k ? raw : k + (raw - k) / tuning.affinitySoftcapTailDivisor;

  return { element, effective, resonanceBonus, counterDelta };
}

// ─── 2 · RESIST (the defensive reduction, D3 §6.2) ───────────────────────────────────────────────
/**
 * The hard-capped resist FRACTION the target has vs `incoming`, after any counter penetration. Returns
 * a value in [0, HARDCAP] — HARDCAP < 1 always, so NOTHING is ever fully resisted (the no-immunity floor).
 */
export function resolveResist(
  weights: ElementWeights,
  incoming: ElementId,
  ctx: ResolveCtx,
  tuning: ElementTuning,
  attackerElement?: ElementId,
): number {
  // counter penetration enters as a NEGATIVE delta to raw resist (it makes the gap), bounded so effective
  // resist can't be driven absurdly negative — clamped at 0 before the saturating curve.
  const penetration = attackerElement && counters(attackerElement, incoming) ? tuning.counterPenetration : 0;
  const raw = Math.max(0, (weights[incoming] ?? 0) - penetration);
  // Defend the load-bearing no-immunity floor (DR-3d) in CODE, not just by convention: HARDCAP is forced
  // strictly below 1 and K strictly positive, so the result is always in [0, 1) — nothing is ever fully
  // resisted — even were D15 to deposit an out-of-range value.
  const hardcap = Math.min(Math.max(0, tuning.resistHardcap), 0.99);
  const k = Math.max(tuning.resistHalfSaturation, 1e-6);
  const fraction = hardcap * (raw / (raw + k)); // saturating; ∈ [0, HARDCAP)
  return clamp(fraction, 0, hardcap);
}

// ─── 3 · REACTION (the combo core, D3 §5) ────────────────────────────────────────────────────────
/**
 * The single highest-priority eligible reaction for `appliedElement` on the target's current states,
 * or null. DETERMINISTIC: sorts by family priority, then the applied element's ring, then its roster
 * index, then catalog order — never RNG. Respects per-pathway ICD (continuous shreds have none). PURE:
 * computes the event; does NOT apply it.
 */
export function resolveReaction(
  appliedElement: ElementId,
  target: TargetElementState,
  ctx: ResolveCtx,
  tuning: ElementTuning,
): ReactionEvent | null {
  const eligible = REACTION_CATALOG.filter((r) => isEligible(r, appliedElement, target, tuning));
  if (eligible.length === 0) return null;

  const ring = ELEMENT_BY_ID[appliedElement].ring;
  const idx = ELEMENT_INDEX[appliedElement];
  const winner = eligible.reduce((best, r) => (rank(r, ring, idx) < rank(best, ring, idx) ? r : best));

  return {
    reaction: winner.id,
    family: winner.family,
    effect: buildEffect(winner, ctx, tuning),
    sealShape: winner.sealShape,
    label: winner.hanzi,
    domText: winner.domText,
  };
}

function isEligible(r: ReactionDef, appliedElement: ElementId, target: TargetElementState, tuning: ElementTuning): boolean {
  if (r.trigger.element !== appliedElement) return false;
  // the keyed state / category must be present on the target (at full intensity if the trigger demands it)
  const match = target.activeStates.find((s) =>
    (r.trigger.keyedState !== undefined && s.state === r.trigger.keyedState) ||
    (r.trigger.keyedCategory !== undefined && s.category === r.trigger.keyedCategory));
  if (!match) return false;
  if (r.requiresFullIntensity && match.intensity < tuning.stateEscalationThreshold) return false;
  // ICD gate (continuous passive-delta shreds — Unmaking Touch — have no ICD).
  if (r.hasIcd && (target.icdByPathway[r.id] ?? 0) > 0) return false;
  return true;
}

/** A sortable rank: family priority dominates; ties by applied ring, then applied index, then catalog order. */
function rank(r: ReactionDef, ring: number, idx: number): number {
  return ((r.familyPriority * 10 + ring) * 100 + idx) * 100 + REACTION_INDEX[r.id];
}

function buildEffect(r: ReactionDef, ctx: ResolveCtx, tuning: ElementTuning): ReactionEffect {
  const scaled = tuning.reactionBase * realmScalar(ctx);
  switch (r.effectKind) {
    case 'burst':
      return { kind: 'burst', amount: scaled * tuning.burstCapMultiple, capped: true };
    case 'sever':
      return { kind: 'sever', amount: scaled * tuning.severCapMultiple, bypassesBody: true, capped: true };
    case 'shred':
      return { kind: 'shred', resistDelta: r.id === 'unmakingTouch' ? tuning.voidShredDelta : tuning.counterPenetration };
    case 'control': {
      const stateId = (CONTROL_RESULT_STATE[r.id] ?? r.trigger.keyedState ?? 'slowed') as StateDelta['stateId'];
      return { kind: 'control', stateId, durationMs: tuning.stateBaseDurationMs };
    }
    case 'dot':
      return { kind: 'dot', stateId: r.trigger.keyedState ?? 'burning', tickCoeff: scaled };
    case 'spread':
      return { kind: 'spread', stateId: r.trigger.keyedState ?? 'burning', radius: 1, count: 1 };
    case 'drain':
      return { kind: 'drain', amount: scaled, interrupt: r.id === 'devour' };
    case 'cleanse':
      return { kind: 'cleanse', categories: CLEANSE_CATEGORIES[r.id] ?? ['dot'] };
    case 'tempo':
      return { kind: 'tempo', delta: r.id === 'slow' ? -scaled : scaled };
    case 'catalyst':
      return { kind: 'catalyst', amplifyNextPct: (tuning.catalyzeMultiplier - 1) * 100 };
  }
}

// ─── 4 · STATE (the affliction vocabulary, D3 §4) ────────────────────────────────────────────────
/**
 * The state an applied element writes/refreshes, under refresh-not-stack (R2) + bounded intensity (R3).
 * Returns a delta D11 applies; the resolver never mutates the target. Escalation (weighted→petrified,
 * chilled→frozen) is reported via `escalatedTo` once intensity crosses the threshold.
 */
export function resolveState(
  appliedElement: ElementId,
  target: TargetElementState,
  ctx: ResolveCtx,
  tuning: ElementTuning,
): StateDelta | null {
  const stateId = ELEMENT_BY_ID[appliedElement].signatureState;
  const def = STATE_BY_ID[stateId];
  if (!def) return null;

  const existing = target.activeStates.find((s) => s.state === stateId);
  const intensity = Math.min((existing?.intensity ?? 0) + 1, tuning.stateMaxIntensity);
  const escalatedTo = def.escalatesTo && intensity >= tuning.stateEscalationThreshold ? def.escalatesTo : null;

  return {
    stateId,
    category: def.category,
    refreshMs: tuning.stateBaseDurationMs, // refresh-not-stack: duration is reset, not summed
    intensity,
    escalatedTo,
  };
}
