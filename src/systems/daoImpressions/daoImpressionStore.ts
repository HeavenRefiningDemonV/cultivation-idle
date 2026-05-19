import { create } from 'zustand';
import type { DaoImpressionAward } from './types.js';

const DEFAULT_MAX_AWARDS = 20;

interface DaoImpressionState {
  awards: DaoImpressionAward[];
  maxAwards: number;
  recordAward: (award: DaoImpressionAward) => void;
  hasSourceEvent: (sourceEventKey: string) => boolean;
  countAwardsByImpressionId: (impressionId: string) => number;
  latestAwardForImpression: (impressionId: string) => DaoImpressionAward | null;
  latestAwardForSourceKind: (sourceKind: DaoImpressionAward['sourceKind']) => DaoImpressionAward | null;
  clearCurrentLife: () => void;
  hardResetDaoImpressions: () => void;
}

export const useDaoImpressionStore = create<DaoImpressionState>()((set, get) => ({
  awards: [],
  maxAwards: DEFAULT_MAX_AWARDS,
  recordAward: (award) => {
    set((state) => {
      const withoutExisting = state.awards.filter((entry) => entry.awardId !== award.awardId && entry.sourceEventKey !== award.sourceEventKey);
      return {
        awards: [award, ...withoutExisting]
          .sort((left, right) => right.createdAt - left.createdAt)
          .slice(0, state.maxAwards),
      };
    });
  },
  hasSourceEvent: (sourceEventKey) => get().awards.some((award) => award.sourceEventKey === sourceEventKey),
  countAwardsByImpressionId: (impressionId) => get().awards.filter((award) => award.impressionId === impressionId).length,
  latestAwardForImpression: (impressionId) =>
    get()
      .awards.filter((award) => award.impressionId === impressionId)
      .sort((left, right) => right.createdAt - left.createdAt)[0] ?? null,
  latestAwardForSourceKind: (sourceKind) =>
    get()
      .awards.filter((award) => award.sourceKind === sourceKind)
      .sort((left, right) => right.createdAt - left.createdAt)[0] ?? null,
  clearCurrentLife: () => set({ awards: [] }),
  hardResetDaoImpressions: () => set({ awards: [], maxAwards: DEFAULT_MAX_AWARDS }),
}));

export function clearDaoImpressions(): void {
  useDaoImpressionStore.getState().clearCurrentLife();
}

export function hardResetDaoImpressions(): void {
  useDaoImpressionStore.getState().hardResetDaoImpressions();
}

export function captureDaoImpressionAwards(limit = 20): DaoImpressionAward[] {
  return useDaoImpressionStore.getState().awards.slice(0, Math.max(0, Math.floor(limit)));
}

export function captureMemoryEligibleDaoImpressions(limit = 5): DaoImpressionAward[] {
  return captureDaoImpressionAwards().filter((award) => award.memoryEligible).slice(0, Math.max(0, Math.floor(limit)));
}
