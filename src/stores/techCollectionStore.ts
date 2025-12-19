import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TechniqueDef } from '../content';

export type ManualGrade = 'mortal' | 'earth' | 'heaven' | 'mystic';
export type TechRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface TechniqueTrait {
  id: string;
  value: number;
}

export interface TechniqueOwnedState {
  unlocked: boolean;
  masteryXp: number;
  rank: number;
  manualGrade: ManualGrade;
  rarity: TechRarity;
  traits: TechniqueTrait[];
  runes: Array<string | null>;
  tier?: string;
  lastCastAt?: number;
}

interface TechCollectionState {
  unlockedTechs: Record<string, TechniqueOwnedState>;
  fragments: Record<string, number>;
  hasTech: (techId: string) => boolean;
  ensureTechState: (techId: string) => TechniqueOwnedState;
  unlockTech: (techId: string, meta?: Partial<TechniqueOwnedState>) => void;
  addFragments: (techId: string, qty: number) => void;
  getFragments: (techId: string) => number;
  addMasteryXp: (techId: string, amount: number, now?: number) => void;
  setManualGrade: (techId: string, grade: ManualGrade) => void;
  setRarityIfHigher: (techId: string, rarity: TechRarity) => void;
  getMasteryLevel: (techId: string) => number;
  getEffectiveRuneSlots: (techId: string) => number;
  getEffectiveTraitSlots: (techId: string) => number;
  hydrate: (data: { unlockedTechs?: Record<string, Partial<TechniqueOwnedState>>; fragments?: Record<string, number> }) => void;
  hardReset: () => void;
}

const XP_SCALE = 3;

const gradeOrder: ManualGrade[] = ['mortal', 'earth', 'heaven', 'mystic'];
const rarityOrder: TechRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export function masteryLevelFromXp(xp: number): number {
  const normalized = Math.max(0, xp);
  const level = 1 + Math.floor(Math.sqrt(normalized / XP_SCALE));
  return Math.min(100, Math.max(1, level));
}

export function masteryMultiplier(level: number): number {
  const clamped = Math.min(100, Math.max(1, level));
  return 1 + 0.003 * clamped;
}

export function masteryMilestones(level: number) {
  return {
    at25: level >= 25,
    at50: level >= 50,
    at75: level >= 75,
    at100: level >= 100,
  };
}

export function normalizeGrade(input?: string): ManualGrade {
  const value = (input ?? '').toLowerCase();
  if (value === 'earth' || value === 'heaven' || value === 'mystic' || value === 'mortal') {
    return value;
  }
  return 'mortal';
}

export function normalizeRarity(input?: string): TechRarity {
  const value = (input ?? '').toLowerCase();
  if (value === 'uncommon' || value === 'rare' || value === 'epic' || value === 'legendary') {
    return value;
  }
  return 'common';
}

export function isHigherGrade(current: ManualGrade, next: ManualGrade): boolean {
  return gradeOrder.indexOf(next) > gradeOrder.indexOf(current);
}

export function isHigherRarity(current: TechRarity, next: TechRarity): boolean {
  return rarityOrder.indexOf(next) > rarityOrder.indexOf(current);
}

export function getManualGradeFromTechnique(technique?: TechniqueDef): ManualGrade {
  return normalizeGrade(technique?.tier);
}

const createDefaultOwnedState = (): TechniqueOwnedState => ({
  unlocked: false,
  masteryXp: 0,
  rank: 1,
  manualGrade: 'mortal',
  rarity: 'common',
  traits: [],
  runes: [],
});

const createInitialState = (): Pick<TechCollectionState, 'unlockedTechs' | 'fragments'> => ({
  unlockedTechs: {},
  fragments: {},
});

function normalizeOwnedState(
  techId: string,
  incoming?: Partial<TechniqueOwnedState> | null,
): TechniqueOwnedState {
  const base = createDefaultOwnedState();
  const merged: TechniqueOwnedState = {
    ...base,
    ...(incoming ?? {}),
  };

  merged.unlocked = Boolean(incoming?.unlocked ?? merged.unlocked);
  merged.masteryXp = Math.max(0, Number(incoming?.masteryXp ?? merged.masteryXp ?? 0));
  merged.rank = Math.max(1, Number(incoming?.rank ?? merged.rank ?? 1));
  merged.manualGrade = normalizeGrade(incoming?.manualGrade);
  merged.rarity = normalizeRarity(incoming?.rarity);
  merged.traits = Array.isArray(incoming?.traits) ? incoming!.traits!.filter(Boolean) : base.traits;
  merged.runes = Array.isArray(incoming?.runes) ? incoming!.runes!.map((rune) => rune ?? null) : base.runes;
  merged.tier = incoming?.tier ?? merged.tier;
  merged.lastCastAt = incoming?.lastCastAt;

  return merged;
}

