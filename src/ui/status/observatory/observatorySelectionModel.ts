import type {
  StatusCausalThreadSurface,
  StatusSelectedContextSurface,
} from '../../../systems/ui/status/statusObservatoryTypes.js';

/**
 * The four instrument families a selection or a thread endpoint can belong to.
 * Mirrors StatusCausalThreadSurface['fromFamily' | 'toFamily'] for the
 * observatory instruments (the no-loss ledger families never appear as a
 * selectable kind, so they are intentionally excluded here).
 */
export type ObservatorySelectionFamily =
  | 'statConstellation'
  | 'meridianVessel'
  | 'rootLawInstrument'
  | 'bottleneckCanopy';

/** A user (or default) selection: which selectable kind, and its id. */
export type ObservatorySelection = {
  kind: StatusSelectedContextSurface['kind'];
  id: string;
} | null;

/**
 * Fixed map from a selectable `kind` to the instrument family its ids live in.
 * `work` has no causal threads, so it maps to null (selecting a work spoke
 * highlights nothing cross-instrument — correct, not a gap).
 */
export const OBSERVATORY_FAMILY_OF_KIND: Record<
  StatusSelectedContextSurface['kind'],
  ObservatorySelectionFamily | null
> = {
  stat: 'statConstellation',
  organ: 'meridianVessel',
  rootLaw: 'rootLawInstrument',
  talisman: 'bottleneckCanopy',
  work: null,
};

/** The ONE canonical key function. Endpoints, relatedKeys, and every
 *  instrument membership test must agree by using only these. */
export function observatorySelectionKey(family: ObservatorySelectionFamily, id: string): string {
  return `${family}:${id}`;
}

export function observatoryThreadKey(threadId: string): string {
  return `thread:${threadId}`;
}

/** Resolve the family for a selection, or null (e.g. for `work`). */
export function observatoryFamilyForSelection(
  selection: ObservatorySelection,
): ObservatorySelectionFamily | null {
  if (!selection) return null;
  return OBSERVATORY_FAMILY_OF_KIND[selection.kind];
}

/**
 * Derive the set of related keys for a selection, given the FULL thread union
 * (pass `bottleneckCanopy.causalThreads`, which already merges vessel cause
 * threads + stat weak-link threads). Pure + deterministic — same inputs always
 * yield the same set; no Math.random, no Date, no React, no DOM.
 *
 * A thread is "related" when EITHER:
 *   - the selection sits exactly on one of its endpoints
 *     (familyOfSelection === thread.fromFamily && selection.id === thread.fromId), or the to-side; OR
 *   - the bottleneck-anchor convention: the selection is in the canopy family
 *     AND the thread converges on the canopy. (Every thread converges on the
 *     central edict, so selecting the canopy bottleneck relates ALL its causes —
 *     mechanically true: "the bottleneck is caused by all of these".)
 *
 * For each related thread we add BOTH endpoint keys + the thread key, so any
 * instrument can ask `relatedKeys.has(observatorySelectionKey(myFamily, myId))`
 * and the thread layer can ask `relatedKeys.has(observatoryThreadKey(t.id))`.
 */
export function deriveObservatoryRelatedKeys(
  selection: ObservatorySelection,
  threads: readonly StatusCausalThreadSurface[],
): ReadonlySet<string> {
  const related = new Set<string>();
  const selFamily = observatoryFamilyForSelection(selection);
  if (!selection || !selFamily) return related;
  const selKey = observatorySelectionKey(selFamily, selection.id);
  for (const thread of threads) {
    // thread.fromFamily / toFamily are wider unions than ObservatorySelectionFamily
    // (they can also be no-loss ledger families); the cast is safe because we only
    // ever COMPARE the produced keys, never trust the family beyond string identity.
    const fromKey = observatorySelectionKey(thread.fromFamily as ObservatorySelectionFamily, thread.fromId);
    const toKey = observatorySelectionKey(thread.toFamily as ObservatorySelectionFamily, thread.toId);
    const exact = fromKey === selKey || toKey === selKey;
    const bottleneckAnchor =
      selFamily === 'bottleneckCanopy' && thread.toFamily === 'bottleneckCanopy';
    if (exact || bottleneckAnchor) {
      related.add(fromKey);
      related.add(toKey);
      related.add(observatoryThreadKey(thread.id));
    }
  }
  return related;
}
