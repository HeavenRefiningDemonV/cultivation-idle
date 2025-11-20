import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

/**
 * UI notification types
 */
export interface UINotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
  duration?: number; // Auto-dismiss after N milliseconds (optional)
}

/**
 * Available game tabs
 */
export type GameTab = 'cultivation' | 'status' | 'adventure' | 'dungeon' | 'inventory' | 'techniques' | 'prestige' | 'settings';

/**
 * UI state interface
 */
export interface UIState {
  // Active tab
  activeTab: GameTab;

  // Side panel visibility
  showSidePanel: boolean;

  // Notifications
  notifications: UINotification[];

  // Modals
  showPrestigeModal: boolean;
  showPathSelectionModal: boolean;
  showPerkSelectionModal: boolean;
  perkSelectionRealm: number | null;
  showBreakthroughAnimation: boolean;

  // Tooltips
  tooltipVisible: boolean;
  tooltipContent: string;
  tooltipPosition: { x: number; y: number };

  // Actions
  setActiveTab: (tab: GameTab) => void;
  toggleSidePanel: () => void;
  addNotification: (type: UINotification['type'], message: string, duration?: number) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  showPrestige: () => void;
  hidePrestige: () => void;
  showPathSelection: () => void;
  hidePathSelection: () => void;
  showPerkSelection: (realmIndex: number) => void;
  hidePerkSelection: () => void;
  triggerBreakthroughAnimation: () => void;
  showTooltip: (content: string, x: number, y: number) => void;
  hideTooltip: () => void;
}

/**
 * Generate unique notification ID
 */
function generateNotificationId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * UI store for managing interface state
 */
export const useUIStore = create<UIState>()(
  immer((set, get) => ({
    // Initial state
    activeTab: 'cultivation',
    showSidePanel: false,
    notifications: [],
    showPrestigeModal: false,
    showPathSelectionModal: false,
    showPerkSelectionModal: false,
    perkSelectionRealm: null,
    showBreakthroughAnimation: false,
    tooltipVisible: false,
    tooltipContent: '',
    tooltipPosition: { x: 0, y: 0 },

    /**
     * Set the active tab
     */
    setActiveTab: (tab: GameTab) => {
      set((state) => {
        state.activeTab = tab;
      });

      console.log(`[UI] Active tab changed to: ${tab}`);
    },

    /**
     * Toggle side panel visibility
     */
    toggleSidePanel: () => {
      set((state) => {
        state.showSidePanel = !state.showSidePanel;
      });

      const newState = get().showSidePanel;
      console.log(`[UI] Side panel ${newState ? 'opened' : 'closed'}`);
    },

    /**
     * Add a notification
     */
    addNotification: (type: UINotification['type'], message: string, duration?: number) => {
      const notification: UINotification = {
        id: generateNotificationId(),
        type,
        message,
        timestamp: Date.now(),
        duration,
      };

      set((state) => {
        state.notifications.push(notification);
      });

      // Auto-dismiss if duration is set
      if (duration) {
        setTimeout(() => {
          get().removeNotification(notification.id);
        }, duration);
      }

      console.log(`[UI] Notification added: ${type} - ${message}`);
    },

    /**
     * Remove a notification by ID
     */
    removeNotification: (id: string) => {
      set((state) => {
        const index = state.notifications.findIndex((n: UINotification) => n.id === id);
        if (index !== -1) {
          state.notifications.splice(index, 1);
        }
      });
    },

    /**
     * Clear all notifications
     */
    clearNotifications: () => {
      set((state) => {
        state.notifications = [];
      });

      console.log('[UI] All notifications cleared');
    },

    /**
     * Show prestige modal
     */
    showPrestige: () => {
      set((state) => {
        state.showPrestigeModal = true;
      });
    },

    /**
     * Hide prestige modal
     */
    hidePrestige: () => {
      set((state) => {
        state.showPrestigeModal = false;
      });
    },

    /**
     * Show path selection modal
     */
    showPathSelection: () => {
      set((state) => {
        state.showPathSelectionModal = true;
      });
    },

    /**
     * Hide path selection modal
     */
    hidePathSelection: () => {
      set((state) => {
        state.showPathSelectionModal = false;
      });
    },

    /**
     * Show perk selection modal for the given realm
     */
    showPerkSelection: (realmIndex: number) => {
      set((state) => {
        state.showPerkSelectionModal = true;
        state.perkSelectionRealm = realmIndex;
      });
    },

    /**
     * Hide perk selection modal
     */
    hidePerkSelection: () => {
      set((state) => {
        state.showPerkSelectionModal = false;
        state.perkSelectionRealm = null;
      });
    },

    /**
     * Trigger breakthrough animation
     */
    triggerBreakthroughAnimation: () => {
      set((state) => {
        state.showBreakthroughAnimation = true;
      });

      setTimeout(() => {
        set((state) => {
          state.showBreakthroughAnimation = false;
        });
      }, 2000);
    },

    /**
     * Show tooltip
     */
    showTooltip: (content: string, x: number, y: number) => {
      set((state) => {
        state.tooltipVisible = true;
        state.tooltipContent = content;
        state.tooltipPosition = { x, y };
      });
    },

    /**
     * Hide tooltip
     */
    hideTooltip: () => {
      set((state) => {
        state.tooltipVisible = false;
      });
    },
  }))
);
