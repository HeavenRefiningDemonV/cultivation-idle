import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { GameEvents } from '../services/events/GameEvents';
import { useContentStore } from './contentStore';
import {
  type ManualGrade,
  type TechRarity,
  getManualGradeFromTechnique,
  normalizeGrade,
  normalizeRarity,
  useTechCollectionStore,
} from './techCollectionStore';
import { useUIStore } from './uiStore';
import { useGameStore } from './gameStore';
import type { CultivationPath } from '../types';

export type FocusRewardType = 'time' | 'mastery' | 'traitQuality';

export interface ManualInstance {
  id: string;
  pavilionId?: string | null;
  cityId?: string | null;
  techId: string;
  grade: ManualGrade;
  rarity: TechRarity;
  acquiredAt: number;
}

export interface ActiveStudy {
  studyId: string;
  manual: ManualInstance;
  startedAt: number;
  endsAt: number;
  focusUsed: boolean;
  focusReward?: FocusRewardType;
  focusAppliedAt?: number;
  completionHandled?: boolean;
}

export interface ManualSatchelState {
  manuals: ManualInstance[];
  activeStudy: ActiveStudy | null;
  lastLearned?: { techId: string; grade: ManualGrade; rarity: TechRarity; focusReward?: FocusRewardType; learnedAt: number } | null;
}

interface ManualSatchelStoreState extends ManualSatchelState {
  addManual: (
    manual: Omit<ManualInstance, 'id' | 'acquiredAt'> & Partial<Pick<ManualInstance, 'id' | 'acquiredAt'>>,
  ) => ManualInstance;
  dismantleManual: (instanceId: string) => { ok: boolean; fragmentsGained?: number; techId?: string; reason?: string };
  startStudy: (instanceId: string, now?: number) => { ok: boolean; reason?: string };
  applyFocusReward: (now?: number) => { ok: boolean; reward?: FocusRewardType; reason?: string };
  tick: (now?: number) => void;
  unlockRandomTechnique: (options?: UnlockRandomTechniqueOptions) => string | null;
  hydrate: (slice?: Partial<ManualSatchelState>) => void;
  toSaveState: () => ManualSatchelState;
  hardReset: () => void;
  getManualCount: (techId: string, grade: ManualGrade, rarity: TechRarity) => number;
}

export type UnlockRandomTechniqueOptions = {
  maxTier?: number;
  allowCrossPath?: boolean;
  includePrestigeLocked?: boolean;
};

const STUDY_DURATION_MS: Record<ManualGrade, number> = {
  mortal: 30_000,
  earth: 60_000,
  heaven: 120_000,
  mystic: 300_000,
};

const DEFAULT_RARITY_FRAGMENT_VALUES: Record<TechRarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 4,
  epic: 8,
  legendary: 16,
};

const DEFAULT_GRADE_FRAGMENT_MULTIPLIER: Record<ManualGrade, number> = {
  mortal: 1,
  earth: 2,
  heaven: 4,
  mystic: 8,
};

const GRADE_TIER_ORDER: ManualGrade[] = ['mortal', 'earth', 'heaven', 'mystic'];

