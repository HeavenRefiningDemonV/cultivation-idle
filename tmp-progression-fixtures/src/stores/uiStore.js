import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createDefaultDaoMandateGuidanceSettings, sanitizeDaoMandateGuidanceSettings, } from '../systems/ui/daoMandate/daoMandateGuidanceSettings.js';
import { createDefaultDaoMandateLessonMemory, isDaoMandateLessonConceptId, sanitizeDaoMandateLessonMemory, } from '../systems/ui/daoMandate/daoMandateLessons.js';
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
import { applyNotificationPolicy, DEFAULT_NOTIFICATION_DURATION_MS, isNotificationOverlayBlocked, promotePendingNotifications, } from '../systems/ui/notificationPolicy.js';
const normalizeWorldBuildingKey = (buildingKey) => buildingKey === 'alchemy' ? 'apothecary' : buildingKey;
export const getWorldBuildingIntentKey = (intent) => JSON.stringify({
    apothecarySurface: intent?.apothecarySurface ?? null,
    apothecaryExactMode: intent?.apothecaryExactMode ?? null,
    apothecaryFocus: intent?.apothecaryFocus ?? null,
    forgeExactMode: intent?.forgeExactMode ?? null,
    manualPavilionExactMode: intent?.manualPavilionExactMode ?? null,
    bountiesExactMode: intent?.bountiesExactMode ?? null,
    expeditionsExactMode: intent?.expeditionsExactMode ?? null,
    ruinsExactMode: intent?.ruinsExactMode ?? null,
    gateTrialExactMode: intent?.gateTrialExactMode ?? null,
});
const INITIAL_UI_STATE = {
    activeTab: 'cultivation',
    headerTitle: '',
    headerSubtitle: '',
    headerTone: 'dark',
    layoutBackgroundOverride: null,
    showSidePanel: false,
    notifications: [],
    pendingNotifications: [],
    lifeStartWizardOpenForNotifications: false,
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
    worldBuildingModalIntent: null,
    showCurrentChapterExhaustedModal: false,
    showLifeSummaryModal: false,
    lifeSummaryMode: 'current',
    showMigrationIssuesModal: false,
    migrationIssuePayload: null,
    currentChapterExhaustedAcknowledgedThisLife: false,
    activeOnboardingPrompt: null,
    queuedOnboardingPrompts: [],
    dismissedOnboardingLifeKeys: [],
    dismissedOnboardingRuntimeKeys: [],
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
        storyMotionMode: 'full',
        ...createDefaultDaoMandateGuidanceSettings(),
    },
    daoMandateLessonMemory: createDefaultDaoMandateLessonMemory(),
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
function generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
const notificationTimeouts = new Map();
const notificationLastTriggeredAtByKey = new Map();
const clearNotificationTimer = (id) => {
    const timeoutId = notificationTimeouts.get(id);
    if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        notificationTimeouts.delete(id);
    }
};
const scheduleNotificationTimer = (id, durationMs, removeNotification) => {
    clearNotificationTimer(id);
    const timeoutId = setTimeout(() => {
        notificationTimeouts.delete(id);
        removeNotification(id);
    }, durationMs);
    notificationTimeouts.set(id, timeoutId);
};
const ONBOARDING_PRIORITY_WEIGHT = {
    high: 3,
    medium: 2,
    low: 1,
};
function updateDaoMandateLessonMemory(current, lesson, apply) {
    if (!isDaoMandateLessonConceptId(lesson.conceptId)) {
        return sanitizeDaoMandateLessonMemory(current);
    }
    const now = Date.now();
    const next = sanitizeDaoMandateLessonMemory(current);
    const existing = next.byConceptId[lesson.conceptId];
    const triggerChanged = existing?.lastTriggerHash !== lesson.triggerHash;
    const entry = {
        seenCount: existing ? (triggerChanged ? existing.seenCount + 1 : Math.max(1, existing.seenCount)) : 1,
        firstSeenAt: existing?.firstSeenAt ?? now,
        lastSeenAt: now,
        ...(existing?.dismissedAt ? { dismissedAt: existing.dismissedAt } : {}),
        ...(existing?.learnedAt ? { learnedAt: existing.learnedAt } : {}),
        lastTriggerHash: lesson.triggerHash,
    };
    apply(entry, now);
    next.byConceptId[lesson.conceptId] = entry;
    return sanitizeDaoMandateLessonMemory(next);
}
/**
 * UI store for managing interface state
 */
