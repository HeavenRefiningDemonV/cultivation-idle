import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { OfflineProgressSummary } from '../systems/offline.js';
import type { OfflineCatchupResult } from '../services/time/OfflineCatchup.js';
import { useActivityStore } from './activityStore.js';
import { useCombatStore } from './combatStore.js';
import { useOutskirtsStore } from './outskirtsStore.js';
import { useRuinsStore } from './ruinsStore.js';
import { useContentStore } from './contentStore.js';
import { useTrialStore } from './trialStore.js';
import { useGameStore } from './gameStore.js';
import { useInventoryStore } from './inventoryStore.js';
import { getTrialGateRewardBundle, getTrialLifecycleSnapshot } from '../systems/progression/runtime/index.js';
import { pickEnemyFromPool } from '../components/screens/world/worldUtils.js';
import { GameEvents } from '../services/events/GameEvents.js';

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

export type WorldBuildingKey =
  | 'outskirts'
  | 'gateTrial'
  | 'ruins'
  | 'apothecary'
  | 'manualPavilion'
  | 'alchemy'
  | 'forge'
  | 'talismanStudio'
  | 'bounties'
  | 'expeditions';

const normalizeWorldBuildingKey = (buildingKey: WorldBuildingKey): WorldBuildingKey =>
  buildingKey === 'alchemy' ? 'apothecary' : buildingKey;

export interface UISettingsState {
  showOfflineModal: boolean;
  showCombatLog: boolean;
  requirePrestigeConfirm: boolean;
  showSystemStatusPanel: boolean;
  showCombatMinibar: boolean;
  combatMinibarExpanded: boolean;
  showCombatFloatingNumbers: boolean;
  combatAIProfile: 'balanced' | 'survivor' | 'burst' | 'farmer';
  explainAIEnabled: boolean;
  explainAIHintsRemaining: number;
  autoRetryOnDeath: boolean;
  useConsumablesInCombat: boolean;
  preferredTarget: 'trash' | 'elite' | 'boss';
}

export type CombatPresentationMode = 'hidden' | 'preview' | 'active' | 'docked';

export type CombatPresentationContext = {
  type: 'outskirts' | 'trial' | 'ruins';
  cityId?: string;
  sourceId?: string;
  moduleKey?: string;
  moduleRefId?: string | null;
  source?: string;
};

type CombatPresentationState = {
  mode: CombatPresentationMode;
  context: CombatPresentationContext | null;
};

interface UIStateBase {
  // Active tab
  activeTab: GameTab;

  // Header titles
  headerTitle: string;
  headerSubtitle: string;
  headerTone: 'dark' | 'light';

  // Background overrides
  layoutBackgroundOverride: string | null;

  // Side panel visibility
  showSidePanel: boolean;

  // Notifications
  notifications: UINotification[];

  // Modals
  showPrestigeModal: boolean;
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
  techniqueLibraryIntent:
    | null
    | { type: 'equip'; techniqueId: string; preferredSlotType?: 'active' | 'passive' | 'ultimate' };
  techniqueFocusRequest: { techId: string; action?: 'open' | 'upgradeRank' | 'rerollTraits' } | null;
  lifeStartWizardContext: { lastHeartLawId: string | null };
  showWorldBuildingModal: boolean;
  worldBuildingModalCityId: string | null;
  worldBuildingModalKey: WorldBuildingKey | null;
  pendingCityArrivalId: string | null;

  // UI Settings
  settings: UISettingsState;

  // Save + offline transparency
  lastSaveAt: number | null;
  lastOfflineSummary: OfflineCatchupResult['summary'];

  // Tooltips
  tooltipVisible: boolean;
  tooltipContent: string;
  tooltipPosition: { x: number; y: number };

  combatPresentation: CombatPresentationState;
}

/**
 * UI state interface
 */
