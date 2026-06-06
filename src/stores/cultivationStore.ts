import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { DaoHeartActivityId, HeartLawDef } from '../content/index.js';
import { useContentStore } from './contentStore.js';
import { GameEvents } from '../services/events/GameEvents.js';
import type {
  BreakthroughFailureSummary,
  ComprehensionSource,
  DaoHeartOfflineSummary,
  InsightChoiceId,
  InsightMomentState,
} from '../types/index.js';
import type { BreakthroughRiskSnapshot } from '../content/types.js';
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
  getNextCultivationConsumableExpiryAt,
  mergeCultivationConsumableModifiers,
} from '../systems/consumables/cultivationConsumableEffects.js';
import type {
  ActiveCultivationConsumable,
  CultivationConsumableModifiers,
  CultivationConsumableReadModel,
} from '../systems/consumables/cultivationConsumableTypes.js';
import {
  DEFAULT_CULTIVATION_CONSUMABLE_MODIFIERS,
} from '../systems/consumables/cultivationConsumableTypes.js';
import { PERF_LABELS, incrementCounter, time } from '../services/performance/index.js';
import { bumpVersion } from './versionCounters.js';
import { COMBAT_ACTIVITY_TYPES, type ForegroundActivityType } from '../types/activity.js';
import { useActivityStore } from './activityStore.js';
import {
  applyDaoHeartProgressNumbers,
  isDaoHeartActivityId,
  isDaoHeartPracticeOfflineAllowed,
  resolveHeartLawPracticeTick,
  type DaoHeartPracticeFailureReason,
} from '../systems/daoHeart/daoHeartProgressionResolver.js';
import { resolveHeartLawLevelPreview } from '../systems/daoHeart/heartLawLevelResolver.js';
import {
  getSpiritRootPairKey,
  resolveRootHeartFit,
} from '../systems/spiritRoots/index.js';
import type { RootHeartFitResult } from '../systems/spiritRoots/rootHeartFitResolver.js';
import { usePrestigeStore } from './prestigeStore.js';
import {
  applyScriptureEchoToHeartLawState,
  resolveScriptureEchoXpMultiplier,
} from '../systems/prestige/prestigeMemory.js';
import {
  buildHeartLawMemoryKey,
  resolvePrestigeReclaimState,
} from '../systems/prestige/prestigeMemoryResolver.js';
import { readCultivationStageNumber } from './cultivationStageBridge.js';

export type DaoHeartActionFailureReason =
  | 'content_unavailable'
  | 'invalid_practice'
  | 'no_selected_heart_law'
  | 'combat_activity_active'
  | 'not_active_dao_heart'
  | DaoHeartPracticeFailureReason;

export type DaoHeartStartResult =
  | { ok: true; previousActivityType: ForegroundActivityType | null }
  | { ok: false; reason: DaoHeartActionFailureReason };

export type DaoHeartTickStoreResult =
  | {
      ok: true;
      practiceId: DaoHeartActivityId;
      appliedMs: number;
      heartLawXpGain: number;
      clarityGain: number;
      turbulenceGain: number;
      verseMasteryGain: number;
      rootResonanceGain: number;
      levelsGained: number;
    }
  | { ok: false; reason: DaoHeartActionFailureReason };

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
  heartLawVersion: number;
  insightDisplayVersion: number;
  consumableVersion: number;
  heartLawLevelById: Record<string, number>;
  heartLawXpById: Record<string, number>;
  verseMasteryByLawId: Record<string, number>;
  daoHeartClarity: number;
  turbulence: number;
  branchChoicesByLawId: Record<string, string>;
  rootResonanceByPair: Record<string, number>;
  activeDaoHeartPracticeId: DaoHeartActivityId | null;
  lastDaoHeartPracticeTickAt: number | null;
  lastDaoHeartOfflineSummary: DaoHeartOfflineSummary | null;
  lastBreakthroughRiskSnapshot: BreakthroughRiskSnapshot | null;
  lastBreakthroughFailureSummary: BreakthroughFailureSummary | null;
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
  flushInsightProgress: (now?: number, frequencyMultiplier?: number) => void;
  ensureInsightCycle: (now: number) => void;
  scheduleNextInsight: (now: number) => void;
  advanceInsightTimer: (deltaMs: number, now: number, frequencyMultiplier?: number) => boolean;
  resolveInsight: (choiceId?: InsightChoiceId | 'auto', now?: number) => void;
  useCultivationConsumable: (itemId: string, now?: number) => UseCultivationConsumableResult;
  getActiveCultivationConsumables: (now?: number) => ActiveCultivationConsumable[];
  clearExpiredCultivationConsumables: (now?: number) => void;
  getCultivationConsumableModifiers: (now?: number) => CultivationConsumableModifiers;
  getCultivationConsumableReadModel: (now?: number) => CultivationConsumableReadModel;
  consumeMajorBreakthroughBonus: (now?: number) => number;
  startDaoHeartPractice: (practiceId: DaoHeartActivityId, opts?: { now?: number }) => DaoHeartStartResult;
  stopDaoHeartPractice: (reason?: string) => void;
  tickDaoHeartPractice: (elapsedMs: number, opts?: { now?: number; offline?: boolean }) => DaoHeartTickStoreResult;
  applyOfflineDaoHeart: (elapsedMs: number, opts?: { completedAt?: number }) => DaoHeartTickStoreResult;
  addHeartLawXp: (heartLawId: string, amount: number, opts?: { cultivationEffectiveStage?: number }) => void;
  setHeartLawLevel: (heartLawId: string, level: number, xp?: number) => void;
  addVerseMastery: (heartLawId: string, amount: number) => void;
  setDaoHeartClarity: (value: number) => void;
  addDaoHeartClarity: (amount: number) => void;
  setTurbulence: (value: number) => void;
  addTurbulence: (amount: number) => void;
  setBranchChoice: (heartLawId: string, choiceId: string) => void;
  recordBreakthroughRiskSnapshot: (snapshot: BreakthroughRiskSnapshot | null) => void;
  recordBreakthroughFailureSummary: (summary: BreakthroughFailureSummary | null) => void;
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
  heartLawVersion: 0,
  insightDisplayVersion: 0,
  consumableVersion: 0,
  heartLawLevelById: {} as Record<string, number>,
  heartLawXpById: {} as Record<string, number>,
  verseMasteryByLawId: {} as Record<string, number>,
  daoHeartClarity: 0,
  turbulence: 0,
  branchChoicesByLawId: {} as Record<string, string>,
  rootResonanceByPair: {} as Record<string, number>,
  activeDaoHeartPracticeId: null as DaoHeartActivityId | null,
  lastDaoHeartPracticeTickAt: null as number | null,
  lastDaoHeartOfflineSummary: null as DaoHeartOfflineSummary | null,
  lastBreakthroughRiskSnapshot: null as BreakthroughRiskSnapshot | null,
  lastBreakthroughFailureSummary: null as BreakthroughFailureSummary | null,
};

