export const PAVILION_UNLOCK_VERSION = 1;
export function createDefaultPavilionSaveState() {
    return {
        selectedEntryId: null,
        selectedCategoryId: null,
        searchQuery: '',
        activeFilters: [],
        stateByEntryId: {},
        seenEntryIds: [],
        recordedEntryIds: [],
        studiedEntryIds: [],
        masteredEntryIds: [],
        pinnedEntryIds: [],
        recentEntryIds: [],
        dismissedGuidanceIds: [],
        priorLifeAnnotations: {},
        entryUnlockVersion: PAVILION_UNLOCK_VERSION,
    };
}
const VALID_STATES = new Set(['sealed', 'rumored', 'recorded', 'studied', 'mastered']);
function isRecord(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}
function sanitizeStringArray(value) {
    return Array.isArray(value) ? value.filter((entry) => typeof entry === 'string') : [];
}
function sanitizeStateMap(value) {
    if (!isRecord(value))
        return {};
    return Object.fromEntries(Object.entries(value).filter((entry) => (typeof entry[0] === 'string' && VALID_STATES.has(entry[1]))));
}
function sanitizePriorNotes(value) {
    if (!isRecord(value))
        return {};
    const result = {};
    Object.entries(value).forEach(([entryId, notes]) => {
        const clean = sanitizeStringArray(notes);
        if (clean.length > 0)
            result[entryId] = clean;
    });
    return result;
}
export function sanitizePavilionSaveState(value) {
    const defaults = createDefaultPavilionSaveState();
    if (!isRecord(value))
        return defaults;
    return {
        selectedEntryId: typeof value.selectedEntryId === 'string' ? value.selectedEntryId : null,
        selectedCategoryId: typeof value.selectedCategoryId === 'string' ? value.selectedCategoryId : null,
        searchQuery: typeof value.searchQuery === 'string' ? value.searchQuery : '',
        activeFilters: sanitizeStringArray(value.activeFilters),
        stateByEntryId: sanitizeStateMap(value.stateByEntryId),
        seenEntryIds: sanitizeStringArray(value.seenEntryIds),
        recordedEntryIds: sanitizeStringArray(value.recordedEntryIds),
        studiedEntryIds: sanitizeStringArray(value.studiedEntryIds),
        masteredEntryIds: sanitizeStringArray(value.masteredEntryIds),
        pinnedEntryIds: sanitizeStringArray(value.pinnedEntryIds),
        recentEntryIds: sanitizeStringArray(value.recentEntryIds).slice(0, 12),
        dismissedGuidanceIds: sanitizeStringArray(value.dismissedGuidanceIds),
        priorLifeAnnotations: sanitizePriorNotes(value.priorLifeAnnotations),
        entryUnlockVersion: typeof value.entryUnlockVersion === 'number'
            ? value.entryUnlockVersion
            : defaults.entryUnlockVersion,
    };
}
export function resolvePavilionRecordState(record, saveState) {
    const override = saveState?.stateByEntryId?.[record.id];
    return override ?? record.state;
}
export function reconcilePavilionSaveState(saveState, validEntryIds, options = {}) {
    const valid = new Set(validEntryIds);
    const keep = (ids) => ids.filter((id) => valid.has(id));
    const cleanStateMap = {};
    Object.entries(saveState.stateByEntryId).forEach(([entryId, state]) => {
        if (valid.has(entryId))
            cleanStateMap[entryId] = state;
    });
    const cleanPrior = {};
    Object.entries(saveState.priorLifeAnnotations).forEach(([entryId, notes]) => {
        if (valid.has(entryId))
            cleanPrior[entryId] = [...notes];
    });
    return {
        ...saveState,
        selectedEntryId: saveState.selectedEntryId && valid.has(saveState.selectedEntryId) ? saveState.selectedEntryId : null,
        stateByEntryId: cleanStateMap,
        seenEntryIds: keep(saveState.seenEntryIds),
        recordedEntryIds: keep(saveState.recordedEntryIds),
        studiedEntryIds: keep(saveState.studiedEntryIds),
        masteredEntryIds: keep(saveState.masteredEntryIds),
        pinnedEntryIds: options.preserveArchive === false ? [] : keep(saveState.pinnedEntryIds),
        recentEntryIds: options.preserveArchive === false ? [] : keep(saveState.recentEntryIds),
        priorLifeAnnotations: options.preserveArchive === false ? {} : cleanPrior,
        entryUnlockVersion: saveState.entryUnlockVersion + 1,
    };
}
