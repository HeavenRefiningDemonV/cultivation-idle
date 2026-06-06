import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import type { LiveWorldModuleKey } from '../../src/content/types.js';
import type { GameTab } from '../../src/stores/uiStore.js';
import {
  buildOnboardingLedgerSurface,
} from '../../src/systems/onboarding/onboardingLedger.js';
import {
  buildOnboardingMilestoneSurface,
  buildSuppressedOnboardingMilestoneSurface,
} from '../../src/systems/onboarding/onboardingMilestoneSurface.js';
import {
  performOnboardingRouteAction,
} from '../../src/systems/onboarding/onboardingRouteActions.js';
import {
  buildOnboardingUnlockCeremonySurface,
} from '../../src/systems/onboarding/onboardingUnlockCeremony.js';
import { buildOnboardingTabPolicy } from '../../src/systems/onboarding/onboardingTabPolicy.js';
import {
  buildOnboardingWorldModulePolicy,
} from '../../src/systems/onboarding/onboardingWorldModulePolicy.js';
import type {
  OnboardingMilestoneContent,
  OnboardingRuntimeMilestoneId,
} from '../../src/systems/onboarding/onboardingTypes.js';
import {
  DEFAULT_ONBOARDING_UNLOCKS_BY_MILESTONE,
} from '../../src/systems/onboarding/onboardingTypes.js';

const PINEWIND_CITY_ID = 'city_pinewind_hamlet';
const ALL_TABS: readonly GameTab[] = [
  'cultivation',
  'status',
  'adventure',
  'inventory',
  'records',
  'techniques',
  'prestige',
  'settings',
];
const PINEWIND_MODULES: readonly string[] = [
  'outskirts',
  'manualPavilion',
  'apothecary',
  'expeditions',
  'forge',
  'ruins',
  'bounties',
  'gateTrial',
];

function loadMilestones(): OnboardingMilestoneContent[] {
  const raw = JSON.parse(
    readFileSync('public/cultivation_idle_content_bible_v1_config/onboarding_milestones.json', 'utf8'),
  ) as { milestones: OnboardingMilestoneContent[] };
  return raw.milestones;
}

function unlocksFor(activeMilestoneId: OnboardingRuntimeMilestoneId | null): {
  unlockedTabs: GameTab[];
  unlockedWorldModules: LiveWorldModuleKey[];
  teaserWorldModules: LiveWorldModuleKey[];
} {
  if (!activeMilestoneId || activeMilestoneId === 'complete') {
    return { unlockedTabs: [], unlockedWorldModules: [], teaserWorldModules: [] };
  }
  const unlocks = DEFAULT_ONBOARDING_UNLOCKS_BY_MILESTONE[activeMilestoneId];
  return {
    unlockedTabs: [...unlocks.tabs],
    unlockedWorldModules: [...unlocks.worldModules],
    teaserWorldModules: [...unlocks.teaserWorldModules],
  };
}

function policies(activeMilestoneId: OnboardingRuntimeMilestoneId | null) {
  const unlocks = unlocksFor(activeMilestoneId);
  return {
    tabPolicy: buildOnboardingTabPolicy({
      activeMilestoneId,
      unlockedTabs: unlocks.unlockedTabs,
      firstLifeOnlyComplete: activeMilestoneId === 'complete',
      supportedTabs: ALL_TABS,
      settingsAsUtility: true,
    }),
    worldModulePolicy: buildOnboardingWorldModulePolicy({
      activeMilestoneId,
      unlockedWorldModules: unlocks.unlockedWorldModules,
      teaserWorldModules: unlocks.teaserWorldModules,
      selectedCityModuleKeys: PINEWIND_MODULES,
      firstLifeOnlyComplete: activeMilestoneId === 'complete',
    }),
  };
}