const sameConsumableList = (
  left: ActiveCultivationConsumable[],
  right: ActiveCultivationConsumable[],
): boolean => left.length === right.length
  && left.every((entry, index) => {
    const other = right[index];
    return other
      && entry.itemId === other.itemId
      && entry.family === other.family
      && entry.activatedAt === other.activatedAt
      && entry.expiresAt === other.expiresAt
      && entry.consumedOnMajorBreakthrough === other.consumedOnMajorBreakthrough
      && entry.modifiers.qiRateMult === other.modifiers.qiRateMult
      && entry.modifiers.comprehensionGainMult === other.modifiers.comprehensionGainMult
      && entry.modifiers.stabilityGainMult === other.modifiers.stabilityGainMult
      && entry.modifiers.insightFrequencyMult === other.modifiers.insightFrequencyMult
      && entry.modifiers.majorBreakthroughQiCostMult === other.modifiers.majorBreakthroughQiCostMult
      && entry.modifiers.majorBreakthroughStabilityBonus === other.modifiers.majorBreakthroughStabilityBonus;
  });

const EMPTY_CULTIVATION_MODIFIERS: CultivationConsumableModifiers = Object.freeze({
  ...DEFAULT_CULTIVATION_CONSUMABLE_MODIFIERS,
});

type ModifierCache = {
  version: number;
  activeLength: number;
  nextExpiryAt: number | null;
  modifiers: CultivationConsumableModifiers;
};

let modifierCache: ModifierCache | null = null;

type InsightRuntimeCache = {
  selectedHeartLawId: string | null;
  targetMs: number | null;
  progressMs: number;
  bucketKey: string;
};

let insightRuntimeCache: InsightRuntimeCache | null = null;

function invalidateModifierCache() {
  modifierCache = null;
}

function resetInsightRuntimeCache() {
  insightRuntimeCache = null;
}

function getInsightBucketKey(progressMs: number, targetMs: number | null, nextInsightAt: number | null, now: number): string {
  if (!targetMs || targetMs <= 0) return '0:none';
  const pct = Math.max(0, Math.min(100, Math.floor((progressMs / targetMs) * 100)));
  const remainingSec = nextInsightAt === null ? 'none' : String(Math.max(0, Math.ceil((nextInsightAt - now) / 1000)));
  return `${pct}:${remainingSec}`;
}

function runtimeProgressFor(state: Pick<CultivationState, 'selectedHeartLawId' | 'insightTargetMs' | 'insightProgressMs'>): number {
  if (
    insightRuntimeCache
    && insightRuntimeCache.selectedHeartLawId === state.selectedHeartLawId
    && insightRuntimeCache.targetMs === state.insightTargetMs
    && insightRuntimeCache.progressMs >= state.insightProgressMs
  ) {
    return insightRuntimeCache.progressMs;
  }
  return state.insightProgressMs;
}

function applyComprehensionGainSnapshot(
  chapter: number,
  comprehension: number,
  amount: number,
): { chapter: number; comprehension: number; changed: boolean } {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { chapter, comprehension, changed: false };
  }

  let nextChapter = chapter;
  let nextComprehension = comprehension + amount;
  while (nextChapter < 5 && nextComprehension >= getChapterRequirement(nextChapter)) {
    nextComprehension -= getChapterRequirement(nextChapter);
    nextChapter += 1;
  }
  if (nextChapter >= 5) {
    nextComprehension = Math.min(nextComprehension, getChapterRequirement(nextChapter));
  }

  return {
    chapter: nextChapter,
    comprehension: nextComprehension,
    changed: nextChapter !== chapter || nextComprehension !== comprehension,
  };
}

const clampNumber = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

function getCultivationEffectiveStage(): number {
  return readCultivationStageNumber(1);
}

function getHeartLawTier(heartLawId: string | null): string {
  if (!heartLawId) return 'starter';
  return useContentStore.getState().maps.heartLawsById[heartLawId]?.tier ?? 'starter';
}

