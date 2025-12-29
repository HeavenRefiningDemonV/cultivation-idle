import { useMemo } from 'react';
import { useUIStore } from '../stores/uiStore';
import './NotificationToasts.scss';

export function NotificationToasts() {
  const notifications = useUIStore((state) => state.notifications);
  const removeNotification = useUIStore((state) => state.removeNotification);

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => a.timestamp - b.timestamp);
  }, [notifications]);

  if (sortedNotifications.length === 0) return null;

  return (
    <div className="notificationToasts">
      {sortedNotifications.map((toast) => (
        <div key={toast.id} className={`notificationToast notificationToast--${toast.type}`}>
          <div className="notificationToast__message">{toast.message}</div>
          <button
            type="button"
            className="notificationToast__close"
            onClick={() => removeNotification(toast.id)}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