function generateManualId(): string {
  return `man_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function sanitizeManual(manual: Partial<ManualInstance>): ManualInstance | null {
  if (!manual || typeof manual.techId !== 'string') return null;
  const id = typeof manual.id === 'string' ? manual.id : generateManualId();
  const grade = normalizeGrade(manual.grade);
  const rarity = normalizeRarity(manual.rarity);
  const acquiredAt = typeof manual.acquiredAt === 'number' ? manual.acquiredAt : Date.now();
  return {
    id,
    pavilionId: manual.pavilionId ?? null,
    cityId: manual.cityId ?? null,
    techId: manual.techId,
    grade,
    rarity,
    acquiredAt,
  };
}

function sanitizeActiveStudy(study: Partial<ActiveStudy> | null | undefined): ActiveStudy | null {
  if (!study || !study.manual) return null;
  const manual = sanitizeManual(study.manual);
  if (!manual) return null;
  const startedAt = typeof study.startedAt === 'number' ? study.startedAt : Date.now();
  const endsAt = typeof study.endsAt === 'number' ? study.endsAt : startedAt;
  return {
    studyId: typeof study.studyId === 'string' ? study.studyId : `study_${manual.id}`,
    manual,
    startedAt,
    endsAt,
    focusUsed: Boolean(study.focusUsed),
    focusReward: study.focusReward,
    focusAppliedAt: typeof study.focusAppliedAt === 'number' ? study.focusAppliedAt : undefined,
    completionHandled: Boolean(study.completionHandled),
  };
}

function getFragmentConfig() {
  const economy = useContentStore.getState().raw as any;
  const manualSystem = economy?.economy?.manualSystem;
  const rarityFragmentValue: Partial<Record<TechRarity, number>> = manualSystem?.rarityFragmentValue ?? {};
  const gradeFragmentMultiplier: Partial<Record<ManualGrade, number>> = manualSystem?.gradeFragmentMultiplier ?? {};
  return { rarityFragmentValue, gradeFragmentMultiplier };
}

function isTechniquePathAllowed(
  techniquePath: CultivationPath,
  selectedPath: CultivationPath | null,
  allowCrossPath: boolean,
) {
  if (allowCrossPath || !selectedPath) return true;
  return techniquePath === selectedPath;
}

function isTechniqueTierAllowed(grade: ManualGrade, maxTier: number) {
  const tierIndex = GRADE_TIER_ORDER.indexOf(grade);
  if (tierIndex < 0) return false;
  return tierIndex + 1 <= maxTier;
}

function computeFragments(grade: ManualGrade, rarity: TechRarity): number {
  const config = getFragmentConfig();
  const rarityValue = Number(config.rarityFragmentValue[rarity] ?? DEFAULT_RARITY_FRAGMENT_VALUES[rarity] ?? 0);
  const gradeMultiplier = Number(
    config.gradeFragmentMultiplier[grade] ?? DEFAULT_GRADE_FRAGMENT_MULTIPLIER[grade] ?? 1,
  );
  return Math.max(0, Math.floor(rarityValue * gradeMultiplier));
}

function ensureMasteryAtLeast(techId: string, level: number) {
  const collection = useTechCollectionStore.getState();
  collection.ensureMasteryLevelAtLeast(techId, level);
}

export const useManualSatchelStore = create<ManualSatchelStoreState>()(
  immer((set, get) => ({
    manuals: [],
    activeStudy: null,
    lastLearned: null,

    addManual: (manual) => {
      const sanitized = sanitizeManual(manual);
      if (!sanitized) return manual as ManualInstance;
      set((state) => {
        state.manuals.push(sanitized);
      });
      GameEvents.emit({
        type: 'manuals/purchased',
        payload: { manualId: sanitized.techId, techniqueId: sanitized.techId, quantity: 1 },
      });
      return sanitized;
    },

    dismantleManual: (instanceId) => {
      const currentState = get();
      if (currentState.activeStudy?.manual.id === instanceId) {
        return { ok: false, reason: 'manual_in_use' };
      }
      let removed: ManualInstance | null = null;
      set((state) => {
        const index = state.manuals.findIndex((manual) => manual.id === instanceId);
        if (index === -1) return;
        removed = state.manuals.splice(index, 1)[0];
      });
      if (!removed) return { ok: false, reason: 'manual_not_found' };
      const manual = removed as ManualInstance;
      const fragmentsGained = computeFragments(manual.grade, manual.rarity);
      if (fragmentsGained > 0) {
        useTechCollectionStore.getState().addFragments(manual.techId, fragmentsGained);
      }
      GameEvents.emit({ type: 'rewards/granted', payload: { type: 'techniqueFragments', techId: manual.techId } as any });
      return { ok: true, fragmentsGained, techId: manual.techId };
    },

    startStudy: (instanceId, now = Date.now()) => {
      const currentState = get();
      if (currentState.activeStudy) return { ok: false, reason: 'Already studying a manual.' };
      let manual: ManualInstance | null = null;
      set((draft) => {
        const index = draft.manuals.findIndex((entry) => entry.id === instanceId);
        if (index === -1) return;
        manual = draft.manuals.splice(index, 1)[0];
        const durationMs = manual ? STUDY_DURATION_MS[manual.grade] ?? STUDY_DURATION_MS.mortal : 0;
        draft.activeStudy = manual
          ? {
              studyId: `study_${manual.id}`,
              manual,
              startedAt: now,
              endsAt: now + durationMs,
              focusUsed: false,
            }
          : draft.activeStudy;
      });
      if (!manual) return { ok: false, reason: 'Manual not found.' };
      const manualInstance = manual as ManualInstance;
      GameEvents.emit({ type: 'manuals/focus_prompt', payload: { manualId: manualInstance.techId } });
      GameEvents.emit({ type: 'manuals/studied', payload: { manualId: manualInstance.techId, progress: 0 } });
      return { ok: true };
    },

    applyFocusReward: (now = Date.now()) => {
      const active = get().activeStudy;
      if (!active) {
        GameEvents.emit({ type: 'manuals/focus_failed', payload: { reason: 'No active study.' } });
        return { ok: false, reason: 'No active study.' };
      }
      if (active.focusUsed) {
        GameEvents.emit({ type: 'manuals/focus_failed', payload: { manualId: active.manual.techId, reason: 'Focus already applied.' } });
        return { ok: false, reason: 'Focus already applied.' };
      }
      const rewards: FocusRewardType[] = ['time', 'mastery', 'traitQuality'];
      const roll = rewards[Math.floor(Math.random() * rewards.length)];
      set((state) => {
        const study = state.activeStudy;
        if (!study) return;
        study.focusUsed = true;
        study.focusReward = roll;
        study.focusAppliedAt = now;
        if (roll === 'time') {
          const remaining = Math.max(0, study.endsAt - now);
          study.endsAt = now + remaining * 0.9;
        }
      });
      GameEvents.emit({ type: 'manuals/focus_applied', payload: { manualId: active.manual.techId, reward: roll } });
      GameEvents.emit({ type: 'manuals/studied', payload: { manualId: active.manual.techId, progress: 0.5 } });
      return { ok: true, reward: roll };
    },

    tick: (now = Date.now()) => {
      const active = get().activeStudy;
      if (!active || active.completionHandled) return;
      if (now < active.endsAt) return;
      set((state) => {
        if (!state.activeStudy) return;
        state.activeStudy.completionHandled = true;
      });
      const collection = useTechCollectionStore.getState();
      const ui = useUIStore.getState();
      const { manual, focusReward } = active;
      const hasTech = collection.hasTech(manual.techId);

      if (hasTech) {
        const fragmentsGained = computeFragments(manual.grade, manual.rarity);
        if (fragmentsGained > 0) {
          collection.addFragments(manual.techId, fragmentsGained);
        }
        set((state) => {
          state.activeStudy = null;
          state.lastLearned = null;
        });
        ui.addNotification('info', `Manual converted to fragments for ${manual.techId}`);
        GameEvents.emit({ type: 'manuals/studied', payload: { manualId: manual.techId, progress: 1 } });
        return;
      }

      collection.unlockTech(manual.techId, { unlocked: true, manualGrade: manual.grade, rarity: manual.rarity });
      collection.setManualGrade(manual.techId, manual.grade);
      collection.setRarityIfHigher(manual.techId, manual.rarity);

      if (focusReward === 'mastery') {
        ensureMasteryAtLeast(manual.techId, 10);
      }
      if (focusReward === 'traitQuality') {
        collection.applyTraitQualityBoost(manual.techId, 0.05);
      }

      const learnedPayload = {
        techId: manual.techId,
        grade: manual.grade,
        rarity: manual.rarity,
        focusReward,
        learnedAt: now,
      } as const;

      set((state) => {
        state.activeStudy = null;
        state.lastLearned = learnedPayload;
      });
      ui.openTechniqueLearned(learnedPayload);
      GameEvents.emit({ type: 'manuals/studied', payload: { manualId: manual.techId, progress: 1 } });
    },

    unlockRandomTechnique: (options) => {
      const {
        maxTier = 2,
        allowCrossPath = false,
        includePrestigeLocked = false,
      } = options ?? {};
      const content = useContentStore.getState();
      if (!content.isLoaded) return null;
      if (get().activeStudy) return null;

      const selectedPath = useGameStore.getState().selectedPath;
      const techCollection = useTechCollectionStore.getState();
      const techniques = Object.values(content.maps.techniquesById ?? {}).filter(Boolean);
      const unlockable = techniques.filter((technique) => {
        const tech = technique!;
        if (techCollection.hasTech(tech.id)) return false;
        if (!isTechniquePathAllowed(tech.path, selectedPath, allowCrossPath)) return false;
        const grade = getManualGradeFromTechnique(tech);
        if (!isTechniqueTierAllowed(grade, maxTier)) return false;
        if (!includePrestigeLocked && Array.isArray(tech.tags)) {
          if (tech.tags.includes('prestige_locked') || tech.tags.includes('hidden')) return false;
        }
        return true;
      });

      if (unlockable.length === 0) return null;
      const chosen = unlockable[Math.floor(Math.random() * unlockable.length)];
      if (!chosen) return null;
      const manualGrade = getManualGradeFromTechnique(chosen);
      const manualRarity = normalizeRarity(chosen.rarity);
      const manualInstance = sanitizeManual({
        techId: chosen.id,
        grade: manualGrade,
        rarity: manualRarity,
      });
      if (!manualInstance) return null;

      set((state) => {
        state.manuals.push(manualInstance);
      });

      const startResult = get().startStudy(manualInstance.id);
      if (!startResult.ok) {
        set((state) => {
          state.manuals = state.manuals.filter((manual) => manual.id !== manualInstance.id);
        });
        return null;
      }

      const activeStudy = get().activeStudy;
      if (!activeStudy) return null;
      const completionTime = activeStudy.endsAt ?? Date.now();
      get().tick(completionTime);

      if (!techCollection.hasTech(chosen.id)) return null;
      return chosen.id;
    },

    hydrate: (slice) => {
      if (!slice || typeof slice !== 'object') return;
      const manuals: ManualInstance[] = Array.isArray(slice.manuals)
        ? slice.manuals
            .map((entry) => sanitizeManual(entry))
            .filter(Boolean)
            .map((entry) => entry!)
        : [];
      const activeStudy = sanitizeActiveStudy(slice.activeStudy);
      const lastLearned = slice.lastLearned ?? null;
      set({ manuals, activeStudy, lastLearned });
    },

    toSaveState: () => {
      const state = get();
      return {
        manuals: state.manuals.map((manual) => ({ ...manual })),
        activeStudy: state.activeStudy ? { ...state.activeStudy, manual: { ...state.activeStudy.manual } } : null,
        lastLearned: state.lastLearned ? { ...state.lastLearned } : null,
      };
    },

    hardReset: () => set({ manuals: [], activeStudy: null, lastLearned: null }),

    getManualCount: (techId, grade, rarity) => {
      return get().manuals.filter((manual) => manual.techId === techId && manual.grade === grade && manual.rarity === rarity)
        .length;
    },
  })),
);
