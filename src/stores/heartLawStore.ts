import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { HeartLawDef } from '../content';
import { GameEvents } from '../services/events/GameEvents';
import type { BreathMode } from '../types';
import { useContentStore } from './contentStore';
import { useUIStore } from './uiStore';

export type ComprehensionSource = 'meditation' | 'outskirtsBoss' | 'trialClear' | 'ruinsClear';

interface HeartLawState {
  selectedHeartLawId: string | null;
  chapter: number;
  comprehension: number;
  unlockedHeartLawIds: string[];
  breathMode: BreathMode;
  studyTechniqueId: string | null;
  lastInsightAt: number | null;
  selectHeartLaw: (id: string) => void;
  addComprehension: (amount: number, source: ComprehensionSource) => void;
  tryAdvanceChapter: () => void;
  isUnlocked: (id: string) => boolean;
  setUnlocked: (ids: string[]) => void;
  unlock: (id: string) => void;
  setBreathMode: (mode: BreathMode) => void;
  setStudyTechniqueId: (techniqueId: string | null) => void;
  markInsight: (timestampMs?: number) => void;
  resetForNewLife: () => void;
}

const DEFAULT_REQUIREMENTS: Record<number, number> = {
  1: 100,
  2: 250,
  3: 500,
  4: 1000,
};

function getStarterHeartLawIds(defs: HeartLawDef[]): string[] {
  const starters = defs.filter((law) => law.tier === 'starter' || law.isStarter);
  if (starters.length > 0) return starters.map((law) => law.id);
  return defs.slice(0, 3).map((law) => law.id);
}

function getChapterRequirement(currentChapter: number): number {
  return DEFAULT_REQUIREMENTS[currentChapter] ?? 0;
}

export const useHeartLawStore = create<HeartLawState>()(
  immer((set, get) => ({
    selectedHeartLawId: null,
    chapter: 1,
    comprehension: 0,
    unlockedHeartLawIds: [],
    breathMode: 'balanced',
    studyTechniqueId: null,
    lastInsightAt: null,

    selectHeartLaw: (id) => {
      if (!get().isUnlocked(id)) return;
      if (get().selectedHeartLawId === id) return;
      useUIStore.getState().setLifeStartWizardContext(id);
      set((state) => {
        state.selectedHeartLawId = id;
        state.chapter = 1;
        state.comprehension = 0;
        state.studyTechniqueId = null;
        state.lastInsightAt = null;
      });
      GameEvents.emit({ type: 'heartlaw/selected', payload: { heartLawId: id } });
    },

    addComprehension: (amount) => {
      if (!Number.isFinite(amount) || amount <= 0) return;
      set((state) => {
        state.comprehension += amount;
      });
      get().tryAdvanceChapter();
    },

    tryAdvanceChapter: () => {
      const { selectedHeartLawId } = get();
      if (!selectedHeartLawId) return;

      let advancedTo: number | null = null;
      set((state) => {
        while (state.chapter < 5) {
          const requirement = getChapterRequirement(state.chapter);
          if (requirement <= 0 || state.comprehension < requirement) break;
          state.comprehension -= requirement;
          state.chapter += 1;
          advancedTo = state.chapter;
        }
      });
      if (advancedTo) {
        console.log(`[HeartLaw] advanced to chapter ${advancedTo}`);
      }
    },

    isUnlocked: (id) => {
      const content = useContentStore.getState();
      const laws = content.raw?.heart_laws ?? [];
      const starters = getStarterHeartLawIds(laws);
      if (starters.includes(id)) return true;
      return get().unlockedHeartLawIds.includes(id);
    },

    setUnlocked: (ids) => {
      const unique = Array.from(new Set(ids));
      set((state) => {
        state.unlockedHeartLawIds = unique;
      });
    },

    unlock: (id) => {
      set((state) => {
        if (!state.unlockedHeartLawIds.includes(id)) {
          state.unlockedHeartLawIds.push(id);
        }
      });
    },

    setBreathMode: (mode) => {
      set((state) => {
        state.breathMode = mode;
      });
    },

    setStudyTechniqueId: (techniqueId) => {
      set((state) => {
        state.studyTechniqueId = techniqueId;
      });
    },

    markInsight: (timestampMs) => {
      const at = typeof timestampMs === 'number' ? timestampMs : Date.now();
      set((state) => {
        state.lastInsightAt = at;
      });
    },

    resetForNewLife: () => {
      const lastSelected = get().selectedHeartLawId;
      set((state) => {
        state.selectedHeartLawId = null;
        state.chapter = 1;
        state.comprehension = 0;
        state.breathMode = 'balanced';
        state.studyTechniqueId = null;
        state.lastInsightAt = null;
      });
      if (lastSelected) {
        useUIStore.getState().setLifeStartWizardContext(lastSelected);
      }
      GameEvents.emit({ type: 'heartlaw/selected', payload: { heartLawId: null } });
    },
  })),
);

export function getDefaultUnlockedHeartLawIds(): string[] {
  const content = useContentStore.getState();
  const laws = content.raw?.heart_laws ?? [];
  return getStarterHeartLawIds(laws);
}

export function getSelectedHeartLawDef(): HeartLawDef | null {
  const selectedId = useHeartLawStore.getState().selectedHeartLawId;
  if (!selectedId) return null;
  const content = useContentStore.getState();
  return content.maps.heartLawsById[selectedId] ?? null;
}

export function getAvailableHeartLaws(): { unlocked: HeartLawDef[]; locked: HeartLawDef[] } {
  const content = useContentStore.getState();
  if (!content.isLoaded || !content.raw?.heart_laws) {
    return { unlocked: [], locked: [] };
  }
  const laws = content.listHeartLaws();
  const store = useHeartLawStore.getState();
  const unlocked: HeartLawDef[] = [];
  const locked: HeartLawDef[] = [];
  laws.forEach((law) => {
    if (store.isUnlocked(law.id)) {
      unlocked.push(law);
    } else {
      locked.push(law);
    }
  });
  return { unlocked, locked };
}
