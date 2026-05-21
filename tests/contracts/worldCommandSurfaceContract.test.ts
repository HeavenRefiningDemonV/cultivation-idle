import assert from 'node:assert/strict';
import test from 'node:test';

import { buildWorldCommandSurface, resolveWorldRecommendedModule } from '../../src/systems/ui/world/worldCommandSurface.js';

test('world command surface groups modules into combat/preparation/support correctly', () => {
  const surface = buildWorldCommandSurface({
    visibleModules: ['outskirts', 'ruins', 'gateTrial', 'apothecary', 'forge', 'manualPavilion', 'bounties', 'expeditions'],
    moduleSurfacesByKey: {},
    runCompassPrimaryAction: null,
    economicTopModuleKey: null,
    economicReason: null,
    trackedBountyModuleKey: null,
    trackedBountyAlert: null,
    expeditionIdleAlert: null,
  });

  assert.deepEqual(surface.groups.map((group) => group.id), ['combat', 'preparation', 'support']);
});

test('world recommendation priority prefers run-compass current-city world action over others', () => {
  const recommendation = resolveWorldRecommendedModule({
    visibleModules: ['ruins', 'bounties'],
    runCompassPrimaryAction: {
      why: 'Current blocker route points to Ruins.',
      target: { kind: 'world_module', cityId: 'city_pinewind_hamlet', moduleKey: 'ruins' },
    },
    economicTopModuleKey: 'bounties',
    economicReason: 'Economic route fallback',
    trackedBountyModuleKey: 'bounties',
  });

  assert.equal(recommendation.moduleKey, 'ruins');
  assert.equal(recommendation.from, 'run_compass');
});

test('world recommendation falls through to run-compass secondary then economic then tracked bounty only for visible modules', () => {
  const recommendation = resolveWorldRecommendedModule({
    visibleModules: ['bounties', 'expeditions'],
    runCompassPrimaryAction: {
      why: 'Primary route points to a deferred module.',
      target: { kind: 'world_module', cityId: 'city_pinewind_hamlet', moduleKey: 'outskirts' },
    },
    runCompassSecondaryModuleKey: 'expeditions',
    economicTopModuleKey: 'apothecary',
    economicReason: 'economic fallback',
    trackedBountyModuleKey: 'bounties',
  });

  assert.equal(recommendation.moduleKey, 'expeditions');
  assert.equal(recommendation.from, 'run_compass');
});

test('world recommendation never points to hidden/deferred modules even when provided by inputs', () => {
  const recommendation = resolveWorldRecommendedModule({
    visibleModules: ['ruins', 'bounties'],
    runCompassPrimaryAction: {
      why: 'deferred target',
      target: { kind: 'tab', tab: 'cultivation' },
    },
    runCompassSecondaryModuleKey: null,
    economicTopModuleKey: 'alchemy',
    economicReason: null,
    trackedBountyModuleKey: 'talismanStudio',
  });

  assert.equal(recommendation.moduleKey, null);
  assert.equal(recommendation.from, 'none');
});

test('world command recommendation copy does not leak adventure wording', () => {
  const recommendation = resolveWorldRecommendedModule({
    visibleModules: ['outskirts'],
    runCompassPrimaryAction: null,
    economicTopModuleKey: null,
    economicReason: null,
    trackedBountyModuleKey: null,
  });

  assert.doesNotMatch(recommendation.reason, /adventure/i);
});

test('world command surface fallback metadata uses canonical world-facing role tags', () => {
  const surface = buildWorldCommandSurface({
    visibleModules: ['outskirts', 'gateTrial', 'bounties', 'expeditions'],
    moduleSurfacesByKey: {},
    runCompassPrimaryAction: null,
    economicTopModuleKey: null,
    economicReason: null,
    trackedBountyModuleKey: null,
    trackedBountyAlert: null,
    expeditionIdleAlert: null,
  });

  const cards = surface.groups.flatMap((group) => group.cards);
  assert.equal(cards.some((card) => card.roleTag === 'Gold & Common Mats'), true);
  assert.equal(cards.some((card) => card.roleTag === 'Gate Proof'), true);
  assert.equal(cards.some((card) => card.roleTag === 'Merit & Routing'), true);
  assert.equal(cards.some((card) => card.roleTag === 'Passive Support'), true);
  cards.forEach((card) => {
    assert.doesNotMatch(card.moduleLabel, /alchemy|talisman/i);
    assert.doesNotMatch(card.roleTag, /Milestone Gate|Gate Prep|Support Currency|Passive Supply/i);
  });
});
