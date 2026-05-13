import { useEffect } from 'react';
import { useActivityStore } from '../../stores/activityStore.js';
import { useCombatStore } from '../../stores/combatStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { COMBAT_ACTIVITY_TYPES } from '../../types/activity.js';
import {
  FRESH_ACCOUNT_STORY_ID,
  resolveFreshAccountStoryTrigger,
} from './storyQueue.js';
import { useStoryStore } from './storyStore.js';

export function useStoryTriggers() {
  const contentReady = useContentStore((state) => state.isLoaded);
  const selectedPath = useGameStore((state) => state.selectedPath);
  const activeCutsceneId = useStoryStore((state) => state.activeCutsceneId);
  const queuedCutsceneIds = useStoryStore((state) => state.queuedCutsceneIds);
  const storyIntroSeen = useStoryStore((state) => Boolean(state.seenFlags.story_intro_seen));
  const startCutscene = useStoryStore((state) => state.startCutscene);
  const queueCutscene = useStoryStore((state) => state.queueCutscene);
  const drainQueue = useStoryStore((state) => state.drainQueue);

  const showOfflineProgressModal = useUIStore((state) => state.showOfflineProgressModal);
  const showManualSatchelModal = useUIStore((state) => state.showManualSatchelModal);
  const showTechniqueLearnedModal = useUIStore((state) => state.showTechniqueLearnedModal);
  const showWorldBuildingModal = useUIStore((state) => state.showWorldBuildingModal);
  const showCurrentChapterExhaustedModal = useUIStore((state) => state.showCurrentChapterExhaustedModal);
  const showLifeSummaryModal = useUIStore((state) => state.showLifeSummaryModal);
  const showMigrationIssuesModal = useUIStore((state) => state.showMigrationIssuesModal);
  const activeOnboardingPrompt = useUIStore((state) => state.activeOnboardingPrompt);
  const pendingCityArrivalId = useUIStore((state) => state.pendingCityArrivalId);

  const inCombat = useCombatStore((state) => state.inCombat);
  const activeActivityType = useActivityStore((state) => state.active?.type ?? null);
  const combatActive = inCombat || (activeActivityType ? COMBAT_ACTIVITY_TYPES.includes(activeActivityType) : false);

  const blockingOverlayActive = Boolean(
    showOfflineProgressModal ||
    showManualSatchelModal ||
    showTechniqueLearnedModal ||
    showWorldBuildingModal ||
    showCurrentChapterExhaustedModal ||
    showLifeSummaryModal ||
    showMigrationIssuesModal ||
    activeOnboardingPrompt ||
    pendingCityArrivalId,
  );

  const uiStable = !blockingOverlayActive && !combatActive && activeCutsceneId === null;

  useEffect(() => {
    const decision = resolveFreshAccountStoryTrigger({
      contentReady,
      storyIntroSeen,
      selectedPath,
      activeCutsceneId,
      blockingOverlayActive,
      combatActive,
      uiStable,
    });

    if (decision.kind === 'start') {
      startCutscene(decision.cutsceneId);
    } else if (decision.kind === 'queue') {
      queueCutscene(decision.cutsceneId);
    }
  }, [
    activeCutsceneId,
    blockingOverlayActive,
    combatActive,
    contentReady,
    queueCutscene,
    selectedPath,
    startCutscene,
    storyIntroSeen,
    uiStable,
  ]);

  useEffect(() => {
    if (!uiStable || activeCutsceneId !== null || storyIntroSeen || selectedPath !== null) return;
    if (!queuedCutsceneIds.includes(FRESH_ACCOUNT_STORY_ID)) return;
    const nextId = drainQueue();
    if (nextId) {
      startCutscene(nextId);
    }
  }, [
    activeCutsceneId,
    drainQueue,
    queuedCutsceneIds,
    selectedPath,
    startCutscene,
    storyIntroSeen,
    uiStable,
  ]);
}
