import type { GameEvent } from '../../services/events/GameEvents.js';
import { GameEvents } from '../../services/events/GameEvents.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useOnboardingStore } from '../../stores/onboardingStore.js';
import { getOnboardingMilestoneById, getOnboardingMilestonesFromContent } from './onboardingContent.js';
import { deriveOnboardingEventEffects } from './onboardingCompletion.js';
import { resolveOnboardingUnlocksThroughMilestone } from './onboardingProgression.js';
import type { OnboardingMilestoneId } from './onboardingTypes.js';

let initialized = false;
let handler: ((event: GameEvent) => void) | null = null;

function getQueuedCardMilestoneId(
  changedMilestoneId: OnboardingMilestoneId | null,
): OnboardingMilestoneId | null {
  if (!changedMilestoneId) return null;
  const activeMilestoneId = useOnboardingStore.getState().activeMilestoneId;

  if (changedMilestoneId === 'M10_foundation_graduation') {
    return 'M10_foundation_graduation';
  }

  if (activeMilestoneId === 'M10_foundation_graduation') {
    return null;
  }

  if (activeMilestoneId && activeMilestoneId !== 'complete') {
    return activeMilestoneId;
  }

  return changedMilestoneId;
}

function syncUnlocksAndCards(changedMilestoneId: OnboardingMilestoneId | null) {
  const content = useContentStore.getState().raw;
  const milestones = getOnboardingMilestonesFromContent(content);
  const store = useOnboardingStore.getState();
  const unlocks = resolveOnboardingUnlocksThroughMilestone({
    milestones,
    completedMilestoneIds: store.completedMilestoneIds,
    activeMilestoneId: store.activeMilestoneId,
  });
  store.applyUnlocks(unlocks);

  if (!changedMilestoneId || milestones.length === 0) return;
  const cardMilestoneId = getQueuedCardMilestoneId(changedMilestoneId);
  if (!cardMilestoneId) return;
  const milestone = getOnboardingMilestoneById(milestones, cardMilestoneId);
  if (milestone) {
    store.queueTutorialCard(milestone.tutorialCard.id);
  }
}

function handleOnboardingEvent(event: GameEvent): void {
  try {
    const effects = deriveOnboardingEventEffects(event);
    if (effects.length === 0) return;

    let changedMilestoneId: OnboardingMilestoneId | null = null;
    const store = useOnboardingStore.getState();
    for (const effect of effects) {
      if (effect.kind === 'record_fact') {
        store.recordEventFact(effect.fact, effect.timestamp);
      } else if (effect.kind === 'record_gate_defeat') {
        store.recordGateDefeat(effect.fact);
      } else if (effect.kind === 'complete_milestone') {
        const current = useOnboardingStore.getState();
        const alreadyCompleted = current.completedMilestoneIds.includes(effect.milestoneId);
        current.completeMilestone(effect.milestoneId, effect.timestamp);
        if (!alreadyCompleted) {
          changedMilestoneId = effect.milestoneId;
        }
      } else {
        store.activateMilestone(effect.milestoneId, effect.reason);
      }
    }

    syncUnlocksAndCards(changedMilestoneId);
  } catch (error) {
    console.warn('[OnboardingEventBridge] Failed to process event', event.type, error);
  }
}

export function initOnboardingEventBridge(): void {
  if (initialized) return;
  handler = handleOnboardingEvent;
  GameEvents.onAny(handler);
  initialized = true;
}

export function teardownOnboardingEventBridge(): void {
  if (handler) {
    GameEvents.offAny(handler);
  }
  handler = null;
  initialized = false;
}

export function __resetOnboardingEventBridgeForTests(): void {
  teardownOnboardingEventBridge();
}
