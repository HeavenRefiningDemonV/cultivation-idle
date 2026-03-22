import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { HeartLawDef } from '../content/index.js';
import { useContentStore } from './contentStore.js';
import { GameEvents } from '../services/events/GameEvents.js';
import type { ComprehensionSource, InsightChoiceId, InsightMomentState } from '../types/index.js';
import {
  INSIGHT_BURSTS,
  INSIGHT_DURATION_MS,
  INSIGHT_INTERVAL_RANGE_MS,
  VERSE_COMPREHENSION_THRESHOLD,
  getBreathModeMultipliers,
} from '../content/tuning/cultivationTuning.js';
import type { BreathMode } from '../types/index.js';
import { useUIStore } from './uiStore.js';
import { D } from '../utils/numbers.js';
import { getConsumableSpec } from '../systems/consumables/consumableCatalog.js';
import {
  buildCultivationConsumableReadModel,
  filterActiveCultivationConsumables,
  mergeCultivationConsumableModifiers,
} from '../systems/consumables/cultivationConsumableEffects.js';
import type {
  ActiveCultivationConsumable,
  CultivationConsumableModifiers,
  CultivationConsumableReadModel,
} from '../systems/consumables/cultivationConsumableTypes.js';

interface UseCultivationConsumableResult {
  ok: boolean;
  reason: string;
  message: string;
}

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
  activeCultivationConsumables: ActiveCultivationConsumable[];
  insightProgressMs: number;
  insightTargetMs: number | null;
  selectHeartLaw: (id: string) => void;
  addComprehension: (amount: number, source: ComprehensionSource) => void;
  addStability: (amount: number) => void;
  tryAdvanceChapter: () => void;
  isUnlocked: (id: string) => boolean;
  setUnlocked: (ids: string[]) => void;
  unlock: (id: string) => void;
  setBreathMode: (mode: BreathMode) => void;
  setStudyEnabled: (enabled: boolean) => void;
  setStudyTechniqueId: (techniqueId: string | null) => void;
  markInsight: (timestampMs?: number) => void;
  getComprehensionRequirementForNextChapter: () => number;
  ensureInsightCycle: (now: number) => void;
  scheduleNextInsight: (now: number) => void;
  advanceInsightTimer: (deltaMs: number, now: number, frequencyMultiplier?: number) => boolean;
  resolveInsight: (choiceId?: InsightChoiceId | 'auto') => void;
  useCultivationConsumable: (itemId: string, now?: number) => UseCultivationConsumableResult;
  getActiveCultivationConsumables: (now?: number) => ActiveCultivationConsumable[];
  clearExpiredCultivationConsumables: (now?: number) => void;
  getCultivationConsumableModifiers: (now?: number) => CultivationConsumableModifiers;
  getCultivationConsumableReadModel: (now?: number) => CultivationConsumableReadModel;
  consumeMajorBreakthroughBonus: (now?: number) => number;
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

function pickInsightTargetMs() {
  const span = INSIGHT_INTERVAL_RANGE_MS.max - INSIGHT_INTERVAL_RANGE_MS.min;
  return Math.random() * span + INSIGHT_INTERVAL_RANGE_MS.min;
}

function deriveNextInsightAt(now: number, progressMs: number, targetMs: number | null, frequencyMultiplier = 1) {
  if (!targetMs || frequencyMultiplier <= 0) return null;
  const remaining = Math.max(0, targetMs - progressMs);
  return now + remaining / frequencyMultiplier;
}

const baseState = {
  selectedHeartLawId: null,
  chapter: 1,
  comprehension: 0,
  unlockedHeartLawIds: [],
  breathMode: 'balanced' as BreathMode,
  studyEnabled: false,
  studyTechniqueId: null,
  lastInsightAt: null as number | null,
  nextInsightAt: null as number | null,
  insight: null as InsightMomentState | null,
  stability: 0,
  stabilityCap: 100,
  activeCultivationConsumables: [] as ActiveCultivationConsumable[],
  insightProgressMs: 0,
  insightTargetMs: null as number | null,
};

