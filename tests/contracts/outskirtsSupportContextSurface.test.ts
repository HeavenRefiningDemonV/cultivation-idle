import assert from 'node:assert/strict';
import test from 'node:test';

import type { BountyInstance } from '../../src/stores/bountyStore.js';
import type { RunCompassActionLine } from '../../src/systems/ui/runCompass/index.js';
import { buildOutskirtsSupportContextSurface } from '../../src/ui/world/buildOutskirtsSupportContextSurface.js';

function makeAction(args: {
  moduleKey: 'ruins' | 'forge' | 'apothecary' | 'outskirts';
  cityId?: string;
  why: string;
  blocked?: boolean;
}): RunCompassActionLine {
  return {
    id: `${args.moduleKey}-${args.why}`,
    label: 'Route',
    why: args.why,
    destinationLabel: args.moduleKey,
    blocked: args.blocked ?? false,
    blockedReason: args.blocked ? 'blocked' : null,
    target: {
      kind: 'world_module',
      cityId: args.cityId ?? 'city_pinewind_hamlet',
      moduleKey: args.moduleKey,
    },
  };
}

function makeOutskirtsBounty(): BountyInstance {
  return {
    instanceId: 'bounty-1',
    cityId: 'city_pinewind_hamlet',
    cityIndex: 0,
    templateId: 'template-1',
    difficulty: 'easy',
    kind: 'OUTSKIRTS_KILL',
    title: 'Cull field beasts',
    description: '',
    progress: 4,
    target: 10,
    claimed: false,
    rewards: { currencies: { gold: '120', merit: '8' } },
    createdAt: 0,
  };
}

void test('tracked bounty and farmer recommendation only surface when relevant', () => {
  const surface = buildOutskirtsSupportContextSurface({
    trackedOutskirtsBounty: makeOutskirtsBounty(),
    runCompassActions: [],
    farmerRecommendationLine: 'Recommended AI: Farmer',
    cityId: 'city_pinewind_hamlet',
  });

  assert.equal(surface.trackedBounty?.title, 'Cull field beasts');
  assert.match(surface.trackedBounty?.progressText ?? '', /4 \/ 10/);
  assert.match(surface.trackedBounty?.rewardSummary ?? '', /Gold 120/);
  assert.equal(surface.farmerRecommendation?.label, 'Recommended AI: Farmer');
});

void test('non-farmer line is suppressed and route hints are limited to 2 from current city', () => {
  const surface = buildOutskirtsSupportContextSurface({
    trackedOutskirtsBounty: null,
    farmerRecommendationLine: 'Recommended AI: Balanced',
    cityId: 'city_pinewind_hamlet',
    runCompassActions: [
      makeAction({ moduleKey: 'ruins', why: 'Need targeted local mats' }),
      makeAction({ moduleKey: 'forge', why: 'Permanent floor below target' }),
      makeAction({ moduleKey: 'apothecary', why: 'Prep stock below floor' }),
      makeAction({ moduleKey: 'ruins', why: 'duplicate should be ignored' }),
      makeAction({ moduleKey: 'forge', cityId: 'city_stonecrag_town', why: 'other city should be ignored' }),
      makeAction({ moduleKey: 'outskirts', why: 'not adjacent module' }),
    ],
  });

  assert.equal(surface.farmerRecommendation, null);
  assert.equal(surface.routeHints.length, 2);
  assert.equal(surface.primaryRouteHint?.destination, 'ruins');
  assert.equal(surface.secondaryRouteHint?.destination, 'forge');
});
