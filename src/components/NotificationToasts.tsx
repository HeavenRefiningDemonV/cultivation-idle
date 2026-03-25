import { useEffect, useMemo } from 'react';
import { useUIStore } from '../stores/uiStore.js';
import './NotificationToasts.scss';
import { GameIcon } from '../ui/icons/index.js';
import { MAX_VISIBLE_NOTIFICATIONS } from '../systems/ui/notificationPolicy.js';

export function NotificationToasts() {
  const notifications = useUIStore((state) => state.notifications);
  const pendingNotifications = useUIStore((state) => state.pendingNotifications);
  const removeNotification = useUIStore((state) => state.removeNotification);
  const flushNotificationQueue = useUIStore((state) => state.flushNotificationQueue);
  const pendingCityArrivalId = useUIStore((state) => state.pendingCityArrivalId);
  const activeOnboardingPrompt = useUIStore((state) => state.activeOnboardingPrompt);
  const isBlockedByOverlay = useUIStore((state) =>
    state.lifeStartWizardOpenForNotifications
    || state.showPrestigeModal
    || state.showPerkSelectionModal
    || state.showOfflineProgressModal
    || state.showManualSatchelModal
    || state.showTechniqueLearnedModal
    || state.showWorldBuildingModal
    || state.showCurrentChapterExhaustedModal
    || state.combatPresentation.mode !== 'hidden',
  );

  const sortedNotifications = useMemo(() => {
    return [...notifications]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, MAX_VISIBLE_NOTIFICATIONS);
  }, [notifications]);

  useEffect(() => {
    if (isBlockedByOverlay) return;
    if (notifications.length < MAX_VISIBLE_NOTIFICATIONS && pendingNotifications.length > 0) {
      flushNotificationQueue();
    }
  }, [flushNotificationQueue, isBlockedByOverlay, notifications.length, pendingNotifications.length]);

  if (sortedNotifications.length === 0) return null;
  const className = `notificationToasts ${(pendingCityArrivalId || activeOnboardingPrompt) ? 'notificationToasts--defer' : ''}`.trim();

  return (
    <div className={className}>
      {sortedNotifications.map((toast) => (
        <div key={toast.id} className={`notificationToast notificationToast--${toast.type}`}>
          <div className="notificationToast__message">{toast.message}</div>
          <button
            type="button"
            className="notificationToast__close"
            onClick={() => removeNotification(toast.id)}
            aria-label="Dismiss notification"
          >
            <GameIcon icon="inkX" size={12} decorative />
          </button>
        </div>
      ))}
    </div>
  );
}