function getHeartLawParityDelta(heartLawStage: number, cultivationEffectiveStage: number): number {
  return Math.floor(heartLawStage) - Math.floor(cultivationEffectiveStage);
}

function hasDaoHeartPractice(practiceId: DaoHeartActivityId): boolean {
  const raw = useContentStore.getState().raw;
  return Boolean(raw?.dao_heart_practices?.practices.some((practice) => practice.id === practiceId));
}

function applyDaoHeartTickToDraft(
  state: CultivationState,
  result: Extract<ReturnType<typeof resolveHeartLawPracticeTick>, { ok: true }>,
  heartLawId: string,
) {
  const preview = result.preview;
  state.heartLawLevelById[heartLawId] = result.levelPreview.nextLevel;
  state.heartLawXpById[heartLawId] = result.levelPreview.nextXp;
  state.verseMasteryByLawId[heartLawId] = clampNumber(
    (state.verseMasteryByLawId[heartLawId] ?? 0) + preview.verseMasteryGain,
    0,
    100,
  );
  const spiritRoot = usePrestigeStore.getState().spiritRoot;
  if (spiritRoot && preview.rootResonanceGain > 0) {
    const pairKey = getSpiritRootPairKey(spiritRoot.element, heartLawId);
    state.rootResonanceByPair[pairKey] = clampNumber(
      (state.rootResonanceByPair[pairKey] ?? 0) + preview.rootResonanceGain,
      0,
      preview.rootExpressionCap,
    );
  }
  state.daoHeartClarity = applyDaoHeartProgressNumbers({
    value: state.daoHeartClarity,
    delta: preview.clarityGain,
    max: 100,
  });
  state.turbulence = applyDaoHeartProgressNumbers({
    value: state.turbulence,
    delta: preview.turbulenceGain,
    max: 100,
  });
  state.heartLawVersion = bumpVersion(state.heartLawVersion);
}

function resolveCurrentRootHeartFit(
  heartLawId: string,
  state: Pick<CultivationState, 'rootResonanceByPair'>,
): RootHeartFitResult | null {
  const spiritRoot = usePrestigeStore.getState().spiritRoot;
  if (!spiritRoot) return null;
  const heartLaw = useContentStore.getState().maps.heartLawsById[heartLawId] ?? null;
  const pairKey = getSpiritRootPairKey(spiritRoot.element, heartLawId);
  return resolveRootHeartFit({
    root: spiritRoot,
    heartLaw,
    currentRootResonance: state.rootResonanceByPair[pairKey] ?? 0,
    unlockedVariantIds: [],
  });
}

function resolveHeartLawReclaimMultiplier(input: {
  heartLawId: string;
  currentLevel: number;
  currentVerseMastery: number;
  cultivationEffectiveStage: number;
}): number {
  const prestige = usePrestigeStore.getState();
  const reclaimRank = Math.max(
    prestige.purchasesById.form_memory ?? 0,
    prestige.purchasesById.scripture_echo ?? 0,
    prestige.purchasesById.root_clarity ?? 0,
    prestige.purchasesById.old_sparring_shadows ?? 0,
  );
  if (reclaimRank <= 0 || prestige.memoryLedger.records.length === 0) return 1;
  const chapterBand = `chapter_${Math.max(1, Math.ceil(Math.max(1, input.currentLevel) / 5))}`;
  const componentKey = buildHeartLawMemoryKey({
    heartLawId: input.heartLawId,
    chapterBand,
    verseId: `verse_${chapterBand}`,
  });
  const resolved = resolvePrestigeReclaimState({
    records: prestige.memoryLedger.records,
    reclaimRank,
    current: {
      lifeId: `life-${Math.max(1, prestige.prestigeCount + 1)}`,
      realmIndex: Math.max(0, Math.floor(input.cultivationEffectiveStage / 9)),
      heartLaw: {
        heartLawId: input.heartLawId,
        chapterBand,
        verseId: `verse_${chapterBand}`,
        lawLevel: input.currentLevel,
        verseMastery: input.currentVerseMastery,
        unlocked: true,
      },
      composite: {
        pathId: null,
        heartLawId: input.heartLawId,
        rootKey: null,
        gateChainId: null,
      },
    },
  });
  return resolved.rows.find((row) =>
    row.record.domain === 'heart_law' && row.record.componentKey === componentKey && row.state === 'active')
    ?.activeMultiplier ?? 1;
}

