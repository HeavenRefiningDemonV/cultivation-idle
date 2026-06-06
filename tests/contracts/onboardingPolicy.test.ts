import assert from 'node:assert/strict';
import test from 'node:test';

import type { LiveWorldModuleKey } from '../../src/content/types.js';
import type { GameTab } from '../../src/stores/uiStore.js';
import {
  buildOnboardingTabPolicy,
} from '../../src/systems/onboarding/onboardingTabPolicy.js';
import {
  buildOnboardingWorldModulePolicy,
} from '../../src/systems/onboarding/onboardingWorldModulePolicy.js';
import {
  guardOnboardingTabRoute,
  guardOnboardingWorldModuleRoute,
} from '../../src/systems/onboarding/onboardingRouteGuards.js';
import type {
  OnboardingRuntimeMilestoneId,
  SaveOnboardingState,
} from '../../src/systems/onboarding/onboardingTypes.js';
import {
  DEFAULT_ONBOARDING_UNLOCKS_BY_MILESTONE,
} from '../../src/systems/onboarding/onboardingTypes.js';

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
  'alchemy',
  'talismanStudio',
];

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

function tabPolicy(activeMilestoneId: OnboardingRuntimeMilestoneId | null, overrides: Partial<Parameters<typeof buildOnboardingTabPolicy>[0]> = {}) {
  const unlocks = unlocksFor(activeMilestoneId);
  return buildOnboardingTabPolicy({
    activeMilestoneId,
    unlockedTabs: unlocks.unlockedTabs,
    firstLifeOnlyComplete: activeMilestoneId === 'complete',
    supportedTabs: ALL_TABS,
    settingsAsUtility: true,
    ...overrides,
  });
}

function worldPolicy(activeMilestoneId: OnboardingRuntimeMilestoneId | null, overrides: Partial<Parameters<typeof buildOnboardingWorldModulePolicy>[0]> = {}) {
  const unlocks = unlocksFor(activeMilestoneId);
  return buildOnboardingWorldModulePolicy({
    activeMilestoneId,
    unlockedWorldModules: unlocks.unlockedWorldModules,
    teaserWorldModules: unlocks.teaserWorldModules,
    selectedCityModuleKeys: PINEWIND_MODULES,
    deferredWorldModuleKeys: ['alchemy', 'talismanStudio'],
    firstLifeOnlyComplete: activeMilestoneId === 'complete',
    ...overrides,
  });
}

test('buildOnboardingTabPolicy reveals first-life tabs in milestone order', () => {
  assert.deepEqual(tabPolicy('M1_cultivation_only').visibleTabs, ['cultivation']);
  assert.deepEqual(tabPolicy('M2_status_unlock').visibleTabs, ['cultivation', 'status']);
  assert.deepEqual(tabPolicy('M3_world_outskirts').visibleTabs, ['cultivation', 'status', 'adventure']);
  assert.equal(tabPolicy('M3_world_outskirts').visibleTabs.includes('records'), false);
  assert.equal(tabPolicy('M3_world_outskirts').visibleTabs.includes('techniques'), false);
  assert.equal(tabPolicy('M4_pavilion_satchel').visibleTabs.includes('records'), true);
  assert.equal(tabPolicy('M5_techniques_loadout').visibleTabs.includes('techniques'), true);
});

test('buildOnboardingTabPolicy treats settings as utility and suppresses progression nav during LifeStart', () => {
  const policy = tabPolicy('M0_life_start', { storyOrLifeStartBlocking: true });

  assert.deepEqual(policy.visibleTabs, []);
  assert.deepEqual(policy.utilityTabs, ['settings']);
  assert.equal(policy.shouldSuppressProgressionNav, true);
  assert.equal(policy.hiddenTabs.includes('adventure'), true);
});

test('buildOnboardingTabPolicy keeps Inventory out of M3 until loot evidence exists', () => {
  const beforeLoot = tabPolicy('M3_world_outskirts');
  const afterLoot = tabPolicy('M3_world_outskirts', { hasInventoryEvidence: true });

  assert.equal(beforeLoot.visibleTabs.includes('inventory'), false);
  assert.equal(afterLoot.visibleTabs.includes('inventory'), true);
});