export const useUIStore = create()(immer((set, get) => ({
    ...INITIAL_UI_STATE,
    /**
     * Set the active tab
     */
    setActiveTab: (tab) => {
        const previousTab = get().activeTab;
        if (previousTab === tab)
            return;
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
    setHeaderTitles: (title, subtitle = '') => {
        set((state) => {
            state.headerTitle = title;
            state.headerSubtitle = subtitle;
        });
    },
    /**
     * Adjust the header tone (e.g., for modal overlays)
     */
    setHeaderTone: (tone) => {
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
    addNotification: (type, message, duration) => {
        const options = typeof duration === 'number'
            ? { durationMs: duration }
            : { ...(duration ?? {}) };
        const now = Date.now();
        const snapshot = get();
        const overlayBlocked = isNotificationOverlayBlocked({
            showPrestigeModal: snapshot.showPrestigeModal,
            showPerkSelectionModal: snapshot.showPerkSelectionModal,
            showOfflineProgressModal: snapshot.showOfflineProgressModal,
            showManualSatchelModal: snapshot.showManualSatchelModal,
            showTechniqueLearnedModal: snapshot.showTechniqueLearnedModal,
            showWorldBuildingModal: snapshot.showWorldBuildingModal,
            showCurrentChapterExhaustedModal: snapshot.showCurrentChapterExhaustedModal,
            showLifeSummaryModal: snapshot.showLifeSummaryModal,
            showMigrationIssuesModal: snapshot.showMigrationIssuesModal,
            pendingCityArrivalId: snapshot.pendingCityArrivalId,
            activeOnboardingPrompt: snapshot.activeOnboardingPrompt,
            combatPresentationMode: snapshot.combatPresentation.mode,
            lifeStartWizardOpen: snapshot.lifeStartWizardOpenForNotifications,
        });
        const result = applyNotificationPolicy({
            now,
            visible: snapshot.notifications,
            pending: snapshot.pendingNotifications,
            options,
            type,
            message,
            createId: generateNotificationId,
            overlayBlocked,
            lastTriggeredAtByKey: notificationLastTriggeredAtByKey,
        });
        if (!result.accepted)
            return;
        set((state) => {
            state.notifications = result.visible;
            state.pendingNotifications = result.pending;
        });
        const removeNotification = get().removeNotification;
        result.becameVisible.forEach((notification) => {
            scheduleNotificationTimer(notification.id, notification.duration ?? DEFAULT_NOTIFICATION_DURATION_MS, removeNotification);
        });
        console.log(`[UI] Notification added: ${type} - ${message}`);
    },
    /**
     * Remove a notification by ID
     */
    removeNotification: (id) => {
        clearNotificationTimer(id);
        set((state) => {
            const index = state.notifications.findIndex((n) => n.id === id);
            if (index !== -1) {
                state.notifications.splice(index, 1);
            }
            const pendingIndex = state.pendingNotifications.findIndex((n) => n.id === id);
            if (pendingIndex !== -1) {
                state.pendingNotifications.splice(pendingIndex, 1);
            }
        });
        get().flushNotificationQueue();
    },
    /**
     * Clear all notifications
     */
    clearNotifications: () => {
        notificationTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
        notificationTimeouts.clear();
        set((state) => {
            state.notifications = [];
            state.pendingNotifications = [];
        });
        console.log('[UI] All notifications cleared');
    },
    flushNotificationQueue: () => {
        const snapshot = get();
        const overlayBlocked = isNotificationOverlayBlocked({
            showPrestigeModal: snapshot.showPrestigeModal,
            showPerkSelectionModal: snapshot.showPerkSelectionModal,
            showOfflineProgressModal: snapshot.showOfflineProgressModal,
            showManualSatchelModal: snapshot.showManualSatchelModal,
            showTechniqueLearnedModal: snapshot.showTechniqueLearnedModal,
            showWorldBuildingModal: snapshot.showWorldBuildingModal,
            showCurrentChapterExhaustedModal: snapshot.showCurrentChapterExhaustedModal,
            showLifeSummaryModal: snapshot.showLifeSummaryModal,
            showMigrationIssuesModal: snapshot.showMigrationIssuesModal,
            pendingCityArrivalId: snapshot.pendingCityArrivalId,
            activeOnboardingPrompt: snapshot.activeOnboardingPrompt,
            combatPresentationMode: snapshot.combatPresentation.mode,
            lifeStartWizardOpen: snapshot.lifeStartWizardOpenForNotifications,
        });
        const promoted = promotePendingNotifications(snapshot.notifications, snapshot.pendingNotifications, overlayBlocked);
        if (promoted.becameVisible.length === 0)
            return;
        set((state) => {
            state.notifications = promoted.visible;
            state.pendingNotifications = promoted.pending;
        });
        const removeNotification = get().removeNotification;
        promoted.becameVisible.forEach((notification) => {
            scheduleNotificationTimer(notification.id, notification.duration ?? DEFAULT_NOTIFICATION_DURATION_MS, removeNotification);
        });
    },
    setLifeStartWizardOpenForNotifications: (open) => {
        if (get().lifeStartWizardOpenForNotifications === open)
            return;
        set((state) => {
            state.lifeStartWizardOpenForNotifications = open;
        });
        if (!open) {
            get().flushNotificationQueue();
        }
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
        if (!get().showPrestigeModal)
            return;
        set((state) => {
            state.showPrestigeModal = false;
        });
    },
    /**
     * Show perk selection modal for the given realm
     */
    showPerkSelection: (realmIndex) => {
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
    showOfflineProgress: (summary) => {
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
    showTooltip: (content, x, y) => {
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
    setSettings: (partial) => {
        set((state) => {
            const merged = { ...state.settings, ...partial };
            state.settings = {
                ...merged,
                ...sanitizeDaoMandateGuidanceSettings(merged),
            };
        });
    },
    setGuidanceOath: (oath) => {
        set((state) => {
            state.settings.guidanceOath = sanitizeDaoMandateGuidanceSettings({ guidanceOath: oath }).guidanceOath;
        });
    },
    setGuidanceSetting: (key, value) => {
        set((state) => {
            const merged = {
                ...state.settings,
                [key]: value,
            };
            state.settings = {
                ...merged,
                ...sanitizeDaoMandateGuidanceSettings(merged),
            };
        });
    },
    resetGuidanceSettings: () => {
        set((state) => {
            state.settings = {
                ...state.settings,
                ...createDefaultDaoMandateGuidanceSettings(),
            };
        });
    },
    hydrateDaoMandateLessonMemory: (memory) => {
        set((state) => {
            state.daoMandateLessonMemory = sanitizeDaoMandateLessonMemory(memory);
        });
    },
    dismissDaoMandateLesson: (lesson) => {
        set((state) => {
            state.daoMandateLessonMemory = updateDaoMandateLessonMemory(state.daoMandateLessonMemory, lesson, (entry, now) => {
                if (entry)
                    entry.dismissedAt = now;
            });
        });
    },
    markDaoMandateLessonLearned: (lesson) => {
        set((state) => {
            state.daoMandateLessonMemory = updateDaoMandateLessonMemory(state.daoMandateLessonMemory, lesson, (entry, now) => {
                if (!entry)
                    return;
                entry.dismissedAt = entry.dismissedAt ?? now;
                entry.learnedAt = now;
            });
        });
    },
    toggleCombatMinibarExpanded: () => {
        set((state) => {
            state.settings.combatMinibarExpanded = !state.settings.combatMinibarExpanded;
        });
    },
    openCombatPreview: (context) => {
        const buildingKey = context.moduleKey ?? (context.type === 'trial' ? 'gateTrial' : context.type);
        if (!context.cityId)
            return;
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
            state.worldBuildingModalIntent = null;
        });
    },
    startCombatFromPreview: () => {
        const presentation = get().combatPresentation;
        const context = presentation.context;
        if (!context)
            return;
        const activityStore = useActivityStore.getState();
        const combatStore = useCombatStore.getState();
        const activeActivity = activityStore.active;
        if (activeActivity && (activeActivity.type !== context.type || activeActivity.sourceId !== context.sourceId)) {
            const confirmed = window.confirm('Stop current combat and start the new encounter?');
            if (!confirmed)
                return;
            if (activeActivity.type === 'ruins') {
                useRuinsStore.getState().stopRun();
            }
            else {
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
        }
        else if (context.type === 'trial') {
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
        }
        else if (context.type === 'ruins') {
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
            }
            else if (state.combatPresentation.mode === 'active') {
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
        }
        else {
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
    openWorldBuildingModal: ({ cityId, buildingKey, intent }) => {
        const normalizedBuildingKey = normalizeWorldBuildingKey(buildingKey);
        const snapshot = get();
        const incomingIntent = intent ?? null;
        if (snapshot.showWorldBuildingModal
            && snapshot.worldBuildingModalCityId === cityId
            && snapshot.worldBuildingModalKey === normalizedBuildingKey
            && getWorldBuildingIntentKey(snapshot.worldBuildingModalIntent) === getWorldBuildingIntentKey(incomingIntent)) {
            return;
        }
        set((state) => {
            state.showWorldBuildingModal = true;
            state.worldBuildingModalCityId = cityId;
            state.worldBuildingModalKey = normalizedBuildingKey;
            state.worldBuildingModalIntent = incomingIntent;
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
        if (!get().showWorldBuildingModal)
            return;
        const buildingKey = get().worldBuildingModalKey;
        const cityId = get().worldBuildingModalCityId;
        set((state) => {
            state.showWorldBuildingModal = false;
            state.worldBuildingModalCityId = null;
            state.worldBuildingModalKey = null;
            state.worldBuildingModalIntent = null;
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
    openCurrentChapterExhaustedModal: () => {
        if (get().showCurrentChapterExhaustedModal)
            return;
        set((state) => {
            state.showCurrentChapterExhaustedModal = true;
        });
    },
    closeCurrentChapterExhaustedModal: () => {
        if (!get().showCurrentChapterExhaustedModal)
            return;
        set((state) => {
            state.showCurrentChapterExhaustedModal = false;
        });
    },
    openLifeSummaryModal: (mode) => {
        if (get().showLifeSummaryModal && get().lifeSummaryMode === mode)
            return;
        set((state) => {
            state.showLifeSummaryModal = true;
            state.lifeSummaryMode = mode;
        });
    },
    closeLifeSummaryModal: () => {
        if (!get().showLifeSummaryModal)
            return;
        set((state) => {
            state.showLifeSummaryModal = false;
        });
    },
    openMigrationIssuesModal: (payload) => {
        set((state) => {
            state.showMigrationIssuesModal = true;
            state.migrationIssuePayload = payload;
        });
    },
    closeMigrationIssuesModal: () => {
        set((state) => {
            state.showMigrationIssuesModal = false;
            state.migrationIssuePayload = null;
        });
    },
    acknowledgeCurrentChapterExhausted: () => {
        if (get().currentChapterExhaustedAcknowledgedThisLife)
            return;
        set((state) => {
            state.currentChapterExhaustedAcknowledgedThisLife = true;
        });
    },
    clearCurrentChapterExhaustedAcknowledgement: () => {
        set((state) => {
            state.currentChapterExhaustedAcknowledgedThisLife = false;
            state.showCurrentChapterExhaustedModal = false;
        });
    },
    queueOnboardingPrompt: (prompt) => {
        set((state) => {
            const alreadyHandled = state.activeOnboardingPrompt?.key === prompt.key
                || state.queuedOnboardingPrompts.some((entry) => entry.key === prompt.key)
                || state.dismissedOnboardingRuntimeKeys.includes(prompt.key)
                || state.dismissedOnboardingLifeKeys.includes(prompt.key);
            if (alreadyHandled) {
                return;
            }
            if (!state.activeOnboardingPrompt) {
                state.activeOnboardingPrompt = prompt;
                return;
            }
            const currentWeight = ONBOARDING_PRIORITY_WEIGHT[state.activeOnboardingPrompt.priority];
            const nextWeight = ONBOARDING_PRIORITY_WEIGHT[prompt.priority];
            if (nextWeight > currentWeight) {
                state.queuedOnboardingPrompts = [state.activeOnboardingPrompt, ...state.queuedOnboardingPrompts];
                state.activeOnboardingPrompt = prompt;
                return;
            }
            state.queuedOnboardingPrompts = [...state.queuedOnboardingPrompts, prompt];
        });
    },
    dismissOnboardingPrompt: (key) => {
        set((state) => {
            if (state.activeOnboardingPrompt?.key === key) {
                if (state.activeOnboardingPrompt.scope === 'life') {
                    state.dismissedOnboardingLifeKeys = [...state.dismissedOnboardingLifeKeys, key];
                }
                else {
                    state.dismissedOnboardingRuntimeKeys = [...state.dismissedOnboardingRuntimeKeys, key];
                }
                state.activeOnboardingPrompt = null;
            }
            state.queuedOnboardingPrompts = state.queuedOnboardingPrompts.filter((prompt) => prompt.key !== key);
        });
    },
    completeOnboardingPrompt: (key) => {
        get().dismissOnboardingPrompt(key);
    },
    clearActiveOnboardingPrompt: () => {
        set((state) => {
            state.activeOnboardingPrompt = null;
        });
    },
    activateNextOnboardingPrompt: () => {
        set((state) => {
            if (state.activeOnboardingPrompt || state.queuedOnboardingPrompts.length === 0) {
                return;
            }
            const [nextPrompt, ...remaining] = state.queuedOnboardingPrompts;
            state.activeOnboardingPrompt = nextPrompt;
            state.queuedOnboardingPrompts = remaining;
        });
    },
    resetOnboardingLifeState: () => {
        set((state) => {
            state.dismissedOnboardingLifeKeys = [];
            state.queuedOnboardingPrompts = state.queuedOnboardingPrompts.filter((prompt) => prompt.scope !== 'life');
            if (state.activeOnboardingPrompt?.scope === 'life') {
                state.activeOnboardingPrompt = null;
            }
        });
    },
    dismissOnboardingLifeKey: (key) => {
        if (!key)
            return;
        set((state) => {
            if (!state.dismissedOnboardingLifeKeys.includes(key)) {
                state.dismissedOnboardingLifeKeys = [...state.dismissedOnboardingLifeKeys, key];
            }
        });
    },
    isOnboardingLifeKeyDismissed: (key) => {
        if (!key)
            return false;
        return get().dismissedOnboardingLifeKeys.includes(key);
    },
    queueCityArrival: (cityId) => {
        if (typeof cityId !== 'string' || !cityId.trim())
            return;
        if (get().pendingCityArrivalId === cityId)
            return;
        set((state) => {
            state.pendingCityArrivalId = cityId;
        });
    },
    clearCityArrival: () => {
        if (get().pendingCityArrivalId === null)
            return;
        set((state) => {
            state.pendingCityArrivalId = null;
        });
    },
    openTechniqueLearned: (payload) => {
        if (!payload)
            return;
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
        notificationTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
        notificationTimeouts.clear();
        notificationLastTriggeredAtByKey.clear();
        set((state) => {
            Object.assign(state, INITIAL_UI_STATE);
        });
    },
})));
