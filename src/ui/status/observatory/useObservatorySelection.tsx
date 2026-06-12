import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  StatusCausalThreadSurface,
  StatusSelectedContextSurface,
} from '../../../systems/ui/status/statusObservatoryTypes.js';
import {
  deriveObservatoryRelatedKeys,
  observatoryFamilyForSelection,
  observatorySelectionKey,
  type ObservatorySelection,
  type ObservatorySelectionFamily,
} from './observatorySelectionModel.js';

export interface ObservatorySelectionApi {
  /** The current shared selection (user click/focus, or seeded default). */
  selection: ObservatorySelection;
  /** Push a selection (called by an instrument on click/focus). Display-only. */
  select(kind: StatusSelectedContextSurface['kind'], id: string): void;
  /** Clear to the seeded default (used on Escape / deselect). */
  clear(): void;
  /** Keys related to the current selection (endpoints + thread keys). */
  relatedKeys: ReadonlySet<string>;
  /** Convenience membership test for an instrument's own node. */
  isRelated(family: ObservatorySelectionFamily, id: string): boolean;
  /** True when (family,id) is the active shared selection itself. */
  isSelected(family: ObservatorySelectionFamily, id: string): boolean;
}

const ObservatorySelectionContext = createContext<ObservatorySelectionApi | null>(null);

export interface ObservatorySelectionProviderProps {
  /** Surface-computed priority default; seeds the selection before any click. */
  defaultSelection: StatusSelectedContextSurface | null;
  /** The FULL thread union — pass surface.bottleneckCanopy.causalThreads. */
  threads: readonly StatusCausalThreadSurface[];
  children: ReactNode;
}

export function ObservatorySelectionProvider({
  defaultSelection,
  threads,
  children,
}: ObservatorySelectionProviderProps) {
  const seeded = useMemo<ObservatorySelection>(
    () => (defaultSelection ? { kind: defaultSelection.kind, id: defaultSelection.id } : null),
    [defaultSelection],
  );
  // `userSelection === null` => follow the seeded default (so a fixture/state
  // switch re-seeds correctly). A click sets an explicit user selection.
  const [userSelection, setUserSelection] = useState<ObservatorySelection>(null);
  const selection = userSelection ?? seeded;

  // If the surface changes such that the user's chosen id no longer exists in
  // any thread endpoint AND isn't the seed, fall back to the seed. Cheap guard;
  // keeps selection valid across store updates without recomputing gameplay.
  useEffect(() => {
    setUserSelection((current) => {
      if (!current) return null;
      const family = observatoryFamilyForSelection(current);
      if (!family) return null;
      const key = observatorySelectionKey(family, current.id);
      const stillPresent = threads.some(
        (t) =>
          observatorySelectionKey(t.fromFamily as ObservatorySelectionFamily, t.fromId) === key ||
          observatorySelectionKey(t.toFamily as ObservatorySelectionFamily, t.toId) === key,
      );
      // Keep canopy/organ/rootLaw selections even if no thread names them (they
      // are valid instrument selections; the bottleneck-anchor convention still
      // lights threads). Only drop a stat that vanished from the union.
      return current.kind === 'stat' && !stillPresent ? null : current;
    });
  }, [threads]);

  const select = useCallback((kind: StatusSelectedContextSurface['kind'], id: string) => {
    setUserSelection({ kind, id });
  }, []);
  const clear = useCallback(() => setUserSelection(null), []);

  const relatedKeys = useMemo(
    () => deriveObservatoryRelatedKeys(selection, threads),
    [selection, threads],
  );

  const api = useMemo<ObservatorySelectionApi>(
    () => ({
      selection,
      select,
      clear,
      relatedKeys,
      isRelated: (family, id) => relatedKeys.has(observatorySelectionKey(family, id)),
      isSelected: (family, id) =>
        !!selection &&
        observatoryFamilyForSelection(selection) === family &&
        selection.id === id,
    }),
    [selection, select, clear, relatedKeys],
  );

  return (
    <ObservatorySelectionContext.Provider value={api}>
      {children}
    </ObservatorySelectionContext.Provider>
  );
}

/**
 * Read the shared selection. Returns a safe no-op API when no provider is
 * present (e.g. an instrument rendered standalone in a unit test), so every
 * instrument keeps working without the provider — this IS the defensive
 * fallback the packet requires.
 */
export function useObservatorySelection(): ObservatorySelectionApi {
  const ctx = useContext(ObservatorySelectionContext);
  if (ctx) return ctx;
  return NO_OP_SELECTION;
}

const EMPTY_KEYS: ReadonlySet<string> = new Set();
const NO_OP_SELECTION: ObservatorySelectionApi = {
  selection: null,
  select: () => {},
  clear: () => {},
  relatedKeys: EMPTY_KEYS,
  isRelated: () => false,
  isSelected: () => false,
};