export const useCultivationStore = create<CultivationState>()(
  immer((set, get) => ({
    ...baseState,

    selectHeartLaw: (id) => {
      if (!get().isUnlocked(id)) return;
      if (get().selectedHeartLawId === id) return;
      useUIStore.getState().setLifeStartWizardContext(id);
      set((state) => {
        Object.assign(state, baseState);
        state.selectedHeartLawId = id;
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

    addStability: (amount) => {
      if (!Number.isFinite(amount) || amount <= 0) return;
      set((state) => {
        state.stability = clampStability(state.stability + amount, state.stabilityCap);
      });
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
    setUnlocked: (ids) => set((state) => { state.unlockedHeartLawIds = Array.from(new Set(ids)); }),
    unlock: (id) => set((state) => { if (!state.unlockedHeartLawIds.includes(id)) state.unlockedHeartLawIds.push(id); }),
    setBreathMode: (mode) => set((state) => { state.breathMode = mode; }),
    setStudyEnabled: (enabled) => set((state) => { state.studyEnabled = enabled; }),
    setStudyTechniqueId: (techniqueId) => set((state) => { state.studyTechniqueId = techniqueId; }),
    markInsight: (timestampMs) => set((state) => { state.lastInsightAt = typeof timestampMs === 'number' ? timestampMs : Date.now(); }),
    getComprehensionRequirementForNextChapter: () => {
      const chapter = get().chapter;
      if (chapter >= 5) return 0;
      return getChapterRequirement(chapter);
    },
    ensureInsightCycle: (now) => {
      set((state) => {
        if (!state.selectedHeartLawId) return;
        if (state.insightTargetMs === null || state.insightTargetMs <= 0) {
          state.insightTargetMs = pickInsightTargetMs();
          state.insightProgressMs = 0;
        }
        const frequency = get().getCultivationConsumableModifiers(now).insightFrequencyMult;
        state.nextInsightAt = deriveNextInsightAt(now, state.insightProgressMs, state.insightTargetMs, frequency);
      });
    },
    scheduleNextInsight: (now) => {
      set((state) => {
        const reference = typeof now === 'number' ? now : Date.now();
        state.insightTargetMs = pickInsightTargetMs();
        state.insightProgressMs = 0;
        const frequency = get().getCultivationConsumableModifiers(reference).insightFrequencyMult;
        state.nextInsightAt = deriveNextInsightAt(reference, 0, state.insightTargetMs, frequency);
      });
    },
    advanceInsightTimer: (deltaMs, now, frequencyMultiplier = 1) => {
      if (deltaMs <= 0 || !get().selectedHeartLawId) return false;
      let opened = false;
      set((state) => {
        if (state.insight) return;
        if (state.insightTargetMs === null || state.insightTargetMs <= 0) {
          state.insightTargetMs = pickInsightTargetMs();
          state.insightProgressMs = 0;
        }
        state.insightProgressMs += deltaMs * Math.max(0, frequencyMultiplier);
        if (state.insightTargetMs !== null && state.insightProgressMs >= state.insightTargetMs) {
          opened = true;
          state.insight = {
            pending: true,
            startedAt: now,
            expiresAt: now + INSIGHT_DURATION_MS,
            defaultChoiceId: 'contemplate',
            choices: [
              { id: 'contemplate', title: 'Contemplate', description: 'Focus inward for a burst of insight.' },
              { id: 'stabilize', title: 'Stabilize', description: 'Calm your breath to steady your foundation.' },
              { id: 'drawQi', title: 'Draw Qi', description: 'Absorb ambient qi for a quick boost.' },
            ],
          };
          state.lastInsightAt = now;
          state.insightProgressMs = 0;
          state.insightTargetMs = pickInsightTargetMs();
          state.nextInsightAt = null;
        } else {
          state.nextInsightAt = deriveNextInsightAt(now, state.insightProgressMs, state.insightTargetMs, frequencyMultiplier);
        }
      });
      return opened;
    },

    resolveInsight: (choiceId) => {
      const state = get();
      if (!state.insight) return;
      const chosenId = choiceId === 'auto' || !choiceId ? state.insight.defaultChoiceId : choiceId;
      const now = Date.now();
      set((draft) => {
        draft.insight = null;
        draft.lastInsightAt = now;
        draft.insightProgressMs = 0;
        draft.insightTargetMs = pickInsightTargetMs();
        const frequency = get().getCultivationConsumableModifiers(now).insightFrequencyMult;
        draft.nextInsightAt = deriveNextInsightAt(now, 0, draft.insightTargetMs, frequency);
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
              return { qi: currentQi.plus(qiBonus).toString(), lastActiveTime: now, lastTickTime: now };
            });
          }
          break;
        }
        case 'stabilize':
        default: {
          const breath = getBreathModeMultipliers(get().breathMode);
          const modifiers = get().getCultivationConsumableModifiers(now);
          get().addStability(INSIGHT_BURSTS.stability * breath.stabilityMult * modifiers.stabilityGainMult);
          break;
        }
      }
    },

    useCultivationConsumable: (itemId, now = Date.now()) => {
      const spec = getConsumableSpec(itemId);
      if (!spec || spec.domain !== 'cultivation' || spec.effect.kind !== 'cultivationBuff' || !spec.family) {
        return { ok: false, reason: 'not_cultivation_consumable', message: 'That item cannot be used for cultivation.' };
      }
      const effect = spec.effect;
      const family = spec.family;

      set((state) => {
        state.activeCultivationConsumables = state.activeCultivationConsumables.filter(
          (entry) => entry.expiresAt > now && entry.family !== family,
        );
        state.activeCultivationConsumables.push({
          itemId,
          family,
          activatedAt: now,
          expiresAt: now + effect.durationSec * 1000,
          modifiers: { ...effect.modifiers },
          consumedOnMajorBreakthrough: false,
        });
      });

      get().clearExpiredCultivationConsumables(now);
      get().ensureInsightCycle(now);
      return {
        ok: true,
        reason: 'ok',
        message: spec.longLabel ?? `Used ${spec.shortLabel}.`,
      };
    },

    getActiveCultivationConsumables: (now = Date.now()) => filterActiveCultivationConsumables(get().activeCultivationConsumables, now),
    clearExpiredCultivationConsumables: (now = Date.now()) => {
      set((state) => {
        state.activeCultivationConsumables = filterActiveCultivationConsumables(state.activeCultivationConsumables, now);
        const frequency = mergeCultivationConsumableModifiers(state.activeCultivationConsumables, now).insightFrequencyMult;
        state.nextInsightAt = deriveNextInsightAt(now, state.insightProgressMs, state.insightTargetMs, frequency);
      });
    },
    getCultivationConsumableModifiers: (now = Date.now()) => mergeCultivationConsumableModifiers(get().activeCultivationConsumables, now),
    getCultivationConsumableReadModel: (now = Date.now()) => buildCultivationConsumableReadModel(get().activeCultivationConsumables, now),
    consumeMajorBreakthroughBonus: (now = Date.now()) => {
      let granted = 0;
      set((state) => {
        const target = state.activeCultivationConsumables.find(
          (entry) => entry.family === 'breakthrough' && entry.expiresAt > now && !entry.consumedOnMajorBreakthrough,
        );
        if (!target) return;
        target.consumedOnMajorBreakthrough = true;
        granted = target.modifiers.majorBreakthroughStabilityBonus;
      });
      return granted;
    },
    resetForNewLife: () => {
      const lastSelected = get().selectedHeartLawId;
      set((state) => { Object.assign(state, baseState); });
      if (lastSelected) useUIStore.getState().setLifeStartWizardContext(lastSelected);
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
  return useContentStore.getState().maps.heartLawsById[selectedId] ?? null;
}

export function getAvailableHeartLaws(): { unlocked: HeartLawDef[]; locked: HeartLawDef[] } {
  const content = useContentStore.getState();
  if (!content.isLoaded || !content.raw?.heart_laws) return { unlocked: [], locked: [] };
  const laws = content.listHeartLaws();
  const store = useCultivationStore.getState();
  const unlocked: HeartLawDef[] = [];
  const locked: HeartLawDef[] = [];
  laws.forEach((law) => { if (store.isUnlocked(law.id)) unlocked.push(law); else locked.push(law); });
  return { unlocked, locked };
}

export function getBreathModeLabel(mode: BreathMode) {
  const m = getBreathModeMultipliers(mode);
  return `${mode} (Qi ${m.qiRateMult}x, Insight ${m.comprehensionMult}x)`;
}