test('buildOnboardingMilestoneSurface renders one concrete next-step objective', () => {
  const milestones = loadMilestones();
  const { tabPolicy, worldModulePolicy } = policies('M3_world_outskirts');
  const surface = buildOnboardingMilestoneSurface({
    milestones,
    activeMilestoneId: 'M3_world_outskirts',
    tabPolicy,
    worldModulePolicy,
    currentCityId: PINEWIND_CITY_ID,
  });

  assert.equal(surface.state, 'active');
  assert.equal(surface.milestoneId, 'M3_world_outskirts');
  assert.equal(surface.title, 'Walk the Outskirts');
  assert.equal(surface.eyebrow, 'Next Step');
  assert.equal(surface.route.label, 'World > Outskirts');
  assert.equal(surface.route.blocked, false);
  assert.equal(surface.primaryAction?.label, 'Open Outskirts');
  assert.equal(surface.details.some((detail: { label: string }) => detail.label === 'Why this matters'), true);

  const publicText = JSON.stringify(surface);
  assert.equal(/Omen|Proof Detail|Source Thread|Mandate Lens|Module Source-Sink/.test(publicText), false);
});

test('buildOnboardingMilestoneSurface reports blocked routes without bypassing MP2 policy', () => {
  const milestones = loadMilestones();
  const m3Policies = policies('M3_world_outskirts');
  const surface = buildOnboardingMilestoneSurface({
    milestones,
    activeMilestoneId: 'M4_pavilion_satchel',
    tabPolicy: m3Policies.tabPolicy,
    worldModulePolicy: m3Policies.worldModulePolicy,
    currentCityId: PINEWIND_CITY_ID,
  });

  assert.equal(surface.state, 'active');
  assert.equal(surface.route.label, 'World > Manual Pavilion');
  assert.equal(surface.route.blocked, true);
  assert.match(surface.route.reason ?? '', /Pavilion opens after|Outskirts/i);
  assert.equal(surface.primaryAction?.disabled, true);
  assert.equal(surface.fallbackAction?.target.kind, 'world_module');
  assert.equal(surface.fallbackAction?.target.kind === 'world_module' ? surface.fallbackAction.target.moduleKey : null, 'outskirts');
});

test('suppressed and completed milestone surfaces do not render guidance chrome', () => {
  const suppressed = buildSuppressedOnboardingMilestoneSurface('life_start');
  assert.equal(suppressed.state, 'suppressed');
  assert.equal(suppressed.reason, 'life_start');
  assert.equal(suppressed.primaryAction, null);

  const complete = buildOnboardingMilestoneSurface({
    milestones: loadMilestones(),
    activeMilestoneId: 'complete',
    tabPolicy: policies('complete').tabPolicy,
    worldModulePolicy: policies('complete').worldModulePolicy,
    currentCityId: PINEWIND_CITY_ID,
  });
  assert.equal(complete.state, 'hidden');
});

test('buildOnboardingUnlockCeremonySurface presents one queued card and prepares a ledger entry', () => {
  const surface = buildOnboardingUnlockCeremonySurface({
    milestones: loadMilestones(),
    queuedCardIds: ['card_status_unlock', 'card_outskirts_unlock'],
    seenCardIds: [],
    suppressed: false,
  });

  assert.equal(surface?.state, 'active');
  assert.equal(surface?.card.cardId, 'card_status_unlock');
  assert.equal(surface?.card.title, 'Know the shape of this life');
  assert.equal(surface?.card.ctaLabel, 'Open Status');
  assert.equal(surface?.remainingCount, 2);
  assert.equal(surface?.ledgerEntry.replayId, 'tutorial_status_first_unlock');

  const suppressed = buildOnboardingUnlockCeremonySurface({
    milestones: loadMilestones(),
    queuedCardIds: ['card_status_unlock'],
    seenCardIds: [],
    suppressed: true,
  });
  assert.equal(suppressed?.state, 'suppressed');
});

