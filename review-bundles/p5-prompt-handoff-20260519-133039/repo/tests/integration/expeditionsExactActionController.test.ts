import assert from 'node:assert/strict';
import test from 'node:test';

import { createExpeditionsExactActionController } from '../../src/features/world/expeditionsExact/useExpeditionsExactActionController.js';
import type {
  DispatchSlotSurface,
  ExpeditionRouteCardSurface,
} from '../../src/features/world/expeditionsExact/expeditionsExactTypes.js';

function makeSlot(overrides: Partial<DispatchSlotSurface>): DispatchSlotSurface {
  return {
    visualIndex: 0,
    roman: 'I',
    realSlotIndex: 0,
    status: 'idle',
    statusLabel: 'IDLE',
    title: 'Recommended:',
    subtitle: 'Scout',
    progressPct: 0,
    iconKey: 'hourglass',
    action: { id: 'slot-0', label: 'Use Slot', enabled: true },
    ...overrides,
  };
}

function makeRoute(overrides: Partial<ExpeditionRouteCardSurface>): ExpeditionRouteCardSurface {
  return {
    routeId: 'forage',
    title: 'Forage Route',
    purpose: 'Herbs · Healing support',
    durationLabel: 'Short / Medium',
    yieldIcons: [],
    recommended: false,
    selected: false,
    defaultDurationId: 'medium',
    button: { id: 'select-forage', label: 'Select Route', enabled: true },
    ...overrides,
  };
}

test('expeditions exact controller auto-fills recommended route, duration, and first idle real slot', () => {
  const selected: Record<string, unknown> = {};
  const controller = createExpeditionsExactActionController({
    cityId: 'city_pinewind_hamlet',
    cityIndex: 0,
    selectedRouteId: null,
    selectedDurationId: null,
    selectedSlotIndex: null,
    dispatchSlots: [
      makeSlot({ visualIndex: 0, realSlotIndex: 0, status: 'active' }),
      makeSlot({ visualIndex: 1, roman: 'II', realSlotIndex: 1, status: 'idle' }),
    ],
    routes: [makeRoute({ routeId: 'forage' }), makeRoute({ routeId: 'scout', recommended: true, defaultDurationId: 'short' })],
    readySlotIndexes: [],
    setSelectedRouteId: (value) => { selected.route = value; },
    setSelectedDurationId: (value) => { selected.duration = value; },
    setSelectedSlotIndex: (value) => { selected.slot = value; },
    start: () => true,
    claim: () => ({ ok: true }),
  });

  controller.autoFillRecommended();
  assert.deepEqual(selected, { route: 'scout', duration: 'short', slot: 1 });
});

test('expeditions exact controller dispatches selected or recommended route to the first idle real slot and blocks when none exist', () => {
  const starts: Array<[number, string, string, string, number]> = [];
  const base = {
    cityId: 'city_pinewind_hamlet',
    cityIndex: 0,
    selectedRouteId: 'mine',
    selectedDurationId: null,
    selectedSlotIndex: null,
    dispatchSlots: [
      makeSlot({ visualIndex: 0, realSlotIndex: 0, status: 'active' }),
      makeSlot({ visualIndex: 1, roman: 'II', realSlotIndex: 1, status: 'idle' }),
    ],
    routes: [makeRoute({ routeId: 'mine', defaultDurationId: 'medium', recommended: true })],
    readySlotIndexes: [],
    setSelectedRouteId: () => undefined,
    setSelectedDurationId: () => undefined,
    setSelectedSlotIndex: () => undefined,
    start: (slotIndex: number, routeId: string, durationId: string, cityId: string, cityIndex: number) => {
      starts.push([slotIndex, routeId, durationId, cityId, cityIndex]);
      return true;
    },
    claim: () => ({ ok: true }),
  };

  assert.equal(createExpeditionsExactActionController(base).dispatchExpedition(), true);
  assert.deepEqual(starts, [[1, 'mine', 'medium', 'city_pinewind_hamlet', 0]]);

  const blocked = createExpeditionsExactActionController({
    ...base,
    dispatchSlots: [makeSlot({ visualIndex: 0, realSlotIndex: 0, status: 'active' })],
  });
  assert.equal(blocked.dispatchExpedition(), false);
  assert.equal(starts.length, 1);
});

test('expeditions exact controller claims first ready and all ready slots only once', () => {
  const claimed: number[] = [];
  const controller = createExpeditionsExactActionController({
    cityId: 'city_pinewind_hamlet',
    cityIndex: 0,
    selectedRouteId: null,
    selectedDurationId: null,
    selectedSlotIndex: null,
    dispatchSlots: [
      makeSlot({ visualIndex: 0, realSlotIndex: 0, status: 'claim-ready' }),
      makeSlot({ visualIndex: 1, roman: 'II', realSlotIndex: 1, status: 'active' }),
      makeSlot({ visualIndex: 2, roman: 'III', realSlotIndex: 2, status: 'claim-ready' }),
      makeSlot({ visualIndex: 3, roman: 'IV', realSlotIndex: null, status: 'locked' }),
    ],
    routes: [makeRoute({ routeId: 'forage', recommended: true })],
    readySlotIndexes: [0, 2],
    setSelectedRouteId: () => undefined,
    setSelectedDurationId: () => undefined,
    setSelectedSlotIndex: () => undefined,
    start: () => true,
    claim: (slotIndex) => {
      claimed.push(slotIndex);
      return { ok: true };
    },
  });

  controller.claimExpedition();
  assert.deepEqual(claimed, [0]);

  claimed.length = 0;
  controller.claimAllReady();
  assert.deepEqual(claimed, [0, 2]);
});
