import type { FreshAccountStoryInput, StoryCutsceneId, StoryTriggerDecision } from './storyTypes.js';

export const FRESH_ACCOUNT_STORY_ID: StoryCutsceneId = 's00_the_night_the_gate_refused_your_name';

export function resolveFreshAccountStoryTrigger(input: FreshAccountStoryInput): StoryTriggerDecision {
  if (!input.contentReady) return { kind: 'none', reason: 'content_not_ready' };
  if (input.storyIntroSeen) return { kind: 'none', reason: 'already_seen' };
  if (input.selectedPath !== null) return { kind: 'none', reason: 'path_selected' };

  const blocked = Boolean(
    input.activeCutsceneId ||
    input.blockingOverlayActive ||
    input.combatActive ||
    !input.uiStable,
  );

  if (blocked) {
    return { kind: 'queue', cutsceneId: FRESH_ACCOUNT_STORY_ID, reason: 'ui_blocked' };
  }

  return { kind: 'start', cutsceneId: FRESH_ACCOUNT_STORY_ID };
}
