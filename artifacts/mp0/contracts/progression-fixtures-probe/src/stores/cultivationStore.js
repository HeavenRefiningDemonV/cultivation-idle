import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useContentStore } from './contentStore.js';
import { GameEvents } from '../services/events/GameEvents.js';
import { INSIGHT_BURSTS, INSIGHT_DURATION_MS, INSIGHT_INTERVAL_RANGE_MS, VERSE_COMPREHENSION_THRESHOLD, getBreathModeMultipliers, } from '../content/tuning/cultivationTuning.js';
import { useUIStore } from './uiStore.js';
import { D } from '../utils/numbers.js';
import { getConsumableSpec } from '../systems/consumables/consumableCatalog.js';
import { buildCultivationConsumableReadModel, filterActiveCultivationConsumables, getNextCultivationConsumableExpiryAt, mergeCultivationConsumableModifiers, } from '../systems/consumables/cultivationConsumableEffects.js';
import { DEFAULT_CULTIVATION_CONSUMABLE_MODIFIERS, } from '../systems/consumables/cultivationConsumableTypes.js';
import { PERF_LABELS, incrementCounter, time } from '../services/performance/index.js';
import { bumpVersion } from './versionCounters.js';
function getStarterHeartLawIds(defs) {
    const starters = defs.filter((law) => law.tier === 'starter' || law.isStarter);
    if (starters.length > 0)
        return starters.map((law) => law.id);
    return defs.slice(0, 3).map((law) => law.id);
}
function getChapterRequirement(currentChapter) {
    if (currentChapter >= 5)
        return 0;
    return VERSE_COMPREHENSION_THRESHOLD;
}
function clampStability(value, cap) {
    if (value < 0)
        return 0;
    if (value > cap)
        return cap;
    return value;
}
function pickInsightTargetMs() {
    const span = INSIGHT_INTERVAL_RANGE_MS.max - INSIGHT_INTERVAL_RANGE_MS.min;
    return Math.random() * span + INSIGHT_INTERVAL_RANGE_MS.min;
}
function deriveNextInsightAt(now, progressMs, targetMs, frequencyMultiplier = 1) {
    if (!targetMs || frequencyMultiplier <= 0)
        return null;
    const remaining = Math.max(0, targetMs - progressMs);
    return now + remaining / frequencyMultiplier;
}
const baseState = {
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
    activeCultivationConsumables: [],
    insightProgressMs: 0,
    insightTargetMs: null,
    heartLawVersion: 0,
    insightDisplayVersion: 0,
    consumableVersion: 0,
};
const sameConsumableList = (left, right) => left.length === right.length
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
const EMPTY_CULTIVATION_MODIFIERS = Object.freeze({
    ...DEFAULT_CULTIVATION_CONSUMABLE_MODIFIERS,
});
let modifierCache = null;
let insightRuntimeCache = null;
function invalidateModifierCache() {
    modifierCache = null;
}
function resetInsightRuntimeCache() {
    insightRuntimeCache = null;
}
function getInsightBucketKey(progressMs, targetMs, nextInsightAt, now) {
    if (!targetMs || targetMs <= 0)
        return '0:none';
    const pct = Math.max(0, Math.min(100, Math.floor((progressMs / targetMs) * 100)));
    const remainingSec = nextInsightAt === null ? 'none' : String(Math.max(0, Math.ceil((nextInsightAt - now) / 1000)));
    return `${pct}:${remainingSec}`;
}
function runtimeProgressFor(state) {
    if (insightRuntimeCache
        && insightRuntimeCache.selectedHeartLawId === state.selectedHeartLawId
        && insightRuntimeCache.targetMs === state.insightTargetMs
        && insightRuntimeCache.progressMs >= state.insightProgressMs) {
        return insightRuntimeCache.progressMs;
    }
    return state.insightProgressMs;
}
function applyComprehensionGainSnapshot(chapter, comprehension, amount) {
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
export const useCultivationStore = create()(immer((set, get) => ({
    ...baseState,
    selectHeartLaw: (id) => {
        if (!get().isUnlocked(id))
            return;
        if (get().selectedHeartLawId === id)
            return;
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { useGameStore } = require('./gameStore');
            useGameStore.getState().flushCultivationAccumulation('heartLaw/select');
        }
        catch {
            // Game store may be unavailable during isolated tests.
        }
        useUIStore.getState().setLifeStartWizardContext(id);
        set((state) => {
            Object.assign(state, baseState);
            state.selectedHeartLawId = id;
            state.heartLawVersion = bumpVersion(state.heartLawVersion);
            state.insightDisplayVersion = bumpVersion(state.insightDisplayVersion);
            state.consumableVersion = bumpVersion(state.consumableVersion);
        });
        invalidateModifierCache();
        resetInsightRuntimeCache();
        GameEvents.emit({ type: 'heartlaw/selected', payload: { heartLawId: id } });
    },
    addComprehension: (amount) => time(PERF_LABELS.cultivationAddComprehension, () => {
        if (!Number.isFinite(amount) || amount <= 0)
            return;
        const current = get();
        if (!current.selectedHeartLawId)
            return;
        const result = time(PERF_LABELS.cultivationComprehensionBatch, () => applyComprehensionGainSnapshot(current.chapter, current.comprehension, amount));
        if (!result.changed)
            return;
        set((state) => {
            state.chapter = result.chapter;
            state.comprehension = result.comprehension;
            state.heartLawVersion = bumpVersion(state.heartLawVersion);
        });
    }),
    addStability: (amount) => {
        if (!Number.isFinite(amount) || amount <= 0)
            return;
        const current = get();
        const nextStability = clampStability(current.stability + amount, current.stabilityCap);
        if (nextStability === current.stability)
            return;
        set((state) => {
            state.stability = nextStability;
            state.heartLawVersion = bumpVersion(state.heartLawVersion);
        });
    },
    tryAdvanceChapter: () => {
        const { selectedHeartLawId, chapter, comprehension } = get();
        if (!selectedHeartLawId)
            return;
        let nextChapter = chapter;
        let nextComprehension = comprehension;
        while (nextChapter < 5 && nextComprehension >= getChapterRequirement(nextChapter)) {
            nextComprehension -= getChapterRequirement(nextChapter);
            nextChapter += 1;
        }
        if (nextChapter >= 5) {
            nextComprehension = Math.min(nextComprehension, getChapterRequirement(nextChapter));
        }
        if (nextChapter === chapter && nextComprehension === comprehension)
            return;
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
        if (starters.includes(id))
            return true;
        return get().unlockedHeartLawIds.includes(id);
    },
    setUnlocked: (ids) => {
        const nextIds = Array.from(new Set(ids));
        const currentIds = get().unlockedHeartLawIds;
        if (nextIds.length === currentIds.length && nextIds.every((id, index) => id === currentIds[index]))
            return;
        set((state) => {
            state.unlockedHeartLawIds = nextIds;
            state.heartLawVersion = bumpVersion(state.heartLawVersion);
        });
    },
    unlock: (id) => set((state) => {
        if (state.unlockedHeartLawIds.includes(id))
            return;
        state.unlockedHeartLawIds.push(id);
        state.heartLawVersion = bumpVersion(state.heartLawVersion);
    }),
    setBreathMode: (mode) => {
        if (get().breathMode === mode)
            return;
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { useGameStore } = require('./gameStore');
            useGameStore.getState().flushCultivationAccumulation('breathMode/change');
        }
        catch {
            // Game store may be unavailable during isolated tests.
        }
        set((state) => {
            state.breathMode = mode;
            state.heartLawVersion = bumpVersion(state.heartLawVersion);
        });
        resetInsightRuntimeCache();
    },
    setStudyEnabled: (enabled) => {
        if (get().studyEnabled === enabled)
            return;
        set((state) => { state.studyEnabled = enabled; });
    },
    setStudyTechniqueId: (techniqueId) => {
        if (get().studyTechniqueId === techniqueId)
            return;
        set((state) => { state.studyTechniqueId = techniqueId; });
    },
    markInsight: (timestampMs) => {
        const next = typeof timestampMs === 'number' ? timestampMs : Date.now();
        if (get().lastInsightAt === next)
            return;
        set((state) => {
            state.lastInsightAt = next;
            state.insightDisplayVersion = bumpVersion(state.insightDisplayVersion);
        });
    },
    getComprehensionRequirementForNextChapter: () => {
        const chapter = get().chapter;
        if (chapter >= 5)
            return 0;
        return getChapterRequirement(chapter);
    },
    flushInsightProgress: (now = Date.now(), frequencyMultiplier = 1) => {
        const current = get();
        if (!insightRuntimeCache || insightRuntimeCache.selectedHeartLawId !== current.selectedHeartLawId)
            return;
        if (insightRuntimeCache.targetMs !== current.insightTargetMs)
            return;
        const nextProgressMs = insightRuntimeCache.progressMs;
        const nextInsightAt = deriveNextInsightAt(now, nextProgressMs, current.insightTargetMs, frequencyMultiplier);
        if (current.insightProgressMs === nextProgressMs && current.nextInsightAt === nextInsightAt)
            return;
        set((state) => {
            state.insightProgressMs = nextProgressMs;
            state.nextInsightAt = nextInsightAt;
            state.insightDisplayVersion = bumpVersion(state.insightDisplayVersion);
        });
    },
    ensureInsightCycle: (now) => time(PERF_LABELS.cultivationEnsureInsightCycle, () => {
        const current = get();
        if (!current.selectedHeartLawId)
            return;
        const nextTargetMs = current.insightTargetMs === null || current.insightTargetMs <= 0
            ? pickInsightTargetMs()
            : current.insightTargetMs;
        const nextProgressMs = current.insightTargetMs === null || current.insightTargetMs <= 0
            ? 0
            : runtimeProgressFor(current);
        const frequency = get().getCultivationConsumableModifiers(now).insightFrequencyMult;
        const nextInsightAt = deriveNextInsightAt(now, nextProgressMs, nextTargetMs, frequency);
        if (current.insightTargetMs === nextTargetMs
            && current.insightProgressMs === nextProgressMs
            && current.nextInsightAt !== null) {
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
        if (deltaMs <= 0 || !current.selectedHeartLawId)
            return false;
        if (current.insight)
            return false;
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
        if (current.insightTargetMs === targetMs
            && previousBucketKey === nextBucketKey) {
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
    resolveInsight: (choiceId) => {
        const state = get();
        if (!state.insight)
            return;
        const chosenId = choiceId === 'auto' || !choiceId ? state.insight.defaultChoiceId : choiceId;
        const now = Date.now();
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
                const { useGameStore } = require('./gameStore');
                useGameStore.getState().flushCultivationAccumulation('insight/drawQi');
                const qiPerSecond = D(useGameStore.getState().qiPerSecond ?? '0');
                const qiBonus = qiPerSecond.times(INSIGHT_BURSTS.qiSecondsWorth);
                if (qiBonus.greaterThan(0)) {
                    useGameStore.setState((s) => {
                        const currentQi = D(s.qi ?? '0');
                        const previousBucket = currentQi.floor().toString();
                        const nextQi = currentQi.plus(qiBonus);
                        const nextBucket = nextQi.floor().toString();
                        return {
                            qi: nextQi.toString(),
                            lastActiveTime: now,
                            lastTickTime: now,
                            qiDisplayVersion: previousBucket === nextBucket ? s.qiDisplayVersion : bumpVersion(s.qiDisplayVersion),
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
            state.activeCultivationConsumables = state.activeCultivationConsumables.filter((entry) => entry.expiresAt > now && entry.family !== family);
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
        if (current.activeCultivationConsumables.length === 0)
            return;
        const nextExpiryAt = getNextCultivationConsumableExpiryAt(current.activeCultivationConsumables, now);
        if (nextExpiryAt !== null && now < nextExpiryAt)
            return;
        const nextConsumables = filterActiveCultivationConsumables(current.activeCultivationConsumables, now);
        const consumablesChanged = !sameConsumableList(current.activeCultivationConsumables, nextConsumables);
        const frequency = get().getCultivationConsumableModifiers(now).insightFrequencyMult;
        const nextInsightAt = deriveNextInsightAt(now, current.insightProgressMs, current.insightTargetMs, frequency);
        if (!consumablesChanged && current.nextInsightAt === nextInsightAt)
            return;
        set((state) => {
            state.activeCultivationConsumables = nextConsumables;
            state.nextInsightAt = nextInsightAt;
            if (consumablesChanged) {
                state.consumableVersion = bumpVersion(state.consumableVersion);
            }
            if (current.nextInsightAt !== nextInsightAt) {
                state.insightDisplayVersion = bumpVersion(state.insightDisplayVersion);
            }
        });
        invalidateModifierCache();
        resetInsightRuntimeCache();
    }),
    getCultivationConsumableModifiers: (now = Date.now()) => time(PERF_LABELS.cultivationConsumableModifiers, () => {
        const current = get();
        if (current.activeCultivationConsumables.length === 0) {
            incrementCounter(PERF_LABELS.cultivationConsumableModifierCacheHit);
            return EMPTY_CULTIVATION_MODIFIERS;
        }
        const nextExpiryAt = getNextCultivationConsumableExpiryAt(current.activeCultivationConsumables, now);
        if (modifierCache
            && modifierCache.version === current.consumableVersion
            && modifierCache.activeLength === current.activeCultivationConsumables.length
            && modifierCache.nextExpiryAt === nextExpiryAt
            && (nextExpiryAt === null || now < nextExpiryAt)) {
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
    }),
    getCultivationConsumableReadModel: (now = Date.now()) => buildCultivationConsumableReadModel(get().activeCultivationConsumables, now),
    consumeMajorBreakthroughBonus: (now = Date.now()) => {
        let granted = 0;
        set((state) => {
            const target = state.activeCultivationConsumables.find((entry) => entry.family === 'breakthrough' && entry.expiresAt > now && !entry.consumedOnMajorBreakthrough);
            if (!target)
                return;
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
    resetForNewLife: () => {
        const lastSelected = get().selectedHeartLawId;
        set((state) => { Object.assign(state, baseState); });
        invalidateModifierCache();
        resetInsightRuntimeCache();
        if (lastSelected)
            useUIStore.getState().setLifeStartWizardContext(lastSelected);
        GameEvents.emit({ type: 'heartlaw/selected', payload: { heartLawId: null } });
    },
})));
export function getDefaultUnlockedHeartLawIds() {
    const content = useContentStore.getState();
    const laws = content.raw?.heart_laws ?? [];
    return getStarterHeartLawIds(laws);
}
export function getSelectedHeartLawDef() {
    const selectedId = useCultivationStore.getState().selectedHeartLawId;
    if (!selectedId)
        return null;
    return useContentStore.getState().maps.heartLawsById[selectedId] ?? null;
}
export function getAvailableHeartLaws() {
    const content = useContentStore.getState();
    if (!content.isLoaded || !content.raw?.heart_laws)
        return { unlocked: [], locked: [] };
    const laws = content.listHeartLaws();
    const store = useCultivationStore.getState();
    const unlocked = [];
    const locked = [];
    laws.forEach((law) => { if (store.isUnlocked(law.id))
        unlocked.push(law);
    else
        locked.push(law); });
    return { unlocked, locked };
}
export function getBreathModeLabel(mode) {
    const m = getBreathModeMultipliers(mode);
    return `${mode} (Qi ${m.qiRateMult}x, Insight ${m.comprehensionMult}x)`;
}