export interface UIState extends UIStateBase {
  setActiveTab: (tab: GameTab) => void;
  setHeaderTitles: (title: string, subtitle?: string) => void;
  setHeaderTone: (tone: UIStateBase['headerTone']) => void;
  setLayoutBackgroundOverride: (backgroundUrl: string | null) => void;
  toggleSidePanel: () => void;
  addNotification: (
    type: UINotification['type'],
    message: string,
    duration?: number | { durationMs?: number },
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  showPrestige: () => void;
  hidePrestige: () => void;
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
  toggleCombatMinibarExpanded: () => void;
  openCombatPreview: (context: CombatPresentationContext) => void;
  startCombatFromPreview: () => void;
  closeCombatPresentation: () => void;
  restoreCombatFromDock: () => void;
  stopCombatAndClose: () => void;
  isCombatVisible: () => boolean;
  isCombatDocked: () => boolean;
  openManualSatchel: () => void;
  closeManualSatchel: () => void;
  openTechniqueLearned: (payload: UIState['techniqueLearnedPayload']) => void;
  closeTechniqueLearned: () => void;
  openWorldBuildingModal: (args: { cityId: string; buildingKey: WorldBuildingKey }) => void;
  closeWorldBuildingModal: () => void;
  queueCityArrival: (cityId: string) => void;
  clearCityArrival: () => void;
  setTechniqueLibraryIntent: (intent: UIState['techniqueLibraryIntent']) => void;
  openTechniqueLibraryForEquip: (
    techniqueId: string,
    preferredSlotType?: 'active' | 'passive' | 'ultimate',
  ) => void;
  requestTechniqueFocus: (
    techId: string,
    action?: 'open' | 'upgradeRank' | 'rerollTraits',
  ) => void;
  clearTechniqueFocusRequest: () => void;
  clearTechniqueLibraryIntent: () => void;
  setLifeStartWizardContext: (lastHeartLawId: string | null) => void;
  clearLifeStartWizardContext: () => void;
  hardResetUI: () => void;
}

const INITIAL_UI_STATE: UIStateBase = {
  activeTab: 'cultivation',
  headerTitle: '',
  headerSubtitle: '',
  headerTone: 'dark',
  layoutBackgroundOverride: null,
  showSidePanel: false,
  notifications: [],
  showPrestigeModal: false,
  showPerkSelectionModal: false,
  perkSelectionRealm: null,
  showBreakthroughAnimation: false,
  showOfflineProgressModal: false,
  offlineProgressSummary: null,
  showManualSatchelModal: false,
  showTechniqueLearnedModal: false,
  techniqueLearnedPayload: null,
  techniqueLibraryIntent: null,
  techniqueFocusRequest: null,
  lifeStartWizardContext: { lastHeartLawId: null },
  showWorldBuildingModal: false,
  worldBuildingModalCityId: null,
  worldBuildingModalKey: null,
  pendingCityArrivalId: null,
  settings: {
    showOfflineModal: true,
    showCombatLog: true,
    requirePrestigeConfirm: true,
    showSystemStatusPanel: false,
    showCombatMinibar: true,
    combatMinibarExpanded: true,
    showCombatFloatingNumbers: true,
    combatAIProfile: 'balanced',
    explainAIEnabled: false,
    explainAIHintsRemaining: 3,
    autoRetryOnDeath: false,
    useConsumablesInCombat: false,
    preferredTarget: 'boss',
  },
  lastSaveAt: null,
  lastOfflineSummary: null,
  tooltipVisible: false,
  tooltipContent: '',
  tooltipPosition: { x: 0, y: 0 },
  combatPresentation: { mode: 'hidden', context: null },
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
      const previousTab = get().activeTab;
      set((state) => {
        state.activeTab = tab;
      });

      if (previousTab !== tab) {
        GameEvents.emit({ type: 'ui/tab_changed', payload: { previous: previousTab, next: tab } });
      }

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

    setLayoutBackgroundOverride: (backgroundUrl) => {
      set((state) => {
        state.layoutBackgroundOverride = backgroundUrl;
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
    addNotification: (type: UINotification['type'], message: string, duration?: number | { durationMs?: number }) => {
      const durationMs = typeof duration === 'number' ? duration : duration?.durationMs;
      const notification: UINotification = {
        id: generateNotificationId(),
        type,
        message,
        timestamp: Date.now(),
        duration: durationMs,
      };

      set((state) => {
        state.notifications.push(notification);
      });

      // Auto-dismiss if duration is set
      if (durationMs) {
        setTimeout(() => {
          get().removeNotification(notification.id);
        }, durationMs);
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

    toggleCombatMinibarExpanded: () => {
      set((state) => {
        state.settings.combatMinibarExpanded = !state.settings.combatMinibarExpanded;
      });
    },

    openCombatPreview: (context) => {
      const buildingKey: WorldBuildingKey =
        (context.moduleKey as WorldBuildingKey) ?? (context.type === 'trial' ? 'gateTrial' : context.type);
      if (!context.cityId) return;

      set((state) => {
        state.combatPresentation.mode = 'preview';
        state.combatPresentation.context = {
          ...context,
          cityId: context.cityId,
          moduleKey: context.moduleKey ?? buildingKey,
        };
        state.showWorldBuildingModal = true;
        state.worldBuildingModalCityId = context.cityId ?? null;
        state.worldBuildingModalKey = buildingKey;
      });
    },

    startCombatFromPreview: () => {
      const presentation = get().combatPresentation;
      const context = presentation.context;
      if (!context) return;

      const activityStore = useActivityStore.getState();
      const combatStore = useCombatStore.getState();
      const activeActivity = activityStore.active;

      if (activeActivity && (activeActivity.type !== context.type || activeActivity.sourceId !== context.sourceId)) {
        const confirmed = window.confirm('Stop current combat and start the new encounter?');
        if (!confirmed) return;

        if (activeActivity.type === 'ruins') {
          useRuinsStore.getState().stopRun();
        } else {
          activityStore.stopActivity('combat-presentation-replace');
          combatStore.exitCombat();
        }
      }

      const contentStore = useContentStore.getState();

      if (context.type === 'outskirts') {
        const outskirtsDef = context.sourceId ? contentStore.maps.outskirtsById[context.sourceId] : undefined;
        if (!outskirtsDef) {
          get().addNotification('error', 'Unable to start outskirts: definition missing.');
          return;
        }

        const shouldSpawnBoss = useOutskirtsStore.getState().shouldSpawnBoss(outskirtsDef.id, outskirtsDef);
        const nextEnemyId = shouldSpawnBoss ? outskirtsDef.bossId : pickEnemyFromPool(outskirtsDef.mobPool);
        if (!nextEnemyId) {
          get().addNotification('warning', 'No enemy available for this outskirts run.');
          return;
        }

        activityStore.startActivity('outskirts', { cityId: context.cityId ?? outskirtsDef.cityId, sourceId: outskirtsDef.id });
        combatStore.setAutoAttack(true);
        combatStore.startCombat(nextEnemyId, {
          type: 'outskirts',
          cityId: context.cityId ?? outskirtsDef.cityId,
          sourceId: outskirtsDef.id,
          cityIndex: outskirtsDef.cityIndex,
          isBoss: shouldSpawnBoss,
        });
      } else if (context.type === 'trial') {
        const trialDef = context.sourceId ? contentStore.maps.trialsById[context.sourceId] : undefined;
        if (!trialDef) {
          get().addNotification('error', 'Unable to start trial: definition missing.');
          return;
        }

        const trialProgress = useTrialStore.getState().getProgress(trialDef.id);
        const gameState = useGameStore.getState();
        const requiredItemSatisfied = trialDef.requiredItemId
          ? useInventoryStore.getState().getItemCount(trialDef.requiredItemId) > 0
          : true;
        const lifecycle = getTrialLifecycleSnapshot({
          content: contentStore.raw,
          trial: trialDef,
          progress: trialProgress,
          realm: gameState.realm,
          qi: gameState.qi,
          breakthroughRequirement: gameState.getBreakthroughRequirement(),
          requiredItemSatisfied,
        });

        if (!lifecycle.canStart) {
          get().addNotification('warning', lifecycle.reason);
          return;
        }

        activityStore.startActivity('trial', { cityId: context.cityId ?? trialDef.cityId, sourceId: trialDef.id });
        combatStore.setAutoAttack(true);
        combatStore.setAutoCombatAI(true);
        combatStore.startCombat(trialDef.bossId, {
          type: 'trial',
          cityId: context.cityId ?? trialDef.cityId,
          trialId: trialDef.id,
          countsTowardFailSafe: lifecycle.countsTowardFailSafeOnStart,
          rewardBundle: getTrialGateRewardBundle(contentStore.raw, trialDef),
        });
      } else if (context.type === 'ruins') {
        const ruinDef = context.sourceId ? contentStore.maps.ruinsById[context.sourceId] : undefined;
        if (!ruinDef) {
          get().addNotification('error', 'Unable to start ruins: definition missing.');
          return;
        }

        useRuinsStore.getState().startRun(ruinDef.id);
      }

      set((state) => {
        state.combatPresentation.mode = 'active';
        state.combatPresentation.context = context;
      });
    },

    closeCombatPresentation: () => {
      set((state) => {
        if (state.combatPresentation.mode === 'preview') {
          state.combatPresentation.mode = 'hidden';
          state.combatPresentation.context = null;
        } else if (state.combatPresentation.mode === 'active') {
          state.combatPresentation.mode = 'docked';
        }
      });
    },

    restoreCombatFromDock: () => {
      set((state) => {
        if (state.combatPresentation.mode === 'docked') {
          state.combatPresentation.mode = 'active';
        }
      });
    },

    stopCombatAndClose: () => {
      const presentation = get().combatPresentation;
      const context = presentation.context;
      const activeActivity = useActivityStore.getState().active;
      const effectiveType = context?.type ?? activeActivity?.type;

      if (effectiveType === 'ruins') {
        useRuinsStore.getState().stopRun();
      } else {
        useActivityStore.getState().stopActivity('combat-presentation-stop');
        useCombatStore.getState().exitCombat();
      }

      set((state) => {
        state.combatPresentation.mode = 'hidden';
        state.combatPresentation.context = null;
      });
    },

    isCombatVisible: () => {
      const mode = get().combatPresentation.mode;
      return mode === 'preview' || mode === 'active';
    },

    isCombatDocked: () => get().combatPresentation.mode === 'docked',

    openManualSatchel: () => {
      set((state) => {
        state.showManualSatchelModal = true;
      });
      GameEvents.emit({ type: 'satchel/opened', payload: {} });
    },

    closeManualSatchel: () => {
      set((state) => {
        state.showManualSatchelModal = false;
      });
      GameEvents.emit({ type: 'satchel/closed', payload: {} });
    },

    openWorldBuildingModal: ({ cityId, buildingKey }) => {
      const normalizedBuildingKey = normalizeWorldBuildingKey(buildingKey);
      set((state) => {
        state.showWorldBuildingModal = true;
        state.worldBuildingModalCityId = cityId;
        state.worldBuildingModalKey = normalizedBuildingKey;
      });
      if (normalizedBuildingKey === 'manualPavilion') {
        GameEvents.emit({ type: 'pavilion/opened', payload: { buildingKey: normalizedBuildingKey, cityId } });
      }
      if (normalizedBuildingKey === 'apothecary') {
        GameEvents.emit({ type: 'apothecary/opened', payload: { cityId } });
      }
      if (normalizedBuildingKey === 'forge' || normalizedBuildingKey === 'talismanStudio') {
        GameEvents.emit({
          type: 'crafting/opened',
          payload: { station: normalizedBuildingKey === 'forge' ? 'forge' : 'talisman' },
        });
      }
    },

    closeWorldBuildingModal: () => {
      const buildingKey = get().worldBuildingModalKey;
      const cityId = get().worldBuildingModalCityId;
      set((state) => {
        state.showWorldBuildingModal = false;
        state.worldBuildingModalCityId = null;
        state.worldBuildingModalKey = null;
      });
      if (buildingKey === 'manualPavilion') {
        GameEvents.emit({ type: 'pavilion/closed', payload: { buildingKey, cityId } });
      }
      if (buildingKey === 'apothecary') {
        GameEvents.emit({ type: 'apothecary/closed', payload: { cityId } });
      }
      if (buildingKey === 'alchemy' || buildingKey === 'forge' || buildingKey === 'talismanStudio') {
        GameEvents.emit({
          type: 'crafting/closed',
          payload: { station: buildingKey === 'alchemy' ? 'alchemy' : buildingKey === 'forge' ? 'forge' : 'talisman' },
        });
      }
    },


    queueCityArrival: (cityId) => {
      if (typeof cityId !== 'string' || !cityId.trim()) return;
      if (get().pendingCityArrivalId === cityId) return;
      set((state) => {
        state.pendingCityArrivalId = cityId;
      });
    },

    clearCityArrival: () => {
      if (get().pendingCityArrivalId === null) return;
      set((state) => {
        state.pendingCityArrivalId = null;
      });
    },

    openTechniqueLearned: (payload) => {
      if (!payload) return;
      set((state) => {
        state.showTechniqueLearnedModal = true;
        state.techniqueLearnedPayload = payload;
      });
      GameEvents.emit({ type: 'techniques/learned_modal_opened', payload: { techniqueId: payload.techId } });
    },

    closeTechniqueLearned: () => {
      const techniqueId = get().techniqueLearnedPayload?.techId ?? null;
      set((state) => {
        state.showTechniqueLearnedModal = false;
        state.techniqueLearnedPayload = null;
      });
      GameEvents.emit({ type: 'techniques/learned_modal_closed', payload: { techniqueId } });
    },

    setTechniqueLibraryIntent: (intent) => {
      set((state) => {
        state.techniqueLibraryIntent = intent;
        state.activeTab = 'techniques';
      });
    },

    requestTechniqueFocus: (techId, action = 'open') => {
      set((state) => {
        state.techniqueFocusRequest = { techId, action };
        state.activeTab = 'techniques';
      });
    },

    clearTechniqueFocusRequest: () => {
      set((state) => {
        state.techniqueFocusRequest = null;
      });
    },

    clearTechniqueLibraryIntent: () => {
      set((state) => {
        state.techniqueLibraryIntent = null;
      });
    },

    setLifeStartWizardContext: (lastHeartLawId) => {
      set((state) => {
        state.lifeStartWizardContext = { lastHeartLawId };
      });
    },

    clearLifeStartWizardContext: () => {
      set((state) => {
        state.lifeStartWizardContext = { lastHeartLawId: null };
      });
    },

    openTechniqueLibraryForEquip: (techniqueId, preferredSlotType) => {
      get().setTechniqueLibraryIntent({ type: 'equip', techniqueId, preferredSlotType });
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
