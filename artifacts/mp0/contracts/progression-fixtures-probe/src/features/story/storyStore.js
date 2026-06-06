import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { STORY_CUTSCENES } from './storyData.js';
const createInitialStoryState = () => ({
    seenFlags: {},
    activeCutsceneId: null,
    queuedCutsceneIds: [],
    slideIndex: 0,
    isReplay: false,
    storyLog: [],
});
const cloneStoryLog = (storyLog) => Array.isArray(storyLog)
    ? storyLog
        .filter((entry) => Boolean(entry)
        && typeof entry.id === 'string'
        && entry.id in STORY_CUTSCENES
        && typeof entry.firstSeenAt === 'number')
        .map((entry) => ({
        id: entry.id,
        firstSeenAt: entry.firstSeenAt,
        completed: Boolean(entry.completed),
    }))
    : [];
const markSeenOnDraft = (state, id) => {
    const cutscene = STORY_CUTSCENES[id];
    if (!cutscene)
        return;
    state.seenFlags[cutscene.storyFlag] = true;
    const existing = state.storyLog.find((entry) => entry.id === id);
    if (existing) {
        existing.completed = true;
        return;
    }
    state.storyLog.push({
        id,
        firstSeenAt: Date.now(),
        completed: true,
    });
};
export const useStoryStore = create()(immer((set, get) => ({
    ...createInitialStoryState(),
    startCutscene: (id, opts) => {
        const cutscene = STORY_CUTSCENES[id];
        if (!cutscene)
            return;
        const replay = Boolean(opts?.replay);
        if (!replay && get().seenFlags[cutscene.storyFlag])
            return;
        set((state) => {
            state.activeCutsceneId = id;
            state.slideIndex = 0;
            state.isReplay = replay;
            state.queuedCutsceneIds = state.queuedCutsceneIds.filter((queuedId) => queuedId !== id);
        });
    },
    queueCutscene: (id) => {
        const cutscene = STORY_CUTSCENES[id];
        if (!cutscene || get().seenFlags[cutscene.storyFlag])
            return;
        if (get().activeCutsceneId === id || get().queuedCutsceneIds.includes(id))
            return;
        set((state) => {
            state.queuedCutsceneIds.push(id);
        });
    },
    advanceSlide: () => {
        const activeId = get().activeCutsceneId;
        if (!activeId)
            return;
        const cutscene = STORY_CUTSCENES[activeId];
        const lastIndex = Math.max(0, cutscene.slides.length - 1);
        set((state) => {
            state.slideIndex = Math.min(lastIndex, state.slideIndex + 1);
        });
    },
    setSlideIndex: (slideIndex) => {
        const activeId = get().activeCutsceneId;
        if (!activeId)
            return;
        const cutscene = STORY_CUTSCENES[activeId];
        const lastIndex = Math.max(0, cutscene.slides.length - 1);
        set((state) => {
            state.slideIndex = Math.max(0, Math.min(lastIndex, Math.floor(slideIndex)));
        });
    },
    markSeen: (id) => {
        set((state) => {
            markSeenOnDraft(state, id);
        });
    },
    skipCutscene: () => {
        const activeId = get().activeCutsceneId;
        if (!activeId)
            return;
        const replay = get().isReplay;
        set((state) => {
            if (!replay) {
                markSeenOnDraft(state, activeId);
            }
            state.activeCutsceneId = null;
            state.slideIndex = 0;
            state.isReplay = false;
        });
    },
    completeCutscene: () => {
        const activeId = get().activeCutsceneId;
        if (!activeId)
            return;
        const replay = get().isReplay;
        set((state) => {
            if (!replay) {
                markSeenOnDraft(state, activeId);
            }
            state.activeCutsceneId = null;
            state.slideIndex = 0;
            state.isReplay = false;
        });
    },
    clearActive: () => {
        set((state) => {
            state.activeCutsceneId = null;
            state.slideIndex = 0;
            state.isReplay = false;
        });
    },
    drainQueue: () => {
        const nextId = get().queuedCutsceneIds[0] ?? null;
        if (!nextId)
            return null;
        set((state) => {
            state.queuedCutsceneIds = state.queuedCutsceneIds.slice(1);
        });
        return nextId;
    },
    toSaveState: () => ({
        seenFlags: { ...get().seenFlags },
        storyLog: get().storyLog.map((entry) => ({ ...entry })),
    }),
    hydrateFromSave: (saveState) => {
        const nextSeenFlags = saveState?.seenFlags && typeof saveState.seenFlags === 'object'
            ? { ...saveState.seenFlags }
            : {};
        const nextStoryLog = cloneStoryLog(saveState?.storyLog);
        set((state) => {
            Object.assign(state, createInitialStoryState());
            state.seenFlags = nextSeenFlags;
            state.storyLog = nextStoryLog;
        });
    },
})));
export const selectActiveStoryCutscene = (state) => state.activeCutsceneId ? STORY_CUTSCENES[state.activeCutsceneId] : null;