test('buildOnboardingLedgerSurface deduplicates and enriches replay entries', () => {
  const ledger = buildOnboardingLedgerSurface({
    milestones: loadMilestones(),
    entries: [
      {
        replayId: 'tutorial_outskirts_first_unlock',
        cardId: 'card_outskirts_unlock',
        title: 'The forest path opens',
        body: 'Outskirts gives gold, common materials, and low-risk combat reps.',
        milestoneId: 'M3_world_outskirts',
        unlockedAt: 30,
      },
      {
        replayId: 'tutorial_outskirts_first_unlock',
        cardId: 'card_outskirts_unlock',
        title: 'Duplicate',
        body: 'Duplicate',
        milestoneId: 'M3_world_outskirts',
        unlockedAt: 40,
      },
      {
        replayId: 'tutorial_status_first_unlock',
        cardId: 'card_status_unlock',
        title: 'Know the shape of this life',
        body: 'Status shows your path, root, current strength, and next pressure.',
        milestoneId: 'M2_status_unlock',
        unlockedAt: 20,
      },
    ],
  });

  assert.equal(ledger.state, 'ready');
  assert.equal(ledger.entries.length, 2);
  assert.deepEqual(ledger.entries.map((entry: { replayId: string }) => entry.replayId), [
    'tutorial_status_first_unlock',
    'tutorial_outskirts_first_unlock',
  ]);
  assert.equal(ledger.entries[0]?.phaseLabel, 'Diagnosis');
  assert.equal(ledger.entries[1]?.milestoneLabel, 'Walk the Outskirts');
});

test('performOnboardingRouteAction uses existing route gates and exposes tutorial ledger action', () => {
  const m2 = policies('M2_status_unlock');
  const calls: string[] = [];

  const statusResult = performOnboardingRouteAction({
    target: { kind: 'tab', tab: 'status' },
    tabPolicy: m2.tabPolicy,
    worldModulePolicy: m2.worldModulePolicy,
    deps: {
      setActiveTab: (tab: GameTab) => calls.push(`tab:${tab}`),
      openWorldModule: (args: { moduleKey: string }) => calls.push(`world:${args.moduleKey}`),
      openTutorialLedgerDrawer: () => calls.push('ledger'),
      notifyBlocked: (message: string) => calls.push(`blocked:${message}`),
    },
  });
  assert.equal(statusResult.status, 'performed');
  assert.deepEqual(calls, ['tab:status']);

  const worldResult = performOnboardingRouteAction({
    target: { kind: 'tab', tab: 'adventure' },
    tabPolicy: m2.tabPolicy,
    worldModulePolicy: m2.worldModulePolicy,
    deps: {
      setActiveTab: (tab: GameTab) => calls.push(`tab:${tab}`),
      openWorldModule: (args: { moduleKey: string }) => calls.push(`world:${args.moduleKey}`),
      openTutorialLedgerDrawer: () => calls.push('ledger'),
      notifyBlocked: (message: string) => calls.push(`blocked:${message}`),
    },
  });
  assert.equal(worldResult.status, 'blocked');
  assert.equal(calls.at(-1)?.startsWith('blocked:'), true);

  const m3 = policies('M3_world_outskirts');
  const pavilionResult = performOnboardingRouteAction({
    target: { kind: 'world_module', moduleKey: 'manualPavilion', cityId: PINEWIND_CITY_ID },
    tabPolicy: m3.tabPolicy,
    worldModulePolicy: m3.worldModulePolicy,
    deps: {
      setActiveTab: (tab: GameTab) => calls.push(`tab:${tab}`),
      openWorldModule: (args: { moduleKey: string }) => calls.push(`world:${args.moduleKey}`),
      openTutorialLedgerDrawer: () => calls.push('ledger'),
      notifyBlocked: (message: string) => calls.push(`blocked:${message}`),
    },
  });
  assert.equal(pavilionResult.status, 'blocked');
  assert.notEqual(calls.includes('world:manualPavilion'), true);

  const ledgerResult = performOnboardingRouteAction({
    target: { kind: 'modal', modalKey: 'tutorialLedger' },
    tabPolicy: m3.tabPolicy,
    worldModulePolicy: m3.worldModulePolicy,
    deps: {
      setActiveTab: (tab: GameTab) => calls.push(`tab:${tab}`),
      openWorldModule: (args: { moduleKey: string }) => calls.push(`world:${args.moduleKey}`),
      openTutorialLedgerDrawer: () => calls.push('ledger'),
      notifyBlocked: (message: string) => calls.push(`blocked:${message}`),
    },
  });
  assert.equal(ledgerResult.status, 'performed');
  assert.equal(calls.at(-1), 'ledger');
});
