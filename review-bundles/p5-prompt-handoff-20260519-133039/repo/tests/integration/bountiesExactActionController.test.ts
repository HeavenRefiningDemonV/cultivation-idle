import assert from 'node:assert/strict';
import test from 'node:test';

import { createBountiesExactActionController } from '../../src/features/world/bountiesExact/useBountiesExactActionController.js';
import type { BountiesExactNoteSurface } from '../../src/features/world/bountiesExact/bountiesExactTypes.js';

function makeNote(overrides: Partial<BountiesExactNoteSurface>): BountiesExactNoteSurface {
  return {
    id: 'order-1',
    role: 'support',
    roleLabel: 'Support Order',
    stateRibbon: null,
    title: 'Herb Stock Notice',
    subtitle: 'SUPPORT ORDER',
    objective: 'Refill basic healing stock.',
    progressPct: 100,
    progressText: '1 / 1',
    rewardLine: 'Merit +2',
    rewardChips: [],
    iconKey: 'herb',
    selected: false,
    tracked: false,
    claimReady: true,
    claimed: false,
    primaryButton: { id: 'route', label: 'Route', enabled: true },
    routeTarget: { cityId: 'city_pinewind_hamlet', moduleKey: 'expeditions', label: 'Expeditions' },
    ...overrides,
  };
}

test('bounties exact controller tracks and untracks the selected order only when it is on the active board', () => {
  const tracked: Array<[string, string | null]> = [];
  const controller = createBountiesExactActionController({
    cityId: 'city_pinewind_hamlet',
    cityIndex: 0,
    selectedOrderId: 'order-1',
    trackedOrderId: null,
    notes: [makeNote({ id: 'order-1' }), makeNote({ id: 'order-2', role: 'route' }), makeNote({ id: 'order-3', role: 'challenge' })],
    setSelectedOrderId: () => undefined,
    setTrackedBounty: (cityId, orderId) => tracked.push([cityId, orderId]),
    claim: () => true,
    canRefresh: () => false,
    refresh: () => undefined,
    openWorldModule: () => undefined,
    now: () => 1000,
  });

  controller.trackSelected();
  assert.deepEqual(tracked, [['city_pinewind_hamlet', 'order-1']]);

  const untrack = createBountiesExactActionController({
    cityId: 'city_pinewind_hamlet',
    cityIndex: 0,
    selectedOrderId: 'order-1',
    trackedOrderId: 'order-1',
    notes: [makeNote({ id: 'order-1' })],
    setSelectedOrderId: () => undefined,
    setTrackedBounty: (cityId, orderId) => tracked.push([cityId, orderId]),
    claim: () => true,
    canRefresh: () => false,
    refresh: () => undefined,
    openWorldModule: () => undefined,
    now: () => 1000,
  });

  untrack.trackSelected();
  assert.deepEqual(tracked.at(-1), ['city_pinewind_hamlet', null]);
});

test('bounties exact controller claims selected ready, falls back to first ready, and claims all once each', () => {
  const claimed: string[] = [];
  const notes = [
    makeNote({ id: 'support-ready', role: 'support', claimReady: true }),
    makeNote({ id: 'route-ready', role: 'route', claimReady: true }),
    makeNote({ id: 'challenge-waiting', role: 'challenge', claimReady: false }),
  ];

  createBountiesExactActionController({
    cityId: 'city_pinewind_hamlet',
    cityIndex: 0,
    selectedOrderId: 'route-ready',
    trackedOrderId: null,
    notes,
    setSelectedOrderId: () => undefined,
    setTrackedBounty: () => undefined,
    claim: (_cityId, orderId) => {
      claimed.push(orderId);
      return true;
    },
    canRefresh: () => false,
    refresh: () => undefined,
    openWorldModule: () => undefined,
    now: () => 1000,
  }).claimReady();
  assert.deepEqual(claimed, ['route-ready']);

  createBountiesExactActionController({
    cityId: 'city_pinewind_hamlet',
    cityIndex: 0,
    selectedOrderId: 'challenge-waiting',
    trackedOrderId: null,
    notes,
    setSelectedOrderId: () => undefined,
    setTrackedBounty: () => undefined,
    claim: (_cityId, orderId) => {
      claimed.push(orderId);
      return true;
    },
    canRefresh: () => false,
    refresh: () => undefined,
    openWorldModule: () => undefined,
    now: () => 1000,
  }).claimReady();
  assert.deepEqual(claimed.slice(-1), ['support-ready']);

  claimed.length = 0;
  createBountiesExactActionController({
    cityId: 'city_pinewind_hamlet',
    cityIndex: 0,
    selectedOrderId: null,
    trackedOrderId: null,
    notes,
    setSelectedOrderId: () => undefined,
    setTrackedBounty: () => undefined,
    claim: (_cityId, orderId) => {
      claimed.push(orderId);
      return orderId !== 'support-ready';
    },
    canRefresh: () => false,
    refresh: () => undefined,
    openWorldModule: () => undefined,
    now: () => 1000,
  }).claimAllReady();
  assert.deepEqual(claimed, ['support-ready', 'route-ready']);
});

test('bounties exact controller routes only surfaced module targets and refreshes only when ready', () => {
  const opened: Array<{ cityId: string; moduleKey: string; source: string }> = [];
  let refreshes = 0;
  const controller = createBountiesExactActionController({
    cityId: 'city_pinewind_hamlet',
    cityIndex: 0,
    selectedOrderId: 'order-1',
    trackedOrderId: null,
    notes: [makeNote({ id: 'order-1' })],
    setSelectedOrderId: () => undefined,
    setTrackedBounty: () => undefined,
    claim: () => true,
    canRefresh: () => true,
    refresh: () => {
      refreshes += 1;
    },
    openWorldModule: (args) => opened.push({ cityId: args.cityId, moduleKey: args.moduleKey, source: args.source ?? '' }),
    now: () => 1000,
  });

  controller.routeNow();
  controller.refreshBoard();
  assert.deepEqual(opened, [{ cityId: 'city_pinewind_hamlet', moduleKey: 'expeditions', source: 'bounties-exact-route' }]);
  assert.equal(refreshes, 1);

  const blocked = createBountiesExactActionController({
    cityId: 'city_pinewind_hamlet',
    cityIndex: 0,
    selectedOrderId: 'blocked',
    trackedOrderId: null,
    notes: [makeNote({ id: 'blocked', routeTarget: null })],
    setSelectedOrderId: () => undefined,
    setTrackedBounty: () => undefined,
    claim: () => true,
    canRefresh: () => false,
    refresh: () => {
      refreshes += 1;
    },
    openWorldModule: (args) => opened.push({ cityId: args.cityId, moduleKey: args.moduleKey, source: args.source ?? '' }),
    now: () => 1000,
  });

  blocked.routeNow();
  blocked.refreshBoard();
  assert.equal(opened.length, 1);
  assert.equal(refreshes, 1);
});
