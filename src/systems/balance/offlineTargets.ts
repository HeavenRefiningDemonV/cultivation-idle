import type { OfflineCatchupSummary } from '../../services/time/OfflineCatchup.js';

export const OFFLINE_MODAL_SUMMARY_PART_ORDER = ['qi_gained', 'path_training', 'dao_heart', 'queued_actions', 'expeditions'] as const;
export type OfflineModalSummaryPartKind = (typeof OFFLINE_MODAL_SUMMARY_PART_ORDER)[number];

export const OFFLINE_MODAL_FRAMING_FIELDS = {
  timeOffline: 'time_offline',
  cappedNotice: 'capped_notice',
} as const;

export const OFFLINE_TIMER_BOUNDS_POLICY = {
  queuedActionsAdvanceToReady: true,
  expeditionsAdvanceToComplete: true,
  autoClaim: false,
  autoRestart: false,
  recursiveHiddenCyclesFromSingleStartedRun: false,
} as const;

export const OFFLINE_MODAL_SUMMARY_POLICY = {
  allowedKindsInOrder: OFFLINE_MODAL_SUMMARY_PART_ORDER,
  includeEfficiencyHeadlineRow: false,
  includeCultivationInternalRows: false,
  framingFields: OFFLINE_MODAL_FRAMING_FIELDS,
} as const;

export function shouldShowOfflineProgressModal(summary: OfflineCatchupSummary | null): boolean {
  if (!summary) return false;
  if (summary.wasCapped) return true;
  return summary.parts.some((part) => OFFLINE_MODAL_SUMMARY_PART_ORDER.includes(part.kind));
}
