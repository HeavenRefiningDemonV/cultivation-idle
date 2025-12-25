import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ManualGrade, TechRarity } from './techCollectionStore';
import type { SaveManualSatchelEntry, SaveManualSatchelState } from '../types';

export type ManualSatchelEntry = SaveManualSatchelEntry;

interface ManualSatchelStoreState extends SaveManualSatchelState {
  addManual: (args: {
    manualId: string;
    techId: string;
    grade: ManualGrade;
    rarity: TechRarity;
    qty?: number;
    acquiredAtMs?: number;
  }) => { key: string; qty: number };
  removeManual: (key: string, qty?: number) => { ok: boolean; qty: number };
  getQty: (key: string) => number;
  listEntries: () => ManualSatchelEntry[];
  hydrate: (slice?: Partial<SaveManualSatchelState>) => void;
  clear: () => void;
}

const allowedGrades: ManualGrade[] = ['mortal', 'earth', 'heaven', 'mystic'];
const allowedRarities: TechRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

function normalizeGrade(input: string): ManualGrade {
  if (allowedGrades.includes(input as ManualGrade)) {
    return input as ManualGrade;
  }
  return 'mortal';
}

function normalizeRarity(input: string): TechRarity {
  if (allowedRarities.includes(input as TechRarity)) {
    return input as TechRarity;
  }
  return 'common';
}

export function buildManualSatchelKey(techId: string, grade: ManualGrade, rarity: TechRarity): string {
  return `${techId}:${grade}:${rarity}`;
}

function sanitizeEntry(entry: Partial<SaveManualSatchelEntry>): SaveManualSatchelEntry | null {
  if (!entry || typeof entry.manualId !== 'string' || typeof entry.techId !== 'string') return null;
  const grade = normalizeGrade(String(entry.grade ?? ''));
  const rarity = normalizeRarity(String(entry.rarity ?? ''));
  const qty = Math.max(0, Math.floor(entry.qty ?? 0));
  if (qty <= 0) return null;
  const key = buildManualSatchelKey(entry.techId, grade, rarity);
  const first = typeof entry.acquiredAtFirstMs === 'number' ? entry.acquiredAtFirstMs : Date.now();
  const last = typeof entry.acquiredAtLastMs === 'number' ? entry.acquiredAtLastMs : first;
  return {
    key,
    manualId: entry.manualId,
    techId: entry.techId,
    grade,
    rarity,
    qty,
    acquiredAtFirstMs: first,
    acquiredAtLastMs: last,
  };
}

export const useManualSatchelStore = create<ManualSatchelStoreState>()(
  immer((set, get) => ({
    entries: {},

    addManual: ({ manualId, techId, grade, rarity, qty = 1, acquiredAtMs = Date.now() }) => {
      if (!manualId || !techId) return { key: '', qty: 0 };
      const normalizedGrade = normalizeGrade(grade);
      const normalizedRarity = normalizeRarity(rarity);
      const sanitizedQty = Math.max(1, Math.floor(qty));
      const key = buildManualSatchelKey(techId, normalizedGrade, normalizedRarity);
      set((state) => {
        const existing = state.entries[key];
        if (existing) {
          existing.qty += sanitizedQty;
          existing.acquiredAtLastMs = acquiredAtMs;
        } else {
          state.entries[key] = {
            key,
            manualId,
            techId,
            grade: normalizedGrade,
            rarity: normalizedRarity,
            qty: sanitizedQty,
            acquiredAtFirstMs: acquiredAtMs,
            acquiredAtLastMs: acquiredAtMs,
          };
        }
      });
      return { key, qty: get().entries[key]?.qty ?? sanitizedQty };
    },

    removeManual: (key: string, qty = 1) => {
      const sanitizedQty = Math.max(1, Math.floor(qty));
      let remaining = 0;
      set((state) => {
        const existing = state.entries[key];
        if (!existing) return;
        existing.qty = Math.max(0, existing.qty - sanitizedQty);
        if (existing.qty <= 0) {
          delete state.entries[key];
          remaining = 0;
        } else {
          remaining = existing.qty;
        }
      });
      return { ok: sanitizedQty > 0, qty: remaining };
    },

    getQty: (key: string) => get().entries[key]?.qty ?? 0,

    listEntries: () => Object.values(get().entries).sort((a, b) => b.acquiredAtLastMs - a.acquiredAtLastMs),

    hydrate: (slice) => {
      if (!slice || typeof slice !== 'object' || !slice.entries || typeof slice.entries !== 'object') return;
      const next: Record<string, ManualSatchelEntry> = {};
      Object.entries(slice.entries).forEach(([key, entry]) => {
        const sanitized = sanitizeEntry(entry as Partial<SaveManualSatchelEntry>);
        if (!sanitized) return;
        next[key] = sanitized;
      });
      set({ entries: next });
    },

    clear: () => set({ entries: {} }),
  })),
);
