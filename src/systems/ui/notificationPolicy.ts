import type { UINotification } from '../../stores/uiStore.js';

export type NotificationPriority = 'low' | 'normal' | 'high';

export type NotificationOptions = {
  durationMs?: number;
  dedupeKey?: string;
  cooldownMs?: number;
  source?: string;
  priority?: NotificationPriority;
};

export type NotificationHierarchyState = {
  showPrestigeModal: boolean;
  showPerkSelectionModal: boolean;
  showOfflineProgressModal: boolean;
  showManualSatchelModal: boolean;
  showTechniqueLearnedModal: boolean;
  showWorldBuildingModal: boolean;
  showCurrentChapterExhaustedModal: boolean;
  showLifeSummaryModal: boolean;
  showMigrationIssuesModal?: boolean;
  pendingCityArrivalId: string | null;
  activeOnboardingPrompt: unknown | null;
  combatPresentationMode: 'hidden' | 'preview' | 'active' | 'docked';
  lifeStartWizardOpen?: boolean;
  // F2-S5 — the shared modals block notifications so a toast never pops over a ceremony / inspector.
  showItemDetailInspector?: boolean;
  showRitualCeremony?: boolean;
};

export const MAX_VISIBLE_NOTIFICATIONS = 3;
export const MAX_PENDING_NOTIFICATIONS = 20;
export const DEFAULT_NOTIFICATION_DURATION_MS = 4200;
export const DEFAULT_NOTIFICATION_COOLDOWN_MS = 1800;

export type NotificationPolicyContext = {
  now: number;
  visible: UINotification[];
  pending: UINotification[];
  options: NotificationOptions;
  type: UINotification['type'];
  message: string;
  createId: () => string;
  overlayBlocked: boolean;
  lastTriggeredAtByKey: Map<string, number>;
};

const priorityRank: Record<NotificationPriority, number> = { low: 0, normal: 1, high: 2 };

const normalizePriority = (priority?: NotificationPriority): NotificationPriority => priority ?? 'normal';

export const buildNotificationDedupeKey = (
  type: UINotification['type'],
  message: string,
  options: NotificationOptions,
): string => {
  if (options.dedupeKey && options.dedupeKey.trim()) return options.dedupeKey.trim();
  const source = options.source?.trim() || 'ui';
  return `${source}::${type}::${message.trim()}`;
};

const sortByTimestamp = (items: UINotification[]): UINotification[] => [...items].sort((a, b) => a.timestamp - b.timestamp);

const maybePromotePending = (
  visible: UINotification[],
  pending: UINotification[],
  overlayBlocked: boolean,
): { visible: UINotification[]; pending: UINotification[]; becameVisible: UINotification[] } => {
  if (overlayBlocked || visible.length >= MAX_VISIBLE_NOTIFICATIONS || pending.length === 0) {
    return { visible, pending, becameVisible: [] };
  }

  const nextVisible = [...visible];
  const nextPending = sortByTimestamp(pending);
  const becameVisible: UINotification[] = [];

  while (nextVisible.length < MAX_VISIBLE_NOTIFICATIONS && nextPending.length > 0) {
    const promoted = nextPending.shift();
    if (!promoted) break;
    nextVisible.push(promoted);
    becameVisible.push(promoted);
  }

  return { visible: sortByTimestamp(nextVisible), pending: nextPending, becameVisible };
};

export const isNotificationOverlayBlocked = (state: NotificationHierarchyState): boolean =>
  state.lifeStartWizardOpen === true
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
  || state.combatPresentationMode !== 'hidden'
  || state.showItemDetailInspector === true
  || state.showRitualCeremony === true;

export const applyNotificationPolicy = (
  context: NotificationPolicyContext,
): {
  visible: UINotification[];
  pending: UINotification[];
  becameVisible: UINotification[];
  accepted: boolean;
} => {
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

  const notification: UINotification = {
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
  } else {
    nextVisible.push(notification);
  }

  const trimmedPending = sortByTimestamp(nextPending).slice(-MAX_PENDING_NOTIFICATIONS);
  const promoted = maybePromotePending(sortByTimestamp(nextVisible), trimmedPending, context.overlayBlocked);

  const orderedVisible = sortByTimestamp(promoted.visible).sort(
    (a, b) => priorityRank[b.priority ?? 'normal'] - priorityRank[a.priority ?? 'normal'] || a.timestamp - b.timestamp,
  );

  return {
    visible: orderedVisible,
    pending: promoted.pending,
    becameVisible: promoted.becameVisible,
    accepted: true,
  };
};

export const promotePendingNotifications = (
  visible: UINotification[],
  pending: UINotification[],
  overlayBlocked: boolean,
): { visible: UINotification[]; pending: UINotification[]; becameVisible: UINotification[] } => {
  const promoted = maybePromotePending(sortByTimestamp(visible), sortByTimestamp(pending), overlayBlocked);
  return promoted;
};
