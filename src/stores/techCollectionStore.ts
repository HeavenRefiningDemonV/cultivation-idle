import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface TechniqueOwnedState {
  unlocked: boolean;
  masteryXp: number;
  rank: number;
  rarity?: string;
  tier?: string;
}

interface TechCollectionState {
  unlockedTechs: Record<string, TechniqueOwnedState>;
  fragments: Record<string, number>;
  hasTech: (techId: string) => boolean;
  unlockTech: (techId: string, meta?: Partial<TechniqueOwnedState>) => void;
  addFragments: (techId: string, qty: number) => void;
  getFragments: (techId: string) => number;
  hydrate: (data: { unlockedTechs?: Record<string, TechniqueOwnedState>; fragments?: Record<string, number> }) => void;
  hardReset: () => void;
}

const createInitialState = (): Pick<TechCollectionState, 'unlockedTechs' | 'fragments'> => ({
  unlockedTechs: {},
  fragments: {},
});

export const useTechCollectionStore = create<TechCollectionState>()(
  immer((set, get) => ({
    ...createInitialState(),

    hasTech: (techId: string) => {
      const owned = get().unlockedTechs[techId];
      return Boolean(owned?.unlocked);
    },

    unlockTech: (techId: string, meta?: Partial<TechniqueOwnedState>) => {
      set((state) => {
        if (state.unlockedTechs[techId]?.unlocked) return;
        state.unlockedTechs[techId] = {
          unlocked: true,
          masteryXp: 0,
          rank: 1,
          ...meta,
        };
      });
    },

    addFragments: (techId: string, qty: number) => {
      if (!Number.isFinite(qty) || qty <= 0) return;
      set((state) => {
        const current = state.fragments[techId] ?? 0;
        const next = current + qty;
        state.fragments[techId] = next < 0 ? 0 : next;
      });
    },

    getFragments: (techId: string) => {
      return get().fragments[techId] ?? 0;
    },

    hydrate: (data) => {
      set((state) => {
        state.unlockedTechs = { ...(data.unlockedTechs ?? {}) };
        state.fragments = { ...(data.fragments ?? {}) };
      });
    },

    hardReset: () => {
      set((state) => {
        const base = createInitialState();
        state.unlockedTechs = base.unlockedTechs;
        state.fragments = base.fragments;
      });
    },
  })),
);