export const useCultivationStore = create<CultivationState>()(
  immer((set, get) => ({
    ...baseState,

    selectHeartLaw: (id) => {
      if (!get().isUnlocked(id)) return;
      if (get().selectedHeartLawId === id) return;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useGameStore } = require('./gameStore') as typeof import('./gameStore');
        useGameStore.getState().flushCultivationAccumulation('heartLaw/select');
      } catch {
        // Game store may be unavailable during isolated tests.
      }
      useUIStore.getState().setLifeStartWizardContext(id);
      const current = get();
      const preservedHeartLawProgress = {
        selectedHeartLawId: id,
        heartLawLevelById: { ...current.heartLawLevelById },
        heartLawXpById: { ...current.heartLawXpById },
        verseMasteryByLawId: { ...current.verseMasteryByLawId },
        branchChoicesByLawId: { ...current.branchChoicesByLawId },
        rootResonanceByPair: { ...current.rootResonanceByPair },
        daoHeartClarity: current.daoHeartClarity,
        turbulence: current.turbulence,
      };
      const prestige = usePrestigeStore.getState();
      const echoedHeartLawProgress = applyScriptureEchoToHeartLawState({
        state: preservedHeartLawProgress,
        ledger: prestige.memoryLedger,
        selectedHeartLawId: id,
        purchasesById: prestige.purchasesById,
      });
      set((state) => {
        Object.assign(state, baseState);
        state.selectedHeartLawId = id;
        state.heartLawLevelById = echoedHeartLawProgress.heartLawLevelById ?? {};
        state.heartLawXpById = echoedHeartLawProgress.heartLawXpById ?? {};
        state.verseMasteryByLawId = echoedHeartLawProgress.verseMasteryByLawId;
        state.branchChoicesByLawId = preservedHeartLawProgress.branchChoicesByLawId;
        state.rootResonanceByPair = preservedHeartLawProgress.rootResonanceByPair;
        state.daoHeartClarity = preservedHeartLawProgress.daoHeartClarity;
        state.turbulence = preservedHeartLawProgress.turbulence;
        state.heartLawLevelById[id] = Math.max(1, state.heartLawLevelById[id] ?? 1);
        state.heartLawXpById[id] = Math.max(0, state.heartLawXpById[id] ?? 0);
        state.heartLawVersion = bumpVersion(state.heartLawVersion);
        state.insightDisplayVersion = bumpVersion(state.insightDisplayVersion);
        state.consumableVersion = bumpVersion(state.consumableVersion);
      });
      invalidateModifierCache();
      resetInsightRuntimeCache();
      GameEvents.emit({ type: 'heartlaw/selected', payload: { heartLawId: id } });
    },

    addComprehension: (amount) => time(PERF_LABELS.cultivationAddComprehension, () => {
      if (!Number.isFinite(amount) || amount <= 0) return;
      const current = get();
      if (!current.selectedHeartLawId) return;
      const result = time(PERF_LABELS.cultivationComprehensionBatch, () => applyComprehensionGainSnapshot(
        current.chapter,
        current.comprehension,
        amount,
      ));
      if (!result.changed) return;
      set((state) => {
        state.chapter = result.chapter;
        state.comprehension = result.comprehension;
        state.heartLawVersion = bumpVersion(state.heartLawVersion);
      });
    }),

    addStability: (amount) => {
      if (!Number.isFinite(amount) || amount <= 0) return;
      const current = get();
      const nextStability = clampStability(current.stability + amount, current.stabilityCap);
      if (nextStability === current.stability) return;
      set((state) => {
        state.stability = nextStability;
        state.heartLawVersion = bumpVersion(state.heartLawVersion);
      });
    },

    tryAdvanceChapter: () => {
      const { selectedHeartLawId, chapter, comprehension } = get();
      if (!selectedHeartLawId) return;
      let nextChapter = chapter;
      let nextComprehension = comprehension;
      while (nextChapter < 5 && nextComprehension >= getChapterRequirement(nextChapter)) {
        nextComprehension -= getChapterRequirement(nextChapter);
        nextChapter += 1;
      }
      if (nextChapter >= 5) {
        nextComprehension = Math.min(nextComprehension, getChapterRequirement(nextChapter));
      }
      if (nextChapter === chapter && nextComprehension === comprehension) return;
      set((state) => {
        state.chapter = nextChapter;
        state.comprehension = nextComprehension;
        state.heartLawVersion = bumpVersion(state.heartLawVersion);
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
      const nextIds = Array.from(new Set(ids));
      const currentIds = get().unlockedHeartLawIds;
      if (nextIds.length === currentIds.length && nextIds.every((id, index) => id === currentIds[index])) return;
      set((state) => {
        state.unlockedHeartLawIds = nextIds;
        state.heartLawVersion = bumpVersion(state.heartLawVersion);
      });
    },
    unlock: (id) => set((state) => {
      if (state.unlockedHeartLawIds.includes(id)) return;
      state.unlockedHeartLawIds.push(id);
      state.heartLawVersion = bumpVersion(state.heartLawVersion);
    }),
    setBreathMode: (mode) => {
      if (get().breathMode === mode) return;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useGameStore } = require('./gameStore') as typeof import('./gameStore');
        useGameStore.getState().flushCultivationAccumulation('breathMode/change');
      } catch {
        // Game store may be unavailable during isolated tests.
      }
      set((state) => {
        state.breathMode = mode;
        state.heartLawVersion = bumpVersion(state.heartLawVersion);
      });
      resetInsightRuntimeCache();
    },
    setStudyEnabled: (enabled) => {
      if (get().studyEnabled === enabled) return;
      set((state) => { state.studyEnabled = enabled; });
    },
    setStudyTechniqueId: (techniqueId) => {
      if (get().studyTechniqueId === techniqueId) return;
      set((state) => { state.studyTechniqueId = techniqueId; });
    },
    markInsight: (timestampMs) => {
      const next = typeof timestampMs === 'number' ? timestampMs : Date.now();
      if (get().lastInsightAt === next) return;
      set((state) => {
        state.lastInsightAt = next;
        state.insightDisplayVersion = bumpVersion(state.insightDisplayVersion);
      });
    },
    getComprehensionRequirementForNextChapter: () => {
      const chapter = get().chapter;
      if (chapter >= 5) return 0;
      return getChapterRequirement(chapter);
    },
    flushInsightProgress: (now = Date.now(), frequencyMultiplier = 1) => {
      const current = get();
      if (!insightRuntimeCache || insightRuntimeCache.selectedHeartLawId !== current.selectedHeartLawId) return;
      if (insightRuntimeCache.targetMs !== current.insightTargetMs) return;
      const nextProgressMs = insightRuntimeCache.progressMs;
      const nextInsightAt = deriveNextInsightAt(now, nextProgressMs, current.insightTargetMs, frequencyMultiplier);
      if (current.insightProgressMs === nextProgressMs && current.nextInsightAt === nextInsightAt) return;
      set((state) => {
        state.insightProgressMs = nextProgressMs;
        state.nextInsightAt = nextInsightAt;
        state.insightDisplayVersion = bumpVersion(state.insightDisplayVersion);
      });
    },
    ensureInsightCycle: (now) => time(PERF_LABELS.cultivationEnsureInsightCycle, () => {
      const current = get();
      if (!current.selectedHeartLawId) return;
      const nextTargetMs = current.insightTargetMs === null || current.insightTargetMs <= 0
        ? pickInsightTargetMs()
        : current.insightTargetMs;
      const nextProgressMs = current.insightTargetMs === null || current.insightTargetMs <= 0
        ? 0
        : runtimeProgressFor(current);
      const frequency = get().getCultivationConsumableModifiers(now).insightFrequencyMult;
      const nextInsightAt = deriveNextInsightAt(now, nextProgressMs, nextTargetMs, frequency);
      if (
        current.insightTargetMs === nextTargetMs
        && current.insightProgressMs === nextProgressMs
        && current.nextInsightAt !== null
      ) {
        return;
      }
      set((state) => {
        state.insightTargetMs = nextTargetMs;
        state.insightProgressMs = nextProgressMs;
        state.nextInsightAt = nextInsightAt;
        state.insightDisplayVersion = bumpVersion(state.insightDisplayVersion);
      });
      insightRuntimeCache = {
        selectedHeartLawId: current.selectedHeartLawId,
        targetMs: nextTargetMs,
        progressMs: nextProgressMs,
        bucketKey: getInsightBucketKey(nextProgressMs, nextTargetMs, nextInsightAt, now),
      };
    }),
    scheduleNextInsight: (now) => {
      set((state) => {
        const reference = typeof now === 'number' ? now : Date.now();
        state.insightTargetMs = pickInsightTargetMs();
        state.insightProgressMs = 0;
        const frequency = get().getCultivationConsumableModifiers(reference).insightFrequencyMult;
        state.nextInsightAt = deriveNextInsightAt(reference, 0, state.insightTargetMs, frequency);
        state.insightDisplayVersion = bumpVersion(state.insightDisplayVersion);
      });
      resetInsightRuntimeCache();
    },
    advanceInsightTimer: (deltaMs, now, frequencyMultiplier = 1) => time(PERF_LABELS.cultivationAdvanceInsightTimer, () => {
      const current = get();
      if (deltaMs <= 0 || !current.selectedHeartLawId) return false;
      if (current.insight) return false;

      const targetMs = current.insightTargetMs === null || current.insightTargetMs <= 0
        ? pickInsightTargetMs()
        : current.insightTargetMs;
      const baseProgressMs = current.insightTargetMs === null || current.insightTargetMs <= 0
        ? 0
        : runtimeProgressFor(current);
      const nextProgressMs = baseProgressMs + deltaMs * Math.max(0, frequencyMultiplier);

      if (nextProgressMs >= targetMs) {
        set((state) => {
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
          state.insightDisplayVersion = bumpVersion(state.insightDisplayVersion);
        });
        resetInsightRuntimeCache();
        return true;
      }

      const nextInsightAt = deriveNextInsightAt(now, nextProgressMs, targetMs, frequencyMultiplier);
      const previousBucketKey = insightRuntimeCache?.selectedHeartLawId === current.selectedHeartLawId
        && insightRuntimeCache.targetMs === targetMs
        ? insightRuntimeCache.bucketKey
        : getInsightBucketKey(current.insightProgressMs, targetMs, current.nextInsightAt, now);
      const nextBucketKey = getInsightBucketKey(nextProgressMs, targetMs, nextInsightAt, now);
      insightRuntimeCache = {
        selectedHeartLawId: current.selectedHeartLawId,
        targetMs,
        progressMs: nextProgressMs,
        bucketKey: nextBucketKey,
      };

      if (
        current.insightTargetMs === targetMs
        && previousBucketKey === nextBucketKey
      ) {
        return false;
      }

      time(PERF_LABELS.cultivationInsightDisplayPublish, () => {
        set((state) => {
          state.insightTargetMs = targetMs;
          state.insightProgressMs = nextProgressMs;
          state.nextInsightAt = nextInsightAt;
          state.insightDisplayVersion = bumpVersion(state.insightDisplayVersion);
        });
      });
      return false;
    }),

    resolveInsight: (choiceId, now = Date.now()) => {
      const state = get();
      if (!state.insight) return;
      const chosenId = choiceId === 'auto' || !choiceId ? state.insight.defaultChoiceId : choiceId;
      set((draft) => {
        draft.insight = null;
        draft.lastInsightAt = now;
        draft.insightProgressMs = 0;
        draft.insightTargetMs = pickInsightTargetMs();
        const frequency = get().getCultivationConsumableModifiers(now).insightFrequencyMult;
        draft.nextInsightAt = deriveNextInsightAt(now, 0, draft.insightTargetMs, frequency);
        draft.insightDisplayVersion = bumpVersion(draft.insightDisplayVersion);
      });
      resetInsightRuntimeCache();

      switch (chosenId) {
        case 'contemplate':
          get().addComprehension(INSIGHT_BURSTS.comprehension, 'meditation');
          break;
        case 'drawQi': {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { useGameStore } = require('./gameStore') as typeof import('./gameStore');
          useGameStore.getState().flushCultivationAccumulation('insight/drawQi');
          const qiPerSecond = D(useGameStore.getState().qiPerSecond ?? '0');
          const qiBonus = qiPerSecond.times(INSIGHT_BURSTS.qiSecondsWorth);
          if (qiBonus.greaterThan(0)) {
            useGameStore.setState((s: any) => {
              const currentQi = D((s as any).qi ?? '0');
              const previousBucket = currentQi.floor().toString();
              const nextQi = currentQi.plus(qiBonus);
              const nextBucket = nextQi.floor().toString();
              return {
                qi: nextQi.toString(),
                lastActiveTime: now,
                lastTickTime: now,
                qiDisplayVersion: previousBucket === nextBucket ? (s as any).qiDisplayVersion : bumpVersion((s as any).qiDisplayVersion),
              };
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
        state.consumableVersion = bumpVersion(state.consumableVersion);
      });
      invalidateModifierCache();
      resetInsightRuntimeCache();

      get().clearExpiredCultivationConsumables(now);
      get().ensureInsightCycle(now);
      return {
        ok: true,
        reason: 'ok',
        message: spec.longLabel ?? `Used ${spec.shortLabel}.`,
      };
    },

    getActiveCultivationConsumables: (now = Date.now()) => filterActiveCultivationConsumables(get().activeCultivationConsumables, now),
    clearExpiredCultivationConsumables: (now = Date.now()) => time(PERF_LABELS.cultivationClearExpiredConsumables, () => {
      const current = get();
      if (current.activeCultivationConsumables.length === 0) return;

      const nextConsumables = filterActiveCultivationConsumables(current.activeCultivationConsumables, now);
      const consumablesChanged = !sameConsumableList(current.activeCultivationConsumables, nextConsumables);
      if (!consumablesChanged) return;

      const frequency = get().getCultivationConsumableModifiers(now).insightFrequencyMult;
      const nextInsightAt = deriveNextInsightAt(now, current.insightProgressMs, current.insightTargetMs, frequency);

      set((state) => {
        state.activeCultivationConsumables = nextConsumables;
        state.nextInsightAt = nextInsightAt;
        state.consumableVersion = bumpVersion(state.consumableVersion);
        if (current.nextInsightAt !== nextInsightAt) {
          state.insightDisplayVersion = bumpVersion(state.insightDisplayVersion);
        }
      });
      invalidateModifierCache();
      resetInsightRuntimeCache();
    }),
    getCultivationConsumableModifiers: (now = Date.now()) => time(
      PERF_LABELS.cultivationConsumableModifiers,
      () => {
        const current = get();
        if (current.activeCultivationConsumables.length === 0) {
          incrementCounter(PERF_LABELS.cultivationConsumableModifierCacheHit);
          return EMPTY_CULTIVATION_MODIFIERS;
        }
        const nextExpiryAt = getNextCultivationConsumableExpiryAt(current.activeCultivationConsumables, now);
        if (
          modifierCache
          && modifierCache.version === current.consumableVersion
          && modifierCache.activeLength === current.activeCultivationConsumables.length
          && modifierCache.nextExpiryAt === nextExpiryAt
          && (nextExpiryAt === null || now < nextExpiryAt)
        ) {
          incrementCounter(PERF_LABELS.cultivationConsumableModifierCacheHit);
          return modifierCache.modifiers;
        }

        incrementCounter(PERF_LABELS.cultivationConsumableModifierCacheMiss);
        const modifiers = mergeCultivationConsumableModifiers(current.activeCultivationConsumables, now);
        modifierCache = {
          version: current.consumableVersion,
          activeLength: current.activeCultivationConsumables.length,
          nextExpiryAt,
          modifiers,
        };
        return modifiers;
      },
    ),
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
        state.consumableVersion = bumpVersion(state.consumableVersion);
      });
      if (granted > 0) {
        invalidateModifierCache();
        resetInsightRuntimeCache();
      }
      return granted;
    },
    startDaoHeartPractice: (practiceId, opts) => {
      if (!isDaoHeartActivityId(practiceId)) return { ok: false, reason: 'invalid_practice' };
      if (!hasDaoHeartPractice(practiceId)) return { ok: false, reason: 'content_unavailable' };
      const current = get();
      const heartLawId = current.selectedHeartLawId;
      if (!heartLawId) return { ok: false, reason: 'no_selected_heart_law' };
      const activityStore = useActivityStore.getState();
      const active = activityStore.active;
      if (active && COMBAT_ACTIVITY_TYPES.includes(active.type)) {
        return { ok: false, reason: 'combat_activity_active' };
      }
      const now = opts?.now ?? Date.now();
      const cultivationEffectiveStage = getCultivationEffectiveStage();
      const currentLevel = current.heartLawLevelById[heartLawId] ?? 1;
      const rootHeartFit = resolveCurrentRootHeartFit(heartLawId, current);
      const parityCheck = resolveHeartLawPracticeTick({
        practiceId,
        elapsedMs: 1,
        currentLevel,
        currentXp: current.heartLawXpById[heartLawId] ?? 0,
        tier: getHeartLawTier(heartLawId),
        cultivationEffectiveStage,
        clarity: current.daoHeartClarity,
        turbulence: current.turbulence,
        rootHeartFit,
      });
      if (!parityCheck.ok && parityCheck.reason === 'heart_law_lag_too_high') {
        return { ok: false, reason: parityCheck.reason };
      }
      const previousActivityType = active?.type ?? null;
      activityStore.startActivity(
        'dao_heart_practice',
        { sourceId: practiceId, practiceId, heartLawId },
        'daoHeart:start',
      );
      set((state) => {
        state.activeDaoHeartPracticeId = practiceId;
        state.lastDaoHeartPracticeTickAt = now;
        state.heartLawLevelById[heartLawId] = Math.max(1, state.heartLawLevelById[heartLawId] ?? 1);
        state.heartLawXpById[heartLawId] = Math.max(0, state.heartLawXpById[heartLawId] ?? 0);
        state.heartLawVersion = bumpVersion(state.heartLawVersion);
      });
      GameEvents.emit({
        type: 'dao_heart/started',
        payload: {
          timestamp: now,
          lawId: heartLawId,
          activityId: practiceId,
          parityDelta: getHeartLawParityDelta(currentLevel, cultivationEffectiveStage),
          turbulence: current.turbulence,
          clarity: current.daoHeartClarity,
        },
      });
      return { ok: true, previousActivityType };
    },
    stopDaoHeartPractice: (reason = 'daoHeart:stop') => {
      if (useActivityStore.getState().active?.type === 'dao_heart_practice') {
        useActivityStore.getState().stopActivity(reason);
      }
      set((state) => {
        state.activeDaoHeartPracticeId = null;
        state.lastDaoHeartPracticeTickAt = null;
      });
    },
    tickDaoHeartPractice: (elapsedMs, opts) => {
      if (elapsedMs <= 0) return { ok: false, reason: 'non_positive_elapsed' };
      const current = get();
      const active = useActivityStore.getState().active;
      if (active && COMBAT_ACTIVITY_TYPES.includes(active.type)) {
        return { ok: false, reason: 'combat_activity_active' };
      }
      if (active?.type !== 'dao_heart_practice' || !current.activeDaoHeartPracticeId) {
        return { ok: false, reason: 'not_active_dao_heart' };
      }
      const heartLawId = current.selectedHeartLawId;
      if (!heartLawId) return { ok: false, reason: 'no_selected_heart_law' };
      const cultivationEffectiveStage = getCultivationEffectiveStage();
      const currentLevel = current.heartLawLevelById[heartLawId] ?? 1;
      const now = opts?.now ?? Date.now();
      const rootHeartFit = resolveCurrentRootHeartFit(heartLawId, current);
      const scriptureEchoMultiplier = resolveScriptureEchoXpMultiplier({
        purchasesById: usePrestigeStore.getState().purchasesById,
        heartLawStage: currentLevel,
        cultivationEffectiveStage,
      });
      const reclaimMemoryMultiplier = resolveHeartLawReclaimMultiplier({
        heartLawId,
        currentLevel,
        currentVerseMastery: current.verseMasteryByLawId[heartLawId] ?? 0,
        cultivationEffectiveStage,
      });
      const result = resolveHeartLawPracticeTick({
        practiceId: current.activeDaoHeartPracticeId,
        elapsedMs,
        currentLevel,
        currentXp: current.heartLawXpById[heartLawId] ?? 0,
        tier: getHeartLawTier(heartLawId),
        cultivationEffectiveStage,
        clarity: current.daoHeartClarity,
        turbulence: current.turbulence,
        heartLawXpMultiplier: Math.max(scriptureEchoMultiplier, reclaimMemoryMultiplier),
        rootHeartFit,
      });
      if (!result.ok) return result;
      set((state) => {
        applyDaoHeartTickToDraft(state, result, heartLawId);
        state.lastDaoHeartPracticeTickAt = now;
        if (opts?.offline) {
          state.lastDaoHeartOfflineSummary = {
            practiceId: current.activeDaoHeartPracticeId!,
            appliedMs: elapsedMs,
            heartLawXpGain: result.preview.heartLawXpGain,
            clarityGain: result.preview.clarityGain,
            turbulenceGain: result.preview.turbulenceGain,
            completedAt: now,
          };
        }
      });
      if (result.levelPreview.nextLevel !== currentLevel) {
        GameEvents.emit({
          type: 'dao_heart/level_changed',
          payload: {
            timestamp: now,
            lawId: heartLawId,
            oldLevel: currentLevel,
            newLevel: result.levelPreview.nextLevel,
            parityDelta: getHeartLawParityDelta(result.levelPreview.nextLevel, cultivationEffectiveStage),
          },
        });
      }
      const storeResult: DaoHeartTickStoreResult = {
        ok: true,
        practiceId: current.activeDaoHeartPracticeId,
        appliedMs: elapsedMs,
        heartLawXpGain: result.preview.heartLawXpGain,
        clarityGain: result.preview.clarityGain,
        turbulenceGain: result.preview.turbulenceGain,
        verseMasteryGain: result.preview.verseMasteryGain,
        rootResonanceGain: result.preview.rootResonanceGain,
        levelsGained: result.levelPreview.levelsGained,
      };
      if (opts?.offline) {
        GameEvents.emit({
          type: 'dao_heart/offline_applied',
          payload: {
            timestamp: now,
            lawId: heartLawId,
            activityId: current.activeDaoHeartPracticeId,
            appliedMs: storeResult.appliedMs,
            heartLawXpGain: storeResult.heartLawXpGain,
            verseMasteryGain: storeResult.verseMasteryGain,
            clarityGain: storeResult.clarityGain,
            turbulenceGain: storeResult.turbulenceGain,
            levelsGained: storeResult.levelsGained,
          },
        });
      }
      return storeResult;
    },
    applyOfflineDaoHeart: (elapsedMs, opts) => {
      const current = get();
      const active = useActivityStore.getState().active;
      if (active?.type !== 'dao_heart_practice' || !current.activeDaoHeartPracticeId) {
        return { ok: false, reason: 'not_active_dao_heart' };
      }
      if (!isDaoHeartPracticeOfflineAllowed(current.activeDaoHeartPracticeId)) {
        set((state) => {
          state.lastDaoHeartOfflineSummary = {
            practiceId: current.activeDaoHeartPracticeId!,
            appliedMs: 0,
            heartLawXpGain: 0,
            clarityGain: 0,
            turbulenceGain: 0,
            completedAt: opts?.completedAt ?? Date.now(),
            blockedReason: 'offline_not_allowed',
          };
        });
        if (current.selectedHeartLawId) {
          GameEvents.emit({
            type: 'dao_heart/offline_applied',
            payload: {
              timestamp: opts?.completedAt ?? Date.now(),
              lawId: current.selectedHeartLawId,
              activityId: current.activeDaoHeartPracticeId,
              appliedMs: 0,
              heartLawXpGain: 0,
              verseMasteryGain: 0,
              clarityGain: 0,
              turbulenceGain: 0,
              levelsGained: 0,
              blockedReason: 'offline_not_allowed',
            },
          });
        }
        return { ok: false, reason: 'not_active_dao_heart' };
      }
      return get().tickDaoHeartPractice(elapsedMs, { now: opts?.completedAt, offline: true });
    },
    addHeartLawXp: (heartLawId, amount, opts) => {
      if (!heartLawId || amount <= 0) return;
      const current = get();
      const levelPreview = resolveHeartLawLevelPreview({
        currentLevel: current.heartLawLevelById[heartLawId] ?? 1,
        currentXp: current.heartLawXpById[heartLawId] ?? 0,
        gainedXp: amount,
        tier: getHeartLawTier(heartLawId),
        cultivationEffectiveStage: opts?.cultivationEffectiveStage ?? getCultivationEffectiveStage(),
      });
      set((state) => {
        state.heartLawLevelById[heartLawId] = levelPreview.nextLevel;
        state.heartLawXpById[heartLawId] = levelPreview.nextXp;
        state.heartLawVersion = bumpVersion(state.heartLawVersion);
      });
    },
    setHeartLawLevel: (heartLawId, level, xp = 0) => {
      if (!heartLawId) return;
      set((state) => {
        state.heartLawLevelById[heartLawId] = clampNumber(Math.floor(level), 1, 45);
        state.heartLawXpById[heartLawId] = Math.max(0, xp);
        state.heartLawVersion = bumpVersion(state.heartLawVersion);
      });
    },
    addVerseMastery: (heartLawId, amount) => {
      if (!heartLawId || amount <= 0) return;
      set((state) => {
        state.verseMasteryByLawId[heartLawId] = clampNumber((state.verseMasteryByLawId[heartLawId] ?? 0) + amount, 0, 100);
        state.heartLawVersion = bumpVersion(state.heartLawVersion);
      });
    },
    setDaoHeartClarity: (value) => {
      set((state) => {
        state.daoHeartClarity = clampNumber(value, 0, 100);
        state.heartLawVersion = bumpVersion(state.heartLawVersion);
      });
    },
    addDaoHeartClarity: (amount) => {
      set((state) => {
        state.daoHeartClarity = clampNumber(state.daoHeartClarity + amount, 0, 100);
        state.heartLawVersion = bumpVersion(state.heartLawVersion);
      });
    },
    setTurbulence: (value) => {
      set((state) => {
        state.turbulence = clampNumber(value, 0, 100);
        state.heartLawVersion = bumpVersion(state.heartLawVersion);
      });
    },
    addTurbulence: (amount) => {
      set((state) => {
        state.turbulence = clampNumber(state.turbulence + amount, 0, 100);
        state.heartLawVersion = bumpVersion(state.heartLawVersion);
      });
    },
    setBranchChoice: (heartLawId, choiceId) => {
      if (!heartLawId || !choiceId) return;
      set((state) => {
        state.branchChoicesByLawId[heartLawId] = choiceId;
        state.heartLawVersion = bumpVersion(state.heartLawVersion);
      });
    },
    recordBreakthroughRiskSnapshot: (snapshot) => {
      set((state) => {
        state.lastBreakthroughRiskSnapshot = snapshot;
      });
    },
    recordBreakthroughFailureSummary: (summary) => {
      set((state) => {
        state.lastBreakthroughFailureSummary = summary;
      });
    },
    resetForNewLife: () => {
      const lastSelected = get().selectedHeartLawId;
      if (useActivityStore.getState().active?.type === 'dao_heart_practice') {
        useActivityStore.getState().stopActivity('daoHeart:reset');
      }
      set((state) => { Object.assign(state, baseState); });
      invalidateModifierCache();
      resetInsightRuntimeCache();
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
