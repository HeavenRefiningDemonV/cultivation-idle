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
      target: { kind: 'world_module', moduleKey: 'ruins' },
    },
    economicTopModuleKey: 'bounties',
    economicReason: 'Economic route fallback',
    trackedBountyModuleKey: 'bounties',
  });

  assert.equal(recommendation.moduleKey, 'ruins');
  assert.equal(recommendation.from, 'run_compass');
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
