import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { HeartLawDef } from '../content/index.js';
import { useContentStore } from './contentStore';
import { GameEvents } from '../services/events/GameEvents';
import type { ComprehensionSource, InsightChoiceId, InsightMomentState } from '../types/index.js';
import {
  INSIGHT_BURSTS,
  INSIGHT_INTERVAL_RANGE_MS,
  VERSE_COMPREHENSION_THRESHOLD,
  getBreathModeMultipliers,
} from '../content/tuning/cultivationTuning';
import type { BreathMode } from '../types/index.js';
import { useUIStore } from './uiStore';
import { D } from '../utils/numbers';

interface CultivationState {
  selectedHeartLawId: string | null;
  chapter: number;
  comprehension: number;
  unlockedHeartLawIds: string[];
  breathMode: BreathMode;
  studyEnabled: boolean;
  studyTechniqueId: string | null;
  lastInsightAt: number | null;
  nextInsightAt: number | null;
  insight: InsightMomentState | null;
  stability: number;
  stabilityCap: number;
  selectHeartLaw: (id: string) => void;
  addComprehension: (amount: number, source: ComprehensionSource) => void;
  tryAdvanceChapter: () => void;
  isUnlocked: (id: string) => boolean;
  setUnlocked: (ids: string[]) => void;
  unlock: (id: string) => void;
  setBreathMode: (mode: BreathMode) => void;
  setStudyEnabled: (enabled: boolean) => void;
  setStudyTechniqueId: (techniqueId: string | null) => void;
  markInsight: (timestampMs?: number) => void;
  getComprehensionRequirementForNextChapter: () => number;
  scheduleNextInsight: (now: number) => void;
  resolveInsight: (choiceId?: InsightChoiceId | 'auto') => void;
  resetForNewLife: () => void;
}

function getStarterHeartLawIds(defs: HeartLawDef[]): string[] {
  const starters = defs.filter((law) => law.tier === 'starter' || law.isStarter);
  if (starters.length > 0) return starters.map((law) => law.id);
  return defs.slice(0, 3).map((law) => law.id);
}

function getChapterRequirement(currentChapter: number): number {
  if (currentChapter >= 5) return 0;
  return VERSE_COMPREHENSION_THRESHOLD;
}

function clampStability(value: number, cap: number) {
  if (value < 0) return 0;
  if (value > cap) return cap;
  return value;
}

function pickNextInsightTime(now: number) {
  const span = INSIGHT_INTERVAL_RANGE_MS.max - INSIGHT_INTERVAL_RANGE_MS.min;
  const offset = Math.random() * span + INSIGHT_INTERVAL_RANGE_MS.min;
  return now + offset;
}

export const useCultivationStore = create<CultivationState>()(
  immer((set, get) => ({
    selectedHeartLawId: null,
    chapter: 1,
    comprehension: 0,
    unlockedHeartLawIds: [],
    breathMode: 'balanced',
    studyEnabled: false,
    studyTechniqueId: null,
    lastInsightAt: null,
    nextInsightAt: null,
    insight: null,
    stability: 0,
    stabilityCap: 100,

    selectHeartLaw: (id) => {
      if (!get().isUnlocked(id)) return;
      if (get().selectedHeartLawId === id) return;
      useUIStore.getState().setLifeStartWizardContext(id);
      set((state) => {
        state.selectedHeartLawId = id;
        state.chapter = 1;
        state.comprehension = 0;
        state.studyTechniqueId = null;
        state.studyEnabled = false;
        state.lastInsightAt = null;
        state.nextInsightAt = null;
        state.insight = null;
        state.stability = 0;
      });
      GameEvents.emit({ type: 'heartlaw/selected', payload: { heartLawId: id } });
    },

    addComprehension: (amount) => {
      if (!Number.isFinite(amount) || amount <= 0) return;
      if (!get().selectedHeartLawId) return;
      set((state) => {
        state.comprehension += amount;
      });
      get().tryAdvanceChapter();
    },

    tryAdvanceChapter: () => {
      const { selectedHeartLawId } = get();
      if (!selectedHeartLawId) return;

      set((state) => {
        while (state.chapter < 5 && state.comprehension >= getChapterRequirement(state.chapter)) {
          state.comprehension -= getChapterRequirement(state.chapter);
          state.chapter += 1;
        }
        if (state.chapter >= 5) {
          state.comprehension = Math.min(state.comprehension, getChapterRequirement(state.chapter));
        }
      });
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

    setStudyEnabled: (enabled) => {
      set((state) => {
        state.studyEnabled = enabled;
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

    getComprehensionRequirementForNextChapter: () => {
      const chapter = get().chapter;
      if (chapter >= 5) return 0;
      return getChapterRequirement(chapter);
    },

    scheduleNextInsight: (now) => {
      set((state) => {
        const reference = typeof now === 'number' ? now : Date.now();
        state.nextInsightAt = pickNextInsightTime(reference);
      });
    },

    resolveInsight: (choiceId) => {
      const state = get();
      if (!state.insight) return;
      const chosenId = choiceId === 'auto' || !choiceId ? state.insight.defaultChoiceId : choiceId;
      const now = Date.now();
      set((draft) => {
        draft.insight = null;
        draft.lastInsightAt = now;
        draft.nextInsightAt = pickNextInsightTime(now);
      });

      switch (chosenId) {
        case 'contemplate':
          get().addComprehension(INSIGHT_BURSTS.comprehension, 'meditation');
          break;
        case 'drawQi': {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { useGameStore } = require('./gameStore') as typeof import('./gameStore');
          const qiPerSecond = D(useGameStore.getState().qiPerSecond ?? '0');
          const qiBonus = qiPerSecond.times(INSIGHT_BURSTS.qiSecondsWorth);
          if (qiBonus.greaterThan(0)) {
            useGameStore.setState((s: any) => {
              const currentQi = D((s as any).qi ?? '0');
              return {
                qi: currentQi.plus(qiBonus).toString(),
                lastActiveTime: now,
                lastTickTime: now,
              };
            });
          }
          break;
        }
        case 'stabilize':
        default:
          set((draft) => {
            draft.stability = clampStability(
              draft.stability + INSIGHT_BURSTS.stability,
              draft.stabilityCap,
            );
          });
          break;
      }
    },

    resetForNewLife: () => {
      const lastSelected = get().selectedHeartLawId;
      set((state) => {
        state.selectedHeartLawId = null;
        state.chapter = 1;
        state.comprehension = 0;
        state.breathMode = 'balanced';
        state.studyTechniqueId = null;
        state.studyEnabled = false;
        state.lastInsightAt = null;
        state.nextInsightAt = null;
        state.insight = null;
        state.stability = 0;
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
  const selectedId = useCultivationStore.getState().selectedHeartLawId;
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
  const store = useCultivationStore.getState();
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

export function getBreathModeLabel(mode: BreathMode) {
  const m = getBreathModeMultipliers(mode);
  return `${mode} (Qi ${m.qiRateMult}x, Insight ${m.comprehensionMult}x)`;
}