export const useTechCollectionStore = create<TechCollectionState>()(
  immer((set, get) => ({
    ...createInitialState(),

    hasTech: (techId) => {
      return Boolean(get().unlockedTechs[techId]?.unlocked);
    },

    ensureTechState: (techId) => {
      const existing = get().unlockedTechs[techId];
      if (existing) return existing;

      const normalized = normalizeOwnedState(techId);
      set((state) => {
        state.unlockedTechs[techId] = normalized;
      });
      return normalized;
    },

    unlockTech: (techId, meta) => {
      set((state) => {
        const existing = state.unlockedTechs[techId];
        if (existing?.unlocked) return;
        const normalized = normalizeOwnedState(techId, {
          ...existing,
          ...meta,
          unlocked: true,
        });
        state.unlockedTechs[techId] = normalized;
      });
    },

    addFragments: (techId, qty) => {
      if (!Number.isFinite(qty) || qty <= 0) return;
      set((state) => {
        const current = state.fragments[techId] ?? 0;
        const next = current + qty;
        state.fragments[techId] = next < 0 ? 0 : next;
      });
    },

    getFragments: (techId) => {
      return get().fragments[techId] ?? 0;
    },

    addMasteryXp: (techId, amount, now = Date.now()) => {
      if (!Number.isFinite(amount) || amount <= 0) return;
      set((state) => {
        const entry = state.unlockedTechs[techId];
        if (!entry?.unlocked) return;
        entry.masteryXp += amount;
        entry.lastCastAt = now;
      });
    },

    setManualGrade: (techId, grade) => {
      set((state) => {
        const entry = state.unlockedTechs[techId] ?? normalizeOwnedState(techId);
        if (!isHigherGrade(entry.manualGrade, grade)) {
          state.unlockedTechs[techId] = entry;
          return;
        }
        entry.manualGrade = grade;
        state.unlockedTechs[techId] = entry;
      });
    },

    setRarityIfHigher: (techId, rarity) => {
      set((state) => {
        const entry = state.unlockedTechs[techId] ?? normalizeOwnedState(techId);
        if (!isHigherRarity(entry.rarity, rarity)) {
          state.unlockedTechs[techId] = entry;
          return;
        }
        entry.rarity = rarity;
        state.unlockedTechs[techId] = entry;
      });
    },

    getMasteryLevel: (techId) => {
      const entry = get().unlockedTechs[techId];
      return masteryLevelFromXp(entry?.masteryXp ?? 0);
    },

    getEffectiveRuneSlots: (techId) => {
      const grade = get().unlockedTechs[techId]?.manualGrade ?? 'mortal';
      if (grade === 'earth') return 1;
      if (grade === 'heaven') return 1;
      if (grade === 'mystic') return 2;
      return 0;
    },

    getEffectiveTraitSlots: (techId) => {
      const entry = get().unlockedTechs[techId];
      const rarity = entry?.rarity ?? 'common';
      const grade = entry?.manualGrade ?? 'mortal';

      const raritySlots: Record<TechRarity, number> = {
        common: 0,
        uncommon: 1,
        rare: 1,
        epic: 2,
        legendary: 3,
      };
      const gradeCap: Record<ManualGrade, number> = {
        mortal: 0,
        earth: 1,
        heaven: 2,
        mystic: 3,
      };

      return Math.min(raritySlots[rarity], gradeCap[grade]);
    },

    hydrate: (data) => {
      set((state) => {
        const unlockedTechs: Record<string, TechniqueOwnedState> = {};
        const incoming = data.unlockedTechs ?? {};

        Object.entries(incoming).forEach(([techId, entry]) => {
          unlockedTechs[techId] = normalizeOwnedState(techId, entry);
        });

        state.unlockedTechs = unlockedTechs;
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
