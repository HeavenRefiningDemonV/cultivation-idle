import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { GameEvents } from '../../src/services/events/GameEvents.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { createDefaultOnboardingState, useOnboardingStore } from '../../src/stores/onboardingStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';
import {
  __resetOnboardingEventBridgeForTests,
  initOnboardingEventBridge,
} from '../../src/systems/onboarding/onboardingEventBridge.js';
import type { OnboardingMilestoneContent } from '../../src/systems/onboarding/onboardingTypes.js';

const NOW = 1_234_567;

function loadMilestones(): OnboardingMilestoneContent[] {
  const raw = JSON.parse(
    readFileSync('public/cultivation_idle_content_bible_v1_config/onboarding_milestones.json', 'utf8'),
  ) as { milestones: OnboardingMilestoneContent[] };
  return raw.milestones;
}

test.beforeEach(() => {
  useUIStore.getState().hardResetUI();
  useOnboardingStore.getState().hydrate(createDefaultOnboardingState(NOW));
});

test('tutorial ledger drawer state is transient UI state, not onboarding save state', () => {
  assert.equal(useUIStore.getState().showTutorialLedgerDrawer, false);

  useUIStore.getState().openTutorialLedgerDrawer();
  assert.equal(useUIStore.getState().showTutorialLedgerDrawer, true);

  useUIStore.getState().closeTutorialLedgerDrawer();
  assert.equal(useUIStore.getState().showTutorialLedgerDrawer, false);

  const saved = useOnboardingStore.getState().toSaveState();
  assert.equal(Object.prototype.hasOwnProperty.call(saved, 'showTutorialLedgerDrawer'), false);
});

test('marking a tutorial card seen persists a ledger entry without completing gameplay milestones', () => {
  const onboarding = useOnboardingStore.getState();
  onboarding.activateMilestone('M3_world_outskirts');
  onboarding.queueTutorialCard('card_outskirts_unlock');

  useOnboardingStore.getState().markCardSeen('card_outskirts_unlock', {
    replayId: 'tutorial_outskirts_first_unlock',
    cardId: 'card_outskirts_unlock',
    title: 'The forest path opens',
    body: 'Outskirts gives gold, common materials, and low-risk combat reps.',
    milestoneId: 'M3_world_outskirts',
    unlockedAt: NOW + 1,
  });

  const state = useOnboardingStore.getState();
  assert.deepEqual(state.completedMilestoneIds, []);
  assert.equal(state.activeMilestoneId, 'M3_world_outskirts');
  assert.deepEqual(state.queuedTutorialCardIds, []);
  assert.deepEqual(state.seenTutorialCardIds, ['card_outskirts_unlock']);
  assert.equal(state.tutorialLedgerEntries.length, 1);

  const saved = state.toSaveState();
  assert.equal(saved.tutorialLedgerEntries[0]?.replayId, 'tutorial_outskirts_first_unlock');
});

test('event bridge queues the newly active unlock card after first breakthrough', () => {
  __resetOnboardingEventBridgeForTests();
  useContentStore.setState({
    raw: { onboarding_milestones: { milestones: loadMilestones() } } as never,
  });
  useOnboardingStore.getState().hydrate({
    ...createDefaultOnboardingState(NOW),
    activeMilestoneId: 'M1_cultivation_only',
    unlockedTabs: ['cultivation'],
  });

  initOnboardingEventBridge();
  GameEvents.emit({
    type: 'progression/breakthrough_completed',
    payload: {
      timestamp: NOW + 2,
      fromRealmIndex: 0,
      fromSubstage: 1,
      toRealmIndex: 0,
      toSubstage: 2,
      major: false,
    },
  });

  const state = useOnboardingStore.getState();
  assert.equal(state.activeMilestoneId, 'M2_status_unlock');
  assert.deepEqual(state.queuedTutorialCardIds, ['card_status_unlock']);
  assert.equal(state.queuedTutorialCardIds.includes('card_first_breath'), false);
  __resetOnboardingEventBridgeForTests();
});