test('buildOnboardingTabPolicy allows completion, advanced saves, and dev override without regressing tabs', () => {
  assert.equal(tabPolicy('complete').visibleTabs.includes('prestige'), true);
  assert.equal(tabPolicy('M2_status_unlock', { isExistingAdvancedSave: true }).visibleTabs.includes('prestige'), true);
  assert.equal(tabPolicy('M1_cultivation_only', { devOverride: { unlockAll: true } as SaveOnboardingState['devOverride'] }).visibleTabs.includes('adventure'), true);
});

test('buildOnboardingWorldModulePolicy exposes available and teaser modules per milestone', () => {
  const m3 = worldPolicy('M3_world_outskirts');
  assert.deepEqual(m3.availableModules, ['outskirts']);
  assert.deepEqual(m3.teaserModules, ['manualPavilion']);
  assert.equal(m3.hiddenModules.includes('forge'), true);
  assert.equal(m3.hiddenModules.includes('ruins'), true);
  assert.equal(m3.hiddenModules.includes('gateTrial'), true);

  const m6 = worldPolicy('M6_apothecary_expedition');
  assert.deepEqual(m6.availableModules, ['outskirts', 'manualPavilion', 'apothecary', 'expeditions']);
  assert.deepEqual(m6.teaserModules, ['forge']);

  assert.equal(worldPolicy('M7_forge').availableModules.includes('forge'), true);
  assert.equal(worldPolicy('M8_ruins_bounties').availableModules.includes('ruins'), true);
  assert.equal(worldPolicy('M8_ruins_bounties').availableModules.includes('bounties'), true);
  assert.deepEqual(worldPolicy('M8_ruins_bounties').teaserModules, ['gateTrial']);
  assert.equal(worldPolicy('M9_gate_trial').availableModules.includes('gateTrial'), true);
});

test('buildOnboardingWorldModulePolicy never synthesizes missing or deferred modules', () => {
  const policy = worldPolicy('complete', {
    firstLifeOnlyComplete: true,
    selectedCityModuleKeys: ['outskirts', 'alchemy'],
    unlockedWorldModules: ['outskirts', 'forge'],
    teaserWorldModules: ['gateTrial'],
    deferredWorldModuleKeys: ['alchemy', 'talismanStudio'],
  });

  assert.deepEqual(policy.availableModules, ['outskirts']);
  assert.deepEqual(policy.teaserModules, []);
  assert.deepEqual(policy.deferredModules, ['alchemy']);
  assert.equal(policy.availableModules.includes('forge'), false);
});

test('onboarding route guards block locked tabs and world modules but allow exact fixture bypass', () => {
  const m2Tabs = tabPolicy('M2_status_unlock');
  assert.equal(guardOnboardingTabRoute({ policy: m2Tabs, tab: 'adventure' }).allowed, false);
  assert.equal(guardOnboardingTabRoute({ policy: m2Tabs, tab: 'status' }).allowed, true);

  const m3World = worldPolicy('M3_world_outskirts');
  assert.equal(guardOnboardingWorldModuleRoute({ policy: m3World, moduleKey: 'manualPavilion' }).allowed, false);
  assert.equal(guardOnboardingWorldModuleRoute({ policy: m3World, moduleKey: 'gateTrial' }).allowed, false);
  assert.equal(guardOnboardingWorldModuleRoute({ policy: m3World, moduleKey: 'outskirts' }).allowed, true);

  const m9World = worldPolicy('M9_gate_trial');
  assert.equal(guardOnboardingWorldModuleRoute({ policy: m9World, moduleKey: 'gateTrial' }).allowed, true);

  const bypass = guardOnboardingWorldModuleRoute({
    policy: m3World,
    moduleKey: 'gateTrial',
    exactFixtureOrCaptureMode: true,
  });
  assert.equal(bypass.allowed, true);
  assert.equal(m3World.moduleStates.gateTrial, 'hidden');
});
