import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createDefaultPavilionSaveState, sanitizePavilionSaveState, } from '../features/pavilion/pavilionUnlocks.js';
function uniquePush(list, entryId) {
    if (!list.includes(entryId))
        list.push(entryId);
}
function setStateKind(state, entryId, kind) {
    state.stateByEntryId[entryId] = kind;
    if (kind === 'recorded')
        uniquePush(state.recordedEntryIds, entryId);
    if (kind === 'studied')
        uniquePush(state.studiedEntryIds, entryId);
    if (kind === 'mastered')
        uniquePush(state.masteredEntryIds, entryId);
}
function toSaveSnapshot(state) {
    return {
        selectedEntryId: state.selectedEntryId,
        selectedCategoryId: state.selectedCategoryId,
        searchQuery: state.searchQuery,
        activeFilters: [...state.activeFilters],
        stateByEntryId: { ...state.stateByEntryId },
        seenEntryIds: [...state.seenEntryIds],
        recordedEntryIds: [...state.recordedEntryIds],
        studiedEntryIds: [...state.studiedEntryIds],
        masteredEntryIds: [...state.masteredEntryIds],
        pinnedEntryIds: [...state.pinnedEntryIds],
        recentEntryIds: [...state.recentEntryIds],
        dismissedGuidanceIds: [...state.dismissedGuidanceIds],
        priorLifeAnnotations: Object.fromEntries(Object.entries(state.priorLifeAnnotations).map(([entryId, notes]) => [entryId, [...notes]])),
        entryUnlockVersion: state.entryUnlockVersion,
    };
}
const initial = createDefaultPavilionSaveState();
export const usePavilionStore = create()(immer((set, get) => ({
    ...initial,
    jadeSlipEntryId: null,
    selectEntry: (entryId) => {
        set((state) => {
            state.selectedEntryId = entryId;
            state.recentEntryIds = [entryId, ...state.recentEntryIds.filter((id) => id !== entryId)].slice(0, 12);
        });
        get().markSeen(entryId);
    },
    selectCategory: (categoryId) => {
        set((state) => {
            state.selectedCategoryId = categoryId;
        });
    },
    setSearchQuery: (query) => {
        set((state) => {
            state.searchQuery = query;
        });
    },
    toggleFilter: (filterId) => {
        set((state) => {
            state.activeFilters = state.activeFilters.includes(filterId)
                ? state.activeFilters.filter((id) => id !== filterId)
                : [...state.activeFilters, filterId];
        });
    },
    clearFilters: () => {
        set((state) => {
            state.activeFilters = [];
        });
    },
    pinEntry: (entryId) => {
        set((state) => {
            uniquePush(state.pinnedEntryIds, entryId);
        });
    },
    unpinEntry: (entryId) => {
        set((state) => {
            state.pinnedEntryIds = state.pinnedEntryIds.filter((id) => id !== entryId);
        });
    },
    markSeen: (entryId) => {
        set((state) => {
            uniquePush(state.seenEntryIds, entryId);
        });
    },
    markRecorded: (entryId) => {
        set((state) => {
            setStateKind(state, entryId, 'recorded');
        });
    },
    markStudied: (entryId) => {
        set((state) => {
            setStateKind(state, entryId, 'studied');
        });
    },
    markMastered: (entryId) => {
        set((state) => {
            setStateKind(state, entryId, 'mastered');
        });
    },
    openJadeSlip: (entryId) => {
        set((state) => {
            state.jadeSlipEntryId = entryId;
            state.selectedEntryId = entryId;
            state.recentEntryIds = [entryId, ...state.recentEntryIds.filter((id) => id !== entryId)].slice(0, 12);
        });
        get().markSeen(entryId);
    },
    closeJadeSlip: () => {
        set((state) => {
            state.jadeSlipEntryId = null;
        });
    },
    toSaveState: () => toSaveSnapshot(get()),
    hydrateFromSaveState: (incoming) => {
        const sanitized = sanitizePavilionSaveState(incoming);
        set((state) => {
            Object.assign(state, sanitized);
            state.jadeSlipEntryId = null;
        });
    },
    hardResetPavilionUiOnly: () => {
        const fresh = createDefaultPavilionSaveState();
        set((state) => {
            Object.assign(state, fresh);
            state.jadeSlipEntryId = null;
        });
    },
})));
