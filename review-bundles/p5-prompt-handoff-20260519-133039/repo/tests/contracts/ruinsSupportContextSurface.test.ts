import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRuinsSupportContextSurface } from '../../src/ui/world/buildRuinsSupportContextSurface.js';

const baseArgs = {
  trackedBounty: null,
  runCompassActions: [],
  cityId: 'city_a',
  cityModules: ['ruins', 'forge', 'apothecary', 'gateTrial'],
  leadMaterialIds: ['ore_a', 'herb_a'],
  itemCountsById: {} as Record<string, number>,
  itemNamesById: { ore_a: 'Quarry Ore', herb_a: 'Lotus Pollen' },
  forgeBlueprints: [
    { id: 'forge_1', unlocksAtCityId: 'city_a', inputs: { ore_a: 4 } },
  ],
  alchemyRecipes: [
    { id: 'brew_1', unlocksAtCityId: 'city_a', inputs: { herb_a: 3 } },
  ],
  gateReadiness: null,
};

test('tracked ruins bounty only surfaces when relevant bounty is provided', () => {
  const noBounty = buildRuinsSupportContextSurface(baseArgs);
  assert.equal(noBounty.trackedBounty, null);

  const withBounty = buildRuinsSupportContextSurface({
    ...baseArgs,
    trackedBounty: {
      instanceId: 'b1',
      cityId: 'city_a',
      cityIndex: 0,
      templateId: 't1',
      difficulty: 'easy',
      kind: 'RUINS_ROOM_CLEAR',
      title: 'Clear Ruins Rooms',
      description: '',
      progress: 2,
      target: 5,
      claimed: false,
      rewards: { currencies: { gold: '20' } },
      createdAt: 1,
    },
  });

  assert.equal(withBounty.trackedBounty?.title, 'Clear Ruins Rooms');
  assert.equal(withBounty.trackedBounty?.progressText, '2 / 5');
});

test('forge and apothecary hints require lead-material thresholds and return no more than one primary hint', () => {
  const noneReady = buildRuinsSupportContextSurface({
    ...baseArgs,
    itemCountsById: { ore_a: 1, herb_a: 1 },
  });
  assert.equal(noneReady.primaryExitHint, null);
  assert.equal(noneReady.secondaryExitHint, null);

  const forgeOnly = buildRuinsSupportContextSurface({
    ...baseArgs,
    itemCountsById: { ore_a: 4, herb_a: 0 },
    runCompassActions: [
      {
        id: 'forge',
        label: 'Forge',
        why: 'forge',
        destinationLabel: 'Forge',
        blocked: false,
        blockedReason: null,
        target: { kind: 'world_module', cityId: 'city_a', moduleKey: 'forge' },
      },
    ],
  });

  assert.equal(forgeOnly.primaryExitHint?.destination, 'forge');
  assert.match(forgeOnly.primaryExitHint?.label ?? '', /enough for Forge/i);
  assert.equal(forgeOnly.secondaryExitHint, null);

  const bothReady = buildRuinsSupportContextSurface({
    ...baseArgs,
    itemCountsById: { ore_a: 4, herb_a: 3 },
  });
  assert.equal(bothReady.primaryExitHint?.destination, 'forge');
  assert.equal(bothReady.secondaryExitHint?.destination, 'apothecary');
});

test('gate near-ready hint appears only for close unresolved state and outranks other exits', () => {
  const closeGate = buildRuinsSupportContextSurface({
    ...baseArgs,
    itemCountsById: { ore_a: 4, herb_a: 3 },
    gateReadiness: {
      readinessLabel: 'Close',
      readinessDetail: 'Only one prep shortfall remains.',
      gateResolved: false,
      canStart: true,
    },
  });

  assert.equal(closeGate.primaryExitHint?.destination, 'gateTrial');
  assert.equal(closeGate.secondaryExitHint?.destination, 'forge');

  const blockedGate = buildRuinsSupportContextSurface({
    ...baseArgs,
    itemCountsById: { ore_a: 4, herb_a: 3 },
    gateReadiness: {
      readinessLabel: 'Blocked',
      readinessDetail: 'still blocked',
      gateResolved: false,
      canStart: false,
    },
  });

  assert.notEqual(blockedGate.primaryExitHint?.destination, 'gateTrial');
});
