import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { OfflineProgressSummary } from '../systems/offline';
import type { OfflineCatchupResult } from '../services/time/OfflineCatchup';

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
export type GameTab =
  | 'cultivation'
  | 'status'
  | 'adventure'
  | 'inventory'
  | 'techniques'
  | 'prestige'
  | 'settings';

export interface UISettingsState {
  showOfflineModal: boolean;
  showCombatLog: boolean;
  requirePrestigeConfirm: boolean;
  showSystemStatusPanel: boolean;
}

interface UIStateBase {
  // Active tab
  activeTab: GameTab;

  // Header titles
  headerTitle: string;
  headerSubtitle: string;
  headerTone: 'dark' | 'light';

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
  showOfflineProgressModal: boolean;
  offlineProgressSummary: OfflineProgressSummary | null;
  showManualSatchelModal: boolean;
  showTechniqueLearnedModal: boolean;
  techniqueLearnedPayload: {
    techId: string;
    grade: string;
    rarity: string;
    focusReward?: string;
    learnedAt: number;
  } | null;

  // UI Settings
  settings: UISettingsState;

  // Save + offline transparency
  lastSaveAt: number | null;
  lastOfflineSummary: OfflineCatchupResult['summary'];

  // Tooltips
  tooltipVisible: boolean;
  tooltipContent: string;
  tooltipPosition: { x: number; y: number };
}

/**
 * UI state interface
 */
export interface UIState extends UIStateBase {
  setActiveTab: (tab: GameTab) => void;
  setHeaderTitles: (title: string, subtitle?: string) => void;
  setHeaderTone: (tone: UIStateBase['headerTone']) => void;
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
  showOfflineProgress: (summary: OfflineProgressSummary) => void;
  hideOfflineProgress: () => void;
  showTooltip: (content: string, x: number, y: number) => void;
  hideTooltip: () => void;
  setLastSaveAt: (timestamp: number | null) => void;
  setLastOfflineSummary: (summary: OfflineCatchupResult['summary']) => void;
  setSettings: (partial: Partial<UISettingsState>) => void;
  openManualSatchel: () => void;
  closeManualSatchel: () => void;
  openTechniqueLearned: (payload: UIState['techniqueLearnedPayload']) => void;
  closeTechniqueLearned: () => void;
  hardResetUI: () => void;
}

const INITIAL_UI_STATE: UIStateBase = {
  activeTab: 'cultivation',
  headerTitle: '',
  headerSubtitle: '',
  headerTone: 'dark',
  showSidePanel: false,
  notifications: [],
  showPrestigeModal: false,
  showPathSelectionModal: false,
  showPerkSelectionModal: false,
  perkSelectionRealm: null,
  showBreakthroughAnimation: false,
  showOfflineProgressModal: false,
  offlineProgressSummary: null,
  showManualSatchelModal: false,
  showTechniqueLearnedModal: false,
  techniqueLearnedPayload: null,
  settings: {
    showOfflineModal: true,
    showCombatLog: true,
    requirePrestigeConfirm: true,
    showSystemStatusPanel: false,
  },
  lastSaveAt: null,
  lastOfflineSummary: null,
  tooltipVisible: false,
  tooltipContent: '',
  tooltipPosition: { x: 0, y: 0 },
};

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
    ...INITIAL_UI_STATE,

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
     * Update the header titles displayed in the top bar
     */
    setHeaderTitles: (title: string, subtitle = '') => {
      set((state) => {
        state.headerTitle = title;
        state.headerSubtitle = subtitle;
      });
    },

    /**
     * Adjust the header tone (e.g., for modal overlays)
     */
    setHeaderTone: (tone: UIStateBase['headerTone']) => {
      set((state) => {
        state.headerTone = tone;
      });
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
     * Navigate to prestige tab
     */
    showPrestige: () => {
      set((state) => {
        state.activeTab = 'prestige';
        state.showPrestigeModal = false;
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
        state.perkSelectionRealm = null;
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
     * Show offline progress modal
     */
    showOfflineProgress: (summary: OfflineProgressSummary) => {
      set((state) => {
        state.showOfflineProgressModal = true;
        state.offlineProgressSummary = summary;
      });
    },

    /**
     * Hide offline progress modal
     */
    hideOfflineProgress: () => {
      set((state) => {
        state.showOfflineProgressModal = false;
        state.offlineProgressSummary = null;
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

    setLastSaveAt: (timestamp) => {
      set((state) => {
        state.lastSaveAt = timestamp;
      });
    },

    setLastOfflineSummary: (summary) => {
      set((state) => {
        state.lastOfflineSummary = summary;
      });
    },

    /**
     * Update UI settings
     */
    setSettings: (partial: Partial<UISettingsState>) => {
      set((state) => {
        state.settings = { ...state.settings, ...partial };
      });
    },

    openManualSatchel: () => {
      set((state) => {
        state.showManualSatchelModal = true;
      });
    },

    closeManualSatchel: () => {
      set((state) => {
        state.showManualSatchelModal = false;
      });
    },

    openTechniqueLearned: (payload) => {
      set((state) => {
        state.showTechniqueLearnedModal = true;
        state.techniqueLearnedPayload = payload;
      });
    },

    closeTechniqueLearned: () => {
      set((state) => {
        state.showTechniqueLearnedModal = false;
        state.techniqueLearnedPayload = null;
      });
    },

    /**
     * Hard reset all UI state
     */
    hardResetUI: () => {
      set((state) => {
        Object.assign(state, INITIAL_UI_STATE);
      });
    },
  }))
);
