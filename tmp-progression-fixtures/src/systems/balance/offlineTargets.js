export const OFFLINE_MODAL_SUMMARY_PART_ORDER = ['qi_gained', 'queued_actions', 'expeditions'];
export const OFFLINE_MODAL_FRAMING_FIELDS = {
    timeOffline: 'time_offline',
    cappedNotice: 'capped_notice',
};
export const OFFLINE_TIMER_BOUNDS_POLICY = {
    queuedActionsAdvanceToReady: true,
    expeditionsAdvanceToComplete: true,
    autoClaim: false,
    autoRestart: false,
    recursiveHiddenCyclesFromSingleStartedRun: false,
};
export const OFFLINE_MODAL_SUMMARY_POLICY = {
    allowedKindsInOrder: OFFLINE_MODAL_SUMMARY_PART_ORDER,
    includeEfficiencyHeadlineRow: false,
    includeCultivationInternalRows: false,
    framingFields: OFFLINE_MODAL_FRAMING_FIELDS,
};
export function shouldShowOfflineProgressModal(summary) {
    if (!summary)
        return false;
    if (summary.wasCapped)
        return true;
    return summary.parts.some((part) => OFFLINE_MODAL_SUMMARY_PART_ORDER.includes(part.kind));
}
