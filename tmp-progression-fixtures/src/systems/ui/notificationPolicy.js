export const MAX_VISIBLE_NOTIFICATIONS = 3;
export const MAX_PENDING_NOTIFICATIONS = 20;
export const DEFAULT_NOTIFICATION_DURATION_MS = 4200;
export const DEFAULT_NOTIFICATION_COOLDOWN_MS = 1800;
const priorityRank = { low: 0, normal: 1, high: 2 };
const normalizePriority = (priority) => priority ?? 'normal';
export const buildNotificationDedupeKey = (type, message, options) => {
    if (options.dedupeKey && options.dedupeKey.trim())
        return options.dedupeKey.trim();
    const source = options.source?.trim() || 'ui';
    return `${source}::${type}::${message.trim()}`;
};
const sortByTimestamp = (items) => [...items].sort((a, b) => a.timestamp - b.timestamp);
const maybePromotePending = (visible, pending, overlayBlocked) => {
    if (overlayBlocked || visible.length >= MAX_VISIBLE_NOTIFICATIONS || pending.length === 0) {
        return { visible, pending, becameVisible: [] };
    }
    const nextVisible = [...visible];
    const nextPending = sortByTimestamp(pending);
    const becameVisible = [];
    while (nextVisible.length < MAX_VISIBLE_NOTIFICATIONS && nextPending.length > 0) {
        const promoted = nextPending.shift();
        if (!promoted)
            break;
        nextVisible.push(promoted);
        becameVisible.push(promoted);
    }
    return { visible: sortByTimestamp(nextVisible), pending: nextPending, becameVisible };
};
export const isNotificationOverlayBlocked = (state) => state.lifeStartWizardOpen === true
    || state.showPrestigeModal
    || state.showPerkSelectionModal
    || state.showOfflineProgressModal
    || state.showManualSatchelModal
    || state.showTechniqueLearnedModal
    || state.showWorldBuildingModal
    || state.showCurrentChapterExhaustedModal
    || state.showLifeSummaryModal
    || state.showMigrationIssuesModal === true
    || state.pendingCityArrivalId !== null
    || state.activeOnboardingPrompt !== null
    || state.combatPresentationMode !== 'hidden';
export const applyNotificationPolicy = (context) => {
    const options = context.options;
    const durationMs = options.durationMs ?? DEFAULT_NOTIFICATION_DURATION_MS;
    const cooldownMs = Math.max(0, options.cooldownMs ?? DEFAULT_NOTIFICATION_COOLDOWN_MS);
    const dedupeKey = buildNotificationDedupeKey(context.type, context.message, options);
    const priority = normalizePriority(options.priority);
    const lastTriggeredAt = context.lastTriggeredAtByKey.get(dedupeKey);
    if (typeof lastTriggeredAt === 'number' && context.now - lastTriggeredAt < cooldownMs) {
        return {
            visible: context.visible,
            pending: context.pending,
            becameVisible: [],
            accepted: false,
        };
    }
    context.lastTriggeredAtByKey.set(dedupeKey, context.now);
    const nextVisible = [...context.visible];
    const nextPending = [...context.pending];
    const existingVisibleIndex = nextVisible.findIndex((item) => item.dedupeKey === dedupeKey);
    if (existingVisibleIndex >= 0) {
        const current = nextVisible[existingVisibleIndex];
        nextVisible[existingVisibleIndex] = {
            ...current,
            message: context.message,
            timestamp: context.now,
            duration: durationMs,
            source: options.source,
            priority,
            dedupeKey,
        };
        return {
            visible: sortByTimestamp(nextVisible),
            pending: sortByTimestamp(nextPending),
            becameVisible: [],
            accepted: true,
        };
    }
    const existingPendingIndex = nextPending.findIndex((item) => item.dedupeKey === dedupeKey);
    if (existingPendingIndex >= 0) {
        const current = nextPending[existingPendingIndex];
        nextPending[existingPendingIndex] = {
            ...current,
            message: context.message,
            timestamp: context.now,
            duration: durationMs,
            source: options.source,
            priority,
            dedupeKey,
        };
        return {
            visible: sortByTimestamp(nextVisible),
            pending: sortByTimestamp(nextPending),
            becameVisible: [],
            accepted: true,
        };
    }
    const notification = {
        id: context.createId(),
        type: context.type,
        message: context.message,
        timestamp: context.now,
        duration: durationMs,
        dedupeKey,
        source: options.source,
        priority,
    };
    if (context.overlayBlocked || nextVisible.length >= MAX_VISIBLE_NOTIFICATIONS) {
        nextPending.push(notification);
    }
    else {
        nextVisible.push(notification);
    }
    const trimmedPending = sortByTimestamp(nextPending).slice(-MAX_PENDING_NOTIFICATIONS);
    const promoted = maybePromotePending(sortByTimestamp(nextVisible), trimmedPending, context.overlayBlocked);
    const orderedVisible = sortByTimestamp(promoted.visible).sort((a, b) => priorityRank[b.priority ?? 'normal'] - priorityRank[a.priority ?? 'normal'] || a.timestamp - b.timestamp);
    return {
        visible: orderedVisible,
        pending: promoted.pending,
        becameVisible: promoted.becameVisible,
        accepted: true,
    };
};
export const promotePendingNotifications = (visible, pending, overlayBlocked) => {
    const promoted = maybePromotePending(sortByTimestamp(visible), sortByTimestamp(pending), overlayBlocked);
    return promoted;
};
